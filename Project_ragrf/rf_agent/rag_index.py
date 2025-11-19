"""Lightweight in-process RAG style index for Robot Framework & Python helper reuse.

Goals:
- Encourage LLM to REUSE existing user keywords / functions instead of re‑creating them
- Zero external dependencies (pure Python, fast build)
- Small scoring heuristic (TF‑IDF like) over names + bodies

Data model:
    Document: {
        'id': str,                # unique
        'type': 'robot_keyword' | 'python_function' | 'variable',
        'name': str,
        'file': str,
        'text': str,              # body / definition / surrounding lines
        'tokens': set[str],       # normalized tokens
        'tf': dict[token,int],
    }
    Index: {
        'documents': list[Document],
        'inverted': dict[token, set[doc_id]],
        'df': dict[token,int],
        'N': int
    }

Public functions:
    build_rag_index(file_index: dict) -> dict
    retrieve_rag_snippets(description: str, steps: list[str], top_k: int = 12) -> list[dict]
    get_rag_index() -> dict | None
    set_rag_index(idx: dict) -> None

Limitations / Non‑goals:
- Not a semantic embedder – purely lexical (fast, offline)
- No persistence yet (rebuilt on process start / file changes)
"""
from __future__ import annotations
import os
import re
import math
from typing import Dict, List, Set, Iterable, Optional

_RAG_INDEX: Optional[Dict] = None
_TOKEN_RE = re.compile(r"[A-Za-z0-9_]+")

# --- token helpers -----------------------------------------------------------

def _tokenize(text: str) -> List[str]:
    if not text:
        return []
    return [t.lower() for t in _TOKEN_RE.findall(text)]

# --- index build -------------------------------------------------------------

def build_rag_index(file_index: Dict[str, Dict]) -> Dict:
    """Build RAG index from current `_file_index` structure.

    We open each .robot & .py file referenced in the file_index and extract:
      - Robot user keywords (names + implementation blocks)
      - Python function definitions (signature + docstring first paragraph)
      - Robot scalar variables (treated lower priority)
    """
    documents = []
    inverted: Dict[str, Set[str]] = {}
    df: Dict[str,int] = {}

    def _add_doc(doc: Dict):
        documents.append(doc)
        seen_tok: Set[str] = set()
        for tok in doc['tokens']:
            inverted.setdefault(tok, set()).add(doc['id'])
            if tok not in seen_tok:
                df[tok] = df.get(tok, 0) + 1
                seen_tok.add(tok)

    for fname, meta in list(file_index.items()):
        if not isinstance(meta, dict):
            continue
        path = meta.get('path')
        if not path or not os.path.isfile(path):
            continue
        if not (fname.endswith('.robot') or fname.endswith('.py')):
            continue
        try:
            with open(path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception:
            continue

        # Robot parsing (simple heuristic)
        if fname.endswith('.robot'):
            lines = content.splitlines()
            current_kw_name = None
            current_kw_lines: List[str] = []
            in_keywords_section = False
            for line in lines:
                stripped = line.strip()
                if stripped.startswith('*** ') and stripped.endswith(' ***'):
                    in_keywords_section = stripped.lower() == '*** keywords ***'
                    # flush ongoing keyword if section changes
                    if current_kw_name and current_kw_lines:
                        body = '\n'.join(current_kw_lines).strip()
                        toks = _tokenize(current_kw_name + ' ' + body)
                        _add_doc({
                            'id': f"{fname}::kw::{current_kw_name}",
                            'type': 'robot_keyword',
                            'name': current_kw_name,
                            'file': fname,
                            'text': body[:1200],
                            'tokens': set(toks),
                            'tf': {t: toks.count(t) for t in set(toks)}
                        })
                        current_kw_name = None
                        current_kw_lines = []
                    continue
                if not in_keywords_section:
                    # capture variable declarations for reuse referencing
                    if stripped.startswith('${') and '}' in stripped and '=' in stripped:
                        var_name = stripped.split('}')[0][2:].strip()
                        # store only name; body not needed
                        toks = _tokenize(var_name)
                        if toks:
                            _add_doc({
                                'id': f"{fname}::var::{var_name}",
                                'type': 'variable',
                                'name': var_name,
                                'file': fname,
                                'text': stripped[:300],
                                'tokens': set(toks),
                                'tf': {t: toks.count(t) for t in set(toks)}
                            })
                    continue
                # inside keywords section
                if stripped and not line.startswith((' ', '\t')):  # new keyword header
                    if current_kw_name and current_kw_lines:
                        body = '\n'.join(current_kw_lines).strip()
                        toks = _tokenize(current_kw_name + ' ' + body)
                        _add_doc({
                            'id': f"{fname}::kw::{current_kw_name}",
                            'type': 'robot_keyword',
                            'name': current_kw_name,
                            'file': fname,
                            'text': body[:1200],
                            'tokens': set(toks),
                            'tf': {t: toks.count(t) for t in set(toks)}
                        })
                    current_kw_name = stripped
                    current_kw_lines = []
                else:
                    if current_kw_name is not None:
                        current_kw_lines.append(line)
            # flush last keyword
            if current_kw_name and current_kw_lines:
                body = '\n'.join(current_kw_lines).strip()
                toks = _tokenize(current_kw_name + ' ' + body)
                _add_doc({
                    'id': f"{fname}::kw::{current_kw_name}",
                    'type': 'robot_keyword',
                    'name': current_kw_name,
                    'file': fname,
                    'text': body[:1200],
                    'tokens': set(toks),
                    'tf': {t: toks.count(t) for t in set(toks)}
                })
        else:  # Python file
            py_func_re = re.compile(r"^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(.*?\):")
            current_func = None
            current_lines: List[str] = []
            for line in content.splitlines():
                m = py_func_re.match(line.strip())
                if m:
                    if current_func and current_lines:
                        body = '\n'.join(current_lines).strip()
                        toks = _tokenize(current_func + ' ' + body[:400])
                        _add_doc({
                            'id': f"{fname}::fn::{current_func}",
                            'type': 'python_function',
                            'name': current_func,
                            'file': fname,
                            'text': body[:800],
                            'tokens': set(toks),
                            'tf': {t: toks.count(t) for t in set(toks)}
                        })
                    current_func = m.group(1)
                    current_lines = [line]
                else:
                    if current_func is not None:
                        if line.startswith(('def ', 'class ')):
                            # treat as new definition start without match (def/class on same indent) flush
                            pass
                        current_lines.append(line)
            if current_func and current_lines:
                body = '\n'.join(current_lines).strip()
                toks = _tokenize(current_func + ' ' + body[:400])
                _add_doc({
                    'id': f"{fname}::fn::{current_func}",
                    'type': 'python_function',
                    'name': current_func,
                    'file': fname,
                    'text': body[:800],
                    'tokens': set(toks),
                    'tf': {t: toks.count(t) for t in set(toks)}
                })

    idx = {
        'documents': documents,
        'inverted': inverted,
        'df': df,
        'N': len(documents)
    }
    global _RAG_INDEX
    _RAG_INDEX = idx
    return idx

# --- retrieval ----------------------------------------------------------------

def retrieve_rag_snippets(description: str, steps: Iterable[str], top_k: int = 12) -> List[Dict]:
    idx = _RAG_INDEX
    if not idx:
        return []
    corpus_N = idx['N'] or 1
    query_text = description or ''
    for s in steps or []:
        if isinstance(s, dict):
            # support test case row structure (may have test_step key)
            query_text += ' ' + (s.get('test_step') or s.get('step') or '')
        else:
            query_text += ' ' + str(s)
    q_tokens = _tokenize(query_text)
    if not q_tokens:
        return []
    q_tf = {t: q_tokens.count(t) for t in set(q_tokens)}

    scores = []
    for doc in idx['documents']:
        # compute weighted overlap (TF-IDF style cosine numerator only)
        shared = set(doc['tokens']) & set(q_tf.keys())
        if not shared:
            continue
        score = 0.0
        for tok in shared:
            df = idx['df'].get(tok, 1)
            idf = math.log(1 + corpus_N / (1 + df))
            score += (doc['tf'].get(tok, 1) * q_tf.get(tok, 1)) * idf
        # mild type preference
        if doc['type'] == 'robot_keyword':
            score *= 1.2
        elif doc['type'] == 'python_function':
            score *= 1.1
        scores.append((score, doc))

    scores.sort(key=lambda x: x[0], reverse=True)
    results = []
    for score, doc in scores[:top_k]:
        results.append({
            'name': doc['name'],
            'file': doc['file'],
            'type': doc['type'],
            'score': round(score, 4),
            'snippet': doc['text'][:400]
        })
    return results

# --- accessors -----------------------------------------------------------------

def get_rag_index() -> Optional[Dict]:
    return _RAG_INDEX

def set_rag_index(idx: Dict) -> None:
    global _RAG_INDEX
    _RAG_INDEX = idx
