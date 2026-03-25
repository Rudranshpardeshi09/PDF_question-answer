# this service handles all the mind map generation logic
# it extracts document structure, generates mind maps via LLM, and manages history

import json
import logging
import os
import re
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.core.config import settings
from app.services.gemini_llm import generate_text

logger = logging.getLogger(__name__)

# where uploaded documents live (shared with RAG system)
UPLOAD_DIR = "app/data/uploads"
# where we store saved mind maps
MINDMAP_DIR = "app/data/mindmaps"
os.makedirs(MINDMAP_DIR, exist_ok=True)

# in-memory cache for extracted document structures
# keyed by (filename, file_mtime) so it auto-invalidates when file changes
_structure_cache: dict[tuple[str, float], dict] = {}


def _get_uploaded_file_path(filename: str) -> str:
    """resolves a filename to its full path in the shared uploads folder"""
    safe_name = os.path.basename(filename)
    path = os.path.join(UPLOAD_DIR, safe_name)
    # security: make sure the resolved path is still inside UPLOAD_DIR
    abs_path = os.path.abspath(path)
    abs_upload = os.path.abspath(UPLOAD_DIR)
    if os.path.commonpath([abs_path, abs_upload]) != abs_upload:
        raise ValueError("Invalid filename")
    if not os.path.exists(abs_path):
        raise FileNotFoundError(f"File not found: {safe_name}")
    return abs_path


def _load_text_from_file(filepath: str) -> str:
    """loads text content from a PDF or DOCX file using the shared ingestion loader"""
    from app.services.ingestion_service import _load_documents

    documents = _load_documents(filepath)
    if not documents:
        raise ValueError(f"Could not extract text from {os.path.basename(filepath)}")

    # combine all pages into one text block
    texts = []
    for doc in documents:
        content = doc.page_content.strip()
        if content:
            texts.append(content)

    return "\n\n".join(texts)


def get_text_from_sources(
    source_type: str,
    source_filenames: list[str] | None = None,
    text_content: str | None = None,
) -> tuple[str, str]:
    """
    gets text content from the specified source
    returns (text, source_label) tuple
    """
    if source_type == "text":
        if not text_content or not text_content.strip():
            raise ValueError("Text content is required")
        return text_content.strip(), "Pasted Text"

    if source_type == "uploaded_pdf":
        if not source_filenames:
            raise ValueError("At least one filename is required")

        all_text = []
        for fname in source_filenames:
            filepath = _get_uploaded_file_path(fname)
            text = _load_text_from_file(filepath)
            all_text.append(f"--- {fname} ---\n{text}")

        source_label = ", ".join(source_filenames)
        if len(source_filenames) > 2:
            source_label = f"{source_filenames[0]} +{len(source_filenames)-1} more"

        return "\n\n".join(all_text), source_label

    raise ValueError(f"Unsupported source type: {source_type}")


def extract_document_structure(filename: str) -> dict:
    """
    extracts chapter/topic hierarchy from a document using LLM
    results are cached per file to avoid re-parsing
    """
    filepath = _get_uploaded_file_path(filename)
    file_mtime = os.path.getmtime(filepath)
    cache_key = (filename, file_mtime)

    # return cached result if available
    if cache_key in _structure_cache:
        logger.info("Returning cached structure for %s", filename)
        return _structure_cache[cache_key]

    # load the document text
    text = _load_text_from_file(filepath)

    # use a limited portion to save tokens (first ~8000 chars usually contains TOC/structure)
    text_for_structure = text[:8000]

    prompt = f"""Analyze this document text and extract its hierarchical structure.

Identify the main chapters/sections and their topics/subtopics.

Document text:
---
{text_for_structure}
---

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "chapters": [
    {{
      "name": "Chapter or section name",
      "topics": [
        {{"name": "Topic name"}},
        {{"name": "Another topic"}}
      ]
    }}
  ]
}}

Rules:
- Extract real chapter/section names from the document
- Each chapter should have 2-8 topics
- If the document has no clear chapters, create logical groupings from the content
- Keep names concise (max 60 characters each)
- Return at least 2 chapters and at most 10
"""

    try:
        response = generate_text(
            prompt, 
            temperature=0.1, 
            max_tokens=8192, 
            response_mime_type="application/json"
        )
        # extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if not json_match:
            raise ValueError(f"No JSON found in LLM response. Response: {response[:200]}...")

        structure = json.loads(json_match.group())

        result = {
            "filename": filename,
            "chapters": structure.get("chapters", [])
        }

        # cache the result
        _structure_cache[cache_key] = result
        logger.info("Extracted structure for %s: %d chapters", filename, len(result["chapters"]))
        return result

    except json.JSONDecodeError as e:
        logger.error("Failed to parse structure JSON: %s", e)
        raise ValueError("Failed to extract document structure. Please try again.")
    except Exception as e:
        logger.error("Error extracting structure from %s: %s", filename, e)
        raise


def _build_mindmap_prompt(text: str, mode: str, chapter: str = None, topic: str = None) -> str:
    """builds the LLM prompt for generating the mind map based on mode and filters"""

    # limit text to avoid token overflow
    max_chars = 6000
    if mode == "topic":
        max_chars = 3000
    elif mode == "chapter":
        max_chars = 5000

    trimmed_text = text[:max_chars]

    focus_instruction = ""
    if mode == "chapter" and chapter:
        focus_instruction = f"\nFOCUS ONLY on the chapter/section: \"{chapter}\"\nIgnore content not related to this chapter."
    elif mode == "topic" and topic:
        focus_instruction = f"\nFOCUS ONLY on the specific topic: \"{topic}\"\nGo deeper into this topic with more detailed subtopics."

    prompt = f"""Generate a structured mind map from this document content.
{focus_instruction}

Document content:
---
{trimmed_text}
---

Rules (STRICT):
1. Use simple, student-friendly language
2. For EACH node, add a 2-line explanation in the description field
3. Include only key points — no filler
4. Use ONLY information from the document — do NOT hallucinate
5. Create a logical hierarchy: Main Topic → Subtopics → Details
6. Aim for 3-6 children per node, max 3 levels deep
7. Keep titles concise (max 50 characters)
8. Each description must be exactly 2 short sentences

Respond with ONLY valid JSON (no markdown, no explanation):
{{
  "title": "Main Topic Title",
  "description": "2-line explanation of the main topic.",
  "children": [
    {{
      "title": "Subtopic 1",
      "description": "2-line explanation of subtopic 1.",
      "children": [
        {{
          "title": "Detail point",
          "description": "2-line explanation of this detail.",
          "children": []
        }}
      ]
    }}
  ]
}}"""

    return prompt


def generate_mindmap(
    source_type: str,
    source_filenames: list[str] | None = None,
    text_content: str | None = None,
    mode: str = "full",
    selected_chapter: str | None = None,
    selected_topic: str | None = None,
) -> dict:
    """
    generates a mind map from the given source
    returns a complete mind map response dict ready to send to frontend
    """
    started_at = time.perf_counter()

    # step 1: get the text content
    text, source_label = get_text_from_sources(source_type, source_filenames, text_content)

    if not text.strip():
        raise ValueError("No text content to generate mind map from")

    # step 2: if chapter/topic mode, try to filter the text
    if mode in ("chapter", "topic") and source_type == "uploaded_pdf" and source_filenames:
        # use the first file for structure reference
        try:
            structure = extract_document_structure(source_filenames[0])
            # find matching content by searching for chapter/topic keywords in text
            if mode == "chapter" and selected_chapter:
                _filter_text_by_section(text, selected_chapter)
            elif mode == "topic" and selected_topic:
                _filter_text_by_section(text, selected_topic)
        except Exception as e:
            logger.warning("Could not filter by structure, using full text: %s", e)

    # step 3: generate the mind map via LLM
    prompt = _build_mindmap_prompt(text, mode, selected_chapter, selected_topic)

    try:
        response = generate_text(
            prompt, 
            temperature=0.2, 
            max_tokens=8192,
            response_mime_type="application/json"
        )

        # extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if not json_match:
            raise ValueError(f"No valid JSON in LLM response. Response: {response[:200]}...")

        mindmap_data = json.loads(json_match.group())

        # validate minimum structure
        if "title" not in mindmap_data:
            raise ValueError("Mind map missing title")

    except json.JSONDecodeError as e:
        logger.error("Failed to parse mind map JSON: %s", e)
        raise ValueError("Failed to generate mind map. The AI response was not valid JSON. Please try again.")
    except Exception as e:
        logger.error("Error generating mind map: %s", e)
        raise

    # step 4: save the mind map
    mindmap_id = uuid.uuid4().hex[:12]
    created_at = datetime.now(timezone.utc).isoformat()

    result = {
        "id": mindmap_id,
        "title": mindmap_data.get("title", "Untitled Mind Map"),
        "source": source_label,
        "created_at": created_at,
        "mindmap": mindmap_data,
    }

    # persist to disk
    _save_mindmap_to_disk(result)

    elapsed = time.perf_counter() - started_at
    logger.info("Mind map generated in %.2fs: %s", elapsed, result["title"])

    return result


def _filter_text_by_section(text: str, section_name: str) -> str:
    """tries to extract a relevant section from the text based on name"""
    # look for the section name in the text and grab surrounding content
    lower_text = text.lower()
    lower_section = section_name.lower()

    idx = lower_text.find(lower_section)
    if idx == -1:
        return text  # section not found, return full text

    # grab ~3000 chars around the found section
    start = max(0, idx - 200)
    end = min(len(text), idx + 3000)
    return text[start:end]


# ============ HISTORY / PERSISTENCE ============

def _save_mindmap_to_disk(mindmap_data: dict):
    """saves a mind map to a JSON file"""
    filepath = os.path.join(MINDMAP_DIR, f"{mindmap_data['id']}.json")
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(mindmap_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error("Failed to save mind map %s: %s", mindmap_data["id"], e)
        # don't raise — the mind map was still generated successfully


def list_mindmaps() -> list[dict]:
    """returns list of all saved mind maps (metadata only, no full tree)"""
    items = []
    if not os.path.exists(MINDMAP_DIR):
        return items

    for fname in os.listdir(MINDMAP_DIR):
        if not fname.endswith(".json"):
            continue
        try:
            filepath = os.path.join(MINDMAP_DIR, fname)
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            items.append({
                "id": data.get("id", fname.replace(".json", "")),
                "title": data.get("title", "Untitled"),
                "source": data.get("source", "Unknown"),
                "created_at": data.get("created_at", ""),
            })
        except Exception as e:
            logger.warning("Failed to read mind map file %s: %s", fname, e)

    # sort by creation time, newest first
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


def get_mindmap(mindmap_id: str) -> Optional[dict]:
    """loads a full mind map by ID"""
    safe_id = os.path.basename(mindmap_id)
    filepath = os.path.join(MINDMAP_DIR, f"{safe_id}.json")

    if not os.path.exists(filepath):
        return None

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to load mind map %s: %s", mindmap_id, e)
        return None


def delete_mindmap(mindmap_id: str) -> bool:
    """deletes a saved mind map, returns True if found and deleted"""
    safe_id = os.path.basename(mindmap_id)
    filepath = os.path.join(MINDMAP_DIR, f"{safe_id}.json")

    if not os.path.exists(filepath):
        return False

    try:
        os.remove(filepath)
        logger.info("Deleted mind map: %s", mindmap_id)
        return True
    except Exception as e:
        logger.error("Failed to delete mind map %s: %s", mindmap_id, e)
        return False
