import chromadb
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
CHROMA_PATH = os.path.join(BASE_DIR, "data", "chroma_db")


class ChromaStore:
    def __init__(self, collection_name="documents"):
        # Use PersistentClient so chunk documents survive process restarts.
        self.client = chromadb.PersistentClient(path=CHROMA_PATH)

        self.collection = self.client.get_or_create_collection(
            name=collection_name
        )

    def add_chunks(self, chunks: list):
        documents, metadatas, ids = [], [], []

        for c in chunks:
            section_text = str(c.get("section", "")).strip()
            body_text = "\n".join(c.get("content", []))
            document_text = f"{section_text}\n{body_text}".strip()
            documents.append(document_text)
            metadatas.append({
                "document_id": c["document_id"],
                "section": c["section"],
                "section_level": c["section_level"],
                "source_file": c["source_file"],
                "source_file_key": str(c["source_file"]).strip().lower(),
                "folder_id": c.get("folder_id", "default"),
            })
            ids.append(c["chunk_id"])

        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

        # Some Chroma versions still expose persist(); call if available.
        if hasattr(self.client, "persist"):
            self.client.persist()

    def get_chunks_by_ids(self, ids: list):
        return self.collection.get(ids=ids)
