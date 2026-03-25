# pydantic models for mind map API requests and responses
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum


class SourceType(str, Enum):
    """where the content for the mind map comes from"""
    UPLOADED_PDF = "uploaded_pdf"
    TEXT = "text"


class MindMapMode(str, Enum):
    """how detailed the mind map should be"""
    FULL = "full"
    CHAPTER = "chapter"
    TOPIC = "topic"


class MindMapGenerateRequest(BaseModel):
    """request body for generating a new mind map"""
    source_type: SourceType
    # filenames of already-uploaded PDFs/DOCX from the shared upload folder
    source_filenames: list[str] = Field(default_factory=list)
    # raw text if user pastes content directly
    text_content: Optional[str] = None
    # generation mode
    mode: MindMapMode = MindMapMode.FULL
    # optional filters for chapter/topic mode
    selected_chapter: Optional[str] = None
    selected_topic: Optional[str] = None

    @field_validator("text_content")
    @classmethod
    def validate_text_content(cls, v, info):
        if info.data.get("source_type") == SourceType.TEXT:
            if not v or not v.strip():
                raise ValueError("Text content is required when source_type is 'text'")
            if len(v) > 100000:
                raise ValueError("Text content too long (max 100,000 characters)")
        return v

    @field_validator("source_filenames")
    @classmethod
    def validate_source_filenames(cls, v, info):
        if info.data.get("source_type") == SourceType.UPLOADED_PDF:
            if not v:
                raise ValueError("At least one filename is required when source is uploaded_pdf")
            if len(v) > 10:
                raise ValueError("Maximum 10 files at once")
        return v


class MindMapNode(BaseModel):
    """a single node in the mind map tree"""
    title: str
    description: str = ""
    children: list["MindMapNode"] = Field(default_factory=list)


class MindMapResponse(BaseModel):
    """response returned after generating a mind map"""
    id: str
    title: str
    source: str
    created_at: str
    mindmap: MindMapNode


class TopicInfo(BaseModel):
    """a topic within a chapter"""
    name: str


class ChapterInfo(BaseModel):
    """a chapter with its topics"""
    name: str
    topics: list[TopicInfo] = Field(default_factory=list)


class DocumentStructure(BaseModel):
    """the extracted chapter/topic hierarchy of a document"""
    filename: str
    chapters: list[ChapterInfo] = Field(default_factory=list)


class MindMapHistoryItem(BaseModel):
    """lightweight metadata for the gallery listing"""
    id: str
    title: str
    source: str
    created_at: str
