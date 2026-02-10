"""
Optimized RAG Pipeline
- Reduced document count for speed
- Streamlined context building
- Faster keyword extraction
"""
from app.rag.prompts import RAG_PROMPT
from app.rag.retriever import get_retriever
from app.services.gemini_llm import generate_text
import re


def extract_keywords(text: str) -> set:
    """Extract meaningful keywords from text (optimized)."""
    # Simple word extraction - faster than regex for common cases
    words = set()
    for word in text.lower().split():
        cleaned = ''.join(c for c in word if c.isalpha())
        if len(cleaned) >= 3:
            words.add(cleaned)
    return words


def semantic_similarity_score(doc_content: str, question_keywords: set) -> float:
    """Calculate semantic similarity (optimized with pre-computed keywords)."""
    if not question_keywords:
        return 0.0
    
    doc_keywords = extract_keywords(doc_content)
    overlap = len(question_keywords & doc_keywords)
    return overlap / len(question_keywords)


def rank_documents(docs: list, question: str) -> list:
    """Re-rank documents by semantic relevance (optimized)."""
    if not docs:
        return docs
    
    # Pre-compute question keywords once
    question_keywords = extract_keywords(question)
    
    scored_docs = [
        (doc, semantic_similarity_score(doc.page_content, question_keywords))
        for doc in docs
    ]
    
    # Sort by score descending
    scored_docs.sort(key=lambda x: x[1], reverse=True)
    return [doc for doc, _ in scored_docs]


def run_rag(question: str, vectorstore, syllabus_context: str = "", marks: int = 3, chat_history: list = None):
    """
    Optimized RAG pipeline:
    1. Retrieve relevant documents using MMR
    2. Rank by semantic relevance
    3. Build compact context from top 4 documents
    4. Include chat history for follow-ups
    5. Generate complete answer
    """
    retriever = get_retriever(vectorstore)

    # ════════════════════════════════════════════════════════════════
    # STEP 1: RETRIEVE - Single query for speed
    # ════════════════════════════════════════════════════════════════
    # Combine question with syllabus hint if available
    search_query = question
    if syllabus_context and len(syllabus_context) > 20:
        # Add first 100 chars of syllabus as context hint
        search_query = f"{syllabus_context[:100]} {question}"
    
    docs = retriever.invoke(search_query)

    if not docs:
        return {
            "answer": f"I couldn't find relevant information about '{question}' in the uploaded documents.",
            "pages": [],
            "sources": [],
            "error": True
        }

    # ════════════════════════════════════════════════════════════════
    # STEP 2: RANK - Sort by semantic relevance
    # ════════════════════════════════════════════════════════════════
    ranked_docs = rank_documents(docs, question)

    # ════════════════════════════════════════════════════════════════
    # STEP 3: BUILD CONTEXT - Top 4 documents only (optimized for speed)
    # ════════════════════════════════════════════════════════════════
    top_docs = ranked_docs[:4]
    
    context_parts = []
    for i, doc in enumerate(top_docs, 1):
        page_info = doc.metadata.get("page", "N/A")
        source_file = doc.metadata.get("source", "Unknown")
        if isinstance(source_file, str):
            source_file = source_file.split("/")[-1].split("\\")[-1]
        # Limit content per doc to prevent overly long prompts
        content = doc.page_content[:800] if len(doc.page_content) > 800 else doc.page_content
        context_parts.append(f"[Source {i} - {source_file}, Page {page_info}]\n{content}")
    
    context = "\n\n---\n\n".join(context_parts)

    # ════════════════════════════════════════════════════════════════
    # STEP 4: FORMAT CHAT HISTORY - Compact format
    # ════════════════════════════════════════════════════════════════
    formatted_chat_history = "No previous conversation."
    if chat_history and len(chat_history) > 0:
        # Limit to last 10 messages for speed
        recent_history = chat_history[-10:]
        history_parts = []
        for msg in recent_history:
            role = "Student" if msg["role"] == "user" else "Tutor"
            # Shorter truncation
            content = msg["content"][:300] + "..." if len(msg["content"]) > 300 else msg["content"]
            history_parts.append(f"{role}: {content}")
        formatted_chat_history = "\n".join(history_parts)

    # ════════════════════════════════════════════════════════════════
    # STEP 5: GENERATE - Create prompt and call LLM
    # ════════════════════════════════════════════════════════════════
    formatted_syllabus = syllabus_context.strip() if syllabus_context else "No syllabus provided."
    
    prompt = RAG_PROMPT.format(
        syllabus_context=formatted_syllabus,
        marks=marks,
        context=context,
        question=question,
        chat_history=formatted_chat_history
    )

    try:
        response = generate_text(prompt)
    except Exception as e:
        return {
            "answer": f"Error generating response: {str(e)}",
            "pages": [],
            "sources": [],
            "error": True
        }

    # ════════════════════════════════════════════════════════════════
    # STEP 6: EXTRACT METADATA
    # ════════════════════════════════════════════════════════════════
    pages = sorted({str(doc.metadata.get("page", "N/A")) for doc in top_docs})
    sources = [
        {
            "page": doc.metadata.get("page", "N/A"),
            "text": doc.page_content[:200]
        }
        for doc in top_docs
    ]

    return {
        "answer": response,
        "pages": pages,
        "sources": sources,
        "error": False
    }
