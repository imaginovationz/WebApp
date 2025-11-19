import os
import json
import ssl
import warnings
import urllib3
import logging
import time
import re
import requests
import hashlib
import difflib
import tiktoken
# Support running as a package (python -m rf_agent.app) and as a script (python rf_agent/app.py)
try:
    from . import rag_index as rag_index  # lightweight lexical fallback
    from . import vector_rag as vector_rag  # vector-based RAG
except Exception:
    # When executed directly, there is no package context; fall back to absolute imports
    import sys
    current_dir = os.path.dirname(__file__)
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
    import rag_index  # type: ignore
    import vector_rag  # type: ignore
# Set tiktoken cache directory to local folder to avoid online downloads
TIKTOKEN_CACHE_DIR = os.path.join(os.path.dirname(__file__), 'encoding_cache')
os.environ['TIKTOKEN_CACHE_DIR'] = TIKTOKEN_CACHE_DIR

# Disable SSL verification for tiktoken downloads (corporate environment)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def init_tiktoken_offline():
    """Initialize tiktoken with offline cache to avoid SSL issues."""
    try:
        # Set environment to prefer cache over downloads
        os.environ['TIKTOKEN_CACHE_DIR'] = TIKTOKEN_CACHE_DIR
        # Try to load the encoding to verify it works offline
        encoding = tiktoken.get_encoding("cl100k_base")
        logger.info("✅ Tiktoken initialized successfully with offline cache")
        return True
    except Exception as e:
        logger.warning(f"⚠️ Tiktoken offline initialization failed: {e}")
        # Try with relaxed SSL if cache fails
        try:
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            encoding = tiktoken.get_encoding("cl100k_base")
            logger.info("✅ Tiktoken initialized with relaxed SSL")
            return True
        except Exception as e2:
            logger.error(f"❌ Tiktoken initialization completely failed: {e2}")
            return False
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict, Iterable, Set
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import httpx
from azure.identity import DefaultAzureCredential, ClientSecretCredential, get_bearer_token_provider
from azure.core.pipeline.transport import RequestsTransport
from openai import AzureOpenAI
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
"""Flask application for lightweight Azure OpenAI code assistant."""
try:
    # Development-wide CORS (all endpoints). Restrict in production.
    CORS(app, resources={r"/*": {"origins": "*"}})
except Exception:
    pass
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s %(message)s')
logger = logging.getLogger("azure_app")
# Ensure a rotating file handler so logs can be inspected via new endpoint
if not any(isinstance(h, logging.FileHandler) for h in logger.handlers):
    try:
        from logging.handlers import RotatingFileHandler
        log_path = os.path.join(os.path.dirname(__file__), 'app.log')
        file_handler = RotatingFileHandler(log_path, maxBytes=2_000_000, backupCount=3, encoding='utf-8')
        file_handler.setFormatter(logging.Formatter('[%(asctime)s] %(levelname)s %(message)s'))
        logger.addHandler(file_handler)
        logger.info('File logging enabled at %s', log_path)
    except Exception as _e:
        logger.warning('Failed to set up file logging: %s', _e)

# Lazy init client (to avoid cold start delay on app import)
_client = None
_assistant_id = None
_vector_store_id = None
STATE_FILE = os.path.join(os.path.dirname(__file__), 'assistant_state.json')
CACHE_FILE = os.path.join(os.path.dirname(__file__), 'api_cache.json')
_config = None
_file_index: Dict[str, Dict] = {}

# -------------------- FILE CATEGORY SUPPORT --------------------
# We allow users to tag uploaded files so LLM can better reason about roles.
# Categories are optional and inferred heuristically if not provided to keep
# backward compatibility with existing UI / API clients.
VALID_FILE_CATEGORIES = {
    'common_keywords': 'Common Keywords',
    'project_keywords': 'Project Keywords',
    'utility': 'Utility',
    'config': 'Config',
    'script': 'Script/Test Cases'
}

def _normalize_category(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    r = raw.strip().lower()
    r = re.sub(r"\(.*?\)", "", r)
    r = r.replace(':', ' ').replace('|', ' ').replace('/', ' ')
    r = re.sub(r"\s+", " ", r).strip()
    # If user passed an internal key already, accept it directly
    if r in VALID_FILE_CATEGORIES:
        return r
    mapping = {
        'common': 'common_keywords',
        'common keywords': 'common_keywords',
        'common_keyword': 'common_keywords',
        'project': 'project_keywords',
        'project keywords': 'project_keywords',
        'project_keyword': 'project_keywords',
        'keyword': 'project_keywords',
        'keywords': 'project_keywords',
        'utility': 'utility',
        'utilities': 'utility',
        'util': 'utility',
        'config': 'config',
        'configuration': 'config',
        'settings': 'config',
        'script': 'script',
        'scripts': 'script',
        'test': 'script',
        'tests': 'script',
        'testcases': 'script',
        'testcase': 'script'
    }
    if r in mapping:
        return mapping[r]
    # Fuzzy first-token match (e.g., "common keyword files")
    first = r.split(' ')[0]
    if first in mapping:
        return mapping[first]
    # Heuristic keyword search when user deliberately chose category: trust intent
    if 'common' in r:
        return 'common_keywords'
    if 'project' in r:
        return 'project_keywords'
    if 'config' in r or 'setting' in r:
        return 'config'
    if 'script' in r or 'test' in r:
        return 'script'
    if 'util' in r:
        return 'utility'
    return None

def _infer_category(filename: str) -> str:
    """Heuristic category inference (kept lightweight)."""
    lower = filename.lower()
    if lower.endswith('.robot'):
        if 'customkeywords' in lower or 'common' in lower:
            return 'common_keywords'
        if any(k in lower for k in ['init', 'initialize', 'finalize']):
            return 'utility'
        if any(k in lower for k in ['test', 'mvp', 'suite', 'case']):
            return 'script'
        # default for other robot files: project keywords (likely keyword/resource)
        return 'project_keywords'
    if lower.endswith(('.yaml', '.yml', '.json', '.ini', '.cfg')):
        return 'config'
    if lower.endswith('.py'):
        if any(k in lower for k in ['config', 'settings']):
            return 'config'
        if any(k in lower for k in ['util', 'utility', 'helper']):
            return 'utility'
        # python modules supporting keywords/utilities
        return 'utility'
    # Fallback classification
    return 'utility'

# Rate limiting and caching
_api_cache: Dict[str, Dict] = {}
_last_api_call = 0
_api_call_count = 0
_rate_limit_window_start = 0

# Progress tracking for Excel processing
_excel_processing_progress = {
    'is_processing': False,
    'current_test_case': 0,
    'total_test_cases': 0,
    'current_description': '',
    'status': 'idle',
    'processed_cases': [],
    'updated_files': {}
}
MIN_API_INTERVAL = 0.5  # Minimum seconds between API calls
MAX_CALLS_PER_MINUTE = 120  # Allows 6 calls per 10-second window (60K tokens/min with 10K per call)
CACHE_EXPIRY_HOURS = 24  # Cache results for 24 hours

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

def load_config():
    """Load JSON config once (if present). Fallback to minimal defaults."""
    global _config
    if _config is not None:
        return _config
    default = {
        "openai": {
            "api_base": "https://9747-dcane.openai.azure.com/",
            "llm_deployment": "gpt-5"
        },
        "azure_credentials": {
            "tenant_id": "",
            "client_id": "",
            "client_secret": ""
        },
        "security": {
            "verify_ssl": True,
            "ca_bundle": None
        }
    }
    if os.path.isfile(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                file_cfg = json.load(f)
            # shallow merge
            for k,v in file_cfg.items():
                default[k] = v
            logger.info("Loaded config file: %s", CONFIG_PATH)
        except Exception as e:
            logger.error("Failed reading config.json (%s). Using defaults.", e)
    else:
        logger.info("Config file not found (%s); using defaults.", CONFIG_PATH)
    _config = default
    return _config

def rebuild_file_index():
    """Rebuild the file index from existing files in the uploads folder."""
    global _file_index
    uploads_dir = app.config['UPLOAD_FOLDER']
    
    if not os.path.exists(uploads_dir):
        logger.warning(f"Uploads directory does not exist: {uploads_dir}")
        return 0
    
    rebuilt_count = 0
    for filename in os.listdir(uploads_dir):
        file_path = os.path.join(uploads_dir, filename)
        
        # Skip directories and files already in index
        if not os.path.isfile(file_path) or filename in _file_index:
            continue
            
        # Only process relevant file types
        if not (filename.endswith('.robot') or filename.endswith('.py') or filename.endswith('.xlsx')):
            continue
            
        try:
            _file_index[filename] = {
                'filename': filename,
                'path': file_path,
                'size_bytes': os.path.getsize(file_path),
                'chunks': 0,  # Will be calculated if needed
                'chunk_size': 1000,
                'chunk_overlap': 200,
                'modified': False,
                'patch_count': 0,
                'last_applied': None,
                'file_id': None,
            }
            rebuilt_count += 1
            logger.info(f"Added {filename} to file index")
            
        except Exception as e:
            logger.warning(f"Failed to process {filename}: {e}")
    
    logger.info(f"Rebuilt file index: {rebuilt_count} files added, total: {len(_file_index)}")
    # (Re)build RAG index after file index changes
    try:
        # Build lexical fallback index
        rag_index.build_rag_index(_file_index)
        logger.info("🧠 Lexical RAG index rebuilt (%d docs)", rag_index.get_rag_index().get('N', 0))
    except Exception as e:
        logger.warning(f"Failed to build lexical RAG index: {e}")
    return rebuilt_count
    return _config

def _chunk_text(text: str, size: int, overlap: int) -> List[str]:
    if size <= 0:
        return [text]
    if overlap >= size:
        overlap = size // 4  # safety
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(length, start + size)
        chunks.append(text[start:end])
        if end == length:
            break
        start = end - overlap
        if start < 0:
            start = 0
    return chunks

# --- Real-time file append support -------------------------------------------------
## NOTE: Removed real-time append helper (reverted to full rewrite logic for diff/highlight compatibility)

_FILENAME_PATTERN = re.compile(r"\b[\w.-]+\.(?:py|robot|txt|md|cfg|ini|json|yaml|yml)\b")

def _extract_referenced_filenames(text: str) -> List[str]:
    """Extract probable filenames referenced in natural language instructions or chat.

    This is heuristic: looks for token-like patterns ending with common code/data extensions.
    """
    if not text:
        return []
    found = set()
    for m in _FILENAME_PATTERN.finditer(text):
        found.add(m.group(0))
    return sorted(found)

class RobotFrameworkAnalyzer:
    """Comprehensive analyzer for Robot Framework files including business logic, test scenarios, and architecture."""
    
    def __init__(self):
        self.keywords = {}  # keyword_name -> {file, args, doc, implementation}
        self.resources = {}  # file -> [imported_resources]
        self.libraries = {}  # file -> [imported_libraries]
        self.variables = {}  # file -> [variables]
        self.test_flows = {}  # test patterns and business flows
        self.business_rules = {}  # extracted business rules and logic
        self.data_dependencies = {}  # data relationships and dependencies
        self.placeholder_patterns = [
            r"#No automation action found",
            r"BuiltIn\.No Operation",
            r"\[Documentation\]\s*.*\s*BuiltIn\.No Operation",
            r"PERFORM.*#No automation action found"
        ]
    
    def analyze_uploaded_files(self, upload_folder: str) -> Dict:
        """Comprehensive analysis of all uploaded Robot Framework files including business logic and architecture."""
        self.keywords.clear()
        self.resources.clear()
        self.libraries.clear()
        self.variables.clear()
        self.test_flows.clear()
        self.business_rules.clear()
        self.data_dependencies.clear()
        
        robot_files = [f for f in os.listdir(upload_folder) if f.endswith('.robot')]
        python_files = [f for f in os.listdir(upload_folder) if f.endswith('.py')]
        config_files = [f for f in os.listdir(upload_folder) if f.endswith(('.py', '.json', '.yaml', '.yml', '.cfg', '.ini'))]
        
        analysis = {
            'robot_files': robot_files,
            'python_files': python_files,
            'config_files': config_files,
            'keywords': {},
            'missing_implementations': [],
            'placeholders': [],
            'dependencies': {},
            'file_analysis': {},
            'business_analysis': {
                'test_scenarios': [],
                'business_flows': [],
                'data_models': [],
                'system_interactions': [],
                'validation_rules': [],
                'error_scenarios': []
            },
            'architecture_analysis': {
                'test_layers': [],
                'page_objects': [],
                'utilities': [],
                'configuration': [],
                'data_sources': []
            },
            'quality_metrics': {
                'coverage_gaps': [],
                'code_smells': [],
                'improvement_suggestions': [],
                'complexity_analysis': []
            }
        }
        
        # Parse each robot file with comprehensive analysis
        for robot_file in robot_files:
            file_path = os.path.join(upload_folder, robot_file)
            try:
                file_analysis = self._parse_robot_file_comprehensive(file_path, robot_file)
                analysis['file_analysis'][robot_file] = file_analysis
                
                # Collect keywords
                for kw_name, kw_info in file_analysis.get('keywords', {}).items():
                    full_name = f"{robot_file}::{kw_name}"
                    analysis['keywords'][full_name] = kw_info
                    
                    # Check for placeholders
                    if self._is_placeholder_implementation(kw_info.get('implementation', '')):
                        analysis['placeholders'].append({
                            'file': robot_file,
                            'keyword': kw_name,
                            'implementation': kw_info.get('implementation', ''),
                            'documentation': kw_info.get('documentation', ''),
                            'business_context': self._extract_business_context(kw_name, kw_info)
                        })
                
                # Collect dependencies
                analysis['dependencies'][robot_file] = {
                    'resources': file_analysis.get('resources', []),
                    'libraries': file_analysis.get('libraries', [])
                }
                
                # Extract business flows and test scenarios
                self._extract_business_flows(file_analysis, analysis['business_analysis'])
                
            except Exception as e:
                logger.error(f"Error analyzing {robot_file}: {e}")
                analysis['file_analysis'][robot_file] = {'error': str(e)}
        
        # Analyze Python files for utilities and data models
        for python_file in python_files:
            file_path = os.path.join(upload_folder, python_file)
            try:
                python_analysis = self._analyze_python_file(file_path, python_file)
                analysis['file_analysis'][python_file] = python_analysis
                self._extract_python_architecture(python_analysis, analysis['architecture_analysis'])
            except Exception as e:
                logger.error(f"Error analyzing {python_file}: {e}")
        
        # Perform cross-file analysis
        self._perform_cross_file_analysis(analysis)
        
        # Find missing implementations with business context
        analysis['missing_implementations'] = self._find_missing_implementations_comprehensive(analysis)
        
        # Generate quality metrics and suggestions
        self._generate_quality_metrics(analysis)
        
        return analysis
    
    def _parse_robot_file_comprehensive(self, file_path: str, filename: str) -> Dict:
        """Parse a Robot Framework file with comprehensive business and technical analysis."""
        analysis = {
            'keywords': {},
            'resources': [],
            'libraries': [],
            'variables': [],
            'test_cases': [],
            'business_context': {
                'domain': self._extract_domain_from_filename(filename),
                'user_journeys': [],
                'business_rules': [],
                'data_entities': []
            },
            'technical_context': {
                'ui_elements': [],
                'api_endpoints': [],
                'database_operations': [],
                'file_operations': []
            }
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception as e:
            return {'error': f"Could not read file: {e}"}
        
        lines = content.split('\n')
        current_section = None
        current_keyword = None
        current_test = None
        keyword_lines = []
        test_lines = []
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Section headers
            if stripped.startswith('*** ') and stripped.endswith(' ***'):
                current_section = stripped[4:-4].strip().lower()
                current_keyword = None
                current_test = None
                continue
            
            # Skip empty lines and comments
            if not stripped or stripped.startswith('#'):
                if current_keyword and keyword_lines:
                    keyword_lines.append(line)
                elif current_test and test_lines:
                    test_lines.append(line)
                continue
            
            if current_section == 'settings':
                self._parse_settings_line(stripped, analysis)
            elif current_section == 'variables':
                self._parse_variables_line_comprehensive(stripped, analysis)
            elif current_section == 'keywords':
                if not line.startswith(' ') and not line.startswith('\t'):
                    # Process previous keyword
                    if current_keyword and keyword_lines:
                        implementation = '\n'.join(keyword_lines)
                        analysis['keywords'][current_keyword]['implementation'] = implementation
                        self._analyze_keyword_content(current_keyword, implementation, analysis)
                    
                    # Start new keyword
                    current_keyword = stripped
                    keyword_lines = []
                    analysis['keywords'][current_keyword] = {
                        'file': filename,
                        'line': i + 1,
                        'arguments': [],
                        'documentation': '',
                        'implementation': '',
                        'tags': [],
                        'business_purpose': self._infer_business_purpose(current_keyword),
                        'complexity': 'unknown',
                        'ui_interactions': [],
                        'data_operations': []
                    }
                else:
                    # Keyword content
                    if current_keyword:
                        keyword_lines.append(line)
                        self._parse_keyword_line(stripped, analysis['keywords'][current_keyword])
            elif current_section == 'test cases':
                if not line.startswith(' ') and not line.startswith('\t'):
                    # Process previous test case
                    if current_test and test_lines:
                        test_implementation = '\n'.join(test_lines)
                        for test in analysis['test_cases']:
                            if test['name'] == current_test:
                                test['implementation'] = test_implementation
                                self._analyze_test_case_content(current_test, test_implementation, analysis)
                                break
                    
                    # Start new test case
                    current_test = stripped
                    test_lines = []
                    analysis['test_cases'].append({
                        'name': current_test,
                        'line': i + 1,
                        'file': filename,
                        'business_scenario': self._extract_business_scenario(current_test),
                        'test_type': self._classify_test_type(current_test),
                        'user_journey': self._extract_user_journey(current_test),
                        'implementation': ''
                    })
                else:
                    if current_test:
                        test_lines.append(line)
        
        # Handle last keyword and test case
        if current_keyword and keyword_lines:
            implementation = '\n'.join(keyword_lines)
            analysis['keywords'][current_keyword]['implementation'] = implementation
            self._analyze_keyword_content(current_keyword, implementation, analysis)
        
        if current_test and test_lines:
            test_implementation = '\n'.join(test_lines)
            for test in analysis['test_cases']:
                if test['name'] == current_test:
                    test['implementation'] = test_implementation
                    self._analyze_test_case_content(current_test, test_implementation, analysis)
                    break
        
        return analysis
    
    def _analyze_python_file(self, file_path: str, filename: str) -> Dict:
        """Analyze Python files for utilities, configuration, and data models."""
        analysis = {
            'type': 'python',
            'classes': [],
            'functions': [],
            'imports': [],
            'configuration': [],
            'constants': [],
            'business_logic': []
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception as e:
            return {'error': f"Could not read file: {e}"}
        
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Extract imports
            if stripped.startswith(('import ', 'from ')):
                analysis['imports'].append(stripped)
            
            # Extract configuration variables
            elif '=' in stripped and stripped.isupper():
                analysis['configuration'].append(stripped)
            
            # Extract constants
            elif stripped.startswith(('ENV_', 'gv_', 'CIBC_', 'mMTG_', 'LCMS_')):
                analysis['constants'].append(stripped)
            
            # Extract class definitions
            elif stripped.startswith('class '):
                class_name = stripped.split('class ')[1].split('(')[0].split(':')[0].strip()
                analysis['classes'].append({
                    'name': class_name,
                    'line': i + 1,
                    'purpose': self._infer_class_purpose(class_name)
                })
            
            # Extract function definitions
            elif stripped.startswith('def '):
                func_name = stripped.split('def ')[1].split('(')[0].strip()
                analysis['functions'].append({
                    'name': func_name,
                    'line': i + 1,
                    'purpose': self._infer_function_purpose(func_name)
                })
        
        return analysis
    
    def _extract_domain_from_filename(self, filename: str) -> str:
        """Extract business domain from filename."""
        if 'mvp' in filename.lower() or 'test' in filename.lower():
            return 'testing'
        elif 'custom' in filename.lower():
            return 'utilities'
        elif 'lcms' in filename.lower():
            return 'loan_management'
        elif 'initialize' in filename.lower():
            return 'setup'
        elif 'finalize' in filename.lower():
            return 'cleanup'
        else:
            return 'business_logic'
    
    def _infer_business_purpose(self, keyword_name: str) -> str:
        """Infer the business purpose of a keyword from its name."""
        name_lower = keyword_name.lower()
        
        if any(word in name_lower for word in ['login', 'signin', 'authenticate']):
            return 'Authentication'
        elif any(word in name_lower for word in ['search', 'find', 'locate']):
            return 'Data Retrieval'
        elif any(word in name_lower for word in ['create', 'add', 'insert', 'fill']):
            return 'Data Creation'
        elif any(word in name_lower for word in ['update', 'modify', 'change', 'edit']):
            return 'Data Modification'
        elif any(word in name_lower for word in ['validate', 'verify', 'check', 'assert']):
            return 'Validation'
        elif any(word in name_lower for word in ['navigate', 'open', 'go to', 'click']):
            return 'Navigation'
        elif any(word in name_lower for word in ['submit', 'save', 'confirm', 'approve']):
            return 'Transaction'
        elif any(word in name_lower for word in ['close', 'logout', 'exit', 'finalize']):
            return 'Cleanup'
        else:
            return 'Business Process'
    
    def _extract_business_scenario(self, test_name: str) -> str:
        """Extract business scenario from test case name."""
        # Remove technical prefixes
        clean_name = re.sub(r'^TC\d+_?', '', test_name)
        clean_name = re.sub(r'_', ' ', clean_name)
        
        # Extract meaningful parts
        parts = clean_name.split()
        if len(parts) > 3:
            return ' '.join(parts[:3])
        return clean_name
    
    def _classify_test_type(self, test_name: str) -> str:
        """Classify the type of test based on name and content."""
        name_lower = test_name.lower()
        
        if 'functional' in name_lower:
            return 'Functional Test'
        elif 'integration' in name_lower:
            return 'Integration Test'
        elif 'regression' in name_lower:
            return 'Regression Test'
        elif 'smoke' in name_lower:
            return 'Smoke Test'
        elif 'api' in name_lower:
            return 'API Test'
        elif 'ui' in name_lower:
            return 'UI Test'
        else:
            return 'Business Process Test'
    
    def _extract_user_journey(self, test_name: str) -> str:
        """Extract the user journey from test case name."""
        name_lower = test_name.lower()
        
        if 'lod' in name_lower and 'mmtg' in name_lower and 'lcms' in name_lower:
            return 'Letter of Direction - MMTG to LCMS Flow'
        elif 'login' in name_lower:
            return 'User Authentication'
        elif 'deal' in name_lower and 'pipeline' in name_lower:
            return 'Deal Management Pipeline'
        elif 'liability' in name_lower:
            return 'Liability Management'
        elif 'approval' in name_lower:
            return 'Deal Approval Process'
        else:
            return 'General Business Process'
    
    def _parse_settings_line(self, line: str, analysis: Dict):
        """Parse settings section line."""
        if line.startswith('Resource'):
            parts = line.split(None, 1)
            if len(parts) > 1:
                analysis['resources'].append(parts[1].strip())
        elif line.startswith('Library'):
            parts = line.split(None, 1)
            if len(parts) > 1:
                analysis['libraries'].append(parts[1].strip())
    
    def _parse_variables_line(self, line: str, analysis: Dict):
        """Parse variables section line."""
        if line.startswith('${') and '}' in line:
            var_end = line.find('}')
            var_name = line[2:var_end]
            analysis['variables'].append(var_name)
    
    def _parse_variables_line_comprehensive(self, line: str, analysis: Dict):
        """Parse variables section line with business context."""
        if line.startswith('${') and '}' in line:
            var_end = line.find('}')
            var_name = line[2:var_end]
            var_value = line[var_end+1:].strip() if len(line) > var_end+1 else ''
            
            analysis['variables'].append(var_name)
            
            # Extract UI elements and business entities
            if any(ui_type in var_name.lower() for ui_type in ['button', 'textbox', 'link', 'dropdown', 'checkbox']):
                analysis['technical_context']['ui_elements'].append({
                    'name': var_name,
                    'value': var_value,
                    'type': self._extract_ui_element_type(var_name)
                })
            
            # Extract business entities
            if any(entity in var_name.lower() for entity in ['deal', 'application', 'user', 'customer', 'loan']):
                analysis['business_context']['data_entities'].append({
                    'name': var_name,
                    'type': self._extract_entity_type(var_name)
                })
    
    def _extract_ui_element_type(self, var_name: str) -> str:
        """Extract UI element type from variable name."""
        name_lower = var_name.lower()
        if 'button' in name_lower:
            return 'Button'
        elif 'textbox' in name_lower or 'input' in name_lower:
            return 'Input Field'
        elif 'link' in name_lower or 'hyperlink' in name_lower:
            return 'Link'
        elif 'dropdown' in name_lower or 'select' in name_lower:
            return 'Dropdown'
        elif 'checkbox' in name_lower:
            return 'Checkbox'
        elif 'radio' in name_lower:
            return 'Radio Button'
        else:
            return 'UI Element'
    
    def _extract_entity_type(self, var_name: str) -> str:
        """Extract business entity type from variable name."""
        name_lower = var_name.lower()
        if 'deal' in name_lower or 'application' in name_lower:
            return 'Business Transaction'
        elif 'user' in name_lower or 'customer' in name_lower:
            return 'User Entity'
        elif 'loan' in name_lower or 'mortgage' in name_lower:
            return 'Financial Product'
        elif 'document' in name_lower:
            return 'Document'
        else:
            return 'Business Entity'
    
    def _analyze_keyword_content(self, keyword_name: str, implementation: str, analysis: Dict):
        """Analyze keyword implementation for business and technical insights."""
        if not implementation:
            return
        
        keyword_info = analysis['keywords'][keyword_name]
        
        # Analyze UI interactions
        ui_interactions = []
        if 'click' in implementation.lower():
            ui_interactions.append('Click Action')
        if 'input' in implementation.lower() or 'type' in implementation.lower():
            ui_interactions.append('Data Input')
        if 'wait' in implementation.lower():
            ui_interactions.append('Wait/Synchronization')
        if 'capture' in implementation.lower() or 'screenshot' in implementation.lower():
            ui_interactions.append('Screenshot Capture')
        
        keyword_info['ui_interactions'] = ui_interactions
        
        # Analyze data operations
        data_operations = []
        if 'validate' in implementation.lower() or 'verify' in implementation.lower():
            data_operations.append('Data Validation')
        if 'extract' in implementation.lower() or 'get' in implementation.lower():
            data_operations.append('Data Extraction')
        if 'set' in implementation.lower() or 'update' in implementation.lower():
            data_operations.append('Data Update')
        
        keyword_info['data_operations'] = data_operations
        
        # Determine complexity
        lines = implementation.split('\n')
        non_empty_lines = [l for l in lines if l.strip() and not l.strip().startswith('#')]
        
        if len(non_empty_lines) <= 3:
            keyword_info['complexity'] = 'Simple'
        elif len(non_empty_lines) <= 10:
            keyword_info['complexity'] = 'Medium'
        else:
            keyword_info['complexity'] = 'Complex'
    
    def _analyze_test_case_content(self, test_name: str, implementation: str, analysis: Dict):
        """Analyze test case implementation for business flow insights."""
        if not implementation:
            return
        
        # Extract the test case info
        test_info = None
        for test in analysis['test_cases']:
            if test['name'] == test_name:
                test_info = test
                break
        
        if not test_info:
            return
        
        # Analyze business flow steps
        steps = implementation.split('\n')
        business_steps = []
        for step in steps:
            step_stripped = step.strip()
            if step_stripped and not step_stripped.startswith('#') and not step_stripped.startswith('['):
                business_steps.append(self._translate_to_business_step(step_stripped))
        
        test_info['business_steps'] = business_steps
    
    def _translate_to_business_step(self, technical_step: str) -> str:
        """Translate technical step to business language."""
        step_lower = technical_step.lower()
        
        if 'login' in step_lower:
            return 'User logs into the system'
        elif 'search' in step_lower and 'deal' in step_lower:
            return 'Search for specific deal/application'
        elif 'credit bureau' in step_lower:
            return 'Process credit bureau consent and reports'
        elif 'liability' in step_lower:
            return 'Manage liability information'
        elif 'submit' in step_lower:
            return 'Submit application/deal for processing'
        elif 'approve' in step_lower:
            return 'Approve the deal/application'
        elif 'validate' in step_lower:
            return 'Validate business rules and data'
        else:
            return technical_step
    
    def _extract_business_flows(self, file_analysis: Dict, business_analysis: Dict):
        """Extract business flows from file analysis."""
        # Extract test scenarios
        for test_case in file_analysis.get('test_cases', []):
            business_analysis['test_scenarios'].append({
                'name': test_case.get('business_scenario', test_case['name']),
                'type': test_case.get('test_type', 'Unknown'),
                'user_journey': test_case.get('user_journey', 'Unknown'),
                'file': test_case['file']
            })
        
        # Extract business flows from keywords
        for kw_name, kw_info in file_analysis.get('keywords', {}).items():
            if kw_info.get('business_purpose') != 'Business Process':
                business_analysis['business_flows'].append({
                    'name': kw_name,
                    'purpose': kw_info.get('business_purpose', 'Unknown'),
                    'complexity': kw_info.get('complexity', 'Unknown'),
                    'file': kw_info['file']
                })
    
    def _extract_python_architecture(self, python_analysis: Dict, architecture_analysis: Dict):
        """Extract architectural information from Python files."""
        # Classify as utility, configuration, or data model
        if 'config' in python_analysis.get('configuration', []):
            architecture_analysis['configuration'].append(python_analysis)
        elif python_analysis.get('classes'):
            architecture_analysis['page_objects'].append(python_analysis)
        elif python_analysis.get('functions'):
            architecture_analysis['utilities'].append(python_analysis)
    
    def _perform_cross_file_analysis(self, analysis: Dict):
        """Perform analysis across multiple files to identify patterns and dependencies."""
        # Analyze data flow between files
        self._analyze_data_flow(analysis)
        
        # Identify missing integrations
        self._identify_missing_integrations(analysis)
        
        # Analyze test coverage
        self._analyze_test_coverage(analysis)
    
    def _analyze_data_flow(self, analysis: Dict):
        """Analyze how data flows between different files and components."""
        # This could be enhanced to track variable usage across files
        pass
    
    def _identify_missing_integrations(self, analysis: Dict):
        """Identify missing integrations between components."""
        # This could identify gaps in the test flow
        pass
    
    def _analyze_test_coverage(self, analysis: Dict):
        """Analyze test coverage across business scenarios."""
        # This could identify uncovered business scenarios
        pass
    
    def _generate_quality_metrics(self, analysis: Dict):
        """Generate quality metrics and improvement suggestions."""
        quality_metrics = analysis['quality_metrics']
        
        # Analyze code smells
        for file_name, file_info in analysis['file_analysis'].items():
            if file_name.endswith('.robot'):
                smells = self._detect_code_smells(file_info)
                quality_metrics['code_smells'].extend(smells)
        
        # Generate improvement suggestions
        suggestions = self._generate_improvement_suggestions(analysis)
        quality_metrics['improvement_suggestions'].extend(suggestions)
        
        # Analyze complexity
        complexity_analysis = self._analyze_complexity(analysis)
        quality_metrics['complexity_analysis'] = complexity_analysis
    
    def _detect_code_smells(self, file_info: Dict) -> List[Dict]:
        """Detect code smells in Robot Framework files."""
        smells = []
        
        for kw_name, kw_info in file_info.get('keywords', {}).items():
            # Long keyword implementation
            impl = kw_info.get('implementation', '')
            if impl and len(impl.split('\n')) > 20:
                smells.append({
                    'type': 'Long Keyword',
                    'keyword': kw_name,
                    'file': kw_info['file'],
                    'suggestion': 'Consider breaking this keyword into smaller, more focused keywords'
                })
            
            # Missing documentation
            if not kw_info.get('documentation'):
                smells.append({
                    'type': 'Missing Documentation',
                    'keyword': kw_name,
                    'file': kw_info['file'],
                    'suggestion': 'Add documentation to explain the business purpose'
                })
        
        return smells
    
    def _generate_improvement_suggestions(self, analysis: Dict) -> List[Dict]:
        """Generate improvement suggestions based on analysis."""
        suggestions = []
        
        # Suggest page object pattern
        ui_heavy_files = []
        for file_name, file_info in analysis['file_analysis'].items():
            if file_name.endswith('.robot'):
                ui_elements = file_info.get('technical_context', {}).get('ui_elements', [])
                if len(ui_elements) > 10:
                    ui_heavy_files.append(file_name)
        
        if ui_heavy_files:
            suggestions.append({
                'type': 'Architecture',
                'title': 'Consider Page Object Pattern',
                'description': f'Files {", ".join(ui_heavy_files)} have many UI elements. Consider implementing Page Object pattern.',
                'priority': 'Medium'
            })
        
        # Suggest data-driven testing
        placeholder_count = len(analysis.get('placeholders', []))
        if placeholder_count > 5:
            suggestions.append({
                'type': 'Testing Strategy',
                'title': 'Implement Data-Driven Testing',
                'description': f'With {placeholder_count} placeholders, consider implementing data-driven test approach.',
                'priority': 'High'
            })
        
        return suggestions
    
    def _analyze_complexity(self, analysis: Dict) -> Dict:
        """Analyze overall complexity of the test suite."""
        complexity_metrics = {
            'total_keywords': len(analysis.get('keywords', {})),
            'placeholder_ratio': 0,
            'average_keyword_complexity': 'Unknown',
            'test_suite_size': 'Unknown'
        }
        
        placeholder_count = len(analysis.get('placeholders', []))
        total_keywords = len(analysis.get('keywords', {}))
        
        if total_keywords > 0:
            complexity_metrics['placeholder_ratio'] = round(placeholder_count / total_keywords * 100, 2)
        
        # Calculate average complexity
        complexities = []
        for file_info in analysis['file_analysis'].values():
            if isinstance(file_info, dict) and 'keywords' in file_info:
                for kw_info in file_info['keywords'].values():
                    complexity = kw_info.get('complexity', 'Unknown')
                    if complexity != 'Unknown':
                        complexities.append(complexity)
        
        if complexities:
            complexity_counts = {c: complexities.count(c) for c in set(complexities)}
            most_common = max(complexity_counts, key=complexity_counts.get)
            complexity_metrics['average_keyword_complexity'] = most_common
        
        return complexity_metrics
    
    def _extract_business_context(self, keyword_name: str, keyword_info: Dict) -> str:
        """Extract business context for a keyword."""
        context_parts = []
        
        purpose = keyword_info.get('business_purpose', '')
        if purpose:
            context_parts.append(f"Purpose: {purpose}")
        
        ui_interactions = keyword_info.get('ui_interactions', [])
        if ui_interactions:
            context_parts.append(f"UI Actions: {', '.join(ui_interactions)}")
        
        data_operations = keyword_info.get('data_operations', [])
        if data_operations:
            context_parts.append(f"Data Operations: {', '.join(data_operations)}")
        
        return '; '.join(context_parts) if context_parts else 'No specific business context identified'
    
    def _infer_class_purpose(self, class_name: str) -> str:
        """Infer the purpose of a Python class."""
        name_lower = class_name.lower()
        if 'utility' in name_lower or 'helper' in name_lower:
            return 'Utility Class'
        elif 'page' in name_lower:
            return 'Page Object'
        elif 'data' in name_lower or 'model' in name_lower:
            return 'Data Model'
        elif 'test' in name_lower:
            return 'Test Helper'
        else:
            return 'Business Logic'
    
    def _infer_function_purpose(self, func_name: str) -> str:
        """Infer the purpose of a Python function."""
        name_lower = func_name.lower()
        if 'get' in name_lower or 'fetch' in name_lower:
            return 'Data Retrieval'
        elif 'set' in name_lower or 'update' in name_lower:
            return 'Data Modification'
        elif 'validate' in name_lower or 'check' in name_lower:
            return 'Validation'
        elif 'parse' in name_lower or 'extract' in name_lower:
            return 'Data Processing'
        elif 'send' in name_lower or 'post' in name_lower:
            return 'Communication'
        else:
            return 'Utility Function'
    
    def generate_ai_insights(self, analysis: Dict, summary: Dict, client, model: str) -> Dict:
        """Generate AI-powered insights about the Robot Framework test suite."""
        try:
            system_prompt = """You are a senior test automation architect and business analyst. Analyze the Robot Framework test suite and provide comprehensive insights covering:

1. Business Logic Analysis
2. Test Architecture Assessment  
3. Quality and Maintainability Review
4. Strategic Recommendations

Focus on both technical and business perspectives. Provide actionable insights."""

            analysis_content = self._prepare_analysis_for_ai(analysis, summary)
            
            ai_response = _make_cached_api_call(
                client=client,
                model=model,
                system_prompt=system_prompt,
                user_content=f"Analyze this Robot Framework test suite:\n\n{analysis_content}",
                temperature=0.3,
                max_tokens=2000
            )
            
            return {
                'summary': self._extract_ai_summary(ai_response),
                'business_insights': self._extract_business_insights(ai_response),
                'technical_insights': self._extract_technical_insights(ai_response),
                'recommendations': self._extract_recommendations(ai_response),
                'full_analysis': ai_response
            }
            
        except Exception as e:
            logger.error(f"AI insights generation failed: {e}")
            return {
                'summary': 'AI analysis unavailable',
                'business_insights': [],
                'technical_insights': [],
                'recommendations': [],
                'full_analysis': f'Error generating insights: {e}'
            }
    
    def generate_contextual_chat_response(self, user_message: str, analysis: Dict, client, model: str) -> str:
        """Generate contextual chat response based on Robot Framework analysis."""
        try:
            system_prompt = """You are an expert Robot Framework consultant and business analyst. Answer user questions about their test automation suite using the provided analysis. 

Be specific and reference actual files, keywords, and business scenarios from their code. Provide practical, actionable advice."""

            analysis_summary = self._create_analysis_summary_for_chat(analysis)
            
            user_content = f"""User Question: {user_message}

Test Suite Analysis:
{analysis_summary}

Please provide a detailed, helpful response based on the actual code and business context."""

            return _make_cached_api_call(
                client=client,
                model=model,
                system_prompt=system_prompt,
                user_content=user_content,
                temperature=0.2,
                max_tokens=1500
            )
            
        except Exception as e:
            logger.error(f"Contextual chat response failed: {e}")
            return f"I encountered an error analyzing your question: {e}. Please try rephrasing your question."
    
    def _prepare_analysis_for_ai(self, analysis: Dict, summary: Dict) -> str:
        """Prepare analysis data for AI consumption."""
        sections = []
        
        # Summary section
        sections.append(f"""OVERVIEW:
- Total Files: {summary['total_files']}
- Total Keywords: {summary['total_keywords']} 
- Placeholder/Missing Implementations: {summary['placeholder_count']}
- Business Test Scenarios: {summary['business_scenarios']}
- Quality Issues Detected: {summary['quality_issues']}""")
        
        # Business analysis section
        business_analysis = analysis.get('business_analysis', {})
        if business_analysis.get('test_scenarios'):
            scenarios_text = '\n'.join([
                f"- {scenario['name']} ({scenario['type']}) - {scenario['user_journey']}"
                for scenario in business_analysis['test_scenarios'][:5]
            ])
            sections.append(f"BUSINESS TEST SCENARIOS:\n{scenarios_text}")
        
        # Placeholder analysis
        placeholders = analysis.get('placeholders', [])[:5]
        if placeholders:
            placeholder_text = '\n'.join([
                f"- {p['keyword']} in {p['file']}: {p.get('business_context', 'No context')}"
                for p in placeholders
            ])
            sections.append(f"MISSING IMPLEMENTATIONS:\n{placeholder_text}")
        
        # Quality issues
        quality_metrics = analysis.get('quality_metrics', {})
        code_smells = quality_metrics.get('code_smells', [])[:3]
        if code_smells:
            smells_text = '\n'.join([
                f"- {smell['type']} in {smell.get('keyword', 'unknown')}: {smell.get('suggestion', 'No suggestion')}"
                for smell in code_smells
            ])
            sections.append(f"QUALITY ISSUES:\n{smells_text}")
        
        # Architecture info
        arch_analysis = analysis.get('architecture_analysis', {})
        if arch_analysis:
            arch_text = f"Configuration files: {len(arch_analysis.get('configuration', []))}, "
            arch_text += f"Utilities: {len(arch_analysis.get('utilities', []))}, "
            arch_text += f"Page Objects: {len(arch_analysis.get('page_objects', []))}"
            sections.append(f"ARCHITECTURE:\n{arch_text}")
        
        return '\n\n'.join(sections)
    
    def _create_analysis_summary_for_chat(self, analysis: Dict) -> str:
        """Create a concise analysis summary for chat context."""
        sections = []
        
        # File overview
        robot_files = analysis.get('robot_files', [])
        python_files = analysis.get('python_files', [])
        sections.append(f"Files: {len(robot_files)} Robot Framework files, {len(python_files)} Python files")
        
        # Key files and their purposes
        key_files = []
        for file_name, file_info in analysis.get('file_analysis', {}).items():
            if file_name.endswith('.robot') and isinstance(file_info, dict):
                domain = file_info.get('business_context', {}).get('domain', 'unknown')
                keyword_count = len(file_info.get('keywords', {}))
                key_files.append(f"{file_name} ({domain}, {keyword_count} keywords)")
        
        if key_files:
            sections.append(f"Key Files:\n" + '\n'.join([f"- {f}" for f in key_files[:5]]))
        
        # Business scenarios
        scenarios = analysis.get('business_analysis', {}).get('test_scenarios', [])
        if scenarios:
            scenario_text = ', '.join([s['name'] for s in scenarios[:3]])
            sections.append(f"Business Scenarios: {scenario_text}")
        
        # Implementation status
        total_keywords = len(analysis.get('keywords', {}))
        placeholder_count = len(analysis.get('placeholders', []))
        if total_keywords > 0:
            completion_rate = round((total_keywords - placeholder_count) / total_keywords * 100, 1)
            sections.append(f"Implementation Status: {completion_rate}% complete ({placeholder_count} placeholders remaining)")
        
        return '\n\n'.join(sections)
    
    def _extract_ai_summary(self, ai_response: str) -> str:
        """Extract summary from AI response."""
        lines = ai_response.split('\n')
        summary_lines = []
        in_summary = False
        
        for line in lines:
            if 'summary' in line.lower() or in_summary:
                in_summary = True
                if line.strip() and not line.startswith('#'):
                    summary_lines.append(line.strip())
                if len(summary_lines) >= 3:
                    break
        
        return ' '.join(summary_lines) if summary_lines else ai_response[:200] + '...'
    
    def _extract_business_insights(self, ai_response: str) -> List[str]:
        """Extract business insights from AI response."""
        insights = []
        lines = ai_response.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in ['business', 'user', 'scenario', 'process', 'workflow']):
                if line.strip() and not line.startswith('#'):
                    insights.append(line.strip())
        
        return insights[:5]
    
    def _extract_technical_insights(self, ai_response: str) -> List[str]:
        """Extract technical insights from AI response."""
        insights = []
        lines = ai_response.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in ['technical', 'code', 'implementation', 'architecture', 'quality']):
                if line.strip() and not line.startswith('#'):
                    insights.append(line.strip())
        
        return insights[:5]
    
    def _extract_recommendations(self, ai_response: str) -> List[str]:
        """Extract recommendations from AI response."""
        recommendations = []
        lines = ai_response.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in ['recommend', 'suggest', 'should', 'consider', 'improve']):
                if line.strip() and not line.startswith('#'):
                    recommendations.append(line.strip())
        
        return recommendations[:5]
    
    def _parse_keyword_line(self, line: str, keyword_info: Dict):
        """Parse individual keyword line."""
        if line.startswith('[Arguments]'):
            args_part = line[11:].strip()
            if args_part:
                keyword_info['arguments'] = [arg.strip() for arg in args_part.split()]
        elif line.startswith('[Documentation]'):
            keyword_info['documentation'] = line[15:].strip()
        elif line.startswith('[Tags]'):
            tags_part = line[6:].strip()
            if tags_part:
                keyword_info['tags'] = [tag.strip() for tag in tags_part.split()]
    
    def _is_placeholder_implementation(self, implementation: str) -> bool:
        """Check if implementation is a placeholder."""
        if not implementation:
            return True
        
        for pattern in self.placeholder_patterns:
            if re.search(pattern, implementation, re.IGNORECASE):
                return True
        
        # Check if implementation only contains comments and BuiltIn.No Operation
        clean_lines = []
        for line in implementation.split('\n'):
            stripped = line.strip()
            if stripped and not stripped.startswith('#'):
                clean_lines.append(stripped)
        
        if not clean_lines:
            return True
        
        if len(clean_lines) == 1 and 'BuiltIn.No Operation' in clean_lines[0]:
            return True
        
        return False
    
    def _find_missing_implementations_comprehensive(self, analysis: Dict) -> List[Dict]:
        """Find keywords that are called but not implemented with business context."""
        missing = []
        implemented_keywords = set()
        called_keywords = set()
        
        # Collect all implemented keywords
        for full_name, kw_info in analysis['keywords'].items():
            if not self._is_placeholder_implementation(kw_info.get('implementation', '')):
                implemented_keywords.add(kw_info.get('file', '') + '::' + full_name.split('::')[-1])
        
        # Find called keywords in implementations and test cases
        for file_name, file_info in analysis['file_analysis'].items():
            if 'error' in file_info:
                continue
            
            # Check keyword implementations for calls to other keywords
            for kw_name, kw_info in file_info.get('keywords', {}).items():
                impl = kw_info.get('implementation', '')
                called_keywords.update(self._extract_keyword_calls(impl))
            
            # Check test cases for keyword calls
            for test in file_info.get('test_cases', []):
                impl = test.get('implementation', '')
                if impl:
                    called_keywords.update(self._extract_keyword_calls(impl))
        
        # Find missing implementations with business context
        for called in called_keywords:
            if called not in implemented_keywords:
                missing.append({
                    'keyword': called,
                    'reason': 'Called but not implemented or placeholder',
                    'business_impact': self._assess_business_impact(called),
                    'suggested_priority': self._suggest_implementation_priority(called)
                })
        
        return missing
    
    def _assess_business_impact(self, keyword_name: str) -> str:
        """Assess the business impact of a missing keyword implementation."""
        name_lower = keyword_name.lower()
        
        if any(critical in name_lower for critical in ['login', 'submit', 'approve', 'validate']):
            return 'High - Core business process'
        elif any(important in name_lower for important in ['search', 'create', 'update', 'save']):
            return 'Medium - Important business function'
        elif any(ui in name_lower for ui in ['click', 'navigate', 'open', 'close']):
            return 'Low - UI interaction'
        else:
            return 'Medium - Business logic'
    
    def _suggest_implementation_priority(self, keyword_name: str) -> str:
        """Suggest implementation priority based on keyword name and business impact."""
        impact = self._assess_business_impact(keyword_name)
        
        if 'High' in impact:
            return 'Critical'
        elif 'Medium' in impact:
            return 'High'
        else:
            return 'Medium'
    
    def _extract_keyword_calls(self, implementation: str) -> Set[str]:
        """Extract keyword calls from implementation text."""
        calls = set()
        if not implementation:
            return calls
        
        lines = implementation.split('\n')
        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith('#') or stripped.startswith('['):
                continue
            
            # Simple heuristic: look for lines that might be keyword calls
            # This could be improved with proper Robot Framework parsing
            if '.' in stripped and not stripped.startswith('${'):
                # Might be Library.Keyword or Module.Keyword
                parts = stripped.split()
                if parts:
                    first_part = parts[0]
                    if '.' in first_part and not first_part.startswith('${'):
                        calls.add(first_part)
            else:
                # Might be direct keyword call
                parts = stripped.split()
                if parts and not parts[0].startswith('${') and not any(
                    parts[0].startswith(prefix) for prefix in ['IF', 'FOR', 'WHILE', 'TRY', 'EXCEPT']
                ):
                    calls.add(parts[0])
        
        return calls
    
    def generate_keyword_implementations(self, analysis: Dict, client, model: str) -> Dict[str, str]:
        """Generate implementations for placeholder keywords using AI with batch processing."""
        implementations = {}
        placeholders = analysis['placeholders']
        
        if not placeholders:
            return implementations
        
        # Process in batches to reduce API calls
        batch_size = 3  # Process 3 keywords at once
        
        for i in range(0, len(placeholders), batch_size):
            batch = placeholders[i:i + batch_size]
            
            try:
                if len(batch) == 1:
                    # Single keyword processing
                    placeholder = batch[0]
                    implementation = self._generate_single_keyword_implementation(
                        placeholder, analysis, client, model
                    )
                    key = f"{placeholder['file']}::{placeholder['keyword']}"
                    implementations[key] = implementation
                else:
                    # Batch processing
                    batch_implementations = self._generate_batch_keyword_implementations(
                        batch, analysis, client, model
                    )
                    implementations.update(batch_implementations)
                    
            except Exception as e:
                logger.error(f"Failed to generate batch implementations: {e}")
                # Fallback to individual processing
                for placeholder in batch:
                    try:
                        implementation = self._generate_single_keyword_implementation(
                            placeholder, analysis, client, model
                        )
                        key = f"{placeholder['file']}::{placeholder['keyword']}"
                        implementations[key] = implementation
                    except Exception as e2:
                        logger.error(f"Failed to generate implementation for {placeholder['keyword']}: {e2}")
                        key = f"{placeholder['file']}::{placeholder['keyword']}"
                        implementations[key] = f"# Error generating implementation: {e2}\nBuiltIn.No Operation"
        
        return implementations
    
    def _generate_batch_keyword_implementations(self, placeholders: List[Dict], analysis: Dict, client, model: str) -> Dict[str, str]:
        """Generate implementations for multiple keywords in a single API call."""
        # Prepare batch context
        context_info = self._build_comprehensive_context(analysis)
        
        # Create batch prompt
        batch_prompt = "Generate Robot Framework implementations for these keywords:\n\n"
        
        for i, placeholder in enumerate(placeholders, 1):
            batch_prompt += f"{i}. KEYWORD: {placeholder['keyword']}\n"
            batch_prompt += f"   FILE: {placeholder['file']}\n"
            if placeholder.get('documentation'):
                batch_prompt += f"   DOCUMENTATION: {placeholder['documentation']}\n"
            if placeholder.get('business_context'):
                batch_prompt += f"   BUSINESS CONTEXT: {placeholder['business_context']}\n"
            batch_prompt += f"   CURRENT: {placeholder.get('implementation', 'BuiltIn.No Operation')}\n\n"
        
        system_prompt = """You are a Robot Framework automation expert. Generate complete, functional implementations for ALL the requested keywords.

Rules:
1. Use only Robot Framework syntax and SeleniumLibrary keywords
2. Include proper error handling and logging
3. Use the variables and locators defined in the uploaded files
4. Follow the existing code style and patterns
5. Include meaningful comments
6. Use proper indentation (4 spaces)
7. Use CustomKeywords.Custom Capture Page Screenshot for screenshots
8. NEVER inline raw XPath or CSS selector strings inside steps. If a locator variable does not already exist, first declare a descriptive variable (e.g. ${Login_Button_XPATH}, ${SearchInput_CSS}) with a temporary placeholder value XPATH_PLACEHOLDER and a comment '# TODO: update locator', then use that variable. Reuse existing locator variables when present. Ignore any previous ${gv_xpath_*} naming convention.

Format: For each keyword, provide:
KEYWORD: [keyword_name]
IMPLEMENTATION:
[complete implementation here]

---

"""

        user_content = f"""{batch_prompt}

Context from uploaded files:
{context_info}

Please generate complete, functional Robot Framework keyword implementations for ALL keywords listed above."""

        try:
            response = _make_cached_api_call(
                client=client,
                model=model,
                system_prompt=system_prompt,
                user_content=user_content,
                temperature=0.2,
                max_tokens=2500
            )
            # Parse batch response
            return self._parse_batch_response(response, placeholders)
        except Exception as e:
            raise Exception(f"Batch AI generation failed: {e}")
    
    def _parse_batch_response(self, response: str, placeholders: List[Dict]) -> Dict[str, str]:
        """Parse the batch response and extract individual implementations."""
        implementations = {}
        
        # Split response by keyword boundaries
        sections = response.split('KEYWORD:')
        
        for section in sections[1:]:  # Skip first empty section
            lines = section.strip().split('\n')
            if not lines:
                continue
            
            # Extract keyword name
            keyword_name = lines[0].strip()
            
            # Find matching placeholder
            matching_placeholder = None
            for placeholder in placeholders:
                if placeholder['keyword'].lower() in keyword_name.lower() or keyword_name.lower() in placeholder['keyword'].lower():
                    matching_placeholder = placeholder
                    break
            
            if not matching_placeholder:
                continue
            
            # Extract implementation
            impl_start = -1
            for i, line in enumerate(lines):
                if 'IMPLEMENTATION:' in line:
                    impl_start = i + 1
                    break
            
            if impl_start > 0:
                impl_lines = []
                for line in lines[impl_start:]:
                    if line.strip() == '---':
                        break
                    impl_lines.append(line)
                
                implementation = '\n'.join(impl_lines).strip()
                if implementation:
                    key = f"{matching_placeholder['file']}::{matching_placeholder['keyword']}"
                    implementations[key] = implementation
        
        # Fallback for any missing implementations
        for placeholder in placeholders:
            key = f"{placeholder['file']}::{placeholder['keyword']}"
            if key not in implementations:
                implementations[key] = f"# TODO: Implement {placeholder['keyword']}\nBuiltIn.No Operation"
        
        return implementations
    
    def _build_comprehensive_context(self, analysis: Dict) -> str:
        """Build comprehensive context for batch processing."""
        context_parts = []
        
        # Add available variables from all files
        all_variables = []
        for file_info in analysis['file_analysis'].values():
            if isinstance(file_info, dict) and 'variables' in file_info:
                all_variables.extend(file_info['variables'])
        
        if all_variables:
            context_parts.append(f"Available variables: {', '.join(all_variables[:20])}")
        
        # Add implemented keywords for reference
        implemented_keywords = []
        for full_name, kw_info in analysis['keywords'].items():
            if not self._is_placeholder_implementation(kw_info.get('implementation', '')):
                implemented_keywords.append(full_name.split('::')[-1])
        
        if implemented_keywords:
            context_parts.append(f"Implemented keywords for reference: {', '.join(implemented_keywords[:10])}")
        
        # Add business context
        business_analysis = analysis.get('business_analysis', {})
        scenarios = business_analysis.get('test_scenarios', [])
        if scenarios:
            scenario_names = [s['name'] for s in scenarios[:5]]
            context_parts.append(f"Business scenarios: {', '.join(scenario_names)}")
        
        return '\n\n'.join(context_parts)

    def _generate_single_keyword_implementation(self, placeholder: Dict, analysis: Dict, client, model: str) -> str:
        """Generate implementation for a single keyword."""
        keyword_name = placeholder['keyword']
        file_name = placeholder['file']
        documentation = placeholder.get('documentation', '')
        
        # Gather context from all uploaded files
        context_info = self._build_context_for_keyword(keyword_name, file_name, analysis)

        system_prompt = """You are a Robot Framework automation expert. Generate a complete, functional implementation for the given keyword.

Rules:
1. Use only Robot Framework syntax and SeleniumLibrary keywords
2. Include proper error handling and logging
3. Use the variables and locators defined in the uploaded files
4. Follow the existing code style and patterns
5. Include meaningful comments
6. Use proper indentation (4 spaces)
7. Return ONLY the keyword implementation (no *** Keywords *** header)
8. Use CustomKeywords.Custom Capture Page Screenshot for screenshots
9. Do NOT inline raw XPath/CSS strings. Introduce (or reuse) a clearly named variable like ${Login_Button_XPATH}. If new, assign XPATH_PLACEHOLDER and add '# TODO: update locator'. Ignore legacy ${gv_xpath_*} pattern.

Format the response as a complete keyword implementation."""

        user_prompt = f"""Generate implementation for keyword: {keyword_name}

Documentation: {documentation}

Context from uploaded files:
{context_info}

Current placeholder implementation:
{placeholder.get('implementation', '')}

Please generate a complete, functional Robot Framework keyword implementation."""

        try:
            return _make_cached_api_call(
                client=client,
                model=model,
                system_prompt=system_prompt,
                user_content=user_prompt,
                temperature=0.2,
                max_tokens=1000
            )
        except Exception as e:
            raise Exception(f"AI generation failed: {e}")
    
    def _build_context_for_keyword(self, keyword_name: str, file_name: str, analysis: Dict) -> str:
        """Build context information for keyword generation."""
        context_parts = []
        
        # Add file-specific variables and locators
        file_analysis = analysis['file_analysis'].get(file_name, {})
        if 'variables' in file_analysis and file_analysis['variables']:
            context_parts.append(f"Variables in {file_name}: {', '.join(file_analysis['variables'])}")
        
        # Add related keywords from the same file
        related_keywords = []
        for kw_name, kw_info in file_analysis.get('keywords', {}).items():
            if kw_name != keyword_name and not self._is_placeholder_implementation(kw_info.get('implementation', '')):
                related_keywords.append(f"{kw_name}: {kw_info.get('documentation', 'No documentation')}")
        
        if related_keywords:
            context_parts.append(f"Implemented keywords in {file_name}:\n" + '\n'.join(related_keywords[:5]))
        
        # Add dependencies
        deps = analysis['dependencies'].get(file_name, {})
        if deps.get('libraries'):
            context_parts.append(f"Available libraries: {', '.join(deps['libraries'])}")
        if deps.get('resources'):
            context_parts.append(f"Resource files: {', '.join(deps['resources'])}")
        
        # Add variables from CustomKeywords.robot if available
        if 'CustomKeywords.robot' in analysis['file_analysis']:
            ck_vars = analysis['file_analysis']['CustomKeywords.robot'].get('variables', [])
            if ck_vars:
                context_parts.append(f"Available variables from CustomKeywords: {', '.join(ck_vars[:10])}")
        
        return '\n\n'.join(context_parts)

def _collect_modified_file_context(exclude: Iterable[str], max_files: int = 3, max_bytes: int = 8000) -> str:
    """Return a textual block with a small subset of other recently modified files' contents.

    We pick up to `max_files` modified files (excluding those in `exclude`), prioritizing most recently patched.
    Truncate aggregate to `max_bytes` to avoid blowing token limits.
    """
    # gather candidates
    mods = [m for n, m in _file_index.items() if m.get('modified') and n not in exclude]
    mods.sort(key=lambda m: (-(m.get('last_applied') or 0)))
    selected = []
    total = 0
    for meta in mods:
        if len(selected) >= max_files:
            break
        path = meta.get('path')
        if not path or not os.path.isfile(path):
            continue
        try:
            with open(path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception:
            continue
        snippet = content[: max(2000, max_bytes // max_files)]  # rough cap per file
        block = f"FILE: {meta['filename']}\n```\n{snippet}\n```\n"
        block_bytes = len(block.encode('utf-8'))
        if total + block_bytes > max_bytes:
            break
        selected.append(block)
        total += block_bytes
    if not selected:
        return ''
    return "Additional Modified File Context (read-only, do not edit here – only edit target diffs):\n" + '\n'.join(selected)

def _load_state():
    global _assistant_id, _vector_store_id
    if os.path.isfile(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            _assistant_id = data.get('assistant_id')
            _vector_store_id = data.get('vector_store_id')
            logger.info("Restored assistant state: assistant=%s vector_store=%s", _assistant_id, _vector_store_id)
        except Exception as e:
            logger.warning("Failed loading state file: %s", e)

def _save_state():
    try:
        with open(STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump({
                'assistant_id': _assistant_id,
                'vector_store_id': _vector_store_id
            }, f)
    except Exception as e:
        logger.warning("Failed saving state: %s", e)

def _load_api_cache():
    """Load API response cache from disk."""
    global _api_cache
    if os.path.isfile(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                _api_cache = json.load(f)
            logger.info("Loaded API cache with %d entries", len(_api_cache))
        except Exception as e:
            logger.warning("Failed loading API cache: %s", e)
            _api_cache = {}
    else:
        _api_cache = {}

def _save_api_cache():
    """Save API response cache to disk."""
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(_api_cache, f, indent=2)
    except Exception as e:
        logger.warning("Failed saving API cache: %s", e)

def _generate_cache_key(system_prompt: str, user_content: str, model: str, temperature: float = 0.2) -> str:
    """Generate a unique cache key for API requests."""
    content = f"{system_prompt}|{user_content}|{model}|{temperature}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def _is_cache_valid(cache_entry: Dict) -> bool:
    """Check if a cache entry is still valid."""
    if 'timestamp' not in cache_entry:
        return False
    
    cache_time = datetime.fromisoformat(cache_entry['timestamp'])
    expiry_time = cache_time + timedelta(hours=CACHE_EXPIRY_HOURS)
    return datetime.now() < expiry_time

def _cleanup_expired_cache():
    """Remove expired entries from cache."""
    global _api_cache
    expired_keys = []
    for key, entry in _api_cache.items():
        if not _is_cache_valid(entry):
            expired_keys.append(key)
    
    for key in expired_keys:
        del _api_cache[key]
    
    if expired_keys:
        logger.info("Cleaned up %d expired cache entries", len(expired_keys))
        _save_api_cache()

def _rate_limit_check() -> Tuple[bool, float]:
    """Check if we're within rate limits. Returns (allowed, wait_time)."""
    global _last_api_call, _api_call_count, _rate_limit_window_start
    
    now = time.time()
    
    # Reset counter if window has passed
    if now - _rate_limit_window_start > 60:
        _rate_limit_window_start = now
        _api_call_count = 0
    
    # Check if we've exceeded calls per minute
    if _api_call_count >= MAX_CALLS_PER_MINUTE:
        wait_time = 60 - (now - _rate_limit_window_start)
        return False, max(wait_time, 0)
    
    # Check minimum interval between calls
    time_since_last = now - _last_api_call
    if time_since_last < MIN_API_INTERVAL:
        wait_time = MIN_API_INTERVAL - time_since_last
        return False, wait_time
    
    return True, 0

def _count_tokens(text: str, model: str = "gpt-5") -> int:
    """Count tokens in text using tiktoken with local cache."""
    try:
        # Try to use local encoding cache first
        if "gpt-5" in model.lower() or "gpt-4" in model.lower():
            # Use cl100k_base encoding for GPT-4/5 models
            encoding = tiktoken.get_encoding("cl100k_base")
        else:
            # Fallback to cl100k_base encoding
            encoding = tiktoken.get_encoding("cl100k_base")
        
        return len(encoding.encode(text))
    except Exception as e:
        logger.warning(f"Error counting tokens: {e}, using approximate count")
        # Fallback: rough approximation (1 token ≈ 4 characters)
        return len(text) // 4

def _chunk_large_content(text: str, model: str = "gpt-5", max_chunk_tokens: int = 8000) -> List[str]:
    """Split large text into chunks that fit within token limits."""
    try:
        # Use cl100k_base encoding for all models to avoid online downloads
        encoding = tiktoken.get_encoding("cl100k_base")
        
        # Encode the text to tokens
        tokens = encoding.encode(text)
        
        # If it fits in one chunk, return as-is
        if len(tokens) <= max_chunk_tokens:
            return [text]
        
        # Split into chunks
        chunks = []
        for i in range(0, len(tokens), max_chunk_tokens):
            chunk_tokens = tokens[i:i + max_chunk_tokens]
            chunk_text = encoding.decode(chunk_tokens)
            chunks.append(chunk_text)
        
        logger.info(f"📦 Split content into {len(chunks)} chunks of ~{max_chunk_tokens} tokens each")
        return chunks
        
    except Exception as e:
        logger.warning(f"Error chunking content: {e}, using simple split")
        # Fallback: split by characters (approximate)
        chunk_size = max_chunk_tokens * 4  # rough approximation
        chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
        return chunks

def _make_cached_api_call(client, model: str, system_prompt: str, user_content: str, 
                         temperature: float = 0.7, max_tokens: int = 1000, 
                         use_cache: bool = True) -> str:
    """Make an API call with caching and rate limiting."""
    global _last_api_call, _api_call_count
    
    # Generate cache key
    cache_key = _generate_cache_key(system_prompt, user_content, model, temperature)
    
    # Check cache first
    if use_cache and cache_key in _api_cache:
        cache_entry = _api_cache[cache_key]
        if _is_cache_valid(cache_entry):
            # Count tokens for cached response too
            system_tokens = _count_tokens(system_prompt, model)
            user_tokens = _count_tokens(user_content, model)
            total_input_tokens = system_tokens + user_tokens
            response_tokens = _count_tokens(cache_entry['response'], model)
            total_tokens = total_input_tokens + response_tokens
            logger.info(f"📁 Using cached response - Input tokens: {total_input_tokens}, Response tokens: {response_tokens}, Total tokens: {total_tokens}")
            return cache_entry['response']
        else:
            # Remove expired entry
            del _api_cache[cache_key]
    
    # Check rate limits
    allowed, wait_time = _rate_limit_check()
    if not allowed:
        logger.warning("Rate limit reached, waiting %.2f seconds", wait_time)
        time.sleep(wait_time + 0.1)  # Add small buffer
    
    # Check if we need to chunk the user content due to token limits
    system_tokens = _count_tokens(system_prompt, model)
    user_tokens = _count_tokens(user_content, model)
    total_input_tokens = system_tokens + user_tokens
    
    # If total tokens exceed 10K, chunk the user content
    # Strategy: 10K tokens every 10 seconds = max 60K tokens per minute
    MAX_TOKENS_PER_CALL = 10000
    if total_input_tokens > MAX_TOKENS_PER_CALL:
        logger.warning(f"⚠️  Large request detected: {total_input_tokens} tokens. Chunking user content...")
        logger.info(f"📊 Chunking strategy: 10K tokens per call, 10-second intervals = 60K tokens/minute max")
        
        # Calculate how much space we have for user content
        available_tokens = MAX_TOKENS_PER_CALL - system_tokens - 500  # Reserve 500 for safety
        
        # Chunk the user content
        user_chunks = _chunk_large_content(user_content, model, available_tokens)
        
        responses = []
        for i, chunk in enumerate(user_chunks):
            logger.info(f"📦 Processing chunk {i+1}/{len(user_chunks)} - Chunk tokens: {_count_tokens(chunk, model)}")
            
            # Add context to chunk to maintain coherence
            if len(user_chunks) > 1:
                chunk_prompt = f"This is part {i+1} of {len(user_chunks)} of a larger request. Please analyze this section:\n\n{chunk}"
            else:
                chunk_prompt = chunk
            
            # Make API call for this chunk
            chunk_response = _make_single_api_call(client, model, system_prompt, chunk_prompt, temperature, max_tokens, use_cache)
            responses.append(chunk_response)
            
            # Wait 10 seconds between chunks (except for the last one) - allows 60K tokens per minute
            if i < len(user_chunks) - 1:
                logger.info("⏳ Waiting 10 seconds before next chunk...")
                time.sleep(10)
        
        # Combine responses
        combined_response = "\n\n---CHUNK SEPARATOR---\n\n".join(responses)
        logger.info(f"✅ Completed chunked processing. Total chunks: {len(user_chunks)}")
        return combined_response
    
    # If tokens are within limit, proceed normally
    return _make_single_api_call(client, model, system_prompt, user_content, temperature, max_tokens, use_cache)

def _make_single_api_call(client, model: str, system_prompt: str, user_content: str, 
                         temperature: float = 0.7, max_tokens: int = 1000, 
                         use_cache: bool = True) -> str:
    """Make a single API call without chunking."""
    global _last_api_call, _api_call_count
    
    # Generate cache key
    cache_key = _generate_cache_key(system_prompt, user_content, model, temperature)
    
    # Check cache first
    if use_cache and cache_key in _api_cache:
        cache_entry = _api_cache[cache_key]
        if _is_cache_valid(cache_entry):
            # Count tokens for cached response too
            system_tokens = _count_tokens(system_prompt, model)
            user_tokens = _count_tokens(user_content, model)
            total_input_tokens = system_tokens + user_tokens
            response_tokens = _count_tokens(cache_entry['response'], model)
            total_tokens = total_input_tokens + response_tokens
            logger.info(f"📁 Using cached response - Input tokens: {total_input_tokens}, Response tokens: {response_tokens}, Total tokens: {total_tokens}")
            return cache_entry['response']
        else:
            # Remove expired entry
            del _api_cache[cache_key]
    
    # Check rate limits
    allowed, wait_time = _rate_limit_check()
    if not allowed:
        logger.warning("Rate limit reached, waiting %.2f seconds", wait_time)
        time.sleep(wait_time + 0.1)  # Add small buffer
    
    # Make API call with retry logic
    max_retries = 3
    base_delay = 5
    
    for attempt in range(max_retries):
        try:
            # Count tokens being sent
            system_tokens = _count_tokens(system_prompt, model)
            user_tokens = _count_tokens(user_content, model)
            total_input_tokens = system_tokens + user_tokens
            
            logger.info(f"🔢 Sending API call - Model: {model}, Input tokens: {total_input_tokens} (system: {system_tokens}, user: {user_tokens}), Max output tokens: {max_tokens}")
            
            # Update rate limiting counters
            _last_api_call = time.time()
            _api_call_count += 1
            
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            response = completion.choices[0].message.content.strip()
            
            # Count response tokens and log usage
            response_tokens = _count_tokens(response, model)
            total_tokens = total_input_tokens + response_tokens
            logger.info(f"✅ API call completed - Response tokens: {response_tokens}, Total tokens: {total_tokens}")
            
            # Cache the response
            if use_cache:
                _api_cache[cache_key] = {
                    'response': response,
                    'timestamp': datetime.now().isoformat(),
                    'model': model,
                    'temperature': temperature
                }
                _save_api_cache()
            
            return response
            
        except Exception as e:
            if "429" in str(e) or "rate limit" in str(e).lower():
                # Rate limit hit, implement exponential backoff
                delay = base_delay * (2 ** attempt)
                logger.warning(f"Rate limit hit on attempt {attempt + 1}, waiting {delay} seconds")
                time.sleep(delay)
                
                # Reset rate limiting counters after a rate limit error
                _api_call_count = max(0, _api_call_count - 1)
                continue
            else:
                # Other error, log and re-raise
                logger.error(f"API call failed on attempt {attempt + 1}: {e}")
                if attempt == max_retries - 1:
                    raise
                time.sleep(base_delay)
    
    raise Exception("Max retries exceeded")

_load_state()
_load_api_cache()


def get_client():
    """Instantiate (once) the AzureOpenAI client using either explicit ClientSecretCredential or DefaultAzureCredential.

    Expected ENV for service principal route:
      AZURE_OPENAI_TENANT_ID
      AZURE_OPENAI_CLIENT_ID
      AZURE_OPENAI_CLIENT_SECRET

    Optional / also used:
      AZURE_OPENAI_ENDPOINT  (defaults to provided endpoint if unset)
      AZURE_OPENAI_MODEL     (deployment name)
    """
    global _client
    if _client is None:
        cfg = load_config()
        tenant_id = cfg.get("azure_credentials", {}).get("tenant_id") or ""
        client_id = cfg.get("azure_credentials", {}).get("client_id") or ""
        client_secret = cfg.get("azure_credentials", {}).get("client_secret") or ""

        cfg_sec = cfg.get("security", {})
        # If verify_ssl is False then we disable ssl verification.
        disable_ssl = not cfg_sec.get("verify_ssl", True)
        custom_ca = cfg_sec.get("ca_bundle") or None

        # Configure global SSL relaxation if requested (DEV ONLY)
        transport = None
        if disable_ssl:
            try:
                urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
                warnings.filterwarnings('ignore', message='Unverified HTTPS request')
                os.environ['PYTHONHTTPSVERIFY'] = '0'
                os.environ['REQUESTS_CA_BUNDLE'] = ''
                os.environ['CURL_CA_BUNDLE'] = ''
                if hasattr(ssl, '_create_unverified_context'):
                    ssl._create_default_https_context = ssl._create_unverified_context  # type: ignore
                transport = RequestsTransport(verify=False)
            except Exception:
                pass
        elif custom_ca and os.path.isfile(custom_ca):
            # Use custom CA trust chain
            os.environ['REQUESTS_CA_BUNDLE'] = custom_ca
            os.environ['CURL_CA_BUNDLE'] = custom_ca
            transport = RequestsTransport(verify=custom_ca)

        # Validate required credentials (no env fallback, no DefaultAzureCredential)
        if not (tenant_id and client_id and client_secret):
            raise RuntimeError("azure_credentials.tenant_id, client_id, client_secret must be set in config.json")

        token_provider = None
        # In insecure mode, bypass azure-identity entirely to avoid SSL validation path
        if disable_ssl:
            logger.warning("Using INSECURE manual OAuth2 client credentials flow (verify_ssl=false in config). FOR DEVELOPMENT ONLY.")

            def _fetch_token() -> Tuple[str, int]:
                url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
                data = {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "grant_type": "client_credentials",
                    "scope": "https://cognitiveservices.azure.com/.default"
                }
                try:
                    resp = requests.post(url, data=data, verify=False, timeout=15)
                except Exception as e:
                    raise RuntimeError(f"Token request failed: {e}")
                if resp.status_code != 200:
                    raise RuntimeError(f"Token request HTTP {resp.status_code}: {resp.text[:180]}")
                js = resp.json()
                access_token = js.get("access_token")
                expires_in = js.get("expires_in", 3600)
                if not access_token:
                    raise RuntimeError("No access_token in response")
                return access_token, int(time.time()) + int(expires_in)

            # Prime first token
            _cached_token: Optional[str] = None
            _cached_exp: int = 0
            try:
                _cached_token, _cached_exp = _fetch_token()
            except Exception as e:
                logger.error(f"Initial insecure token fetch failed: {e}")
                raise

            def insecure_provider() -> str:
                nonlocal _cached_token, _cached_exp
                if _cached_token is None or time.time() > _cached_exp - 60:
                    _cached_token, _cached_exp = _fetch_token()
                return _cached_token

            token_provider = insecure_provider
        else:
            logger.info("Initializing ClientSecretCredential (transport=%s, disable_ssl=%s, custom_ca=%s)", bool(transport), disable_ssl, bool(custom_ca))
            credential = ClientSecretCredential(
                tenant_id=tenant_id,
                client_id=client_id,
                client_secret=client_secret,
                transport=transport
            )
            token_provider = get_bearer_token_provider(
                credential,
                "https://cognitiveservices.azure.com/.default"
            )

        azure_endpoint = cfg.get("openai", {}).get("api_base", "https://9747-dcane.openai.azure.com/")

        http_client = None
        if disable_ssl:
            http_client = httpx.Client(verify=False)
        elif custom_ca and os.path.isfile(custom_ca):
            http_client = httpx.Client(verify=custom_ca)

        _client = AzureOpenAI(
            azure_ad_token_provider=token_provider,
            azure_endpoint=azure_endpoint.rstrip('/'),
            api_version="2024-12-01-preview",
            http_client=http_client
        )
        logger.info("AzureOpenAI client initialized (endpoint=%s, insecure=%s, custom_ca=%s, model=%s)", azure_endpoint, disable_ssl, bool(custom_ca), cfg.get('openai',{}).get('llm_deployment'))
    return _client

def get_assistant():
    global _assistant_id, _vector_store_id
    client = get_client()
    cfg = load_config()
    model = get_model_name()

    def _supports_vector_stores(c) -> bool:
        """Return True if the instantiated OpenAI client exposes vector store APIs.

        AzureOpenAI (azure endpoint) currently does not surface beta.vector_stores; attempting
        to access it causes attribute errors. We defensively probe capability before use.
        """
        try:
            return hasattr(c, 'beta') and hasattr(c.beta, 'vector_stores') and hasattr(c.beta.vector_stores, 'create')
        except Exception:
            return False

    # Ensure vector store (only if supported by client / endpoint)
    if _vector_store_id is None and _supports_vector_stores(client):
        try:
            vs = client.beta.vector_stores.create(name="UserFilesStore")
            _vector_store_id = vs.id
            logger.info("Created vector store %s", _vector_store_id)
            _save_state()
        except Exception as e:
            logger.error("Vector store create failed: %s (feature will be disabled)", e)
    elif _vector_store_id is None:
        logger.info("Vector store feature not supported by current client; continuing without file_search.")

    if _assistant_id is None:
        try:
            tools = [{"type": "code_interpreter"}]
            tool_resources = {}
            if _vector_store_id:
                tools.append({"type": "file_search"})
                tool_resources = {"file_search": {"vector_store_ids": [_vector_store_id]}, "code_interpreter": {}}
            assistant = client.beta.assistants.create(
                model=model,
                name="CodeHelper",
                instructions="You are a coding assistant. Provide concise, clear answers. Use file_search to reference uploaded code.",
                tools=tools,
                tool_resources=tool_resources or None,
                temperature=cfg.get('openai', {}).get('temperature', 0.2),
                top_p=0.9
            )
            _assistant_id = assistant.id
            _save_state()
            logger.info("Created assistant %s", _assistant_id)
        except Exception as e:
            logger.error("Assistant creation failed: %s", e)
            raise
    return _assistant_id

def get_model_name():
    cfg = load_config()
    return cfg.get("openai", {}).get("llm_deployment", "gpt-5")

def process_excel_test_cases(file_path: str) -> List[Dict]:
    """
    Process Excel file and extract test cases from columns F, G, H, I.
    Handles merged cells for test case descriptions.
    
    Returns list of test cases with their steps.
    """
    logger.info(f"📋 Starting Excel processing for file: {file_path}")
    
    # Check if file exists
    if not os.path.exists(file_path):
        logger.error(f"❌ File does not exist: {file_path}")
        raise FileNotFoundError(f"Excel file not found: {file_path}")
    
    # Check file size
    file_size = os.path.getsize(file_path)
    logger.info(f"📏 File size: {file_size} bytes")
    
    if file_size == 0:
        logger.error("❌ File is empty")
        raise ValueError("Excel file is empty")
    
    try:
        # Read the Excel file with proper resource management
        logger.info("📖 Reading Excel file...")
        with pd.ExcelFile(file_path, engine='openpyxl') as workbook:
            logger.info(f"📊 Available sheets: {workbook.sheet_names}")
            sheet_name = workbook.sheet_names[0]  # Use first sheet
            logger.info(f"📊 Using sheet: {sheet_name}")
            df = pd.read_excel(workbook, sheet_name=sheet_name)
        
        logger.info(f"📏 Excel dimensions: {df.shape[0]} rows x {df.shape[1]} columns")
        logger.info(f"📝 Column headers: {list(df.columns)}")
        
        # Check if we have enough columns
        if df.shape[1] < 9:
            logger.error(f"❌ Insufficient columns: {df.shape[1]} (need at least 9 for columns A-I)")
            raise ValueError(f"Excel file must have at least 9 columns (A-I). Found {df.shape[1]} columns.")
        
        # Map column letters to indices (F=5, G=6, H=7, I=8 in 0-based indexing)
        # Assuming columns are: F=Test Case Description, G=Test Step, H=Test Case Expected Results, I=Step#
        test_cases = []
        current_test_case = None
        
        logger.info("🔍 Processing rows...")
        for index, row in df.iterrows():
            try:
                # Skip if row is completely empty
                if pd.isna(row.iloc[5:9]).all():
                    continue
                
                test_case_desc = row.iloc[5] if pd.notna(row.iloc[5]) else None  # Column F
                test_step = row.iloc[6] if pd.notna(row.iloc[6]) else None       # Column G  
                expected_result = row.iloc[7] if pd.notna(row.iloc[7]) else None # Column H
                step_number = row.iloc[8] if pd.notna(row.iloc[8]) else None     # Column I
                
                if index < 5:  # Log first few rows for debugging
                    logger.info(f"Row {index}: F='{test_case_desc}', G='{test_step}', H='{expected_result}', I='{step_number}'")
                
                # If we have a test case description, start a new test case
                if test_case_desc:
                    if current_test_case and current_test_case['steps']:
                        test_cases.append(current_test_case)
                        logger.info(f"✅ Added test case: {current_test_case['description'][:50]}...")
                    
                    current_test_case = {
                        'description': str(test_case_desc),
                        'steps': []
                    }
                    logger.info(f"🆕 Started new test case: {str(test_case_desc)[:50]}...")
                
                # Add step if we have a current test case and step information
                if current_test_case and (test_step or expected_result):
                    step = {
                        'step_number': str(step_number) if step_number else '',
                        'test_step': str(test_step) if test_step else '',
                        'expected_result': str(expected_result) if expected_result else ''
                    }
                    current_test_case['steps'].append(step)
            
            except Exception as e:
                logger.warning(f"Error processing row {index}: {e}")
                continue
        
        # Add the last test case if it exists
        if current_test_case and current_test_case['steps']:
            test_cases.append(current_test_case)
        
        logger.info(f"Processed {len(test_cases)} test cases from Excel file")
        
        # Log detailed information about extracted test cases
        logger.info("=" * 80)
        logger.info("EXTRACTED TEST CASES FROM EXCEL:")
        logger.info("=" * 80)
        for i, test_case in enumerate(test_cases, 1):
            logger.info(f"Test Case {i}: {test_case['description']}")
            logger.info(f"Number of Steps: {len(test_case['steps'])}")
            for j, step in enumerate(test_case['steps'], 1):
                logger.info(f"  Step {j}: {step.get('test_step', 'N/A')}")
                if step.get('expected_result'):
                    logger.info(f"    Expected: {step['expected_result']}")
            logger.info("-" * 40)
        logger.info("=" * 80)
        
        return test_cases
        
    except Exception as e:
        logger.error(f"Error processing Excel file: {e}")
        raise

def _build_comprehensive_files_context(include_files: Optional[Iterable[str]] = None, userid: Optional[str] = None) -> str:
    """Build comprehensive context from uploaded Robot/Python files.

    Args:
        include_files: Optional iterable of filenames the user explicitly selected.
                        If provided we restrict context to this subset (intersection
                        with uploaded files). When None we include all uploaded
                        .robot and .py files.
        userid: User ID for user-specific file access.
    Ordering strategy:
        1. Priority files from config (e.g., CustomKeywords.robot, CommonKeywords.robot)
        2. Other .robot files
        3. .py files (utilities, keyword implementations)
    The function enforces an overall soft token budget. Files that would exceed
    the remaining budget are truncated intelligently retaining structural sections.
    """
    # Get user-specific file index
    if userid:
        user_index_key = f"{userid}_files"
        if user_index_key not in _file_index:
            return ""
        file_index = _file_index[user_index_key]
    else:
        file_index = _file_index
        
    if not file_index:
        return ""

    include_set: Optional[Set[str]] = set(include_files) if include_files else None

    def eligible(fname: str) -> bool:
        if include_set is not None and fname not in include_set:
            return False
        return fname.endswith(('.robot', '.py'))

    # Load priority files from configuration
    try:
        cfg = load_config()
        priority_files = cfg.get("robot_framework", {}).get("priority_files", ["CustomKeywords.robot"])
    except Exception as e:
        logger.warning(f"Failed to load priority files config, using default: {e}")
        priority_files = ["CustomKeywords.robot"]

    ordered: List[str] = []
    processed_files = set()
    
    # Add priority files first (in order of priority)
    for priority_file in priority_files:
        if priority_file in file_index and eligible(priority_file):
            ordered.append(priority_file)
            processed_files.add(priority_file)
    
    # Add other robot files (excluding already processed priority files)
    for fn in sorted(file_index.keys()):
        if fn not in processed_files and fn.endswith('.robot') and eligible(fn):
            ordered.append(fn)
    
    # Add python files
    for fn in sorted(file_index.keys()):
        if fn.endswith('.py') and eligible(fn):
            ordered.append(fn)

    logger.info(f"📁 Building context from {len(ordered)} files (selected={bool(include_set)})")

    MAX_TOTAL_CONTEXT_TOKENS = 15000
    total_tokens = 0
    parts: List[str] = []

    for fname in ordered:
        meta = file_index.get(fname, {})
        path = meta.get('path')
        if not path or not os.path.isfile(path):
            logger.warning(f"Skipping {fname}: missing path")
            continue
        try:
            with open(path, 'r', encoding='utf-8', errors='replace') as fh:
                content = fh.read()
        except Exception as e:
            logger.warning(f"Failed reading {fname}: {e}")
            continue

        file_tokens = _count_tokens(content)
        remaining = MAX_TOTAL_CONTEXT_TOKENS - total_tokens
        if remaining <= 0:
            logger.info("Context budget exhausted before adding remaining files")
            break

        if file_tokens > remaining:
            logger.info(f"Truncating {fname}: {file_tokens} tokens > remaining {remaining}")
            truncated = _truncate_content_intelligently(content, remaining)
            parts.append(f"=== {fname} (truncated) ===\n{truncated}")
            total_tokens = MAX_TOTAL_CONTEXT_TOKENS
            break
        else:
            parts.append(f"=== {fname} ===\n{content}")
            total_tokens += file_tokens

    final = "\n\n".join(parts)
    logger.info(f"✅ Context built: {total_tokens} tokens from {len(parts)} files (budget {MAX_TOTAL_CONTEXT_TOKENS})")
    return final

def _truncate_content_intelligently(content: str, max_tokens: int) -> str:
    """
    Truncate content intelligently, preserving important sections.
    For Robot Framework files: preserve *** sections and keywords
    For Python files: preserve classes and functions
    """
    if max_tokens <= 100:
        return content[:max_tokens * 4]  # Rough character approximation
    
    lines = content.split('\n')
    important_lines = []
    current_tokens = 0
    
    # For Robot Framework files
    if any(section in content for section in ['*** Settings ***', '*** Variables ***', '*** Keywords ***', '*** Test Cases ***']):
        in_important_section = False
        current_section = ""
        
        for line in lines:
            line_tokens = _count_tokens(line)
            
            # Check if we would exceed token limit
            if current_tokens + line_tokens > max_tokens:
                break
                
            # Identify important sections
            if line.strip().startswith('***'):
                in_important_section = True
                current_section = line.strip()
                important_lines.append(line)
                current_tokens += line_tokens
            elif in_important_section and (line.startswith('    ') or line.strip() == ''):
                # Include content within important sections
                important_lines.append(line)
                current_tokens += line_tokens
            elif line.strip() and not line.startswith(' '):
                # Keyword or test case names
                important_lines.append(line)
                current_tokens += line_tokens
                in_important_section = False
    else:
        # For Python files or other content
        for line in lines:
            line_tokens = _count_tokens(line)
            
            if current_tokens + line_tokens > max_tokens:
                break
                
            # Include important Python constructs
            if (line.strip().startswith(('def ', 'class ', 'import ', 'from ')) or 
                line.strip().startswith('${') or  # Robot Framework variables
                '=' in line and not line.strip().startswith('#')):
                important_lines.append(line)
                current_tokens += line_tokens
    
    return '\n'.join(important_lines)

def process_test_case_with_llm(test_case: Dict, files_context: str = "") -> str:
    """Generate a complete Robot Framework test case implementation using LLM with enforced locator variable policy."""
    try:
        client = get_client()
        model = get_model_name()

        system_prompt = """You are an expert Robot Framework test automation engineer. Generate complete, production-ready Robot Framework test cases.

REQUIREMENTS:
1. Follow Robot Framework syntax exactly
2. Use SeleniumLibrary keywords for web automation
3. Include proper test setup/teardown when needed
4. Use variables and keywords from the uploaded files
5. Include meaningful assertions for expected results
6. Add proper error handling and logging
7. Use CustomKeywords.Custom Capture Page Screenshot for screenshots
8. Do NOT inline raw XPath/CSS selectors. Always reference an existing locator variable or introduce a descriptive one (e.g. ${Login_Button_XPATH}) with XPATH_PLACEHOLDER + '# TODO: update locator' when unknown. Ignore legacy ${gv_xpath_*} naming.
9. Follow existing code patterns and naming conventions
10. Include proper documentation and tags

OUTPUT FORMAT:
Generate a complete Robot Framework test case with proper structure:
- Test case name
- [Documentation]
- [Tags] (if applicable)
- Test steps with proper indentation
- Keywords with arguments
- Assertions and validations"""

        user_prompt = f"""Generate a Robot Framework test case implementation for:

TEST CASE DESCRIPTION: {test_case['description']}

DETAILED TEST STEPS:
"""
        for i, step in enumerate(test_case['steps'], start=1):
            step_text = step.get('test_step', step.get('step', ''))
            expected_result = step.get('expected_result', '')
            step_number = step.get('step_number', '')
            user_prompt += f"\nStep {i}"
            if step_number:
                user_prompt += f" (#{step_number})"
            user_prompt += f": {step_text}"
            if expected_result:
                user_prompt += f"\n   Expected Result: {expected_result}"

        if files_context:
            user_prompt += f"\n\nAVAILABLE CONTEXT FROM UPLOADED FILES:\n{files_context}"

        user_prompt += """

GENERATE: A complete, functional Robot Framework test case that implements all the steps above.
Use the variables, keywords, and patterns from the uploaded files.
Make it production-ready with proper error handling and assertions."""

        system_tokens = _count_tokens(system_prompt, model)
        user_tokens = _count_tokens(user_prompt, model)
        logger.info(f"📊 Prompt tokens: System={system_tokens}, User={user_tokens}, Total={system_tokens+user_tokens}")

        response = _make_cached_api_call(
            client=client,
            model=model,
            system_prompt=system_prompt,
            user_content=user_prompt,
            temperature=0.2,
            max_tokens=3000,
            use_cache=True
        )
        return response
    except Exception as e:
        logger.error(f"Error processing test case with enhanced LLM: {e}")
        raise

def process_test_case_with_enhanced_llm_dual_output(test_case: Dict, files_context: str = "", test_files: List[str] = None, keyword_files: List[str] = None, userid: Optional[str] = None) -> Dict:
    """
    Process a single test case with the LLM to generate both test case implementation and supporting keywords.
    Returns a dictionary with 'test_case' and 'keywords' implementations.
    """
    # Load config first to ensure it's available
    load_config()
    
    client = get_client()
    model = get_model_name()

    # System prompt now supports optional Python keyword implementation generation
    system_prompt = """You are a senior test automation engineer. You generate Robot Framework test cases, supporting keyword blocks, and (WHEN NECESSARY) Python keyword implementations.

PYTHON AWARENESS & UPDATE RULES (ADDITIONAL):
- Carefully READ the provided context from existing Python files (utilities, custom keywords, helpers) before creating new functions.
- REUSE existing Python functions when they already implement the required behavior; do NOT re‑implement duplicates.
- If a function with the same name or highly similar purpose exists, either:
    * Reference it directly in Robot keywords/test case, or
    * If enhancement is needed, output ONLY the improved replacement version (not both original + new) in the PYTHON block.
- New Python functions MUST be idempotent, have clear docstrings (purpose, args, returns), and raise meaningful exceptions instead of silent failures.
- Avoid global state; pass data via arguments; prefer returning values.
- Don’t introduce external imports not already present unless absolutely necessary (then note them in a comment at top of block).
- Use logging (if available) or simple print only if no logger reference exists in context.
- Guard side effects (e.g., file I/O) with existence checks.
- Prefer explicit waits / validations over arbitrary sleeps.
- If NO Python additions are needed, leave the PYTHON block empty (markers still required)."

    RULES:
    1. Always first attempt to implement behavior using existing keywords/variables from provided context.
    2. ONLY generate new Robot Framework user keywords if they clearly encapsulate reusable actions.
    3. ONLY generate Python code if a required keyword cannot be expressed with existing libraries or user keywords, or complex logic (loops, parsing) is needed.
    4. Python keywords MUST be standard Robot Framework library style (simple functions) and reference SeleniumLibrary where applicable.
    5. Keep Python functions idempotent and side‑effect free besides intended UI/API actions; add docstrings.
    6. Use consistent naming: snake_case for Python, Capitalized Words or readable phrases for Robot user keywords.
    7. Avoid duplicating keywords that obviously already exist (infer from context text snippets).
    8. Use CustomKeywords.Custom Capture Page Screenshot for critical validation steps in Robot code.
    9. Assertions: prefer 'Should Be Equal', 'Should Contain', or SeleniumLibrary waits; for Python use assert statements with clear messages.
    10. Do NOT include any credentials or hardcoded secrets.

    OUTPUT FORMAT (markers are REQUIRED exactly as shown):
    <<<TEST_CASE_START>>>
    <Robot Framework test case ONLY (no *** Settings *** section)>
    <<<TEST_CASE_END>>>
    <<<KEYWORDS_START>>>
    <Any new Robot Framework user keyword definitions required>
    <<<KEYWORDS_END>>>
    <<<PYTHON_KEYWORDS_START>>>
    <Python code with one or more def functions implementing missing complex keywords (omit entirely if not needed)>
    <<<PYTHON_KEYWORDS_END>>>

    If NO new user keywords are needed leave KEYWORDS block empty (still output the markers). If NO Python is needed output empty PYTHON block markers. NEVER nest markers or add extra commentary outside markers."""

    # Retrieve RAG snippets (existing keywords / functions) to bias reuse
    retrieved_snippets = []
    retrieval_mode = 'none'
    step_texts = []
    for s in test_case.get('steps', []):
        if isinstance(s, dict):
            step_texts.append(s.get('test_step') or s.get('step') or '')
        else:
            step_texts.append(str(s))
    # Try vector first
    try:
        vector_rag.ensure_user_vector_index(userid)
        # If user specified explicit files, add them to vector index (idempotent add)
        if userid and test_files:
            try:
                vector_rag.add_files_to_user_index(test_files, userid)
            except Exception as _afe:
                logger.debug(f"Skip adding test files to vector index: {_afe}")
        vec_hits = vector_rag.retrieve_similar_snippets(test_case.get('description',''), step_texts, top_k=10, userid=userid)
        if vec_hits:
            retrieved_snippets = [{
                'type': h.get('type') or 'unknown',
                'name': h.get('keyword') or h.get('file'),
                'file': h.get('file'),
                'score': 0.0,  # vector score not exposed here
                'snippet': h.get('content','')
            } for h in vec_hits]
            retrieval_mode = 'vector'
    except Exception as e:
        logger.warning(f"Vector RAG retrieval failed, falling back to lexical: {e}")
    # Fallback lexical if vector empty
    if not retrieved_snippets:
        try:
            lexical_hits = rag_index.retrieve_rag_snippets(test_case.get('description',''), step_texts, top_k=12)
            if lexical_hits:
                retrieved_snippets = lexical_hits
                retrieval_mode = 'lexical'
        except Exception as le:
            logger.warning(f"Lexical RAG retrieval failed: {le}")

    # Build user prompt with explicit test steps
    steps_rendered = []
    for i, step in enumerate(test_case.get('steps', []), start=1):
        steps_rendered.append(f"{i}. {step}")
    steps_text = "\n".join(steps_rendered) if steps_rendered else "(No granular steps provided)"

    user_prompt = f"""Generate implementations for the following test case.

TEST CASE DESCRIPTION:
{test_case.get('description','(missing)')}

DETAILED STEPS:
{steps_text}

CONTEXT NOTES:
- Target Robot test files: {test_files or []}
- Target Robot keyword files: {keyword_files or []}
- Provide reusable abstractions only when clear repetition or complexity exists.
"""

    # Compose RAG context block
    if retrieved_snippets:
        reuse_lines = []
        for sn in retrieved_snippets:
            reuse_lines.append(f"- {sn['type']} {sn['name']} (file: {sn['file']}, score: {sn['score']})\n  ```\n{sn['snippet']}\n  ```")
        user_prompt += "\n\nREUSE CANDIDATES (Existing definitions – prefer calling these instead of creating new ones):\n" + "\n".join(reuse_lines)

    if files_context:
        user_prompt += "\n\nRELEVANT FILE CONTEXT (TRUNCATED):\n" + files_context[:15000]

    # Token accounting (best effort)
    try:
        sys_tokens = _count_tokens(system_prompt, model)
        usr_tokens = _count_tokens(user_prompt, model)
        logger.info(f"🧮 Dual-output prompt tokens: system={sys_tokens} user={usr_tokens} total={sys_tokens+usr_tokens}")
    except Exception as te:
        logger.debug(f"Token count skipped: {te}")

    raw_response = _make_cached_api_call(
        client=client,
        model=model,
        system_prompt=system_prompt,
        user_content=user_prompt,
        temperature=0.25,
        max_tokens=3200,
        use_cache=True
    )

    logger.info("📥 Dual output raw response preview: %s", raw_response[:300].replace('\n',' ') + ("..." if len(raw_response) > 300 else ""))

    def _extract_block(text: str, start: str, end: str) -> str:
        if start in text and end in text:
            return text.split(start,1)[1].split(end,1)[0].strip()
        return ""

    test_case_impl = _extract_block(raw_response, "<<<TEST_CASE_START>>>", "<<<TEST_CASE_END>>>")
    keywords_impl = _extract_block(raw_response, "<<<KEYWORDS_START>>>", "<<<KEYWORDS_END>>>")
    python_impl = _extract_block(raw_response, "<<<PYTHON_KEYWORDS_START>>>", "<<<PYTHON_KEYWORDS_END>>>")

    # Post-process to remove duplicate keyword definitions that already exist (encourage reuse)
    try:
        if keywords_impl.strip():
            existing_kw_names = set()
            idx = rag_index.get_rag_index() or {}
            for doc in idx.get('documents', []):
                if doc.get('type') == 'robot_keyword':
                    existing_kw_names.add(doc.get('name','').strip())
            filtered_blocks = []
            current_block = []
            for line in keywords_impl.splitlines():
                if line.strip() and not line.startswith((' ', '\t')):
                    # new keyword header; flush previous
                    if current_block:
                        header = current_block[0].strip()
                        if header not in existing_kw_names:
                            filtered_blocks.append('\n'.join(current_block))
                    current_block = [line]
                else:
                    current_block.append(line)
            if current_block:
                header = current_block[0].strip()
                if header not in existing_kw_names:
                    filtered_blocks.append('\n'.join(current_block))
            removed = len([b for b in keywords_impl.split('\n\n') if b.strip()]) - len(filtered_blocks)
            if removed > 0:
                logger.info("🧹 Removed %d duplicate keyword definitions from generation output", removed)
            keywords_impl = '\n\n'.join(filtered_blocks)
    except Exception as e:
        logger.warning(f"Keyword duplicate filter failed: {e}")

    result = {
        'test_case': test_case_impl,
        'keywords': keywords_impl,
        'python_keywords': python_impl,
        'raw': raw_response,
        'rag_used': bool(retrieved_snippets),
        'rag_snippet_count': len(retrieved_snippets),
        'rag_mode': retrieval_mode
    }

    return result

def process_test_case_with_llm_for_file_update(test_case: Dict, files_context: str = "", target_files: List[str] = None) -> str:
    """Generate a Robot Framework test case tailored for updating existing files (no settings/variables sections)."""
    try:
        client = get_client()
        model = get_model_name()

        system_prompt = """You are an expert Robot Framework and Python test automation engineer. Generate Robot Framework test case implementations that can be integrated into existing Robot Framework files, and WHEN REQUIRED also generate or update Python keyword/helper functions.

REQUIREMENTS:
1. Generate ONLY the Robot Framework test case body (no *** Settings *** or *** Variables *** sections)
2. Follow Robot Framework syntax exactly (4 spaces indentation for steps)
3. Use SeleniumLibrary & existing custom keywords when possible BEFORE inventing new ones
4. Reuse existing locator variables. Do NOT inline raw XPath/CSS; if a locator variable is missing, introduce a descriptive one (e.g. ${Login_Button_XPATH}) with XPATH_PLACEHOLDER + '# TODO: update locator'. Ignore prior ${gv_xpath_*} naming convention.
5. Include meaningful assertions (Should Be Equal / Should Contain / waits) not blind clicks
6. Add error handling and logging patterns consistent with context (capture screenshot keyword must be CustomKeywords.Custom Capture Page Screenshot)
7. If a required action cannot be expressed with existing RF keywords, you MAY propose a new Robot user keyword OR a Python function
8. Only generate a Python helper when logic is complex (loops, parsing, branching) or clearly reusable; avoid trivial wrappers
9. BEFORE creating a Python function, conceptually check (based on context text) whether a similar function already exists; if so reuse name or skip
10. Python helper style: snake_case, docstring with purpose/args/returns, no global mutable state, raise specific exceptions
11. Do NOT duplicate whole files; provide ONLY the function(s) you are adding or replacing
12. NEVER output secrets, credentials, or hardcoded sensitive values
13. If no Python changes needed, omit them entirely (or leave an empty marker if dual-output pipeline expects it)
14. Ensure generated test steps call the new keyword(s) you define if you define them

OUTPUT FORMAT:
Generate a complete Robot Framework test case that can be added to *** Test Cases *** section:
- Test case name (no spaces, use underscores)
- [Documentation] line
- [Tags] line (if applicable)
- Test steps with proper indentation (4 spaces)
- Keywords with arguments
- Assertions and validations

DO NOT include *** Settings ***, *** Variables ***, or *** Keywords *** sections - just the test case itself.

If Python helper(s) are required, they will be generated elsewhere in the pipeline; you only need to ensure the Robot test references them with a consistent name."""

        user_prompt = f"""Generate a Robot Framework test case implementation for:

TEST CASE DESCRIPTION: {test_case['description']}

DETAILED TEST STEPS:
"""
        for i, step in enumerate(test_case['steps'], start=1):
            step_text = step.get('test_step', step.get('step', ''))
            expected_result = step.get('expected_result', '')
            step_number = step.get('step_number', '')
            user_prompt += f"\nStep {i}"
            if step_number:
                user_prompt += f" (#{step_number})"
            user_prompt += f": {step_text}"
            if expected_result:
                user_prompt += f"\n   Expected Result: {expected_result}"

        if files_context:
            user_prompt += f"\n\nAVAILABLE CONTEXT FROM UPLOADED FILES:\n{files_context}"
        if target_files:
            user_prompt += f"\n\nTARGET FILES TO UPDATE: {', '.join(target_files)}"

        user_prompt += """

GENERATE: A complete, functional Robot Framework test case that can be directly added to the *** Test Cases *** section of existing Robot Framework files.
Use the variables, keywords, and patterns from the uploaded files and any python functions.
Make it production-ready with proper error handling and assertions."""

        system_tokens = _count_tokens(system_prompt, model)
        user_tokens = _count_tokens(user_prompt, model)
        logger.info(f"📊 File-update prompt tokens: System={system_tokens}, User={user_tokens}, Total={system_tokens+user_tokens}")

        response = _make_cached_api_call(
            client=client,
            model=model,
            system_prompt=system_prompt,
            user_content=user_prompt,
            temperature=0.2,
            max_tokens=3000,
            use_cache=True
        )
        return response
    except Exception as e:
        logger.error(f"Error processing test case with enhanced LLM for file update: {e}")
        raise

def apply_test_case_to_robot_files(test_case: Dict, robot_implementation: str, target_files: List[str], test_case_number: int) -> Dict[str, str]:
    """
    Apply the generated test case implementation to the appropriate Robot Framework files.
    Returns a dictionary of filename -> update_info.
    """
    file_updates = {}
    
    try:
        # Clean and prepare the test case implementation
        clean_implementation = robot_implementation.strip()
        
        # Generate a safe test case name
        safe_name = re.sub(r'[^\w\s-]', '', test_case['description'][:50])
        safe_name = re.sub(r'\s+', ' ', safe_name).strip()
        test_case_name = f"TC_{test_case_number:02d}_{safe_name.replace(' ', '_')}"
        
        # Ensure the implementation has proper structure
        if not clean_implementation.startswith(test_case_name):
            # If the LLM didn't include the test case name, add it
            formatted_implementation = f"\n{test_case_name}\n"
            formatted_implementation += f"    [Documentation]    {test_case['description']}\n"
            formatted_implementation += f"    [Tags]    Generated    TestCase{test_case_number:02d}\n"
            
            # Add the implementation with proper indentation
            for line in clean_implementation.split('\n'):
                if line.strip():
                    if not line.startswith('    '):
                        formatted_implementation += f"    {line}\n"
                    else:
                        formatted_implementation += f"{line}\n"
                else:
                    formatted_implementation += "\n"
        else:
            formatted_implementation = f"\n{clean_implementation}\n"
        
        # Determine which file to update: prefer files categorized as Script/Test in index
        primary_test_file = None
        for filename in target_files:
            meta = _file_index.get(filename, {})
            if isinstance(meta, dict) and meta.get('category') == 'script':
                primary_test_file = filename
                break
        if not primary_test_file:
            # Next preference: filename hints like 'test'
            for filename in target_files:
                if 'test' in filename.lower():
                    primary_test_file = filename
                    break
        if not primary_test_file and target_files:
            primary_test_file = target_files[0]  # Fallback to first file
        
        # Update the primary test file
        file_path = _file_index[primary_test_file]['path']
        
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            original_content = f.read()
        _snapshot_file(primary_test_file, original_content)
        
        # Find or create *** Test Cases *** section
        if '*** Test Cases ***' in original_content:
            # Append to existing test cases section
            test_cases_marker = '*** Test Cases ***'
            parts = original_content.split(test_cases_marker)
            if len(parts) >= 2:
                # Insert after existing test cases
                updated_content = parts[0] + test_cases_marker + parts[1] + formatted_implementation
            else:
                updated_content = original_content + f"\n\n*** Test Cases ***{formatted_implementation}"
        else:
            # Add new test cases section
            updated_content = original_content + f"\n\n*** Test Cases ***{formatted_implementation}"
        
        # Compute original lines for highlight info before writing
        original_line_count = original_content.count('\n') + 1
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        # Update file metadata
        _file_index[primary_test_file]['modified'] = True
        _file_index[primary_test_file]['patch_count'] = _file_index[primary_test_file].get('patch_count', 0) + 1
        _file_index[primary_test_file]['last_applied'] = datetime.now().isoformat()
        
        file_updates[primary_test_file] = f"Added test case: {test_case_name}"

        # Record insertion span for persistent UI highlighting
        try:
            new_total_lines = updated_content.count('\n') + 1
            inserted_start = original_line_count + 1
            inserted_end = new_total_lines
            meta = _file_index.get(primary_test_file, {})
            recent = meta.get('recent_inserts') or []
            recent.append({
                'type': 'test_case',
                'name': test_case_name,
                'test_case_number': test_case_number,
                'start_line': inserted_start,
                'end_line': inserted_end,
                'timestamp': datetime.now().isoformat()
            })
            # Trim history
            if len(recent) > 30:
                recent = recent[-30:]
            meta['recent_inserts'] = recent
            _file_index[primary_test_file] = meta
        except Exception as rec_err:
            logger.warning(f"Failed to record recent insert span for {primary_test_file}: {rec_err}")
        
        logger.info(f"✅ Successfully updated {primary_test_file} with test case: {test_case_name}")
        
        return file_updates
        
    except Exception as e:
        logger.error(f"Error applying test case to robot files: {e}")
        raise

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/health')
def health():
    cfg = load_config()
    cred_cfg = cfg.get("azure_credentials", {})
    sec_cfg = cfg.get("security", {})
    
    # Cleanup expired cache entries
    _cleanup_expired_cache()
    
    return jsonify({
        "status": "ok",
        "tenant_id_present": bool(cred_cfg.get("tenant_id")),
        "client_id_present": bool(cred_cfg.get("client_id")),
        "client_secret_present": bool(cred_cfg.get("client_secret")),
        "disable_ssl": not sec_cfg.get("verify_ssl", True),
        "custom_ca_bundle": bool(sec_cfg.get("ca_bundle") and os.path.isfile(str(sec_cfg.get("ca_bundle")))),
        "config_loaded": True,
        "config_path": CONFIG_PATH,
        "model": get_model_name(),
        "endpoint": cfg.get("openai", {}).get("api_base"),
        "cache_entries": len(_api_cache),
        "api_calls_this_minute": _api_call_count,
        "rate_limit_status": "OK" if _rate_limit_check()[0] else f"Limited (wait {_rate_limit_check()[1]:.1f}s)"
    })

@app.route('/api/cache_status')
def cache_status():
    """Get detailed cache status information."""
    global _api_cache, _api_call_count, _last_api_call
    
    # Calculate cache statistics
    valid_entries = 0
    expired_entries = 0
    
    for entry in _api_cache.values():
        if _is_cache_valid(entry):
            valid_entries += 1
        else:
            expired_entries += 1
    
    return jsonify({
        "total_cache_entries": len(_api_cache),
        "valid_entries": valid_entries,
        "expired_entries": expired_entries,
        "api_calls_this_minute": _api_call_count,
        "last_api_call": _last_api_call,
        "rate_limit_max": MAX_CALLS_PER_MINUTE,
        "min_interval": MIN_API_INTERVAL,
        "cache_expiry_hours": CACHE_EXPIRY_HOURS
    })

@app.route('/api/recent_inserts', methods=['GET'])
def recent_inserts():
    """Return recent inserted line ranges for one file for UI highlighting.

    Query params:
      name: filename (required)
      userid: optional user id for per-user workspace isolation
      limit: optional max records (default 10)
    """
    fname = request.args.get('name', '').strip()
    userid = request.args.get('userid', '').strip()
    if not fname:
        return jsonify({'error': 'Missing name'}), 400
    # Choose file index scope
    if userid and f"{userid}_files" in _file_index:
        meta = _file_index[f"{userid}_files"].get(fname)
    else:
        meta = _file_index.get(fname)
    if not meta:
        return jsonify({'error': 'File not indexed'}), 404
    recent = meta.get('recent_inserts') or []
    try:
        limit = int(request.args.get('limit', '10'))
    except ValueError:
        limit = 10
    return jsonify({
        'file': fname,
        'userid': userid or None,
        'count': len(recent),
        'recent_inserts': list(reversed(recent))[:limit]
    })

@app.route('/api/recent_inserts_all', methods=['GET'])
def recent_inserts_all():
    """Return recent insert metadata for all indexed files (capped)."""
    aggregated = {}
    total = 0
    cap = int(request.args.get('cap', '200'))
    for fname, meta in _file_index.items():
        rec = meta.get('recent_inserts') or []
        if rec:
            # Keep only most recent entries (already stored oldest-first usually)
            recent_subset = list(reversed(rec))[:cap]
            aggregated[fname] = recent_subset
            total += len(recent_subset)
            if total >= cap:
                break
    return jsonify({'total_records': total, 'files': aggregated})

def apply_dual_output_to_robot_files(test_case: Dict, test_case_result: Dict, test_files: List[str], keyword_files: List[str], test_case_number: int, userid: Optional[str] = None) -> Dict[str, str]:
    """Apply the generated test case, Robot keywords, and optional Python keyword implementations to files.

    Returns: mapping filename -> update summary string
    """
    file_updates: Dict[str, str] = {}
    try:
        global _file_index
        if not test_case_result:
            return file_updates

        # Fallback: if no python keywords were produced but heuristics indicate complex logic, attempt a focused generation pass
        try:
            if not test_case_result.get('python_keywords'):
                kw_impl = (test_case_result.get('keywords') or '').strip()
                complexity_signals = [
                    'FOR    ', 'IF    ', 'WHILE    ', 'Repeat Keyword', 'Evaluate', 'Run Keyword If', 'Run Keyword And'
                ]
                long_keyword_blocks = any(len(block.strip().splitlines()) >= 12 for block in kw_impl.split('\n\n')) if kw_impl else False
                has_signal = any(sig in kw_impl for sig in complexity_signals) or long_keyword_blocks
                if has_signal and kw_impl:
                    logger.info("🔁 No python_keywords block returned; triggering supplemental Python helper generation pass")
                    supplemental_py = _attempt_python_helper_generation(kw_impl, test_case.get('description',''), files_context='')
                    if supplemental_py.strip():
                        test_case_result['python_keywords'] = supplemental_py.strip()
        except Exception as supp_err:
            logger.warning(f"Supplemental python helper generation skipped: {supp_err}")

        base_folder = app.config.get('UPLOAD_FOLDER')
        user_folder = os.path.join(base_folder, userid) if userid else base_folder
        os.makedirs(user_folder, exist_ok=True)

        # Helper to write / append with snapshot + recent insert metadata
        def append_to_robot_file(filename: str, block: str, section_header: str) -> None:
            path = _file_index.get(f"{userid}_files", {}).get(filename, {}).get('path') if userid else _file_index.get(filename, {}).get('path')
            # fallback if path missing
            if not path:
                path = os.path.join(user_folder, filename)
            exists = os.path.isfile(path)
            original_content = ''
            if exists:
                with open(path, 'r', encoding='utf-8', errors='replace') as f:
                    original_content = f.read()
            else:
                original_content = ''

            _snapshot_file(filename, original_content)

            content = original_content
            if section_header not in content:
                if content and not content.endswith('\n'):
                    content += '\n'
                content += f"\n{section_header}\n"

            # Ensure a blank line before appending
            if not content.endswith('\n'):
                content += '\n'

            # If appending to *** Keywords *** section, de-duplicate by keyword name
            def _normalize_kw_name(name: str) -> str:
                n = re.sub(r"\s+", " ", name.strip()).strip()
                return n.lower()

            def _extract_keywords_map(text: str) -> Dict[str, str]:
                """Extract keyword blocks from a Robot file content within its *** Keywords *** section.
                Returns mapping of normalized keyword name -> full block (header + body)."""
                lines = text.splitlines()
                in_kw = False
                current_name = None
                current_lines: List[str] = []
                kw_map: Dict[str, str] = {}
                for line in lines:
                    stripped = line.strip()
                    if stripped.startswith('*** ') and stripped.endswith(' ***'):
                        # Flush on section switch
                        if current_name is not None and current_lines:
                            block_text = "\n".join(current_lines).rstrip()
                            kw_map[_normalize_kw_name(current_name)] = block_text
                        in_kw = stripped.lower() == '*** keywords ***'
                        current_name = None
                        current_lines = []
                        continue
                    if not in_kw:
                        continue
                    if stripped and not line.startswith((' ', '\t')):
                        # New keyword header
                        if current_name is not None and current_lines:
                            block_text = "\n".join(current_lines).rstrip()
                            kw_map[_normalize_kw_name(current_name)] = block_text
                        current_name = stripped
                        current_lines = [stripped]
                    else:
                        if current_name is not None:
                            current_lines.append(line)
                # flush last
                if in_kw and current_name is not None and current_lines:
                    block_text = "\n".join(current_lines).rstrip()
                    kw_map[_normalize_kw_name(current_name)] = block_text
                return kw_map

            def _extract_keywords_from_block(text: str) -> List[str]:
                """Split an incoming block (without section header) into individual keyword blocks."""
                blocks: List[List[str]] = []
                current: List[str] = []
                for ln in text.splitlines():
                    if ln.strip() and not ln.startswith((' ', '\t')):
                        # header line
                        if current:
                            blocks.append(current)
                        current = [ln.strip()]
                    else:
                        if current:
                            current.append(ln)
                if current:
                    blocks.append(current)
                return ["\n".join(b).rstrip() for b in blocks if b]

            to_append_text = block.strip()
            deduped_blocks_text = to_append_text
            deduped_count = 0
            if section_header.strip().lower() == '*** keywords ***' and to_append_text:
                existing_kw_map = _extract_keywords_map(content)
                incoming_blocks = _extract_keywords_from_block(to_append_text)
                filtered_blocks: List[str] = []
                for b in incoming_blocks:
                    header = b.splitlines()[0] if b else ''
                    norm = _normalize_kw_name(header)
                    if norm in existing_kw_map:
                        # Duplicate keyword by name; skip
                        deduped_count += 1
                        logger.info("Skipping duplicate keyword '%s' in file %s", header, filename)
                        continue
                    filtered_blocks.append(b)
                deduped_blocks_text = ("\n\n".join(filtered_blocks)).strip()
                if deduped_count > 0 and not filtered_blocks:
                    # Nothing new to add; write back original content unchanged and record no-op insert
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    logger.info("No new keywords to append to %s (all %d were duplicates)", filename, deduped_count)
                    return

            insertion_start_line = content.count('\n') + 1
            if deduped_blocks_text:
                content += '\n' + deduped_blocks_text + '\n'
            insertion_end_line = content.count('\n')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

            # Update index metadata
            user_key = f"{userid}_files" if userid else None
            target_index = _file_index[user_key][filename] if user_key and filename in _file_index[user_key] else _file_index.get(filename)
            if target_index is None:
                # create metadata if missing
                if user_key:
                    _file_index[user_key][filename] = {
                        'filename': filename,
                        'path': path,
                        'size_bytes': os.path.getsize(path),
                        'chunks': 0,
                        'chunk_size': 1000,
                        'chunk_overlap': 200,
                        'modified': True,
                        'patch_count': 1,
                        'last_applied': datetime.now().isoformat(),
                        'userid': userid,
                    }
                    target_index = _file_index[user_key][filename]
            if target_index:
                target_index['modified'] = True
                target_index['patch_count'] = target_index.get('patch_count', 0) + 1
                target_index['last_applied'] = datetime.now().isoformat()
                rec = target_index.setdefault('recent_inserts', [])
                rec.append({'timestamp': datetime.now().isoformat(), 'start': insertion_start_line, 'end': insertion_end_line})
                # Trim history
                if len(rec) > 25:
                    target_index['recent_inserts'] = rec[-25:]

        # 1. Apply test case implementation
        test_case_block = test_case_result.get('test_case', '').strip()
        if test_case_block:
            # Resolve script-category file list from index (authoritative categories stored there)
            script_files: List[str] = []
            if userid:
                user_key = f"{userid}_files"
                for fname, meta in _file_index.get(user_key, {}).items():
                    if meta.get('category') == 'script' and fname.endswith('.robot'):
                        script_files.append(fname)
            else:
                for fname, meta in _file_index.items():
                    if isinstance(meta, dict) and meta.get('category') == 'script' and fname.endswith('.robot'):
                        script_files.append(fname)

            # Intersect provided test_files (UI selection) with script_files if both present
            candidate_scripts = []
            if test_files:
                for f in test_files:
                    if f in script_files:
                        candidate_scripts.append(f)
            # If no intersection, fallback to all script files collected
            if not candidate_scripts:
                candidate_scripts = script_files

            # If still empty, create a default script file for the user
            if not candidate_scripts:
                default_name = 'GeneratedTestSuite.robot'
                candidate_scripts = [default_name]
                # ensure file exists in index with script category
                user_folder = os.path.join(base_folder, userid) if userid else base_folder
                default_path = os.path.join(user_folder, default_name)
                if not os.path.isfile(default_path):
                    with open(default_path, 'w', encoding='utf-8') as nf:
                        nf.write('*** Test Cases ***\n')
                user_index_key = f"{userid}_files" if userid else None
                if user_index_key:
                    meta_container = _file_index.setdefault(user_index_key, {})
                    meta_container.setdefault(default_name, {
                        'filename': default_name,
                        'path': default_path,
                        'size_bytes': os.path.getsize(default_path),
                        'chunks': 0,
                        'chunk_size': 1000,
                        'chunk_overlap': 200,
                        'modified': False,
                        'patch_count': 0,
                        'last_applied': None,
                        'userid': userid,
                        'category': 'script'
                    })
                else:
                    _file_index.setdefault(default_name, {
                        'filename': default_name,
                        'path': default_path,
                        'size_bytes': os.path.getsize(default_path),
                        'chunks': 0,
                        'chunk_size': 1000,
                        'chunk_overlap': 200,
                        'modified': False,
                        'patch_count': 0,
                        'last_applied': None,
                        'category': 'script'
                    })
                logger.info("🛠️ Created default script file %s for test case placement (no existing script files found)", default_name)

            primary_test_file = candidate_scripts[0]
            # Log reroute if original first test_files entry wasn't script
            if test_files and primary_test_file != test_files[0]:
                logger.info("↪️ Redirected test case insertion to script file %s (original candidate %s not script category)", primary_test_file, test_files[0])
            append_to_robot_file(primary_test_file, test_case_block, '*** Test Cases ***')
            file_updates[primary_test_file] = file_updates.get(primary_test_file, '') + 'Added test case implementation. '

        # 2. Apply Robot keyword implementations
        keywords_block = test_case_result.get('keywords', '').strip()
        if keywords_block and keyword_files:
            # Only write keywords to files explicitly categorized as keyword holders (not script)
            primary_kw_file = None
            if userid:
                user_key = f"{userid}_files"
                for fname in keyword_files:
                    meta = _file_index.get(user_key, {}).get(fname, {})
                    if meta.get('category') in ('common_keywords', 'project_keywords', 'utility'):
                        primary_kw_file = fname
                        break
            else:
                for fname in keyword_files:
                    meta = _file_index.get(fname, {})
                    if isinstance(meta, dict) and meta.get('category') in ('common_keywords', 'project_keywords', 'utility'):
                        primary_kw_file = fname
                        break
            if primary_kw_file:
                append_to_robot_file(primary_kw_file, keywords_block, '*** Keywords ***')
                file_updates[primary_kw_file] = file_updates.get(primary_kw_file, '') + 'Added keyword definitions. '
            else:
                logger.info('⚠️ No suitable keyword file (non-script category) found; skipping keyword block insertion to avoid polluting test files.')

        # 3. Apply Python keyword implementations
        python_block = test_case_result.get('python_keywords', '').strip()
        if python_block:
            # Decide target python file
            user_index_key = f"{userid}_files" if userid else None
            candidate_python_files = []
            if user_index_key and user_index_key in _file_index:
                candidate_python_files = [n for n in _file_index[user_index_key].keys() if n.endswith('.py')]
            else:
                candidate_python_files = [n for n in _file_index.keys() if n.endswith('.py')]

            target_py_filename = None
            for name in candidate_python_files:
                if 'keyword' in name.lower() or 'custom' in name.lower():
                    target_py_filename = name
                    break
            if not target_py_filename:
                target_py_filename = candidate_python_files[0] if candidate_python_files else 'generated_python_keywords.py'

            target_py_path = os.path.join(user_folder, target_py_filename)
            exists = os.path.isfile(target_py_path)
            original_py = ''
            if exists:
                with open(target_py_path, 'r', encoding='utf-8', errors='replace') as f:
                    original_py = f.read()
            _snapshot_file(target_py_filename, original_py)
            if not exists:
                header = '# Auto-generated Python keyword implementations file\n\n'
            else:
                header = ''
            # ensure newline separation
            if original_py and not original_py.endswith('\n'):
                original_py += '\n'
            new_py_content = header + original_py + '\n' + python_block.strip() + '\n'
            with open(target_py_path, 'w', encoding='utf-8') as f:
                f.write(new_py_content)

            # update index
            meta_container = _file_index.setdefault(user_index_key, {}) if user_index_key else _file_index
            if target_py_filename not in meta_container:
                meta_container[target_py_filename] = {
                    'filename': target_py_filename,
                    'path': target_py_path,
                    'size_bytes': os.path.getsize(target_py_path),
                    'chunks': 0,
                    'chunk_size': 1000,
                    'chunk_overlap': 200,
                    'modified': True,
                    'patch_count': 1,
                    'last_applied': datetime.now().isoformat(),
                    'userid': userid,
                    'category': 'python'
                }
            else:
                meta = meta_container[target_py_filename]
                meta['modified'] = True
                meta['patch_count'] = meta.get('patch_count', 0) + 1
                meta['last_applied'] = datetime.now().isoformat()

            # Track recent insertion lines similarly to Robot files so UI can highlight on revisit
            try:
                meta = meta_container[target_py_filename]
                # Compute insertion line span
                header_plus_original = header + original_py + '\n'
                start_line = header_plus_original.count('\n') + 1  # first line of inserted python block
                block_line_count = python_block.strip().count('\n') + 1
                end_line = start_line + block_line_count - 1
                rec = meta.setdefault('recent_inserts', [])
                rec.append({'timestamp': datetime.now().isoformat(), 'start': start_line, 'end': end_line})
                if len(rec) > 25:
                    meta['recent_inserts'] = rec[-25:]
            except Exception as meta_err:
                logger.warning(f"Failed to record recent_inserts for python file {target_py_filename}: {meta_err}")
            file_updates[target_py_filename] = file_updates.get(target_py_filename, '') + 'Added/updated Python keyword implementations. '

        return file_updates
    except Exception as e:
        logger.error(f"Error applying dual output to robot/python files: {e}")
        logger.error(f"Test files: {test_files}")
        logger.error(f"Keyword files: {keyword_files}")
        logger.error(f"User ID: {userid}")
        raise

def _attempt_python_helper_generation(keywords_impl: str, test_case_description: str, files_context: str = "") -> str:
    """Best-effort generation of Python helper functions for complex Robot user keywords.

    Heuristic triggers: complex flow control or long multi-step keyword definitions.
    Returns Python code (one or more def functions) or empty string if not generated.
    """
    try:
        client = get_client()
        model = get_model_name()
        system_prompt = (
            "You are a Python automation engineer. Generate ONLY Python function implementations for Robot Framework user keywords that require complex logic. "
            "Return ONLY valid Python code (no fencing, no commentary). Avoid duplicating existing standard SeleniumLibrary capabilities unless wrapping them adds real value." )
        user_prompt = (f"Test Case: {test_case_description}\n\nRobot Keywords (source):\n" +
                       keywords_impl +
                       "\n\nGenerate Python functions (snake_case) implementing any keyword logic that would benefit from Python (parsing, loops, conditionals, calculations). "
                       "Skip keywords already implementable purely via SeleniumLibrary built-ins. Each function must have a docstring and raise ValueError or AssertionError on validation failure.")
        if files_context:
            user_prompt += "\n\nContext Snippets:\n" + files_context[:6000]
        py_code = _make_cached_api_call(client, model, system_prompt, user_prompt, temperature=0.15, max_tokens=1200, use_cache=True)
        # Basic sanitization: remove accidental markdown fencing
        py_code = re.sub(r"```python|```", "", py_code).strip()
        # Keep only lines starting with valid python constructs or indentation following them
        return py_code
    except Exception as e:
        logger.warning(f"Python helper generation failed: {e}")
        return ""

@app.route('/api/excel_progress', methods=['GET'])
def get_excel_progress():
    """Get the current progress of Excel processing."""
    global _excel_processing_progress
    return jsonify(_excel_processing_progress)

# Provide trailing-slash alias to avoid 404 if frontend/browser rewrites
@app.route('/api/excel_progress/', methods=['GET'])
def get_excel_progress_alias():
    return get_excel_progress()

@app.route('/api/reset_excel_progress', methods=['POST'])
def reset_excel_progress():
    """Reset Excel processing progress state to idle."""
    global _excel_processing_progress
    _excel_processing_progress = {
        'is_processing': False,
        'current_test_case': 0,
        'total_test_cases': 0,
        'current_description': '',
        'status': 'idle',
        'processed_cases': [],
        'updated_files': {}
    }
    logger.info("🔄 Excel processing progress state reset to idle")
    return jsonify({'message': 'Progress state reset successfully'})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Get user ID from form data
    userid = request.form.get('userid')
    if not userid:
        return jsonify({'error': 'User ID required. Please login first.'}), 401

    # Optional category field supplied via multipart form (category or file_category)
    raw_cat = request.form.get('category') or request.form.get('file_category') or ''
    # If user supplied a category string, treat it as authoritative; only fall back if empty
    if raw_cat.strip():
        normalized = _normalize_category(raw_cat)
        if normalized:
            category = normalized
        else:
            # Last-resort heuristic based on provided raw category text
            rc = raw_cat.lower()
            if 'common' in rc:
                category = 'common_keywords'
            elif 'project' in rc:
                category = 'project_keywords'
            elif 'config' in rc or 'setting' in rc:
                category = 'config'
            elif 'script' in rc or 'test' in rc:
                category = 'script'
            elif 'util' in rc:
                category = 'utility'
            else:
                category = _infer_category(f.filename)
    else:
        category = _infer_category(f.filename)

    filename = secure_filename(f.filename)
    
    # Create user-specific folder
    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], userid)
    os.makedirs(user_folder, exist_ok=True)
    
    path = os.path.join(user_folder, filename)
    f.save(path)

    # Build chunk metadata for local use (not yet added to vector store directly)
    cfg = load_config()
    if cfg is None:
        logger.warning("Config is None, using default processing settings")
        cfg = {}
    proc = cfg.get('processing', {})
    chunk_size = int(proc.get('chunk_size', 1000))
    chunk_overlap = int(proc.get('chunk_overlap', 200))
    try:
        with open(path, 'r', encoding='utf-8', errors='replace') as rf:
            raw_text = rf.read()
        chunks = _chunk_text(raw_text, chunk_size, chunk_overlap)
    except Exception as e:
        logger.warning("Chunking failed for %s: %s", filename, e)
        chunks = []
    # Store file metadata in user-specific index
    user_index_key = f"{userid}_files"
    if user_index_key not in _file_index:
        _file_index[user_index_key] = {}
    
    _file_index[user_index_key][filename] = {
        'filename': filename,
        'path': path,
        'size_bytes': os.path.getsize(path),
        'chunks': len(chunks),
        'chunk_size': chunk_size,
        'chunk_overlap': chunk_overlap,
        'modified': False,
        'patch_count': 0,
        'last_applied': None,
        'file_id': None,
        'category': category,
        'userid': userid,
    }

    # Attempt ingestion into vector store (upload to OpenAI then batch add)
    ingested = False
    file_id = None
    try:
        client = get_client()
        get_assistant()  # ensure assistant/vector store exist
        if _vector_store_id:
            with open(path, 'rb') as fb:
                uploaded = client.files.create(file=fb, purpose="assistants")
                file_id = uploaded.id
            client.beta.vector_stores.file_batches.create(
                vector_store_id=_vector_store_id,
                file_ids=[file_id]
            )
            ingested = True
    except Exception as e:
        logger.warning("File ingestion skipped: %s", e)

    if file_id:
        _file_index[user_index_key][filename]['file_id'] = file_id
    return jsonify({'filename': filename, 'ingested': ingested, 'file_id': file_id, 'chunks': _file_index[user_index_key][filename]['chunks'], 'category': category, 'category_label': VALID_FILE_CATEGORIES.get(category, category)})

@app.route('/api/update_category', methods=['POST'])
def update_category():
    """Explicitly update category for one or more existing files for a user.

    JSON body:
      {
        "userid": "Arvind",
        "files": ["Finalize.robot", "Initialize.robot"],   # or single string
        "category": "common_keywords"  # can be any accepted label or verbose text
      }
    Returns per-file status list.
    """
    data = request.get_json(silent=True) or {}
    userid = data.get('userid')
    raw_cat = (data.get('category') or '').strip()
    files = data.get('files')
    if isinstance(files, str):
        files = [files]
    if not userid or not files or not raw_cat:
        return jsonify({'error': 'userid, files, category required'}), 400
    normalized = _normalize_category(raw_cat)
    if not normalized:
        # attempt keyword fallback
        lc = raw_cat.lower()
        if 'common' in lc:
            normalized = 'common_keywords'
        elif 'project' in lc:
            normalized = 'project_keywords'
        elif 'config' in lc or 'setting' in lc:
            normalized = 'config'
        elif 'script' in lc or 'test' in lc:
            normalized = 'script'
        elif 'util' in lc:
            normalized = 'utility'
    if not normalized:
        return jsonify({'error': 'Unrecognized category'}), 400
    user_index_key = f"{userid}_files"
    if user_index_key not in _file_index:
        return jsonify({'error': 'No files indexed for user'}), 404
    results = []
    for fname in files:
        meta = _file_index[user_index_key].get(fname)
        if not meta:
            results.append({'file': fname, 'updated': False, 'reason': 'not_found'})
            continue
        meta['category'] = normalized
        results.append({'file': fname, 'updated': True, 'category': normalized, 'category_label': VALID_FILE_CATEGORIES.get(normalized, normalized)})
    return jsonify({'results': results, 'userid': userid})

@app.route('/api/test_excel_processing', methods=['GET'])
def test_excel_processing():
    """Test Excel processing with the pre-uploaded file."""
    excel_file = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_E18_19_Testcases.xlsx')
    
    if not os.path.exists(excel_file):
        return jsonify({'error': 'Test Excel file not found'}), 404
    
    try:
        test_cases = process_excel_test_cases(excel_file)
        return jsonify({
            'message': 'Excel processing test successful',
            'file': 'temp_E18_19_Testcases.xlsx',
            'test_cases_found': len(test_cases),
            'test_cases': test_cases[:2] if test_cases else []  # Return first 2 for preview
        })
    except Exception as e:
        logger.error(f"Test Excel processing failed: {e}")
        return jsonify({'error': f'Test failed: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'uploaded_files': list(_file_index.keys()),
        'robot_files': [f for f in _file_index.keys() if f.endswith('.robot')],
        'python_files': [f for f in _file_index.keys() if f.endswith('.py')]
    })

@app.route('/api/preview_excel', methods=['POST'])
def preview_excel():
    """Preview Excel test cases without invoking LLM.

    Accepts multipart/form-data with field 'file'. Returns structured test cases.
    This allows the UI to let users select which cases to process.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part (expected form field name: file)'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    if not f.filename.lower().endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'File must be .xlsx or .xls'}), 400
    try:
        filename = secure_filename(f.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"preview_{filename}")
        f.save(temp_path)
        
        try:
            cases = process_excel_test_cases(temp_path)
        finally:
            # Ensure file is deleted even if processing fails
            try:
                if os.path.exists(temp_path):
                    time.sleep(0.1)  # Small delay to ensure file handles are released
                    os.remove(temp_path)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup preview file {temp_path}: {cleanup_error}")
        
        # Assign simple ids (1-based)
        enriched = []
        for i, tc in enumerate(cases, start=1):
            enriched.append({
                'id': i,
                'description': tc.get('description', ''),
                'steps': tc.get('steps', []),
                'step_count': len(tc.get('steps', []))
            })
        return jsonify({'file': filename, 'total': len(enriched), 'test_cases': enriched})
    except Exception as e:
        logger.error(f"Preview Excel failed: {e}")
        return jsonify({'error': f'Preview failed: {str(e)}'}), 500

@app.route('/api/preview_excel/', methods=['POST'])
def preview_excel_alias():
    return preview_excel()

@app.route('/api/process_excel', methods=['POST'])
def process_excel():
    """Process Excel file with test cases and generate Robot Framework implementations."""
    logger.info("🚀 Starting Excel processing request")
    logger.info(f"📊 Request method: {request.method}")
    logger.info(f"📋 Request files keys: {list(request.files.keys())}")
    logger.info(f"📋 Request form keys: {list(request.form.keys())}")
    logger.info(f"📋 Request content type: {request.content_type}")
    
    # Get user ID from form data
    userid = request.form.get('userid')
    if not userid:
        return jsonify({'error': 'User ID required. Please login first.'}), 401
    
    if 'file' not in request.files:
        logger.error("❌ No file part in request")
        logger.error(f"Available file keys: {list(request.files.keys())}")
        return jsonify({'error': 'No file part in request. Expected key: file'}), 400
    
    f = request.files['file']
    if f.filename == '':
        logger.error("❌ No file selected")
        return jsonify({'error': 'No file selected'}), 400
    
    logger.info(f"📁 Processing file: {f.filename}")
    logger.info(f"📏 File size: {f.content_length if hasattr(f, 'content_length') else 'unknown'}")
    
    if not f.filename.lower().endswith(('.xlsx', '.xls')):
        logger.error(f"❌ Invalid file type: {f.filename}")
        logger.error(f"Expected .xlsx or .xls, got: {f.filename.split('.')[-1] if '.' in f.filename else 'no extension'}")
        return jsonify({'error': 'File must be an Excel file (.xlsx or .xls)'}), 400
    
    try:
        filename = secure_filename(f.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{filename}")
        f.save(temp_path)
        
        # Initialize progress tracking
        global _excel_processing_progress
        _excel_processing_progress.update({
            'is_processing': True,
            'current_test_case': 0,
            'total_test_cases': 0,
            'current_description': 'Extracting test cases from Excel...',
            'status': 'extracting',
            'processed_cases': [],
            'updated_files': {}
        })
        
        # Optional metadata (selected case ids, selected files) provided via form field 'metadata'
        selected_case_ids: Optional[Set[int]] = None
        selected_files_for_context: Optional[List[str]] = None
        if 'metadata' in request.form:
            meta_raw = request.form.get('metadata')
            if meta_raw:
                try:
                    meta_json = json.loads(meta_raw)
                    if isinstance(meta_json, dict):
                        ids = meta_json.get('selected_case_ids')
                        if isinstance(ids, list):
                            selected_case_ids = {int(x) for x in ids if isinstance(x, (int, str)) and str(x).isdigit()}
                        sel_files = meta_json.get('selected_files')
                        if isinstance(sel_files, list):
                            selected_files_for_context = [str(x) for x in sel_files if isinstance(x, str)]
                    logger.info(f"Metadata parsed: case_ids={selected_case_ids} files={selected_files_for_context}")
                except Exception as me:
                    logger.warning(f"Failed to parse metadata JSON: {me}")

        # If user selected specific files for context, ALWAYS augment with all Python files
        # so that keyword implementations / utilities are visible to the LLM.
        if selected_files_for_context:
            try:
                user_folder = os.path.join(app.config['UPLOAD_FOLDER'], userid)
                if os.path.exists(user_folder):
                    py_context_files = [f for f in os.listdir(user_folder) if f.endswith('.py')]
                    # Preserve order: existing selected list first, then any new python files
                    for pyf in py_context_files:
                        if pyf not in selected_files_for_context:
                            selected_files_for_context.append(pyf)
                    logger.info(f"Extended selected context with python files: {py_context_files}")
            except Exception as e:
                logger.warning(f"Could not extend selected files with python context: {e}")

        # Extract test cases from Excel
        logger.info(f"📋 Attempting to extract test cases from: {temp_path}")
        test_cases = process_excel_test_cases(temp_path)
        if selected_case_ids is not None:
            original_len = len(test_cases)
            test_cases = [tc for idx, tc in enumerate(test_cases, start=1) if idx in selected_case_ids]
            logger.info(f"Filtered test cases by ids: {len(test_cases)}/{original_len}")
        
        if not test_cases:
            logger.error("❌ No test cases found in Excel file")
            logger.error("This could be due to:")
            logger.error("1. Wrong sheet being processed")
            logger.error("2. Data not in expected columns (F, G, H, I)")
            logger.error("3. Empty or malformed Excel file")
            _excel_processing_progress['is_processing'] = False
            _excel_processing_progress['status'] = 'error'
            return jsonify({'error': 'No test cases found in Excel file. Please check that test cases are in columns F-I.'}), 400
        
        # Update progress with total count
        _excel_processing_progress.update({
            'total_test_cases': len(test_cases),
            'current_description': 'Building comprehensive context...',
            'status': 'preparing'
        })

        # Get comprehensive context (respect selected files if provided)
        files_context = _build_comprehensive_files_context(selected_files_for_context, userid)

        # Get user-specific file index
        user_index_key = f"{userid}_files"
        if user_index_key not in _file_index:
            _file_index[user_index_key] = {}
        
        user_file_index = _file_index[user_index_key]
        
        # Ensure user file index is populated
        if not user_file_index:
            logger.info(f"User file index is empty for {userid}, rebuilding from user folder...")
            user_folder = os.path.join(app.config['UPLOAD_FOLDER'], userid)
            if os.path.exists(user_folder):
                for fname in os.listdir(user_folder):
                    fpath = os.path.join(user_folder, fname)
                    if os.path.isfile(fpath):
                        try:
                            user_file_index[fname] = {
                                'filename': fname,
                                'path': fpath,
                                'size_bytes': os.path.getsize(fpath),
                                'chunks': 0,
                                'chunk_size': 1000,
                                'chunk_overlap': 200,
                                'modified': False,
                                'patch_count': 0,
                                'last_applied': None,
                                'file_id': None,
                                'userid': userid,
                                # Persist a best-effort category so later routing can honor Script/Test files
                                'category': _infer_category(fname)
                            }
                        except Exception as e:
                            logger.warning(f"Failed indexing {fname} for user {userid}: {e}")

        # Identify target Robot Framework files to update - separate test files and keyword files.
        # Use case-insensitive match for extension and apply selection filtering with a safe fallback.
        all_robot_files = [fname for fname in user_file_index.keys()
                           if fname.lower().endswith('.robot') and not fname.startswith('generated_tests_')]
        target_robot_files = list(all_robot_files)

        # Apply user selection filtering ONLY if it would not eliminate all robot files OR if user explicitly selected at least one .robot file
        if selected_files_for_context:
            # What robot files did the user explicitly select?
            explicitly_selected_robot = [f for f in selected_files_for_context if f.lower().endswith('.robot')]
            filtered = [f for f in target_robot_files if f in selected_files_for_context]
            if filtered:
                target_robot_files = filtered
            else:
                # No robot files survived filtering
                if explicitly_selected_robot:
                    # User tried to select robot files but they weren't indexed (naming mismatch?)
                    logger.warning("User selected Robot Framework files not present in index: %s", explicitly_selected_robot)
                # Fallback: retain all robot files so processing can continue
                logger.warning("Selected files filtering removed all Robot Framework files; falling back to all detected robot files: %s", all_robot_files)
                target_robot_files = list(all_robot_files)

        # Additional defensive fallback: if still empty but we have .robot files with different casing (already covered by lower()), keep as-is.
        if not target_robot_files and all_robot_files:
            logger.warning("Target robot files list unexpectedly empty; restoring all_robot_files")
            target_robot_files = list(all_robot_files)
        
        # Separate test files from keyword files
        test_files = []
        keyword_files = []

        for filename in target_robot_files:
            meta = user_file_index.get(filename, {})
            category = meta.get('category')
            # Prefer explicit/persisted category when available
            if category == 'script':
                test_files.append(filename)
                continue
            if category in ('common_keywords', 'project_keywords', 'utility', 'config'):
                keyword_files.append(filename)
                continue

            # Fallback to lightweight content inspection only when category is unknown
            file_path = meta.get('path') or user_file_index[filename]['path']
            try:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                    if '*** Test Cases ***' in content:
                        test_files.append(filename)
                    elif '*** Keywords ***' in content or '*** keywords ***' in content:
                        keyword_files.append(filename)
                    else:
                        # Infer category from filename as last resort
                        inferred = _infer_category(filename)
                        if inferred == 'script':
                            test_files.append(filename)
                        else:
                            keyword_files.append(filename)
            except Exception as e:
                logger.warning(f"Could not analyze file {filename}: {e}")
                # On error, classify by filename inference
                inferred = _infer_category(filename)
                (test_files if inferred == 'script' else keyword_files).append(filename)

        # Do NOT promote keyword files to hold test cases.
        # If no test files are identified, insertion logic will create or choose a dedicated script file safely.
        if not test_files and keyword_files:
            logger.warning("No Script/Test files identified; will create/use a dedicated script suite during insertion. Keyword files will not be modified.")
        
        logger.info(f"🎯 Available files in user {userid} index: {list(user_file_index.keys())}")
        logger.info(f"🎯 Test files found: {test_files}")
        logger.info(f"🎯 Keyword files found: {keyword_files}")
        
        if not target_robot_files:
            # Distinguish between truly no uploads vs selection filtering edge-case
            has_any_robot = bool(all_robot_files)
            logger.error("❌ No Robot Framework files available after filtering")
            logger.error("All robot files detected pre-filter: %s", all_robot_files)
            logger.error("User selection (if any): %s", selected_files_for_context)
            logger.error(f"Available files in user {userid} index: " + ", ".join(user_file_index.keys()) if user_file_index else "None")
            _excel_processing_progress['is_processing'] = False
            _excel_processing_progress['status'] = 'error'
            if has_any_robot:
                return jsonify({'error': 'Robot Framework files exist but none matched the selected context. Adjust your file selection or upload test/keyword .robot files.'}), 400
            else:
                return jsonify({'error': 'No Robot Framework (.robot) files uploaded. Please upload at least one .robot file containing either *** Test Cases *** or *** Keywords *** sections.'}), 400
        
        # Update progress status
        _excel_processing_progress.update({
            'current_description': 'Starting test case processing...',
            'status': 'processing'
        })
        
        # Process each test case with enhanced LLM using comprehensive context
        processed_test_cases = []
        total_cases = len(test_cases)
        updated_files = {}
        
        logger.info(f"🚀 Starting enhanced processing of {total_cases} test cases with comprehensive context")
        logger.info(f"📁 Context includes {len([f for f in _file_index.keys() if f.endswith(('.robot', '.py'))])} files")
        logger.info(f"🎯 Will update existing Robot Framework files: {', '.join(target_robot_files)}")
        
        for i, test_case in enumerate(test_cases, 1):
            # Update progress
            _excel_processing_progress.update({
                'current_test_case': i,
                'current_description': f"Processing: {test_case['description'][:50]}...",
                'status': 'processing'
            })
            
            logger.info(f"🔄 Processing test case {i}/{total_cases}: {test_case['description'][:50]}...")
            
            try:
                # Generate both test case and keywords using enhanced processing
                test_case_result = process_test_case_with_enhanced_llm_dual_output(
                    test_case, files_context, test_files, keyword_files
                )
                
                # Apply updates to the appropriate files
                file_updates = apply_dual_output_to_robot_files(
                    test_case, test_case_result, test_files, keyword_files, i, userid
                )
                
                for filename, update_info in file_updates.items():
                    if filename not in updated_files:
                        updated_files[filename] = []
                    updated_files[filename].append({
                        'test_case_number': i,
                        'test_case_description': test_case['description'],
                        'update_info': update_info
                    })
                
                processed_test_cases.append({
                    'original': test_case,
                    'robot_implementation': test_case_result,
                    'file_updates': file_updates,
                    'status': 'success'
                })
                
                # Update progress with successful case
                _excel_processing_progress['processed_cases'].append({
                    'test_case_number': i,
                    'description': test_case['description'],
                    'status': 'success'
                })
                _excel_processing_progress['updated_files'].update(file_updates)
                
                logger.info(f"✅ Successfully processed test case {i}/{total_cases} and updated files")
                
            except Exception as e:
                logger.error(f"❌ Failed to process test case {i}: {e}")
                processed_test_cases.append({
                    'original': test_case,
                    'robot_implementation': None,
                    'file_updates': {},
                    'status': 'error',
                    'error': str(e)
                })
                
                # Update progress with failed case
                _excel_processing_progress['processed_cases'].append({
                    'test_case_number': i,
                    'description': test_case['description'],
                    'status': 'error',
                    'error': str(e)
                })
            
            # Add small delay between test cases to respect rate limits
            if i < total_cases:
                time.sleep(1)
        
        
        # Clean up temp file
        os.remove(temp_path)
        
        success_count = sum(1 for p in processed_test_cases if p['status'] == 'success')
        
        # Prepare summary of file updates
        total_file_updates = {}
        for case in processed_test_cases:
            if case['status'] == 'success' and 'file_updates' in case:
                for filename, update_info in case['file_updates'].items():
                    if filename not in total_file_updates:
                        total_file_updates[filename] = []
                    total_file_updates[filename].append(update_info)
        
        # Mark processing as complete
        _excel_processing_progress.update({
            'is_processing': False,
            'current_test_case': total_cases,
            'current_description': f'Completed! Updated {len(total_file_updates)} files with {success_count} test cases',
            'status': 'completed'
        })
        
        return jsonify({
            'message': f'Processed {total_cases} test cases and updated {len(total_file_updates)} Robot Framework files',
            'total_test_cases': total_cases,
            'successful_generations': success_count,
            'failed_generations': total_cases - success_count,
            'updated_files': total_file_updates,
            'file_update_summary': {filename: len(updates) for filename, updates in total_file_updates.items()},
            'test_cases': processed_test_cases
        })
        
    except Exception as e:
        logger.error(f"Excel processing failed: {e}")
        
        # Mark processing as failed
        _excel_processing_progress.update({
            'is_processing': False,
            'status': 'error',
            'current_description': f'Error: {str(e)}'
        })
        
        # Clean up temp file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        return jsonify({'error': f'Excel processing failed: {str(e)}'}), 500

@app.route('/api/process_excel/', methods=['POST'])
def process_excel_alias():
    return process_excel()

@app.route('/api/delete_file', methods=['DELETE'])
def delete_file():
    """Delete an uploaded file (idempotent). Used by Reset UI to remove Excel uploads.
    
    Supports user-specific file deletion with userid parameter.
    """
    global _file_index
    name = request.args.get('name')
    userid = request.args.get('userid')
    
    if not name:
        return jsonify({'error': 'Missing name parameter'}), 400
    if not userid:
        return jsonify({'error': 'Missing userid parameter'}), 400
        
    safe_name = secure_filename(name)
    if not safe_name:
        return jsonify({'error': 'Invalid filename'}), 400
    
    # Get user-specific folder and file path
    user_folder = os.path.join(UPLOAD_FOLDER, userid)
    file_path = os.path.join(user_folder, safe_name)
    
    # Get user-specific file index key
    user_index_key = f"{userid}_files"
    
    if os.path.isfile(file_path):
        try:
            os.remove(file_path)
            # Remove from user-specific file index
            if user_index_key in _file_index and safe_name in _file_index[user_index_key]:
                _file_index[user_index_key].pop(safe_name, None)
            logger.info('🗑️ Deleted user file via API: %s (user: %s)', safe_name, userid)
            return jsonify({'message': 'Deleted', 'filename': safe_name, 'userid': userid})
        except Exception as e:
            logger.error('Failed to delete %s for user %s: %s', safe_name, userid, e)
            return jsonify({'error': f'Failed to delete: {e}'}), 500
    else:
        # treat as success for idempotency
        if user_index_key in _file_index:
            _file_index[user_index_key].pop(safe_name, None)
        logger.info('🗑️ File not found, treated as deleted: %s (user: %s)', safe_name, userid)
        return jsonify({'message': 'File not found; treated as deleted', 'filename': safe_name, 'userid': userid})

@app.route('/api/files', methods=['GET'])
def list_files():
    """Return metadata for uploaded files for a specific user.

    Enhancements:
      - Purges _file_index entries whose underlying file was removed.
      - Optional ?rescan=1 forces a full directory scan (clears and rebuilds index).
      - Now supports user-specific file listing via ?userid=xxx parameter.
    """
    global _file_index
    rescan = request.args.get('rescan') in ('1', 'true', 'yes')
    userid = request.args.get('userid')
    
    if not userid:
        return jsonify({'files': [], 'message': 'User ID required'}), 400

    # Create user-specific file index key
    user_index_key = f"{userid}_files"
    if user_index_key not in _file_index:
        _file_index[user_index_key] = {}

    user_file_index = _file_index[user_index_key]
    user_folder = os.path.join(UPLOAD_FOLDER, userid)
    
    # Create user folder if it doesn't exist
    os.makedirs(user_folder, exist_ok=True)

    # Fast purge of missing files (without full rescan) unless full rescan requested
    removed = []
    if rescan:
        user_file_index.clear()
    else:
        for name, meta in list(user_file_index.items()):
            path = meta.get('path') or os.path.join(user_folder, name)
            if not os.path.isfile(path):
                removed.append(name)
                user_file_index.pop(name, None)
        if removed:
            logger.info("Purged %d missing file(s) from user %s index: %s", len(removed), userid, ', '.join(removed))

    # If rescan requested or index empty, rebuild from disk for user folder
    if rescan or not user_file_index:
        if os.path.exists(user_folder):
            for fname in sorted(os.listdir(user_folder)):
                fpath = os.path.join(user_folder, fname)
                if not os.path.isfile(fpath):
                    continue
                if fname not in user_file_index:
                    try:
                        user_file_index[fname] = {
                            'filename': fname,
                            'path': fpath,
                            'size_bytes': os.path.getsize(fpath),
                            'chunks': 0,
                            'chunk_size': 1000,
                            'chunk_overlap': 200,
                            'modified': False,
                            'patch_count': 0,
                            'last_applied': None,
                            'file_id': None,
                            'userid': userid,
                        }
                    except Exception as e:
                        logger.warning("Failed indexing %s for user %s: %s", fname, userid, e)

    files = []
    for name, meta in sorted(user_file_index.items()):
        files.append({
            'filename': meta.get('filename'),
            'size_bytes': meta.get('size_bytes'),
            'chunks': meta.get('chunks'),
            'modified': meta.get('modified'),
            'patch_count': meta.get('patch_count'),
            'last_applied': meta.get('last_applied'),
            'category': meta.get('category'),
            'category_label': VALID_FILE_CATEGORIES.get(meta.get('category'), meta.get('category')) if meta.get('category') else None
        })
    return jsonify({'files': files, 'purged': removed, 'rescan': rescan, 'userid': userid})

@app.route('/api/file', methods=['GET'])
def get_file_contents():
    """Return raw contents of an uploaded file for a specific user (no directory traversal)."""
    name = request.args.get('name', '')
    userid = request.args.get('userid', '')
    
    if not name:
        return jsonify({'error': 'Missing name'}), 400
    if not userid:
        return jsonify({'error': 'Missing userid'}), 400
        
    # simple security: no path separators
    if '/' in name or '\\' in name:
        return jsonify({'error': 'Invalid name'}), 400
        
    # Construct user-specific path
    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], userid)
    path = os.path.join(user_folder, name)
    if not os.path.isfile(path):
        return jsonify({'error': 'Not found'}), 404
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    return jsonify({'name': name, 'content': content})

@app.route('/api/download/<filename>')
def download_file(filename):
    """Download a single file with applied implementations.

    Enhancement: supports user-specific subdirectories via ?userid=<id>.
    Search order:
      1. UPLOAD_FOLDER/<userid>/<filename> (if userid provided)
      2. UPLOAD_FOLDER/<filename>
    Returns JSON error payloads for clarity.
    """
    # Basic security: disallow traversal or separators
    if '/' in filename or '\\' in filename or '..' in filename:
        return jsonify({'error': 'Invalid filename'}), 400

    base_folder = app.config.get('UPLOAD_FOLDER')
    if not base_folder:
        return jsonify({'error': 'Server misconfiguration: UPLOAD_FOLDER not set'}), 500

    userid = request.args.get('userid', '').strip()
    search_paths = []
    if userid:
        try:
            safe_userid = secure_filename(userid)
        except Exception:
            safe_userid = userid
        user_folder = os.path.join(base_folder, safe_userid)
        search_paths.append(user_folder)
    search_paths.append(base_folder)

    for folder in search_paths:
        full_path = os.path.join(folder, filename)
        if os.path.isfile(full_path):
            try:
                return send_from_directory(
                    folder,
                    filename,
                    as_attachment=True,
                    download_name=filename
                )
            except FileNotFoundError:
                continue

    # Fallback: search _file_index (both global and user-specific) for a matching filename
    try:
        from flask import send_file
        candidate_path = None
        # Direct top-level entries
        for key, meta in _file_index.items():
            # Skip user collection containers here
            if key.endswith('_files') and isinstance(meta, dict) and not meta.get('path'):
                continue
            if isinstance(meta, dict):
                meta_name = meta.get('filename') or key
                if meta_name == filename and meta.get('path') and os.path.isfile(meta['path']):
                    candidate_path = meta['path']
                    break
        # Search user-specific collections if not found
        if not candidate_path:
            for key, collection in _file_index.items():
                if key.endswith('_files') and isinstance(collection, dict):
                    file_meta = collection.get(filename)
                    if file_meta and file_meta.get('path') and os.path.isfile(file_meta['path']):
                        candidate_path = file_meta['path']
                        break
        if candidate_path:
            logger.info("Download served via file index path: %s", candidate_path)
            return send_file(candidate_path, as_attachment=True, download_name=filename)
    except Exception as fallback_err:
        logger.warning("Download fallback via _file_index failed for %s: %s", filename, fallback_err)

    logger.warning("Download failed - file not found: %s (userid=%s) searched=%s and _file_index", filename, userid, search_paths)
    return jsonify({'error': 'File not found', 'filename': filename, 'userid': userid or None}), 404

@app.route('/api/download_all')
def download_all_files():
    """Download all files as a zip archive.

    Enhancement: support user-specific archives via ?userid=<id>. When userid is
    provided, only that user's files (directly inside their folder) are included.
    Without userid, we include only top-level files inside UPLOAD_FOLDER (legacy behavior).
    """
    import zipfile, io
    from flask import send_file

    base_folder = app.config.get('UPLOAD_FOLDER')
    if not base_folder:
        return jsonify({'error': 'Server misconfiguration: UPLOAD_FOLDER not set'}), 500

    userid = request.args.get('userid', '').strip()
    if userid:
        safe_userid = secure_filename(userid)
        target_folder = os.path.join(base_folder, safe_userid)
        if not os.path.isdir(target_folder):
            return jsonify({'error': 'User folder not found', 'userid': userid}), 404
    else:
        target_folder = base_folder

    try:
        file_entries = []
        for name in sorted(os.listdir(target_folder)):
            full_path = os.path.join(target_folder, name)
            if os.path.isfile(full_path) and not name.startswith('.'):
                file_entries.append((name, full_path))

        if not file_entries:
            return jsonify({'error': 'No files available to download', 'userid': userid or None}), 404

        zip_buffer = io.BytesIO()
        archive_name = f"{safe_userid}_robot_framework_files.zip" if userid else 'robot_framework_files.zip'
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for name, full_path in file_entries:
                try:
                    zf.write(full_path, arcname=name)
                except Exception as write_err:
                    logger.warning('Skipped file during zipping %s: %s', name, write_err)
        zip_buffer.seek(0)
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=archive_name
        )
    except Exception as e:
        logger.error('Failed to create zip archive (userid=%s): %s', userid, e)
        return jsonify({'error': 'Failed to create zip', 'details': str(e)}), 500

@app.route('/api/set_file_category', methods=['POST'])
def set_file_category():
    """Assign or update a category for a previously uploaded file.

    JSON body: { filename: str, category: str }
    Category may be one of VALID_FILE_CATEGORIES keys or a loose label that
    will be normalized. Returns updated file metadata.
    """
    data = request.get_json(force=True)
    filename = (data.get('filename') or '').strip()
    category_raw = (data.get('category') or '').strip()
    if not filename or filename not in _file_index:
        return jsonify({'error': 'File not found'}), 404
    norm = _normalize_category(category_raw)
    if not norm:
        return jsonify({'error': 'Invalid category'}), 400
    _file_index[filename]['category'] = norm
    return jsonify({
        'filename': filename,
        'category': norm,
        'category_label': VALID_FILE_CATEGORIES.get(norm, norm)
    })

@app.route('/api/suggest_patch', methods=['POST'])
def suggest_patch():
    """Generate a unified diff patch suggestion for a file based on an instruction.

    Request JSON: { filename: str, instruction: str }
    Response JSON: { diff: str }
    """
    data = request.get_json(force=True)
    filename = data.get('filename', '').strip()
    instruction = data.get('instruction', '').strip()
    if not filename or not instruction:
        return jsonify({'error': 'filename and instruction required'}), 400
    if '/' in filename or '\\' in filename:
        return jsonify({'error': 'Invalid filename'}), 400
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.isfile(path):
        return jsonify({'error': 'File not found'}), 404
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        original = f.read()

    client = get_client()
    model = get_model_name()

    # Detect referenced filenames and prompt user if missing
    referenced = _extract_referenced_filenames(instruction)
    missing = [r for r in referenced if r not in _file_index and r != filename]
    if missing:
        return jsonify({'error': f"Referenced file(s) not uploaded: {', '.join(missing)}. Please upload them first."}), 400

    system_prompt = (
        "You are an AI code refactoring assistant specialized in Python and Robot Framework (.robot) files. "
        "Task: produce ONLY a unified diff patch for THE TARGET file provided (and ONLY that file). "
        "Rules: \n"
        "1) Start with '--- ORIGINAL' then '+++ UPDATED' lines. \n"
        "2) Use minimal context lines and standard @@ hunk headers. \n"
        "3) Preserve existing indentation and spacing. \n"
        "4) For Robot Framework: keep consistent keyword alignment; do NOT convert spacing to tabs; maintain comments. \n"
        "5) For Python: avoid large rewrites; keep imports sorted; ensure syntactic correctness. \n"
        "6) If instruction is vague, infer a small helpful enhancement (docstring, logging, type hints). \n"
        "7) Do NOT include changes for any other file besides the TARGET. \n"
        "8) If no change is needed output an empty string. \n"
        "Return ONLY the diff, no prose." )
    extra_context = _collect_modified_file_context(exclude=[filename])
    user_content = f"Instruction:\n{instruction}\n\nTARGET File: {filename}\n\n```\n{original}\n```\n\n{extra_context}".strip()

    try:
        diff_text = _make_cached_api_call(
            client=client,
            model=model,
            system_prompt=system_prompt,
            user_content=user_content,
            temperature=0.2,
            max_tokens=1200
        )
    except Exception as e:
        return jsonify({'error': f'Generation failed: {e}'}), 500

    return jsonify({'diff': diff_text})

@app.route('/api/suggest_patches', methods=['POST'])
def suggest_patches():
    """Generate unified diffs for multiple files with a shared instruction.

    Request JSON: { filenames: [str], instruction: str }
    Response: { diff: str }
    Diff format: sequential unified diffs; each file block begins with standard headers:
      --- ORIGINAL:filename
      +++ UPDATED:filename
    """
    data = request.get_json(force=True)
    filenames = data.get('filenames') or []
    instruction = (data.get('instruction') or '').strip()
    if not filenames or not instruction:
        return jsonify({'error': 'filenames (array) and instruction required'}), 400
    safe_files = []
    contents = []
    for name in filenames:
        if not isinstance(name, str):
            return jsonify({'error': 'Invalid filename entry'}), 400
        name = name.strip()
        if not name or '/' in name or '\\' in name:
            return jsonify({'error': f'Invalid filename: {name}'}), 400
        path = os.path.join(app.config['UPLOAD_FOLDER'], name)
        if not os.path.isfile(path):
            return jsonify({'error': f'File not found: {name}'}), 404
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            contents.append((name, f.read()))
        safe_files.append(name)

    client = get_client()
    model = get_model_name()
    # Detect referenced filenames; if any not included in filenames list and not uploaded, prompt
    referenced = _extract_referenced_filenames(instruction)
    missing = [r for r in referenced if r not in _file_index and r not in filenames]
    if missing:
        return jsonify({'error': f"Referenced file(s) not uploaded: {', '.join(missing)}. Upload them or remove from instruction."}), 400

    system_prompt = (
        "You are an AI code refactoring assistant (Python + Robot Framework). Produce unified diffs ONLY for files that need changes. "
        "For each changed file output exactly: --- ORIGINAL:filename then +++ UPDATED:filename then hunks. \n"
        "Do NOT invent new files. Omit unchanged files completely. Keep modifications minimal and focused. No prose outside diffs." )

    user_sections = [f"File: {name}\n```\n{text}\n```" for name, text in contents]
    extra_context = _collect_modified_file_context(exclude=filenames)
    user_content = (f"Instruction:\n{instruction}\n\n" + '\n\n'.join(user_sections) + ("\n\n" + extra_context if extra_context else '')).strip()
    try:
        diff_text = _make_cached_api_call(
            client=client,
            model=model,
            system_prompt=system_prompt,
            user_content=user_content,
            temperature=0.2,
            max_tokens=2000
        )
    except Exception as e:
        return jsonify({'error': f'Generation failed: {e}'}), 500
    return jsonify({'diff': diff_text})

def _apply_unified_diff(original_text: str, diff_text: str) -> str:
    """Apply a single-file unified diff to original_text and return new text.

    Limitations: assumes diff produced with minimal context, single file, consistent ordering.
    Raises RuntimeError on mismatch.
    """
    orig_lines = original_text.splitlines(keepends=False)
    new_lines = []
    i = 0  # pointer into orig_lines
    in_hunk = False
    for raw in diff_text.splitlines():
        line = raw.rstrip('\n')
        if line.startswith('--- ') or line.startswith('+++ '):
            continue
        if line.startswith('@@'):
            in_hunk = True
            # Hunk header contains positions; we ignore and rely on sequential apply
            continue
        if not in_hunk:
            # Skip anything before first hunk
            continue
        if line.startswith(' '):
            expected = line[1:]
            if i >= len(orig_lines) or orig_lines[i] != expected:
                raise RuntimeError(f"Context mismatch applying patch near: {expected}")
            new_lines.append(expected)
            i += 1
        elif line.startswith('-'):
            expected = line[1:]
            if i >= len(orig_lines) or orig_lines[i] != expected:
                raise RuntimeError(f"Removal mismatch applying patch near: {expected}")
            i += 1  # skip this line (removal)
        elif line.startswith('+'):
            new_lines.append(line[1:])
        else:
            # Unknown marker; treat as context safety
            if i < len(orig_lines) and orig_lines[i] == line:
                new_lines.append(line)
                i += 1
            else:
                # Append as-is (defensive)
                new_lines.append(line)
    # Append any remaining original lines if patch didn't consume all (conservative)
    while i < len(orig_lines):
        new_lines.append(orig_lines[i])
        i += 1
    return '\n'.join(new_lines) + ('\n' if original_text.endswith('\n') else '')

# -------------------- SNAPSHOT & DIFF SUPPORT --------------------
def _snapshot_file(filename: str, original_content: str, max_history: int = 5) -> None:
    """Store a lightweight snapshot (pre-modification) for diff viewing.

    Keeps only last `max_history` versions per file.
    Stored as list of dicts under _file_index[filename]['history'].
    Each entry holds: timestamp, size, sha256, lines (list[str]).
    """
    meta = _file_index.get(filename)
    if meta is None:
        return
    try:
        history = meta.get('history') or []
        snap = {
            'timestamp': datetime.now().isoformat(),
            'size': len(original_content.encode('utf-8')),
            'sha256': hashlib.sha256(original_content.encode('utf-8')).hexdigest(),
            'lines': original_content.splitlines()
        }
        history.append(snap)
        if len(history) > max_history:
            history = history[-max_history:]
        meta['history'] = history
    except Exception as e:
        logger.warning(f"Snapshot failed for {filename}: {e}")

def _compute_diff(snapshot_lines: List[str], current_lines: List[str], filename: str) -> Dict:
    """Return unified diff text + parsed line change info for highlighting."""
    diff_iter = difflib.unified_diff(snapshot_lines, current_lines, fromfile=f"{filename}:snapshot", tofile=filename, lineterm='')
    diff_lines = list(diff_iter)
    added_ranges = []  # list of (start_line, end_line) in current file
    current_line_no = 0
    # We parse hunks to find lines beginning with '+' (excluding headers)
    temp_start = None
    for line in diff_lines:
        if line.startswith('@@'):
            # parse hunk header: @@ -a,b +c,d @@
            try:
                header = line.split('@@')[1].strip()
                plus_part = [seg for seg in header.split(' ') if seg.startswith('+')][0]
                # +c or +c,d
                plus_vals = plus_part[1:].split(',')
                current_line_no = int(plus_vals[0]) - 1  # will increment before use
            except Exception:
                pass
            continue
        if line.startswith('+') and not line.startswith('+++'):
            current_line_no += 1
            if temp_start is None:
                temp_start = current_line_no
        elif line.startswith('-') and not line.startswith('---'):
            # removed line does not advance current line
            continue
        else:
            # context line or something else
            if temp_start is not None:
                added_ranges.append({'start': temp_start, 'end': current_line_no})
                temp_start = None
            if not line.startswith('-'):
                current_line_no += 1 if not line.startswith('---') else 0
    if temp_start is not None:
        added_ranges.append({'start': temp_start, 'end': current_line_no})
    return {
        'diff_text': '\n'.join(diff_lines),
        'added_ranges': added_ranges
    }

@app.route('/api/file_history', methods=['GET'])
def file_history():
    name = request.args.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Missing name'}), 400
    meta = _file_index.get(name)
    if not meta:
        return jsonify({'error': 'File not indexed'}), 404
    hist = meta.get('history') or []
    # Return metadata only (omit lines)
    return jsonify({
        'file': name,
        'versions': [
            {k: v for k, v in entry.items() if k != 'lines'}
            for entry in reversed(hist)
        ]
    })

@app.route('/api/file_diff', methods=['GET'])
def file_diff():
    name = request.args.get('name', '').strip()
    userid = request.args.get('userid', '').strip()
    if not name:
        return jsonify({'error': 'Missing name'}), 400
    if userid and f"{userid}_files" in _file_index:
        meta = _file_index[f"{userid}_files"].get(name)
    else:
        meta = _file_index.get(name)
    if not meta:
        return jsonify({'error': 'File not indexed'}), 404
    history = meta.get('history') or []
    if not history:
        return jsonify({'error': 'No snapshots for file'}), 404
    # Choose snapshot: index=0 is MOST recent previous version (we stored chronological, we reversed earlier)
    idx_param = request.args.get('index')
    if idx_param and idx_param.isdigit():
        snap_index = int(idx_param)
        if snap_index < 0 or snap_index >= len(history):
            return jsonify({'error': 'Snapshot index out of range'}), 400
        snapshot = history[-(snap_index + 1)]  # reverse mapping
    else:
        snapshot = history[-1]
    try:
        with open(meta.get('path'), 'r', encoding='utf-8', errors='replace') as f:
            current_content = f.read()
    except Exception as e:
        return jsonify({'error': f'Failed reading current file: {e}'}), 500
    result = _compute_diff(snapshot.get('lines', []), current_content.splitlines(), name)
    return jsonify({
        'file': name,
        'snapshot_timestamp': snapshot.get('timestamp'),
        'added_ranges': result['added_ranges'],
        'diff': result['diff_text']
    })

@app.route('/api/apply_patch', methods=['POST'])
def apply_patch():
    data = request.get_json(force=True)
    filename = data.get('filename', '').strip()
    diff_text = data.get('diff', '')
    if not filename or not diff_text:
        return jsonify({'error': 'filename and diff required'}), 400
    if '/' in filename or '\\' in filename:
        return jsonify({'error': 'Invalid filename'}), 400
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.isfile(path):
        return jsonify({'error': 'File not found'}), 404
    try:
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            original = f.read()
        updated = _apply_unified_diff(original, diff_text)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(updated)
        meta = _file_index.get(filename)
        if meta is None:
            meta = _file_index[filename] = {
                'filename': filename,
                'path': path,
                'size_bytes': len(updated.encode('utf-8')),
                'chunks': None,
                'chunk_size': None,
                'chunk_overlap': None,
                'modified': True,
                'patch_count': 1,
                'last_applied': time.time(),
            }
        else:
            meta['modified'] = True
            meta['patch_count'] = (meta.get('patch_count') or 0) + 1
            meta['last_applied'] = time.time()
            meta['size_bytes'] = len(updated.encode('utf-8'))
        # Re-ingest updated file into vector store to keep search fresh
        try:
            client = get_client()
            if _vector_store_id and os.path.isfile(path):
                # Optionally delete old version
                old_id = meta.get('file_id')
                if old_id:
                    try:
                        client.files.delete(old_id)  # may fail if not supported
                    except Exception:
                        pass
                with open(path, 'rb') as fb:
                    uploaded = client.files.create(file=fb, purpose="assistants")
                new_id = uploaded.id
                meta['file_id'] = new_id
                try:
                    client.beta.vector_stores.file_batches.create(
                        vector_store_id=_vector_store_id,
                        file_ids=[new_id]
                    )
                except Exception:
                    pass
        except Exception as ie:
            logger.warning("Re-ingest after patch failed: %s", ie)

        return jsonify({'applied': True, 'filename': filename, 'updated_length': len(updated), 'patch_count': meta['patch_count']})
    except Exception as e:
        return jsonify({'error': f'Patch apply failed: {e}'}), 400

@app.route('/api/analyze_robot_framework', methods=['POST'])
def analyze_robot_framework():
    """Perform comprehensive analysis of uploaded Robot Framework files."""
    try:
        analyzer = RobotFrameworkAnalyzer()
        analysis = analyzer.analyze_uploaded_files(app.config['UPLOAD_FOLDER'])
        
        # Generate AI insights for the analysis
        client = get_client()
        model = get_model_name()
        
        # Create a summary for AI analysis
        summary = {
            'total_files': len(analysis.get('robot_files', [])) + len(analysis.get('python_files', [])),
            'total_keywords': len(analysis.get('keywords', {})),
            'placeholder_count': len(analysis.get('placeholders', [])),
            'business_scenarios': len(analysis.get('business_analysis', {}).get('test_scenarios', [])),
            'quality_issues': len(analysis.get('quality_metrics', {}).get('code_smells', []))
        }
        
        # Generate AI insights
        ai_insights = analyzer.generate_ai_insights(analysis, summary, client, model)
        analysis['ai_insights'] = ai_insights
        
        return jsonify(analysis)
    except Exception as e:
        logger.error(f"Robot Framework analysis failed: {e}")
        return jsonify({'error': f'Analysis failed: {e}'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json(force=True)
    user_message = data.get('message', '').strip()
    if not user_message:
        return jsonify({'error': 'Empty message'}), 400

    # Early check: see if user references missing files and prompt for upload instead of confusing LLM
    referenced = _extract_referenced_filenames(user_message)
    missing = [r for r in referenced if r not in _file_index]
    if missing:
        return jsonify({'answer': f"I notice you referenced file(s) not uploaded yet: {', '.join(missing)}. Please upload them so I can inspect."})

    # Check if this is a Robot Framework analysis request
    if any(keyword in user_message.lower() for keyword in ['analyze', 'robot framework', 'business logic', 'test scenarios']):
        try:
            analyzer = RobotFrameworkAnalyzer()
            analysis = analyzer.analyze_uploaded_files(app.config['UPLOAD_FOLDER'])
            
            # Generate contextual response based on the analysis
            client = get_client()
            model = get_model_name()
            
            contextual_response = analyzer.generate_contextual_chat_response(
                user_message, analysis, client, model
            )
            
            return jsonify({'answer': contextual_response})
        except Exception as e:
            logger.error(f"Robot Framework contextual analysis failed: {e}")
            # Fall back to regular chat

    client = get_client()
    assistant_id = get_assistant()

    # Create a new thread per request (simplest). For real use, persist thread IDs per user/session.
    thread = client.beta.threads.create(messages=[{"role": "user", "content": user_message}])

    run = client.beta.threads.runs.create_and_poll(
        thread_id=thread.id,
        assistant_id=assistant_id
    )

    if run.status != 'completed':
        return jsonify({'error': f'Run status: {run.status}'}), 500

    messages = client.beta.threads.messages.list(thread_id=thread.id)
    # Last assistant message content
    answer = ''
    for m in reversed(messages.data):
        if m.role == 'assistant':
            # Each content item may be text / etc.
            parts = []
            for c in m.content:
                if c.type == 'text':
                    parts.append(c.text.value)
            answer = '\n'.join(parts)
            break

    return jsonify({'answer': answer})

@app.route('/api/analyze_robot_files', methods=['POST'])
def analyze_robot_files():
    """Analyze all uploaded Robot Framework files and return comprehensive analysis."""
    try:
        analyzer = RobotFrameworkAnalyzer()
        analysis = analyzer.analyze_uploaded_files(UPLOAD_FOLDER)
        return jsonify(analysis)
    except Exception as e:
        logger.error(f"Robot file analysis failed: {e}")
        return jsonify({'error': f'Analysis failed: {e}'}), 500

@app.route('/api/generate_keyword_implementations', methods=['POST'])
def generate_keyword_implementations():
    """Generate implementations for all placeholder keywords."""
    try:
        analyzer = RobotFrameworkAnalyzer()
        analysis = analyzer.analyze_uploaded_files(UPLOAD_FOLDER)
        
        if not analysis['placeholders']:
            return jsonify({'message': 'No placeholder keywords found', 'implementations': {}})
        
        client = get_client()
        model = get_model_name()
        
        implementations = analyzer.generate_keyword_implementations(analysis, client, model)
        
        return jsonify({
            'implementations': implementations,
            'count': len(implementations),
            'placeholders_analyzed': len(analysis['placeholders'])
        })
    except Exception as e:
        logger.error(f"Keyword implementation generation failed: {e}")
        return jsonify({'error': f'Generation failed: {e}'}), 500

@app.route('/api/apply_keyword_implementations', methods=['POST'])
def apply_keyword_implementations():
    """Apply generated keyword implementations to the actual files."""
    data = request.get_json(force=True)
    implementations = data.get('implementations', {})
    
    if not implementations:
        return jsonify({'error': 'No implementations provided'}), 400
    
    applied_count = 0
    errors = []
    
    for key, implementation in implementations.items():
        try:
            # Parse key: "filename::keyword_name"
            if '::' not in key:
                errors.append(f"Invalid key format: {key}")
                continue
            
            filename, keyword_name = key.split('::', 1)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            
            if not os.path.isfile(file_path):
                errors.append(f"File not found: {filename}")
                continue
            
            # Apply the implementation
            success = _apply_keyword_implementation(file_path, keyword_name, implementation)
            if success:
                applied_count += 1
                
                # Update file index
                meta = _file_index.get(filename)
                if meta:
                    meta['modified'] = True
                    meta['patch_count'] = (meta.get('patch_count') or 0) + 1
                    meta['last_applied'] = time.time()
            else:
                errors.append(f"Failed to apply implementation for {keyword_name} in {filename}")
                
        except Exception as e:
            errors.append(f"Error applying {key}: {e}")
    
    return jsonify({
        'applied_count': applied_count,
        'total_implementations': len(implementations),
        'errors': errors
    })

def _apply_keyword_implementation(file_path: str, keyword_name: str, implementation: str) -> bool:
    """Apply a keyword implementation to a specific file."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        lines = content.split('\n')
        new_lines = []
        in_keyword = False
        keyword_found = False
        keyword_indent = 0
        
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # Check if this is the start of our target keyword
            if not in_keyword and stripped == keyword_name:
                keyword_found = True
                in_keyword = True
                keyword_indent = len(line) - len(line.lstrip())
                new_lines.append(line)  # Keep the keyword name line
                
                # Skip the old implementation
                i += 1
                while i < len(lines):
                    next_line = lines[i]
                    next_stripped = next_line.strip()
                    
                    # Stop if we hit a new keyword or section
                    if (next_stripped and 
                        not next_line.startswith(' ') and 
                        not next_line.startswith('\t') and
                        not next_stripped.startswith('[') and
                        next_stripped != keyword_name):
                        break
                    
                    i += 1
                
                # Add the new implementation with proper indentation
                impl_lines = implementation.split('\n')
                for impl_line in impl_lines:
                    if impl_line.strip():  # Don't indent empty lines
                        new_lines.append(' ' * 4 + impl_line)  # 4 spaces indentation
                    else:
                        new_lines.append('')
                
                in_keyword = False
                continue
            else:
                new_lines.append(line)
                i += 1
        
        if keyword_found:
            # Write the updated content back to the file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(new_lines))
            return True
        else:
            logger.warning(f"Keyword '{keyword_name}' not found in {file_path}")
            return False
            
    except Exception as e:
        logger.error(f"Error applying keyword implementation: {e}")
        return False

@app.route('/api/missing_files_check', methods=['POST'])
def missing_files_check():
    """Check for missing files referenced in the uploaded Robot Framework files."""
    try:
        analyzer = RobotFrameworkAnalyzer()
        analysis = analyzer.analyze_uploaded_files(UPLOAD_FOLDER)
        
        # Collect all referenced files
        referenced_files = set()
        uploaded_files = set(analysis['robot_files'] + analysis['python_files'])
        
        for file_name, deps in analysis['dependencies'].items():
            for resource in deps.get('resources', []):
                # Extract just the filename from the resource path
                ref_file = os.path.basename(resource)
                if ref_file.endswith('.robot') or ref_file.endswith('.py'):
                    referenced_files.add(ref_file)
            
            for library in deps.get('libraries', []):
                # Extract library filename if it's a file reference
                if '/' in library or '\\' in library or library.endswith('.py'):
                    lib_file = os.path.basename(library)
                    if lib_file.endswith('.py'):
                        referenced_files.add(lib_file)
        
        # Find missing files
        missing_files = referenced_files - uploaded_files
        
        return jsonify({
            'referenced_files': sorted(list(referenced_files)),
            'uploaded_files': sorted(list(uploaded_files)),
            'missing_files': sorted(list(missing_files)),
            'dependencies': analysis['dependencies']
        })
        
    except Exception as e:
        logger.error(f"Missing files check failed: {e}")
        return jsonify({'error': f'Check failed: {e}'}), 500

if __name__ == '__main__':
    init_tiktoken_offline()
    host = os.environ.get('HOST', '0.0.0.0')        
    port = 5051

    enable_dev_reload = os.environ.get('ENABLE_DEV_RELOAD') == '1'
    if enable_dev_reload:
        app.run(debug=True, host=host, port=port)
    else:
        try:
            from waitress import serve
            serve(app, host=host, port=port)
        except ImportError:
            logger.warning('waitress not installed; falling back to Flask built-in server')
            app.run(debug=False, host=host, port=port, use_reloader=False, threaded=True)
