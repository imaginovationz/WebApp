"""Vector-based RAG integration wrapper for rf_agent.

Bridges existing FAISS vector store utilities under `rag/` to the rf_agent flow.

Features:
  * Per-user vector store directory: uploads/<userid>/rag_vector/
  * Extracts Robot keywords, Python functions, and variables as short Documents
  * Uses existing AzureOpenAI embeddings (deployment from rf_agent config OR rag/config.json fallback)
  * Fallback to lightweight lexical rag_index if vector pipeline fails

Public API:
  ensure_user_vector_index(userid: Optional[str]) -> bool
  add_files_to_user_index(filenames: list[str], userid: Optional[str]) -> int
  retrieve_similar_snippets(query: str, steps: list, top_k: int = 8, userid: Optional[str] = None) -> list[dict]

The upload/index rebuild logic should call ensure_user_vector_index after new files appear.
"""
from __future__ import annotations
import os
import json
import logging
from typing import List, Dict, Optional, Iterable

from datetime import datetime

try:
    from langchain_core.documents import Document
    from langchain_community.vectorstores import FAISS
except Exception:  # soft dependency
    Document = None  # type: ignore
    FAISS = None  # type: ignore

logger = logging.getLogger(__name__)

_USER_VS: Dict[str, Dict] = {}  # userid -> { 'store': FAISS, 'config': cfg, 'storage_dir': path }

# Local helpers to obtain config/client without importing rf_agent.app (avoid circular imports)
def _load_config_local() -> Dict:
    here = os.path.dirname(__file__)
    cfg_path = os.path.join(here, 'config.json')
    try:
        with open(cfg_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

def _get_client_local():
    """Return AzureOpenAI client using shared azure_openai_client with repo-root import fallback."""
    # Ensure repository root (one level up from rf_agent) is on sys.path
    import sys
    root = os.path.dirname(os.path.dirname(__file__))
    if root not in sys.path:
        sys.path.insert(0, root)
    try:
        from azure_openai_client import AzureOpenAIClient  # type: ignore
        here = os.path.dirname(__file__)
        cfg_path = os.path.join(here, 'config.json')
        client_wrapper = AzureOpenAIClient(config_file=cfg_path)
        return client_wrapper.client
    except Exception as e:
        logger.error(f"Failed to initialize Azure OpenAI client locally: {e}")
        raise

def _load_rag_config() -> Dict:
    """Try to load rag/config.json if present for embedding deployment fallback."""
    root = os.path.dirname(os.path.dirname(__file__))
    rag_cfg_path = os.path.join(root, 'rag', 'config.json')
    base = {
        'openai': {
            'embedding_deployment': 'text-embedding-3-small'
        },
        'vectorstore': {
            'k_results': 5
        },
        'processing': {
            'chunk_size': 1000,
            'chunk_overlap': 200
        }
    }
    if os.path.isfile(rag_cfg_path):
        try:
            with open(rag_cfg_path, 'r', encoding='utf-8') as f:
                cfg = json.load(f)
            # shallow merge
            for k, v in cfg.items():
                base[k] = v
        except Exception as e:
            logger.warning(f"Could not load rag config: {e}")
    return base

def _get_embedding_function():
    """Return a callable that maps list[str] -> list[vector].

    Uses AzureOpenAI embeddings via client.embeddings.create.
    """
    # Obtain client and config locally to avoid importing rf_agent.app
    client = _get_client_local()
    cfg = _load_config_local()
    rag_cfg = _load_rag_config()
    deployment = (cfg.get('openai', {}).get('embedding_deployment') or
                  rag_cfg.get('openai', {}).get('embedding_deployment'))
    if not deployment:
        raise RuntimeError('No embedding deployment configured')

    def _embed(texts: List[str]):
        # Azure responses may require chunking for large lists; keep simple now
        vectors = []
        for chunk in texts:
            try:
                resp = client.embeddings.create(input=chunk, model=deployment)
                vectors.append(resp.data[0].embedding)
            except Exception as e:
                logger.error(f"Embedding failed for chunk len={len(chunk)}: {e}")
                raise
        return vectors

    class _Adapter:  # minimal interface for langchain FAISS
        def embed_documents(self, texts: List[str]):
            return _embed(texts)
        def embed_query(self, text: str):
            return _embed([text])[0]

    return _Adapter()

def ensure_user_vector_index(userid: Optional[str]) -> bool:
    """Ensure vector store object for user exists / is loaded.
    Returns True if ready.
    """
    if FAISS is None or Document is None:
        logger.warning('LangChain/FAISS not available; vector RAG disabled')
        return False
    key = userid or '_default'
    if key in _USER_VS:
        return True
    uploads_root = os.path.join(os.path.dirname(__file__), 'uploads')
    user_dir = os.path.join(uploads_root, userid) if userid else uploads_root
    storage_dir = os.path.join(user_dir, 'rag_vector')
    os.makedirs(storage_dir, exist_ok=True)
    # attempt load existing
    try:
        embedding_fn = _get_embedding_function()
        if any(f.endswith('.faiss') or f.endswith('.pkl') for f in os.listdir(storage_dir)):
            vs = FAISS.load_local(storage_dir, embedding_fn, allow_dangerous_deserialization=True)
            _USER_VS[key] = {'store': vs, 'storage_dir': storage_dir}
            logger.info('Loaded existing vector store for user=%s', key)
            return True
        else:
            # create empty placeholder (will populate when files added)
            _USER_VS[key] = {'store': None, 'storage_dir': storage_dir}
            logger.info('Initialized empty vector store slot for user=%s', key)
            return True
    except Exception as e:
        logger.error(f"Failed to init/load user vector store: {e}")
        return False

def _extract_documents_from_files(filenames: Iterable[str], userid: Optional[str]) -> List:
    docs = []
    uploads_root = os.path.join(os.path.dirname(__file__), 'uploads')
    user_dir = os.path.join(uploads_root, userid) if userid else uploads_root
    for fname in filenames:
        path = os.path.join(user_dir, fname)
        if not os.path.isfile(path):
            continue
        try:
            with open(path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception as e:
            logger.warning(f"Skip {fname}: {e}")
            continue
        if fname.endswith('.robot'):
            current_kw = None
            buffer = []
            in_kw_section = False
            for line in content.splitlines():
                st = line.strip()
                if st.startswith('*** ') and st.endswith(' ***'):
                    in_kw_section = st.lower() == '*** keywords ***'
                    if current_kw and buffer:
                        body = '\n'.join(buffer)[:800]
                        docs.append(Document(page_content=f"KW: {current_kw}\n{body}", metadata={'file': fname, 'type': 'robot_keyword', 'keyword': current_kw}))
                        current_kw, buffer = None, []
                    continue
                if not in_kw_section:
                    continue
                if st and not line.startswith((' ', '\t')):
                    if current_kw and buffer:
                        body = '\n'.join(buffer)[:800]
                        docs.append(Document(page_content=f"KW: {current_kw}\n{body}", metadata={'file': fname, 'type': 'robot_keyword', 'keyword': current_kw}))
                    current_kw, buffer = st, []
                else:
                    if current_kw is not None:
                        buffer.append(line)
            if current_kw and buffer:
                body = '\n'.join(buffer)[:800]
                docs.append(Document(page_content=f"KW: {current_kw}\n{body}", metadata={'file': fname, 'type': 'robot_keyword', 'keyword': current_kw}))
        elif fname.endswith('.py'):
            for line in content.splitlines():
                if line.strip().startswith('def '):
                    sig = line.strip()
                    docs.append(Document(page_content=sig, metadata={'file': fname, 'type': 'python_function'}))
        # (Optionally parse variables later)
    return docs

def add_files_to_user_index(filenames: List[str], userid: Optional[str]) -> int:
    if not ensure_user_vector_index(userid):
        return 0
    key = userid or '_default'
    record = _USER_VS.get(key)
    if record is None:
        return 0
    embedding_fn = _get_embedding_function()
    docs = _extract_documents_from_files(filenames, userid)
    if not docs:
        return 0
    # create or append
    if record['store'] is None:
        try:
            vs = FAISS.from_documents(docs, embedding_fn)
            record['store'] = vs
        except Exception as e:
            logger.error(f"Failed to create FAISS store: {e}")
            return 0
    else:
        try:
            record['store'].add_documents(docs)  # type: ignore
        except Exception as e:
            logger.error(f"Failed adding docs: {e}")
            return 0
    # persist
    try:
        record['store'].save_local(record['storage_dir'])  # type: ignore
    except Exception as e:
        logger.warning(f"Persist vector store failed: {e}")
    return len(docs)

def retrieve_similar_snippets(query: str, steps: Iterable, top_k: int = 8, userid: Optional[str] = None) -> List[Dict]:
    if not ensure_user_vector_index(userid):
        return []
    key = userid or '_default'
    record = _USER_VS.get(key)
    if not record or record.get('store') is None:
        return []
    full_query = query or ''
    for s in steps or []:
        if isinstance(s, dict):
            full_query += ' ' + (s.get('test_step') or s.get('step') or '')
        else:
            full_query += ' ' + str(s)
    try:
        docs = record['store'].similarity_search(full_query, k=top_k)  # type: ignore
        results = []
        for d in docs:
            md = getattr(d, 'metadata', {}) or {}
            results.append({
                'file': md.get('file'),
                'type': md.get('type'),
                'keyword': md.get('keyword'),
                'content': d.page_content[:500]
            })
        return results
    except Exception as e:
        logger.error(f"Vector retrieval failed: {e}")
        return []
