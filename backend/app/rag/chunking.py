# this splits big PDF text into smaller pieces that the AI can understand
import hashlib
import os

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings


def _normalize_metadata(metadata: dict) -> dict:
    normalized = dict(metadata or {})
    page = normalized.get("page")
    if isinstance(page, int):
        normalized["page"] = page + 1
    elif page in (None, "", "N/A"):
        normalized["page"] = 1
    if isinstance(normalized.get("source"), str):
        normalized["source"] = os.path.basename(normalized["source"])
    return normalized


# takes in loaded PDF documents and splits them into smaller chunks
def chunk_documents(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", "; ", ", ", " "],
    )

    chunks = []
    seen_chunk_ids = set()

    for document in documents:
        split_docs = splitter.split_documents([document])
        for split_doc in split_docs:
            content = split_doc.page_content.strip()
            if not content:
                continue

            split_doc.page_content = content
            split_doc.metadata = _normalize_metadata(split_doc.metadata)
            chunk_id = hashlib.sha1(
                f"{split_doc.metadata.get('source', '')}|{split_doc.metadata.get('page', '')}|{content}".encode("utf-8")
            ).hexdigest()

            if chunk_id in seen_chunk_ids:
                continue

            split_doc.metadata["chunk_id"] = chunk_id
            seen_chunk_ids.add(chunk_id)
            chunks.append(split_doc)

    return chunks
