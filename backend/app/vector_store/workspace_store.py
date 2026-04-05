from pathlib import Path
import re

from app.vector_store.chroma_store import ChromaStore
from app.vector_store.faiss_index import FaissIndex

VECTOR_DIM = 384
VECTOR_STORE_ROOT = Path("data/vector_store/workspaces")

_faiss_cache: dict[str, FaissIndex] = {}
_chroma_cache: dict[str, ChromaStore] = {}


def normalize_folder_id(folder_id: str | None) -> str:
    raw = (folder_id or "default").strip().lower()
    safe = re.sub(r"[^a-z0-9_-]+", "-", raw)
    safe = re.sub(r"-+", "-", safe).strip("-")
    return safe or "default"


def get_workspace_faiss_index(folder_id: str | None) -> FaissIndex:
    normalized = normalize_folder_id(folder_id)
    if normalized in _faiss_cache:
        return _faiss_cache[normalized]

    storage_dir = VECTOR_STORE_ROOT / normalized
    index = FaissIndex(dim=VECTOR_DIM, storage_dir=storage_dir)
    _faiss_cache[normalized] = index
    return index


def get_workspace_chroma_store(folder_id: str | None) -> ChromaStore:
    normalized = normalize_folder_id(folder_id)
    if normalized in _chroma_cache:
        return _chroma_cache[normalized]

    collection_name = f"documents_{normalized}"
    store = ChromaStore(collection_name=collection_name)
    _chroma_cache[normalized] = store
    return store
