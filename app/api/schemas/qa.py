from pydantic import BaseModel
from typing import List, Optional

class Source(BaseModel):
    page: int
    text: str

class QARequest(BaseModel):
    question: str
    subject: Optional[str] = None
    unit: Optional[str] = None
    topic: Optional[str] = None
    marks: Optional[int] = None

class QAResponse(BaseModel):
    answer: str
    pages: List[str]
    sources: List[Source]
