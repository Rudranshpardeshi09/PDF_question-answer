from fastapi import FastAPI
from app.api.routes import ingest, qa

app = FastAPI(
    title="PDF RAG Backend",
    version="1.0.0"
)

app.include_router(ingest.router, prefix="/ingest", tags=["Ingestion"])
app.include_router(qa.router, prefix="/qa", tags=["Question Answering"])
