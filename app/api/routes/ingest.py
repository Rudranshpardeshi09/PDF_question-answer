"""
PDF Ingestion API Routes
Handles PDF upload, background processing, and status tracking
Optimized for fast deletion with background rebuild
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
import os
import shutil
import logging
from urllib.parse import unquote
from concurrent.futures import ThreadPoolExecutor
from app.services.ingestion_service import ingest_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingest", tags=["Document Ingestion"])

# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════
UPLOAD_DIR = "app/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Thread pool for CPU-intensive PDF processing
executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="pdf_ingest_")

# In-memory status tracking
INGESTION_STATUS = {}


def ingest_background(file_path: str, filename: str):
    """Background task for PDF ingestion."""
    if (
        filename in INGESTION_STATUS
        and INGESTION_STATUS[filename]["status"] == "processing"
    ):
        return

    INGESTION_STATUS[filename] = {
        "status": "processing",
        "pages": 0,
        "chunks": 0,
        "error": None,
    }

    try:
        future = executor.submit(ingest_pdf, file_path)
        result = future.result()

        INGESTION_STATUS[filename].update({
            "status": "completed",
            "pages": result["pages"],
            "chunks": result["chunks"],
        })

    except Exception as e:
        INGESTION_STATUS[filename].update({
            "status": "failed",
            "error": str(e),
        })


def rebuild_vectorstore_background():
    """Background task for vectorstore rebuild after deletion."""
    try:
        from app.services.ingestion_service import rebuild_vectorstore_from_uploads
        rebuild_vectorstore_from_uploads()
        logger.info("Background vectorstore rebuild completed")
    except Exception as e:
        logger.error(f"Background rebuild failed: {e}")


@router.post("/")
async def ingest(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file or not (file.filename.lower().endswith(".pdf") or file.filename.lower().endswith(".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    if not (
        file.filename in INGESTION_STATUS
        and INGESTION_STATUS[file.filename]["status"] in ("pending", "processing")
    ):
        INGESTION_STATUS[file.filename] = {
            "status": "pending",
            "pages": 0,
            "chunks": 0,
            "error": None,
        }

    background_tasks.add_task(
        ingest_background,
        file_path,
        file.filename
    )

    return {
        "status": "accepted",
        "filename": file.filename,
        "message": "PDF upload received. Processing started."
    }


@router.get("/status")
async def ingest_status(filename: str | None = None):
    if filename:
        return INGESTION_STATUS.get(filename, {"status": "not_found"})
    return INGESTION_STATUS


@router.delete("/delete/{filename}")
async def delete_pdf(background_tasks: BackgroundTasks, filename: str):
    """
    Delete a PDF and rebuild vectorstore in background.
    Returns immediately for fast UI response.
    """
    decoded_filename = unquote(filename)
    pdf_path = os.path.join(UPLOAD_DIR, decoded_filename)

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")

    # Delete file immediately
    os.remove(pdf_path)
    
    # Remove from status tracking
    INGESTION_STATUS.pop(decoded_filename, None)
    
    # Rebuild vectorstore in BACKGROUND (non-blocking)
    background_tasks.add_task(rebuild_vectorstore_background)

    return {"status": "deleted", "filename": decoded_filename}


@router.delete("/reset")
async def reset_all_pdfs(background_tasks: BackgroundTasks):
    """Reset all PDFs - fast response with background cleanup."""
    if os.path.exists(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR)
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    INGESTION_STATUS.clear()
    
    # Clean vector DB in background
    def cleanup_vectordb():
        from app.core.config import settings
        if os.path.exists(settings.VECTOR_DB_PATH):
            shutil.rmtree(settings.VECTOR_DB_PATH)
            logger.info("Vector DB cleared in background")
    
    background_tasks.add_task(cleanup_vectordb)

    return {"status": "reset"}