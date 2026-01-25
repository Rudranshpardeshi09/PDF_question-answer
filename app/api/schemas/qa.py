from pydantic import BaseModel
from typing import List

class Source(BaseModel):
    page: int
    text: str

class QARequest(BaseModel):
    question: str

class QAResponse(BaseModel):
    answer: str
    pages: List[str]
    sources: List[Source]
