import re
from collections import defaultdict

from rank_bm25 import BM25Okapi


_TOKEN_RE = re.compile(r"\b\w+\b", re.UNICODE)


def _tokenize(text: str) -> list[str]:
	return _TOKEN_RE.findall((text or "").lower())


def _rrf(rank: int, k: int = 60) -> float:
	return 1.0 / (k + rank)


def hybrid_retrieve(
	query: str,
	faiss_index,
	chroma_store,
	embedder,
	top_k: int = 7,
	dense_k: int = 20,
	sparse_k: int = 20,
):
	if not query or not query.strip():
		return []

	# Dense retrieval
	dense_ids = []
	dense_scores = []
	if getattr(faiss_index, "has_vectors", False):
		query_embedding = embedder.embed_texts([query])
		dense_ids, dense_scores = faiss_index.search_with_scores(query_embedding, dense_k)

	# Sparse retrieval over the workspace collection
	all_rows = chroma_store.collection.get(include=["documents", "metadatas"])
	all_ids = all_rows.get("ids", [])
	all_docs = all_rows.get("documents", [])
	all_meta = all_rows.get("metadatas", all_rows.get("metadata", []))

	if not all_ids or not all_docs:
		return []

	corpus_tokens = [_tokenize(doc) for doc in all_docs]
	query_tokens = _tokenize(query)

	sparse_ranked = []
	if query_tokens:
		bm25 = BM25Okapi(corpus_tokens)
		sparse_scores = bm25.get_scores(query_tokens)
		sparse_ranked = sorted(
			[
				(all_ids[i], float(sparse_scores[i]))
				for i in range(min(len(all_ids), len(sparse_scores)))
			],
			key=lambda item: item[1],
			reverse=True,
		)[:sparse_k]

	dense_ranked = sorted(
		[(chunk_id, float(score)) for chunk_id, score in zip(dense_ids, dense_scores)],
		key=lambda item: item[1],
		reverse=True,
	)[:dense_k]

	# Reciprocal Rank Fusion
	fused_scores = defaultdict(float)
	dense_rank = {}
	dense_score_by_id = {}
	sparse_rank = {}
	sparse_score_by_id = {}

	for idx, (chunk_id, score) in enumerate(dense_ranked, start=1):
		dense_rank[chunk_id] = idx
		dense_score_by_id[chunk_id] = score
		fused_scores[chunk_id] += _rrf(idx)

	for idx, (chunk_id, score) in enumerate(sparse_ranked, start=1):
		sparse_rank[chunk_id] = idx
		sparse_score_by_id[chunk_id] = score
		fused_scores[chunk_id] += _rrf(idx)

	if not fused_scores:
		return []

	final_ids = [
		chunk_id
		for chunk_id, _ in sorted(fused_scores.items(), key=lambda item: item[1], reverse=True)[:top_k]
	]

	retrieved = chroma_store.collection.get(ids=final_ids, include=["documents", "metadatas"])
	ids = retrieved.get("ids", [])
	docs = retrieved.get("documents", [])
	metas = retrieved.get("metadatas", retrieved.get("metadata", []))

	# Preserve RRF order when Chroma returns a different order.
	rank_position = {chunk_id: pos for pos, chunk_id in enumerate(final_ids)}

	rows = []
	for i, chunk_id in enumerate(ids):
		text = docs[i] if i < len(docs) else ""
		meta = metas[i] if i < len(metas) else {}
		if not text or not str(text).strip():
			text = meta.get("section", "") if isinstance(meta, dict) else ""
		if not text or not str(text).strip():
			continue

		rows.append(
			{
				"id": chunk_id,
				"text": str(text).strip(),
				"meta": meta if isinstance(meta, dict) else {},
				"hybrid_score": round(float(fused_scores.get(chunk_id, 0.0)), 6),
				"dense_rank": dense_rank.get(chunk_id),
				"sparse_rank": sparse_rank.get(chunk_id),
				"dense_score": dense_score_by_id.get(chunk_id),
				"sparse_score": sparse_score_by_id.get(chunk_id),
			}
		)

	rows.sort(key=lambda row: rank_position.get(row["id"], 10**9))
	return rows
