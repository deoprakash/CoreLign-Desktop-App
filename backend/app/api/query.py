import re
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db import get_model_usage_events_collection, get_user_model_usage_collection
from app.embeddings.embedder import Embedder
from app.vector_store.workspace_store import (
    get_workspace_chroma_store,
    get_workspace_faiss_index,
    normalize_folder_id,
)
from app.retrieval.search import hybrid_retrieve
from app.llm.groq_llm import GroqLLM
from app.session import get_active_session
from app.utils.metrics import metrics

router = APIRouter()
embedder = Embedder()
llm = GroqLLM()


def _chunk_sort_key(chunk_id: str):
    # chunk_id format: <uuid>_<index>
    match = re.search(r"_(\d+)$", chunk_id or "")
    if not match:
        return (1, chunk_id or "")
    return (0, int(match.group(1)))


class QueryRequest(BaseModel):
    query: str
    top_k: int = 7
    folder_id: str = "default"
    generation: dict | None = None


@router.post("/query")
async def query_documents(request: QueryRequest, session_doc=Depends(get_active_session)):
    query = request.query
    if not query:
        return {"error": "Query text is required."}

    top_k = request.top_k
    folder_id = normalize_folder_id(request.folder_id)
    faiss_index = get_workspace_faiss_index(folder_id)
    chroma_store = get_workspace_chroma_store(folder_id)

    if not faiss_index.has_vectors:
        faiss_index.load_from_disk()

    total_chunks = chroma_store.collection.count()
    if total_chunks == 0:
        return {"error": f"No indexed chunks found for folder '{folder_id}'. Upload documents first."}

    print(f"DEBUG: FAISS index has {faiss_index.index.ntotal} vectors, {len(faiss_index.chunk_ids)} chunk_ids")
    print(f"DEBUG: Chroma has {total_chunks} chunks")
    print(f"DEBUG: First 5 chunk_ids in FAISS: {faiss_index.chunk_ids[:5]}")

    # Start overall timer
    t_start = time.perf_counter()

    # 1️⃣ Hybrid retrieval (FAISS dense + BM25 sparse)
    t_retr_start = time.perf_counter()
    rows = hybrid_retrieve(
        query=query,
        faiss_index=faiss_index,
        chroma_store=chroma_store,
        embedder=embedder,
        top_k=top_k,
        dense_k=max(20, top_k * 3),
        sparse_k=max(20, top_k * 3),
    )
    print(f"DEBUG: Hybrid retrieval returned {len(rows)} chunks")

    if not rows:
        return {
            "query": query,
            "answer": "I don't have enough information in the provided context to answer that.",
            "sources": [],
            "chunks": [],
            "confidence": 0.0,
            "semantic_similarity": 0.0,
        }

    t_retr_end = time.perf_counter()
    retrieval_time = t_retr_end - t_retr_start

    context = "The following information is extracted from a document:\n\n"

    for i, row in enumerate(rows):
        doc = row.get("text", "")
        meta = row.get("meta", {})
        section_label = meta.get("section", f"Section {i+1}") if isinstance(meta, dict) else f"Section {i+1}"
        context += f"{section_label}:\n{doc}\n\n"

    # Confidence and semantic similarity are derived from available dense scores.
    dense_scores = [row.get("dense_score") for row in rows if row.get("dense_score") is not None]
    confidence = 0.0
    semantic_similarity = 0.0
    if dense_scores:
        avg_similarity = sum(dense_scores) / len(dense_scores)
        top_similarity = max(dense_scores)
        confidence = round(max(0.0, min(1.0, avg_similarity)), 3)
        semantic_similarity = round(max(0.0, min(1.0, top_similarity)), 3)

    # Ask Groq
    resolved_generation = llm.resolve_generation_config(question=query, generation=request.generation)
    t_gen_start = time.perf_counter()
    answer = llm.generate_answer(
        context=context,
        question=query,
        generation=request.generation,
    )
    t_gen_end = time.perf_counter()
    generation_time = t_gen_end - t_gen_start

    # Total response time
    response_time = time.perf_counter() - t_start

    # Record metrics (non-blocking minimal overhead)
    try:
        metrics.record(
            query=query,
            top_k=top_k,
            response_time=response_time,
            retrieval_time=retrieval_time,
            generation_time=generation_time,
        )
    except Exception as e:
        print(f"DEBUG: Failed to write metrics: {e}")

    # Persist model usage analytics (global + per-user aggregates).
    try:
        now = datetime.now(timezone.utc)
        user_id = session_doc.get('user_id')
        session_id = session_doc.get('session_id')
        model_name = resolved_generation.get('model')

        events = get_model_usage_events_collection()
        events.insert_one(
            {
                'timestamp': now,
                'user_id': user_id,
                'session_id': session_id,
                'model': model_name,
                'mode': resolved_generation.get('mode'),
                'temperature': resolved_generation.get('temperature'),
                'max_tokens': resolved_generation.get('max_tokens'),
                'query': query,
                'folder_id': folder_id,
                'retrieval_top_k': top_k,
            }
        )

        user_model_usage = get_user_model_usage_collection()
        user_model_usage.update_one(
            {'user_id': user_id, 'model': model_name},
            {
                '$inc': {'query_count': 1},
                '$set': {'updated_at': now},
                '$setOnInsert': {'created_at': now},
            },
            upsert=True,
        )
    except Exception as e:
        print(f"DEBUG: Failed to store model usage analytics: {e}")
    # Include the retrieved chunk texts and metadata in the response so the
    # frontend can surface the original chunks for each answer.
    chunks = [
        {
            "id": row.get("id"),
            "text": row.get("text"),
            "meta": row.get("meta", {}),
            "score": row.get("hybrid_score"),
            "dense_score": row.get("dense_score"),
            "sparse_score": row.get("sparse_score"),
        }
        for row in rows
    ]

    sources = [
        {
            "id": row.get("id"),
            "metadata": row.get("meta", {}),
            "score": row.get("hybrid_score"),
            "dense_score": row.get("dense_score"),
            "sparse_score": row.get("sparse_score"),
        }
        for row in rows
    ]

    return {
        "query": query,
        "folder_id": folder_id,
        "answer": answer,
        "sources": sources,
        "chunks": chunks,
        "confidence": confidence,
        "semantic_similarity": semantic_similarity,
        "model_used": resolved_generation.get('model'),
        "generation_mode": resolved_generation.get('mode'),
    }
