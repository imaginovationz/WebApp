import os
import sys
import json
import logging
import tempfile
import pandas as pd
import ssl
import urllib3
import warnings
import requests
from datetime import datetime
from azure.identity import ClientSecretCredential
from azure.core.pipeline.transport import RequestsTransport
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
# Ensure tiktoken uses offline cache before any LangChain/tiktoken usage
try:
    _enc_cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "encoding_cache")
    os.makedirs(_enc_cache_dir, exist_ok=True)
    # Only set if not already defined by environment
    os.environ.setdefault('TIKTOKEN_CACHE_DIR', _enc_cache_dir)
except Exception:
    pass

from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
# Ensure the current directory is in the path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import our services directly
from services.test_case_extractor import TestCaseExtractor
from services.test_case_generator import TestCaseGenerator
from services.vector_store import VectorStoreService
from models.test_case import TestCase
from utils.tiktoken_utils import configure_tiktoken_offline

class RAGTestCaseGenerator:
    """Service for generating test cases using RAG (Retrieval-Augmented Generation)"""
    
    def __init__(self, config_path=None):
        """Initialize with configuration"""
        self.config = self._load_config(config_path)
        self.embeddings = None
        self.llm = None
        self.vector_store = None
        self.logger = logging.getLogger(__name__)
        self._azure_credential = None
        
        # Configure SSL settings
        self._configure_ssl()

        # Ensure tiktoken works offline (use local encoding_cache)
        try:
            if not configure_tiktoken_offline():
                self.logger.warning("tiktoken offline cache missing expected files; proceeding but network access may be attempted by tokenizers.")
        except Exception:
            # Do not block initialization if helper fails
            pass
        
        # Create directories if they don't exist
        for dir_path in [
            self.config["paths"]["input_directory"],
            self.config["paths"]["output_directory"],
            self.config["paths"]["temp_directory"],
            self.config["vectorstore"]["storage_dir"]
        ]:
            os.makedirs(dir_path, exist_ok=True)
        
        self._initialize_embeddings()
        self._initialize_llm()
        
        # Initialize services
        self.test_case_extractor = TestCaseExtractor()
        self.vector_store_service = VectorStoreService(self.embeddings, self.config)
        
    def _load_config(self, config_path=None):
        """Load configuration from file or use default"""
        default_config = {
            "openai": {
                "api_type": "azure",
                "api_base": "https://9747-dcane.openai.azure.com/",
                "api_version": "2025-01-01-preview",
                "embedding_deployment": "text-embedding-3-small",
                "llm_deployment": "gpt-4.1",
                "temperature": 0
            },
            "azure_credentials": {
                "client_id": "",
                "tenant_id": "",
                "client_secret": ""
            },
            "security": {
                "verify_ssl": False,
                "ca_bundle": None
            },
            "vectorstore": {
                "type": "faiss",
                "k_results": 5,
                "similarity_threshold": 0.8,
                "storage_dir": "vector_storage"
            },
            "document": {
                "supported_formats": [".docx", ".pdf", ".xlsx", ".xlsm", ".txt"],
                "output_format": "xlsx",
                "preserve_formatting": True
            },
            "processing": {
                "chunk_size": 1000,
                "chunk_overlap": 200,
                "max_tokens": 4000
            },
            "paths": {
                "input_directory": "docs",
                "output_directory": "output",
                "temp_directory": "temp"
            },
            "logging": {
                "level": "INFO",
                "file": "rag.log",
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            }
        }
        
        # If no config path provided, try local config.json
        if not config_path:
            config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
            
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    loaded_config = json.load(f)
                    # Merge loaded config with default config
                    for key, value in loaded_config.items():
                        if key in default_config and isinstance(value, dict):
                            default_config[key].update(value)
                        else:
                            default_config[key] = value
            except Exception as e:
                print(f"Error loading config: {str(e)}")
        else:
            print(f"Config file not found at: {config_path}, using defaults")
        
        return default_config
    
    def _configure_ssl(self):
        """Configure SSL settings based on configuration"""
        security_cfg = self.config.get("security", {})
        verify_ssl = security_cfg.get("verify_ssl", False)
        ca_bundle = security_cfg.get("ca_bundle")
        
        if not verify_ssl:
            self.logger.info("Disabling SSL verification for Azure authentication")
            
            # Disable SSL warnings
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            warnings.filterwarnings('ignore', message='Unverified HTTPS request')
            
            # Set environment variables to disable SSL verification - critical for Azure
            os.environ['PYTHONHTTPSVERIFY'] = '0'
            os.environ['REQUESTS_CA_BUNDLE'] = ''
            os.environ['CURL_CA_BUNDLE'] = ''
            os.environ['SSL_CERT_VERIFY'] = '0'
            
            # Configure SSL context to not verify certificates
            if hasattr(ssl, '_create_unverified_context'):
                ssl._create_default_https_context = ssl._create_unverified_context
                
            # Set tiktoken cache directory to avoid permission issues
            tiktoken_cache_dir = os.path.join(os.path.dirname(__file__), "encoding_cache")
            os.makedirs(tiktoken_cache_dir, exist_ok=True)
            os.environ['TIKTOKEN_CACHE_DIR'] = str(tiktoken_cache_dir)
            
            self.logger.info("SSL verification completely disabled for all connections")
            
            # Set tiktoken cache directory
            os.environ['TIKTOKEN_CACHE_DIR'] = str(os.path.join(os.path.dirname(__file__), "encoding_cache"))
            
            self.logger.info("SSL verification disabled - using insecure connections")
        else:
            # If a custom CA bundle is provided, wire it for requests/httpx
            if ca_bundle and os.path.exists(ca_bundle):
                os.environ['REQUESTS_CA_BUNDLE'] = ca_bundle
                os.environ['CURL_CA_BUNDLE'] = ca_bundle
                os.environ['SSL_CERT_FILE'] = ca_bundle
                self.logger.info(f"SSL verification enabled with custom CA bundle: {ca_bundle}")
            else:
                self.logger.info("SSL verification enabled (system CA store)")
    
    def _get_azure_credential(self):
        """Get or create Azure credential using client credentials"""
        if self._azure_credential is None:
            azure_creds = self.config.get("azure_credentials", {})
            
            # Debug: Log what we're getting from config
            self.logger.info(f"Azure credentials from config: {azure_creds}")
            
            client_id = azure_creds.get('client_id', '').strip()
            tenant_id = azure_creds.get('tenant_id', '').strip()
            client_secret = azure_creds.get('client_secret', '').strip()
            
            # Debug: Log individual values (without secret)
            self.logger.info(f"Client ID: {client_id[:10]}..." if client_id else "Client ID: EMPTY")
            self.logger.info(f"Tenant ID: {tenant_id[:10]}..." if tenant_id else "Tenant ID: EMPTY")
            self.logger.info(f"Client Secret: {'***PROVIDED***' if client_secret else 'EMPTY'}")
            
            if not all([client_id, tenant_id, client_secret]):
                # Raise error if Azure credentials are not provided
                raise ValueError("Azure credentials (client_id, tenant_id, client_secret) must be provided in configuration")
            
            try:
                # Build a transport that matches our SSL config
                security_cfg = self.config.get("security", {})
                verify_ssl = security_cfg.get("verify_ssl", True)
                ca_bundle = security_cfg.get("ca_bundle")

                transport: RequestsTransport | None = None
                if not verify_ssl:
                    # Fully disable verification
                    transport = RequestsTransport(connection_verify=False)
                    self.logger.info("Using Azure RequestsTransport with connection_verify=False")
                elif ca_bundle and os.path.exists(ca_bundle):
                    # Use organization CA bundle
                    transport = RequestsTransport(connection_verify=ca_bundle)
                    self.logger.info(f"Using Azure RequestsTransport with custom CA bundle: {ca_bundle}")

                # Create Azure credential (inject custom transport when set)
                self._azure_credential = ClientSecretCredential(
                    tenant_id=tenant_id,
                    client_id=client_id,
                    client_secret=client_secret,
                    additionally_allowed_tenants=["*"],
                    transport=transport
                )

                self.logger.info("Azure credential created successfully")
            except Exception as e:
                self.logger.error(f"Failed to create Azure credential: {str(e)}")
                raise
                
        return self._azure_credential
    
    def _get_azure_token(self):
        """Get Azure AD access token"""
        try:
            credential = self._get_azure_credential()
            self.logger.info("Getting Azure AD token...")
            token = credential.get_token("https://cognitiveservices.azure.com/.default")
            self.logger.info("Azure AD token obtained successfully")
            return token.token
        except Exception as e:
            self.logger.error(f"Failed to get Azure token: {str(e)}")
            raise ValueError(f"Failed to get Azure token: {str(e)}")
    
    def _initialize_embeddings(self):
        """Initialize the embeddings model"""
        try:
            token = self._get_azure_token()
            
            if not token:
                raise ValueError("Failed to obtain Azure AD token. Please check your Azure credentials.")
            
            # Use Azure AD authentication with specific embedding API version
            embedding_api_version = self.config["openai"].get("embedding_api_version", self.config["openai"]["api_version"])
            self.embeddings = AzureOpenAIEmbeddings(
                azure_endpoint=self.config["openai"]["api_base"],
                api_version=embedding_api_version,
                azure_deployment=self.config["openai"]["embedding_deployment"],
                azure_ad_token=token,
                model=self.config["openai"]["embedding_deployment"]
            )
                
        except Exception as e:
            self.logger.error(f"Error initializing embeddings: {str(e)}")
            raise
    
    def _initialize_llm(self):
        """Initialize the language model"""
        try:
            token = self._get_azure_token()
            
            if not token:
                raise ValueError("Failed to obtain Azure AD token. Please check your Azure credentials.")
            
            # Use Azure AD authentication
            self.llm = AzureChatOpenAI(
                azure_endpoint=self.config["openai"]["api_base"],
                api_version=self.config["openai"]["api_version"],
                azure_deployment=self.config["openai"]["llm_deployment"],
                azure_ad_token=token,
                model=self.config["openai"]["llm_deployment"],
                temperature=self.config["openai"]["temperature"]
            )
                
        except Exception as e:
            self.logger.error(f"Error initializing LLM: {str(e)}")
            raise
    
    def load_document(self, file_path):
        """Load a document from file path"""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_ext == ".pdf":
                loader = PyPDFLoader(file_path)
                return loader.load()
            elif file_ext in [".docx", ".doc"]:
                loader = Docx2txtLoader(file_path)
                return loader.load()
            elif file_ext in [".xlsx", ".xls", ".xlsm"]:
                return self._load_excel_as_documents(file_path)
            elif file_ext == ".txt":
                loader = TextLoader(file_path)
                return loader.load()
            else:
                self.logger.error(f"Unsupported file format: {file_ext}")
                raise ValueError(f"Unsupported file format: {file_ext}")
        except Exception as e:
            self.logger.error(f"Error loading document: {str(e)}")
            raise

    def _load_excel_as_documents(self, file_path):
        """Load Excel content into a list of LangChain Documents using pandas (no unstructured dep)."""
        try:
            # Read all sheets
            sheets = pd.read_excel(file_path, sheet_name=None, dtype=str)
        except Exception as e:
            raise RuntimeError(f"Failed reading Excel file: {e}")

        documents = []
        for sheet_name, df in sheets.items():
            if df is None or df.empty:
                continue

            # Normalize: ensure string and replace NaN with empty string
            df = df.fillna("")

            for idx, row in df.iterrows():
                # Build a readable text block for the row
                parts = []
                for col, val in row.items():
                    val_str = str(val).strip()
                    if val_str:
                        parts.append(f"{col}: {val_str}")
                content = f"Sheet: {sheet_name}\nRow: {idx}\n" + "\n".join(parts)
                if parts:
                    documents.append(
                        Document(
                            page_content=content,
                            metadata={
                                "source": file_path,
                                "sheet": sheet_name,
                                "row_index": int(idx) if isinstance(idx, (int, float)) else str(idx),
                                "file_type": "excel",
                            },
                        )
                    )

        if not documents:
            # Fallback: at least return a single document noting empty content
            documents.append(
                Document(
                    page_content=f"Excel file {os.path.basename(file_path)} had no parsable content.",
                    metadata={"source": file_path, "file_type": "excel"},
                )
            )

        return documents
    
    def load_corpus(self, file_path, file_info=None):
        """Load test case corpus from file"""
        try:
            # Load the corpus document
            raw_documents = self.load_document(file_path)
            
            if not raw_documents:
                self.logger.error("No documents loaded from corpus")
                return []
            
            # Extract file info if not provided
            if not file_info:
                file_info = {
                    "filename": os.path.basename(file_path),
                    "file_size": os.path.getsize(file_path),
                    "file_type": os.path.splitext(file_path)[1].lower(),
                    "test_case_count": 0,
                    "description": f"Auto-uploaded from {os.path.basename(file_path)}",
                    "tags": []
                }
                
            # If Excel, also extract structured test cases
            if file_path.endswith((".xlsx", ".xls", ".xlsm")):
                test_cases = self.test_case_extractor.extract_from_excel(file_path)
                file_info["test_case_count"] = len(test_cases)
                
                # Convert test cases to documents
                for tc in test_cases:
                    steps_text = "\n".join([f"Step {step['step_num']}: {step['step_text']}" 
                                          for step in tc.steps])
                    expected_results = "\n".join([f"Result {i+1}: {result}" 
                                                for i, result in enumerate(tc.expected_results)])
                    
                    doc_content = f"""
                    TEST CASE ID: {tc.test_case_id}
                    DESCRIPTION: {tc.description}
                    
                    TEST STEPS:
                    {steps_text}
                    
                    EXPECTED RESULTS:
                    {expected_results}
                    
                    PRIORITY: {tc.priority}
                    COMPLEXITY: {tc.complexity}
                    TEST TYPE: {tc.test_type}
                    """
                    
                    raw_documents.append(Document(
                        page_content=doc_content,
                        metadata={
                            "source": file_path, 
                            "test_case_id": tc.test_case_id,
                            "upload_info": file_info
                        }
                    ))
            else:
                # For non-Excel files, estimate test case count based on content
                total_content = "\n".join([doc.page_content for doc in raw_documents])
                file_info["test_case_count"] = max(1, total_content.count("test case") + total_content.count("TEST CASE"))
            
            # Preserve absolute source path for downstream tracking (MySQL)
            file_info["source_path"] = file_path
            return raw_documents, file_info
                
        except Exception as e:
            self.logger.error(f"Error loading corpus: {str(e)}")
            raise
    
    def create_vector_store(self, documents, file_info=None):
        """Create a vector store from documents"""
        return self.vector_store_service.create_vector_store(documents, file_info)
    
    def add_to_vector_store(self, documents, file_info=None):
        """Add documents to existing vector store"""
        return self.vector_store_service.create_vector_store(documents, file_info)
    
    def search_test_cases(self, query, k=5):
        """Search test cases in vector store"""
        return self.vector_store_service.search_test_cases(query, k)
    
    def get_inventory(self):
        """Get test case inventory"""
        return self.vector_store_service.get_inventory()
    
    def search_inventory(self, query="", file_type="", tags=None):
        """Search inventory with filters"""
        return self.vector_store_service.search_inventory(query, file_type, tags)
    
    def get_vector_store_stats(self):
        """Get vector store statistics"""
        return self.vector_store_service.get_vector_store_stats()
    
    def delete_from_inventory(self, upload_id):
        """Delete upload from inventory"""
        return self.vector_store_service.delete_from_inventory(upload_id)
    
    def get_vector_store_stats(self):
        """Get vector store statistics"""
        return self.vector_store_service.get_vector_store_stats()
    
    def delete_from_inventory(self, upload_id):
        """Delete upload from inventory"""
        return self.vector_store_service.delete_from_inventory(upload_id)
    
    def load_vector_store(self):
        """Load vector store from disk"""
        return self.vector_store_service.load_vector_store()
    
    # These methods have been moved to TestCaseGenerator class
    # Keeping the service.py file cleaner by removing duplicated functionality
    
    def process_requirement_file(self, file_path, vector_reference='whole', specific_query='', selected_test_cases=None):
        """Process a requirement document file and generate test cases"""
        try:
            # Load document
            docs = self.load_document(file_path)
            
            if not docs:
                self.logger.error("No content loaded from requirement document")
                raise ValueError("Failed to extract content from requirement document")
            
            # Extract text from documents
            requirement_text = "\n\n".join([doc.page_content for doc in docs])
            
            # Initialize test case generator based on vector reference option
            if vector_reference == 'none':
                # Generate test cases without vector database reference
                test_case_generator = TestCaseGenerator(self.llm, None)
            else:
                # Get the retriever
                retriever = self.vector_store_service.get_retriever()
                
                if not retriever:
                    self.logger.error("Vector store retriever not available")
                    raise ValueError("Vector store not initialized, please upload corpus first")
                
                # Initialize test case generator with retriever
                test_case_generator = TestCaseGenerator(self.llm, retriever)
            
            # Generate test cases based on reference type
            if vector_reference == 'specific' and selected_test_cases:
                # Use specific test cases as context
                specific_context = "\n\n".join([tc.get('content', '') for tc in selected_test_cases])
                test_cases = test_case_generator.generate_test_cases_with_context(
                    requirement_text, 
                    specific_context
                )
            else:
                # Use default generation (whole database or no reference)
                test_cases = test_case_generator.generate_test_cases(requirement_text)
            
            if not test_cases:
                self.logger.error("No test cases generated")
                raise ValueError("Failed to generate test cases")
            
            # Export to Excel
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            ref_suffix = f"_{vector_reference}" if vector_reference != 'whole' else ""
            output_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), 
                '..', 
                'generated', 
                f"test_cases_{base_name}{ref_suffix}_{timestamp}.xlsx"
            )
            
            success = test_case_generator.export_to_excel(test_cases, output_path)
            
            if not success:
                raise ValueError("Failed to export test cases to Excel")
                
            return output_path
            
        except Exception as e:
            self.logger.error(f"Error processing requirement file: {str(e)}")
            raise
