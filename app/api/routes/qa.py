# from fastapi import APIRouter, HTTPException
# from app.api.schemas.qa import QARequest
# from app.vectorstore.faiss_store import load_vectorstore
# from app.services.rag_service import run_rag

# router = APIRouter()

# @router.post("/qa/")
# def ask_question(req: QARequest):
#     db = load_vectorstore()
#     if not all([req.subject, req.unit, req.topic, req.marks]):
#         raise HTTPException(
#             status_code=400,
#             detail="Subject, Unit, Topic and Marks are required"
#         )
#     return run_rag(question=req.question,
#         vectorstore=db,
#         unit=req.unit,
#         topic=req.topic,
#         marks=req.marks,
#         subject=req.subject
#     )

from fastapi import APIRouter, HTTPException
from app.api.schemas.qa import QARequest
from app.vectorstore.faiss_store import load_vectorstore
from app.services.rag_service import run_rag

router = APIRouter()

@router.post("/qa/")
def ask_question(req: QARequest):
    # ---------- VALIDATION (EMBEDDED, NON-BREAKING) ----------
    missing_fields = []

    if not req.unit:
        missing_fields.append("unit")
    if not req.topic:
        missing_fields.append("topic")
    if not req.marks:
        missing_fields.append("marks")

    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {', '.join(missing_fields)}"
        )

    # ---------- EXISTING FUNCTIONALITY (UNCHANGED) ----------
    db = load_vectorstore()

    return run_rag(
        question=req.question,
        vectorstore=db,
        unit=req.unit,
        topic=req.topic,
        marks=req.marks,
        subject=req.subject
    )
