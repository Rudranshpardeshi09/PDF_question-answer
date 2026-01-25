from fastapi import APIRouter
from app.api.schemas.qa import QARequest
from app.vectorstore.faiss_store import load_vectorstore
from app.services.rag_service import run_rag

router = APIRouter()

@router.post("/")
def ask_question(req: QARequest):
    db = load_vectorstore()
    return run_rag(req.question, db)
