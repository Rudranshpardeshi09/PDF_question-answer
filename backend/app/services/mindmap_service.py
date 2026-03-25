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

from app.rag.prompts import build_mindmap_generation_prompt
from app.services.gemini_llm import generate_text

logger = logging.getLogger(__name__)

UPLOAD_DIR = "app/data/uploads"
MINDMAP_DIR = "app/data/mindmaps"
os.makedirs(MINDMAP_DIR, exist_ok=True)

_structure_cache: dict[tuple[str, float], dict] = {}


def _get_uploaded_file_path(filename: str) -> str:
    """resolves a filename to its full path in the shared uploads folder"""
    safe_name = os.path.basename(filename)
    path = os.path.join(UPLOAD_DIR, safe_name)
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
    """gets text content from the specified source and returns (text, source_label)"""
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
    """extracts chapter/topic hierarchy from a document using LLM"""
    filepath = _get_uploaded_file_path(filename)
    file_mtime = os.path.getmtime(filepath)
    cache_key = (filename, file_mtime)

    if cache_key in _structure_cache:
        logger.info("Returning cached structure for %s", filename)
        return _structure_cache[cache_key]

    text = _load_text_from_file(filepath)
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
            response_mime_type="application/json",
        )
        json_match = re.search(r"\{[\s\S]*\}", response)
        if not json_match:
            raise ValueError(f"No JSON found in LLM response. Response: {response[:200]}...")

        structure = json.loads(json_match.group())
        result = {
            "filename": filename,
            "chapters": structure.get("chapters", []),
        }

        _structure_cache[cache_key] = result
        logger.info("Extracted structure for %s: %d chapters", filename, len(result["chapters"]))
        return result

    except json.JSONDecodeError as error:
        logger.error("Failed to parse structure JSON: %s", error)
        raise ValueError("Failed to extract document structure. Please try again.")
    except Exception as error:
        logger.error("Error extracting structure from %s: %s", filename, error)
        raise


def _truncate_source_text(text: str, mode: str) -> str:
    """trims source text to a focused, token-efficient window"""
    max_chars = 6500
    if mode == "chapter":
        max_chars = 5200
    elif mode == "topic":
        max_chars = 3600
    return text[:max_chars]


def _normalize_description(value: str) -> str:
    """keeps descriptions compact and readable for rendering"""
    cleaned = " ".join((value or "").split())
    if not cleaned:
        return (
            "Summarizes a key idea from the uploaded material. "
            "Highlights why the concept matters in context."
        )
    if len(cleaned) > 220:
        cleaned = cleaned[:217].rstrip(" ,;:") + "..."
    return cleaned


def _normalize_bullet_points(values) -> list[str]:
    """normalizes supporting points for compact diagram rendering"""
    if not isinstance(values, list):
        return []

    bullets: list[str] = []
    for value in values:
        cleaned = " ".join(str(value or "").split())
        if not cleaned:
            continue
        if len(cleaned) > 60:
            cleaned = cleaned[:57].rstrip(" ,;:") + "..."
        bullets.append(cleaned)
        if len(bullets) == 4:
            break
    return bullets


def _sanitize_mindmap_tree(node: dict, depth: int = 0) -> dict:
    """caps tree size and normalizes node content for performance and consistency"""
    if not isinstance(node, dict):
        return {
            "title": "Untitled Topic",
            "description": _normalize_description(""),
            "children": [],
        }

    title = " ".join(str(node.get("title", "Untitled Topic")).split())[:60].strip()
    title = title or "Untitled Topic"
    description = _normalize_description(str(node.get("description", "")))
    bullet_points = _normalize_bullet_points(node.get("bullet_points", []))

    child_limits = {0: 8, 1: 5, 2: 4}
    raw_children = node.get("children", [])
    if not isinstance(raw_children, list):
        raw_children = []

    if depth >= 3:
        children = []
    else:
        children = [
            _sanitize_mindmap_tree(child, depth + 1)
            for child in raw_children[: child_limits.get(depth, 0)]
        ]

    return {
        "title": title,
        "description": description,
        "bullet_points": bullet_points,
        "children": children,
    }


def generate_mindmap(
    source_type: str,
    source_filenames: list[str] | None = None,
    text_content: str | None = None,
    mode: str = "full",
    selected_chapter: str | None = None,
    selected_topic: str | None = None,
) -> dict:
    """generates a mind map from the given source"""
    started_at = time.perf_counter()

    text, source_label = get_text_from_sources(source_type, source_filenames, text_content)
    if not text.strip():
        raise ValueError("No text content to generate mind map from")

    if mode in ("chapter", "topic") and source_type == "uploaded_pdf" and source_filenames:
        try:
            extract_document_structure(source_filenames[0])
            if mode == "chapter" and selected_chapter:
                text = _filter_text_by_section(text, selected_chapter)
            elif mode == "topic" and selected_topic:
                text = _filter_text_by_section(text, selected_topic)
        except Exception as error:
            logger.warning("Could not filter by structure, using full text: %s", error)

    prompt = build_mindmap_generation_prompt(
        _truncate_source_text(text, mode),
        mode,
        selected_chapter,
        selected_topic,
    )

    try:
        response = generate_text(
            prompt,
            temperature=0.2,
            max_tokens=8192,
            response_mime_type="application/json",
        )

        json_match = re.search(r"\{[\s\S]*\}", response)
        if not json_match:
            raise ValueError(f"No valid JSON in LLM response. Response: {response[:200]}...")

        mindmap_data = _sanitize_mindmap_tree(json.loads(json_match.group()))
        if "title" not in mindmap_data:
            raise ValueError("Mind map missing title")

    except json.JSONDecodeError as error:
        logger.error("Failed to parse mind map JSON: %s", error)
        raise ValueError(
            "Failed to generate mind map. The AI response was not valid JSON. Please try again."
        )
    except Exception as error:
        logger.error("Error generating mind map: %s", error)
        raise

    mindmap_id = uuid.uuid4().hex[:12]
    created_at = datetime.now(timezone.utc).isoformat()

    result = {
        "id": mindmap_id,
        "title": mindmap_data.get("title", "Untitled Mind Map"),
        "source": source_label,
        "created_at": created_at,
        "mindmap": mindmap_data,
    }

    _save_mindmap_to_disk(result)

    elapsed = time.perf_counter() - started_at
    logger.info("Mind map generated in %.2fs: %s", elapsed, result["title"])
    return result


def _filter_text_by_section(text: str, section_name: str) -> str:
    """tries to extract a relevant section from the text based on name"""
    lower_text = text.lower()
    lower_section = section_name.lower()

    idx = lower_text.find(lower_section)
    if idx == -1:
        return text

    start = max(0, idx - 200)
    end = min(len(text), idx + 3000)
    return text[start:end]


def _save_mindmap_to_disk(mindmap_data: dict):
    """saves a mind map to a JSON file"""
    filepath = os.path.join(MINDMAP_DIR, f"{mindmap_data['id']}.json")
    try:
        with open(filepath, "w", encoding="utf-8") as file:
            json.dump(mindmap_data, file, ensure_ascii=False, indent=2)
    except Exception as error:
        logger.error("Failed to save mind map %s: %s", mindmap_data["id"], error)


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
            with open(filepath, "r", encoding="utf-8") as file:
                data = json.load(file)
            items.append({
                "id": data.get("id", fname.replace(".json", "")),
                "title": data.get("title", "Untitled"),
                "source": data.get("source", "Unknown"),
                "created_at": data.get("created_at", ""),
            })
        except Exception as error:
            logger.warning("Failed to read mind map file %s: %s", fname, error)

    items.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return items


def get_mindmap(mindmap_id: str) -> Optional[dict]:
    """loads a full mind map by ID"""
    safe_id = os.path.basename(mindmap_id)
    filepath = os.path.join(MINDMAP_DIR, f"{safe_id}.json")

    if not os.path.exists(filepath):
        return None

    try:
        with open(filepath, "r", encoding="utf-8") as file:
            return json.load(file)
    except Exception as error:
        logger.error("Failed to load mind map %s: %s", mindmap_id, error)
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
    except Exception as error:
        logger.error("Failed to delete mind map %s: %s", mindmap_id, error)
        return False
