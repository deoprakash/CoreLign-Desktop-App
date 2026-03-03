from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, query

app = FastAPI(
    title="RAG Document System",
    description="Document ingestion and retrieval API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(query.router, tags=["Query"])

@app.get("/")
def health_check():
    return {"status": "running"}