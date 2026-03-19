# this file handles uploading PDFs, processing them, and deleting them
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
import os
import shutil
import logging
from urllib.parse import unquote
from concurrent.futures import ThreadPoolExecutor
from app.services.ingestion_service import ingest_pdf
from app.core.config import settings
from app.utils.file_utils import ensure_safe_child_path, sanitize_filename, save_upload_file
import threading

logger = logging.getLogger(__name__)
# lock to prevent race conditions when modifying INGESTION_STATUS
_status_lock = threading.Lock()
# lock to prevent concurrent vectorstore modifications
_vectorstore_lock = threading.Lock()

# creating a router for all PDF ingestion related endpoints
router = APIRouter(prefix="/ingest", tags=["Document Ingestion"])

# folder where uploaded PDFs are stored
UPLOAD_DIR = "app/data/uploads"
# create the folder if it doesnt exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

# thread pool limits PDF processing to 2 at a time so we dont overload the system
# with a reasonable queue size to prevent unlimited queueing
executor = ThreadPoolExecutor(
    max_workers=2, 
    thread_name_prefix="pdf_ingest_",
    max_queue_size=10  # limit queue to prevent memory bloat
) if hasattr(ThreadPoolExecutor, 'max_queue_size') else ThreadPoolExecutor(
    max_workers=2,
    thread_name_prefix="pdf_ingest_"
)

# keeps track of which PDFs are processing, completed, or failed
INGESTION_STATUS = {}


# this runs in the background to process a PDF without blocking the user
def ingest_background(file_path: str, filename: str):
    # check if already processing (with thread safety)
    with _status_lock:
        if (
            filename in INGESTION_STATUS
            and INGESTION_STATUS[filename]["status"] == "processing"
        ):
            return
        
        # mark the file as currently being processed
        INGESTION_STATUS[filename] = {
            "status": "processing",
            "pages": 0,
            "chunks": 0,
            "error": None,
        }

    try:
        # run the actual PDF processing in a separate thread with vectorstore lock
        with _vectorstore_lock:
            future = executor.submit(ingest_pdf, file_path)
            # wait for it to finish and get the result (with timeout to prevent hanging)
            result = future.result(timeout=300)  # 5 minute timeout

        # update status to completed with page and chunk counts (with lock)
        with _status_lock:
            INGESTION_STATUS[filename].update({
                "status": "completed",
                "pages": result.get("pages", 0),
                "chunks": result.get("chunks", 0),
            })
        logger.info(f"Successfully processed {filename}: {result.get('pages', 0)} pages, {result.get('chunks', 0)} chunks")

    except Exception as e:
        # if something went wrong, mark it as failed with the error message (with lock)
        error_msg = str(e)
        logger.error(f"Error processing PDF {filename}: {error_msg}")
        with _status_lock:
            if filename in INGESTION_STATUS:
                INGESTION_STATUS[filename].update({
                    "status": "failed",
                    "error": error_msg,
                })


# rebuilds the search database after a PDF is deleted (runs in background)
def rebuild_vectorstore_background():
    try:
        # use lock to prevent concurrent vectorstore modifications
        with _vectorstore_lock:
            from app.services.ingestion_service import rebuild_vectorstore_from_uploads
            rebuild_vectorstore_from_uploads()
            logger.info("Background vectorstore rebuild completed")
    except Exception as e:
        logger.error(f"Background rebuild failed: {e}")


# API endpoint to upload a PDF file
@router.post("/")
async def ingest(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # validate file exists
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # validate file extension (case-insensitive)
    safe_filename = sanitize_filename(file.filename)
    file_lower = safe_filename.lower()
    file_ext = os.path.splitext(file_lower)[1]
    if file_ext not in settings.ALLOWED_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Only {', '.join(settings.ALLOWED_FILE_EXTENSIONS)} files allowed"
        )
    if file.content_type and file.content_type not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type"
        )
    # save the uploaded file to disk
    file_path = ensure_safe_child_path(UPLOAD_DIR, safe_filename)
    try:
        save_upload_file(file, file_path)
    except Exception as e:
        logger.error(f"Failed to save file {safe_filename}: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Failed to save file")

    # set initial status to pending (so frontend knows we got the file) - use lock for thread safety
    with _status_lock:
        if safe_filename not in INGESTION_STATUS or INGESTION_STATUS[safe_filename]["status"] not in ("pending", "processing"):
            INGESTION_STATUS[safe_filename] = {
                "status": "pending",
                "pages": 0,
                "chunks": 0,
                "error": None,
            }

    # start processing the PDF in the background so we can respond immediately
    background_tasks.add_task(
        ingest_background,
        file_path,
        safe_filename
    )

    # tell the frontend we got the file and started processing
    return {
        "status": "accepted",
        "filename": safe_filename,
        "message": "PDF upload received. Processing started."
    }


# API endpoint to check the processing status of uploaded files
@router.get("/status")
async def ingest_status(filename: str | None = None):
    # use lock to ensure consistent reads
    with _status_lock:
        # if a specific filename is given, return just that files status
        if filename:
            decoded = sanitize_filename(unquote(filename))
            return INGESTION_STATUS.get(decoded, {"status": "not_found"})
        # otherwise return all statuses (make a copy to avoid external modifications)
        return dict(INGESTION_STATUS)


# API endpoint to delete a specific PDF
@router.delete("/delete/{filename}")
async def delete_pdf(background_tasks: BackgroundTasks, filename: str):
    # decode the filename in case it has special characters like spaces
    decoded_filename = unquote(filename)
    safe_filename = sanitize_filename(decoded_filename)
    pdf_path = ensure_safe_child_path(UPLOAD_DIR, safe_filename)

    # check if the file actually exists
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")

    try:
        # delete the actual file from disk
        os.remove(pdf_path)
    except Exception as e:
        logger.error(f"Failed to delete file {safe_filename}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file")
    
    # remove it from our status tracking (with thread safety)
    with _status_lock:
        INGESTION_STATUS.pop(safe_filename, None)
    
    # rebuild the search database in the background (so the response is instant)
    background_tasks.add_task(rebuild_vectorstore_background)

    # respond immediately - the database rebuild happens in background
    return {"status": "deleted", "filename": safe_filename}


# API endpoint to delete ALL uploaded PDFs and reset everything
@router.delete("/reset")
async def reset_all_pdfs(background_tasks: BackgroundTasks):
    # use locks for thread safety
    with _vectorstore_lock:
        # delete the entire uploads folder and recreate it empty
        try:
            if os.path.exists(UPLOAD_DIR):
                shutil.rmtree(UPLOAD_DIR)
            os.makedirs(UPLOAD_DIR, exist_ok=True)
        except Exception as e:
            logger.error(f"Failed to reset uploads folder: {e}")
            raise HTTPException(status_code=500, detail="Failed to reset uploads")

        # clear all status tracking
        with _status_lock:
            INGESTION_STATUS.clear()
        
        # clean up the vector database in the background
        def cleanup_vectordb():
            try:
                if os.path.exists(settings.VECTOR_DB_PATH):
                    shutil.rmtree(settings.VECTOR_DB_PATH)
                    logger.info("Vector DB cleared successfully")
            except Exception as e:
                logger.error(f"Failed to clear vector DB: {e}")
        
        background_tasks.add_task(cleanup_vectordb)

    return {"status": "reset", "message": "All PDFs and vector database cleared"}
