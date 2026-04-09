import os
from functools import lru_cache
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from huggingface_hub import InferenceClient


load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")


MODEL_ID = os.getenv("HF_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
HF_TOKEN = os.getenv("HF_TOKEN")


def _normalize_embedding(result):
    if hasattr(result, "tolist"):
        result = result.tolist()

    if isinstance(result, list) and result:
        first = result[0]
        if isinstance(first, list):
            return result
        if isinstance(first, (int, float)):
            return result

    raise RuntimeError(f"Unexpected Hugging Face embedding format: {result}")


class Embedder:
    def __init__(self, model_id: str = MODEL_ID):
        self.model_id = model_id
        self.client = InferenceClient(api_key=HF_TOKEN, timeout=30)

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        if not HF_TOKEN:
            raise RuntimeError("HF_TOKEN is not set. Configure it in your environment.")

        if not texts:
            return np.empty((0, 0), dtype=np.float32)

        results = []
        for text in texts:
            result = self.client.feature_extraction(text, model=self.model_id)
            results.append(_normalize_embedding(result))

        return np.array(results, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        query_embedding = self.embed_texts([query])
        return query_embedding


@lru_cache(maxsize=1)
def get_embedder(model_id: str = MODEL_ID) -> Embedder:
    return Embedder(model_id=model_id)

