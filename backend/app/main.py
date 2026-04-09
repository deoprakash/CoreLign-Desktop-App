from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, upload, query
# from app.embeddings.embedder import Embedder
from app.embeddings.embedder import get_embedder
import os

app = FastAPI(
    title="RAG Document System",
    description="Document ingestion and retrieval API",
    version="0.1.0"
)

default_origins = "*"
cors_origins = os.getenv("CORS_ALLOW_ORIGINS", default_origins)

if cors_origins.strip() == "*":
    allow_origins = ["*"]
    allow_credentials = False
else:
    allow_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(query.router, tags=["Query"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])


@app.on_event("startup")
def warm_hf_embedding_model():
    # Preload the embedding client during startup so the first launch exercises the Hugging Face API path.
    try:
        get_embedder().embed_texts(["startup warmup"])
    except Exception as exc:
        print(f"DEBUG: Hugging Face embedding warmup skipped: {exc}")

@app.get("/")
def health_check():
    return {"status": "running"}