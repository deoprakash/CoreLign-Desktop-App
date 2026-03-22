import re

from fastapi import APIRouter
from pydantic import BaseModel

from app.embeddings.embedder import Embedder
from app.vector_store.index_instance import faiss_index
from app.vector_store import chroma_store
from app.llm.groq_llm import GroqLLM
from app.utils.metrics import metrics
import time

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


@router.post("/query")
async def query_documents(request: QueryRequest):
    query = request.query
    if not query:
        return {"error": "Query text is required."}

    top_k = request.top_k

    if not faiss_index.has_vectors:
        faiss_index.load_from_disk()

    if not faiss_index.has_vectors:
        return {"error": "Vector index not initialised! Upload a document first."}

    print(f"DEBUG: FAISS index has {faiss_index.index.ntotal} vectors, {len(faiss_index.chunk_ids)} chunk_ids")
    print(f"DEBUG: Chroma has {chroma_store.collection.count()} chunks")
    print(f"DEBUG: First 5 chunk_ids in FAISS: {faiss_index.chunk_ids[:5]}")

    # Start overall timer
    t_start = time.perf_counter()

    # 1️⃣ Embed query
    query_embedding = embedder.embed_texts([query])

    # 2️⃣ FAISS similarity search (returns chunk_ids + cosine similarities)
    t_retr_start = time.perf_counter()
    chunk_ids, similarities = faiss_index.search_with_scores(query_embedding, top_k)
    print(f"DEBUG: FAISS returned {len(chunk_ids)} chunk_ids: {chunk_ids}")

    if not chunk_ids:
        return {
            "query": query,
            "answer": "I don't have enough information in the provided context to answer that.",
            "sources": [],
            "confidence": 0.0,
        }

    # 3️⃣ Fetch documents from Chroma
    chroma_results = chroma_store.collection.get(
        ids=chunk_ids,
        include=["documents", "metadatas"],
    )

    t_retr_end = time.perf_counter()
    retrieval_time = t_retr_end - t_retr_start
    # retrieval_time covers FAISS search + Chroma fetch

    print(f"DEBUG: Chroma returned keys: {list(chroma_results.keys())}")

    ids = chroma_results.get("ids", [])
    documents = chroma_results.get("documents", [])
    # Chroma may return 'metadatas' (plural) depending on version; fallback to 'metadata' if present
    metadatas = chroma_results.get("metadatas", chroma_results.get("metadata", []))

    # Build Context
    # documents = [doc for doc in documents if doc and doc.strip()]
    # context = "\n\n".join(documents)

    rows = []
    for idx, doc in enumerate(documents):
        if not doc or not doc.strip():
            continue

        row_id = ids[idx] if idx < len(ids) else ""
        row_meta = metadatas[idx] if idx < len(metadatas) else {}
        rows.append((row_id, doc.strip(), row_meta))

    rows.sort(key=lambda r: _chunk_sort_key(r[0]))

    context = "The following information is extracted from a document:\n\n"

    for i, (_, doc, meta) in enumerate(rows):
        section_label = meta.get("section", f"Section {i+1}") if isinstance(meta, dict) else f"Section {i+1}"
        context += f"{section_label}:\n{doc}\n\n"

    if not context.strip():
        return {
            "query": query,
            "answer": "I don't have enough information in the provided context to answer that.",
            "sources": metadatas,
            "chunks": [],
            "confidence": 0.0,
        }

    # Normalize distances into a 0-1 confidence score (lower distance => higher confidence)
    confidence = 0.0
    if similarities:
        avg_similarity = sum(similarities) / len(similarities)
        confidence = round(max(0.0, min(1.0, avg_similarity)), 2)

    # Ask Groq
    t_gen_start = time.perf_counter()
    answer = llm.generate_answer(
        context=context,
        question=query
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
    # Include the retrieved chunk texts and metadata in the response so the
    # frontend can surface the original chunks for each answer.
    chunks = [{
        "id": row_id,
        "text": doc,
        "meta": meta,
    } for (row_id, doc, meta) in rows]

    return {
        "query": query,
        "answer": answer,
        "sources": metadatas,
        "chunks": chunks,
        "confidence": confidence,
    }
