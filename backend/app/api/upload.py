from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
import uuid
import os
from typing import List, Optional

from app.ingestion.docx_loader import (
    extract_text_from_docx,
    detect_headings,
    assign_contextual_levels,
)
from app.ingestion.pdf_loader import extract_text_from_pdf

from app.ingestion.chunking import (
    create_semantic_chunks,
    merge_empty_parent_chunks,
)

# from app.embeddings.embedder import Embedder
from app.embeddings.embedder import get_embedder
from app.vector_store.workspace_store import (
    get_workspace_chroma_store,
    get_workspace_faiss_index,
    normalize_folder_id,
)


router = APIRouter()

UPLOAD_DIR = "data/raw_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
CHUNK_SIZE = 500
CHUNK_OVERLAP = 120
MIN_SECTION_CHARS = 600


def _file_already_exists_in_folder(file_name: str, folder_id: str, chroma_store) -> bool:
    folder_upload_dir = os.path.join(UPLOAD_DIR, folder_id)
    os.makedirs(folder_upload_dir, exist_ok=True)

    # Check already uploaded raw files in this folder.
    suffix = f"_{file_name}"
    try:
        if any(existing.endswith(suffix) for existing in os.listdir(folder_upload_dir)):
            return True
    except Exception:
        pass

    # Check already indexed chunks for this file in this folder collection.
    file_key = file_name.strip().lower()
    try:
        indexed = chroma_store.collection.get(
            where={"source_file_key": file_key},
            include=["metadatas"],
        )
        if indexed.get("ids"):
            return True
    except Exception:
        # Backward compatibility for older records without source_file_key.
        try:
            indexed = chroma_store.collection.get(
                where={"source_file": file_name},
                include=["metadatas"],
            )
            if indexed.get("ids"):
                return True
        except Exception:
            pass

    return False


async def _ingest_single_file(file: UploadFile, folder_id: str, chroma_store):
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file upload.",
        )

    if _file_already_exists_in_folder(file.filename, folder_id, chroma_store):
        return {
            "document_id": None,
            "file_name": file.filename,
            "status": "duplicate_skipped",
            "chunks_created": 0,
            "chunks_embedded": 0,
            "message": "File already exists in this workspace folder.",
        }, []

    document_id = str(uuid.uuid4())
    folder_upload_dir = os.path.join(UPLOAD_DIR, folder_id)
    os.makedirs(folder_upload_dir, exist_ok=True)
    file_path = os.path.join(folder_upload_dir, f"{document_id}_{file.filename}")

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # ---------------------------
    # 2. Ingestion pipeline (DOCX or PDF)
    # ---------------------------
    filename_lower = file.filename.lower()

    if filename_lower.endswith(".pdf"):
        paragraphs = extract_text_from_pdf(file_path)
    elif filename_lower.endswith(".docx") or filename_lower.endswith(".doc"):
        paragraphs = extract_text_from_docx(file_path)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only PDF and DOCX are supported.",
        )

    paragraphs = detect_headings(paragraphs)
    paragraphs = assign_contextual_levels(paragraphs)

    # ---------------------------
    # 3. Semantic chunking
    # ---------------------------
    chunks = create_semantic_chunks(
        paragraphs=paragraphs,
        document_id=document_id,
        source_file=file.filename,
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        min_section_chars=MIN_SECTION_CHARS,
    )

    chunks = merge_empty_parent_chunks(chunks)

    chunks_to_embed = [c for c in chunks if c["section_level"] != 0]
    for chunk in chunks_to_embed:
        chunk["folder_id"] = folder_id

    # Debug output (optional)
    print("\n--- Semantic Chunks ---")
    for chunk in chunks:
        print(f"\n[Chunk {chunk['chunk_id']}] {chunk['section']}")
        for line in chunk["content"]:
            print("-", line)

    return {
        "document_id": document_id,
        "file_name": file.filename,
        "status": "uploaded" if chunks_to_embed else "uploaded_no_embeddings",
        "chunks_created": len(chunks),
        "chunks_embedded": len(chunks_to_embed),
        "message": "No embeddable chunks found" if not chunks_to_embed else "Indexed successfully",
    }, chunks_to_embed


@router.post("/upload")
async def upload_document(
    files: Optional[List[UploadFile]] = File(None),
    file: Optional[UploadFile] = File(None),
    folder_id: Optional[str] = Form("default"),
):
    normalized_folder_id = normalize_folder_id(folder_id)

    normalized_files: List[UploadFile] = []
    if files:
        normalized_files.extend(files)
    if file:
        normalized_files.append(file)

    if not normalized_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded. Provide one or more PDF/DOCX files.",
        )

    indexed_chunks = []
    document_results = []
    faiss_index = get_workspace_faiss_index(normalized_folder_id)
    chroma_store = get_workspace_chroma_store(normalized_folder_id)
    embedder = get_embedder()
    seen_names = set()

    for uploaded_file in normalized_files:
        file_name_key = (uploaded_file.filename or "").strip().lower()
        if file_name_key and file_name_key in seen_names:
            result = {
                "document_id": None,
                "file_name": uploaded_file.filename,
                "status": "duplicate_skipped",
                "chunks_created": 0,
                "chunks_embedded": 0,
                "message": "Duplicate file name in this upload batch.",
            }
            chunks_to_embed = []
        else:
            seen_names.add(file_name_key)
            result, chunks_to_embed = await _ingest_single_file(uploaded_file, normalized_folder_id, chroma_store)

        indexed_chunks.extend(chunks_to_embed)
        document_results.append(result)

    if indexed_chunks:
        texts = [f"{c.get('section', '')}\n{' '.join(c['content'])}".strip() for c in indexed_chunks]
        embeddings = embedder.embed_texts(texts)

        faiss_index.add_vectors(
            embeddings,
            chunk_ids=[c["chunk_id"] for c in indexed_chunks],
        )
        faiss_index.save_to_disk()
        chroma_store.add_chunks(indexed_chunks)

    print("Chroma count:", chroma_store.collection.count())

    return {
        "status": "uploaded",
        "folder_id": normalized_folder_id,
        "files_received": len(normalized_files),
        "files_indexed": len([d for d in document_results if d["chunks_embedded"] > 0]),
        "files_skipped_duplicates": len([d for d in document_results if d["status"] == "duplicate_skipped"]),
        "total_chunks_embedded": len(indexed_chunks),
        "documents": document_results,
    }
