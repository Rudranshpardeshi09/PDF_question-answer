# this is the main RAG (Retrieval Augmented Generation) pipeline
# it finds relevant content from PDFs and uses AI to answer questions
import logging
import time

from app.core.config import settings
from app.rag.prompts import RAG_PROMPT
from app.rag.retriever import get_retriever
from app.services.gemini_llm import generate_text

logger = logging.getLogger(__name__)


# pulls out important words from a piece of text
def extract_keywords(text: str) -> set:
    words = set()
    for word in text.lower().split():
        cleaned = "".join(c for c in word if c.isalpha())
        if len(cleaned) >= 3:
            words.add(cleaned)
    return words


# checks how similar a document is to the question by comparing keywords
def semantic_similarity_score(doc_content: str, question_keywords: set) -> float:
    if not question_keywords:
        return 0.0

    doc_keywords = extract_keywords(doc_content)
    overlap = len(question_keywords & doc_keywords)
    return overlap / len(question_keywords)


# sorts documents so the most relevant ones come first
def rank_documents(docs: list, question: str) -> list:
    if not docs:
        return docs

    question_keywords = extract_keywords(question)
    scored_docs = [
        (doc, semantic_similarity_score(doc.page_content, question_keywords))
        for doc in docs
    ]
    scored_docs.sort(key=lambda x: x[1], reverse=True)

    filtered_docs = [
        doc for doc, score in scored_docs
        if score >= settings.RETRIEVER_MIN_SCORE
    ]
    return filtered_docs or [doc for doc, _ in scored_docs[: max(1, min(3, len(scored_docs)))]]


def _deduplicate_docs(docs: list) -> list:
    unique_docs = []
    seen = set()
    for doc in docs:
        key = (
            doc.metadata.get("chunk_id"),
            doc.metadata.get("page"),
            doc.page_content[:200],
        )
        if key in seen:
            continue
        seen.add(key)
        unique_docs.append(doc)
    return unique_docs


def _build_context(top_docs: list) -> str:
    context_parts = []
    current_size = 0

    for i, doc in enumerate(top_docs, 1):
        page_info = doc.metadata.get("page", "N/A")
        source_file = doc.metadata.get("source", "Unknown")
        content = " ".join(doc.page_content.split())
        remaining = max(settings.MAX_CONTEXT_CHARS - current_size, 0)
        if remaining <= 0:
            break

        limited_content = content[: min(850, remaining)]
        part = f"[Source {i} | File: {source_file} | Page: {page_info}]\n{limited_content}"
        context_parts.append(part)
        current_size += len(part) + 8

    return "\n\n---\n\n".join(context_parts)


def _page_number(doc) -> int:
    page = doc.metadata.get("page", 1)
    if isinstance(page, int):
        return page
    if isinstance(page, str) and page.isdigit():
        return int(page)
    return 1


# this is the main function that answers a student's question using their uploaded PDFs
def run_rag(question: str, vectorstore, syllabus_context: str = "", marks: int = 3, chat_history: list = None):
    started_at = time.perf_counter()
    desired_k = 4 if marks <= 3 else 5 if marks <= 5 else settings.TOP_K
    retriever = get_retriever(vectorstore, desired_k=desired_k)

    search_query = question
    if syllabus_context and len(syllabus_context) > 20:
        search_query = f"{syllabus_context[:100]} {question}"

    retrieval_started = time.perf_counter()
    docs = retriever.invoke(search_query)
    logger.info("Retriever returned %s docs in %.2fs", len(docs), time.perf_counter() - retrieval_started)

    if not docs:
        return {
            "answer": f"I couldn't find relevant information about '{question}' in the uploaded documents.",
            "pages": [],
            "sources": [],
            "error": True
        }

    ranked_docs = _deduplicate_docs(rank_documents(docs, question))
    if not ranked_docs:
        return {
            "answer": f"I couldn't find relevant information about '{question}' in the uploaded documents after ranking.",
            "pages": [],
            "sources": [],
            "error": True
        }

    top_docs = ranked_docs[: settings.TOP_K]
    context = _build_context(top_docs)

    formatted_chat_history = "No previous conversation."
    if chat_history and len(chat_history) > 0:
        recent_history = chat_history[-settings.MAX_CHAT_HISTORY:] if len(chat_history) > settings.MAX_CHAT_HISTORY else chat_history
        history_parts = []
        for msg in recent_history:
            role = "Student" if msg.get("role") == "user" else "Tutor"
            content = msg.get("content", "")
            content = content[:300] + "..." if len(content) > 300 else content
            history_parts.append(f"{role}: {content}")
        formatted_chat_history = "\n".join(history_parts)

    formatted_syllabus = syllabus_context.strip() if syllabus_context else "No syllabus provided."

    prompt = RAG_PROMPT.format(
        syllabus_context=formatted_syllabus,
        marks=marks,
        context=context,
        question=question,
        chat_history=formatted_chat_history
    )

    try:
        logger.info("Sending RAG request with %s chars context and marks=%s", len(context), marks)
        response = generate_text(prompt)
        if not response:
            raise ValueError("Empty response from Gemini")
    except Exception as e:
        logger.error("Error generating response: %s", e)
        return {
            "answer": f"Error generating response. Please try again: {str(e)[:100]}",
            "pages": [],
            "sources": [],
            "error": True
        }

    pages = sorted({str(_page_number(doc)) for doc in top_docs}, key=int)
    sources = [
        {
            "page": _page_number(doc),
            "text": doc.page_content[:200]
        }
        for doc in top_docs
    ]

    logger.info("RAG completed in %.2fs", time.perf_counter() - started_at)
    return {
        "answer": response,
        "pages": pages,
        "sources": sources,
        "error": False
    }
