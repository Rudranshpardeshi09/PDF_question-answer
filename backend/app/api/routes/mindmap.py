# this file handles all mind map API endpoints
# generate maps, extract structure, manage history

import asyncio
import logging

from fastapi import APIRouter, HTTPException

from app.api.schemas.mindmap import (
    MindMapGenerateRequest,
    MindMapResponse,
    DocumentStructure,
    MindMapHistoryItem,
)
from app.services.mindmap_service import (
    generate_mindmap,
    extract_document_structure,
    list_mindmaps,
    get_mindmap,
    delete_mindmap,
)

logger = logging.getLogger(__name__)

# creating a router for all mind map related endpoints
router = APIRouter(prefix="/mindmap", tags=["Mind Map"])


@router.post("/generate", response_model=MindMapResponse)
async def generate_mindmap_endpoint(request: MindMapGenerateRequest):
    """generates a new mind map from the given source and settings"""
    try:
        result = await asyncio.to_thread(
            generate_mindmap,
            source_type=request.source_type.value,
            source_filenames=request.source_filenames,
            text_content=request.text_content,
            mode=request.mode.value,
            selected_chapter=request.selected_chapter,
            selected_topic=request.selected_topic,
        )
        return result

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error generating mind map: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate mind map. Please try again."
        )


@router.get("/structure/{filename}", response_model=DocumentStructure)
async def get_document_structure(filename: str):
    """extracts chapter/topic structure from an uploaded document"""
    try:
        result = await asyncio.to_thread(extract_document_structure, filename)
        return result

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error extracting structure: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to extract document structure. Please try again."
        )


@router.get("/history", response_model=list[MindMapHistoryItem])
async def get_mindmap_history():
    """returns a list of all saved mind maps"""
    try:
        return await asyncio.to_thread(list_mindmaps)
    except Exception as e:
        logger.error("Error listing mind maps: %s", e)
        raise HTTPException(status_code=500, detail="Failed to load history")


@router.get("/{mindmap_id}", response_model=MindMapResponse)
async def get_mindmap_endpoint(mindmap_id: str):
    """retrieves a specific saved mind map by ID"""
    result = await asyncio.to_thread(get_mindmap, mindmap_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Mind map not found")
    return result


@router.delete("/{mindmap_id}")
async def delete_mindmap_endpoint(mindmap_id: str):
    """deletes a saved mind map"""
    deleted = await asyncio.to_thread(delete_mindmap, mindmap_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Mind map not found")
    return {"status": "deleted", "id": mindmap_id}
