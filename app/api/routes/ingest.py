from fastapi import APIRouter, UploadFile, File
from app.services.ingestion_service import ingest_pdf

router = APIRouter()

@router.post("/ingest/")
def ingest(file: UploadFile = File(...)):
    ingest_pdf(file)
    return {"status": "PDF ingested successfully"}
