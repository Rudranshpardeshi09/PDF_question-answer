from typing import List, Optional

from pydantic import BaseModel, Field, validator

# represents a source reference from a PDF (which page and what text was found)
class Source(BaseModel):
    page: int
    text: str

# represents a single message in the chat history (either from user or AI)
class ChatMessage(BaseModel):
    role: str = Field(..., description="Either 'user' or 'assistant'")
    content: str = Field(..., description="The message content")

    @validator("role")
    def validate_role(cls, value: str) -> str:
        if value not in {"user", "assistant"}:
            raise ValueError("role must be 'user' or 'assistant'")
        return value

    @validator("content")
    def validate_content(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("content cannot be empty")
        return cleaned[:2000]

# this is what the frontend sends when asking a question
class QARequest(BaseModel):
    # the actual question the student is asking
    question: str = Field(..., min_length=1, max_length=1000)
    # optional syllabus text to help the AI focus on relevant topics
    syllabus_context: Optional[str] = Field(
        default=None, 
        max_length=10000,
        description="User's syllabus, topics, or study context"
    )
    # how long the answer should be (3=short, 5=medium, 12=detailed)
    marks: Optional[int] = Field(
        default=3, 
        ge=1, 
        le=100,
        description="Answer length: 3=short, 5=medium, 12=long"
    )
    # previous messages so the AI can understand follow-up questions
    chat_history: Optional[List[ChatMessage]] = Field(
        default=None,
        max_length=30,
        description="Previous conversation messages for context (max 15 message pairs)"
    )

    @validator("question")
    def normalize_question(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("question cannot be empty")
        return cleaned

    @validator("syllabus_context")
    def normalize_syllabus_context(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

# this is what the backend sends back as the answer
class QAResponse(BaseModel):
    answer: str           # the AI-generated answer
    pages: List[str]      # list of page numbers where info was found
    sources: List[Source] # detailed source references for verification
