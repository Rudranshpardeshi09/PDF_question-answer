from app.rag.prompts import RAG_PROMPT
from app.rag.retriever import get_retriever
from app.services.gemini_llm import generate_text
import re


def extract_keywords(text: str) -> list:
    """Extract meaningful keywords from text."""
    # Remove special chars and split into words
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    return list(set(words))


def semantic_similarity_score(doc_content: str, question: str) -> float:
    """
    Calculate semantic similarity between document and question.
    Uses keyword overlap as a simple but effective heuristic.
    """
    question_keywords = set(extract_keywords(question))
    doc_keywords = set(extract_keywords(doc_content))
    
    if not question_keywords:
        return 0.0
    
    overlap = len(question_keywords & doc_keywords)
    similarity = overlap / len(question_keywords)
    return similarity


def rank_documents(docs: list, question: str) -> list:
    """
    Re-rank documents by semantic relevance to the question.
    This ensures most relevant documents appear first.
    """
    if not docs:
        return docs
    
    scored_docs = [
        (doc, semantic_similarity_score(doc.page_content, question))
        for doc in docs
    ]
    
    # Sort by score descending
    scored_docs.sort(key=lambda x: x[1], reverse=True)
    
    return [doc for doc, _ in scored_docs]


def run_rag(question: str, vectorstore, subject, unit, topic, marks):
    """
    Production-ready RAG pipeline:
    
    1. Retrieve diverse, relevant documents using MMR
    2. Rank them by semantic relevance to the question
    3. Build rich context from top documents
    4. Generate answer with proper formatting
    5. Extract and return metadata
    
    This pipeline ensures:
    - Questions are answered from the PDF content
    - Context is comprehensive and relevant
    - No aggressive filtering that removes valid documents
    - Proper error handling and fallbacks
    """
    retriever = get_retriever(vectorstore)

    # ════════════════════════════════════════════════════════════════
    # STEP 1: RETRIEVE - Use both question and topic for best coverage
    # ════════════════════════════════════════════════════════════════
    # Search with question keywords (primary)
    question_docs = retriever.invoke(question)
    
    # Search with topic context (secondary)
    topic_docs = retriever.invoke(f"{topic} {question}")
    
    # Merge and deduplicate (keep unique by content)
    combined_docs = question_docs + topic_docs
    unique_docs = []
    seen_content = set()
    
    for doc in combined_docs:
        content_hash = hash(doc.page_content)
        if content_hash not in seen_content:
            unique_docs.append(doc)
            seen_content.add(content_hash)

    if not unique_docs:
        return {
            "answer": (
                f"I couldn't find relevant information about '{question}' in the document. "
                "Try asking differently or check if the topic is covered in your study material."
            ),
            "pages": [],
            "sources": [],
            "error": True
        }

    # ════════════════════════════════════════════════════════════════
    # STEP 2: RANK - Sort by semantic relevance to question
    # ════════════════════════════════════════════════════════════════
    ranked_docs = rank_documents(unique_docs, question)

    # ════════════════════════════════════════════════════════════════
    # STEP 3: BUILD CONTEXT - Combine top documents with separators
    # ════════════════════════════════════════════════════════════════
    # Use top 6 documents (quality over quantity)
    context_docs = ranked_docs[:6]
    
    context_parts = []
    for i, doc in enumerate(context_docs, 1):
        page_info = doc.metadata.get("page", "N/A")
        context_parts.append(
            f"[Source {i} - Page {page_info}]\n{doc.page_content}"
        )
    
    context = "\n\n" + "─" * 70 + "\n\n".join(context_parts)

    # ════════════════════════════════════════════════════════════════
    # STEP 4: GENERATE - Create prompt and call LLM
    # ════════════════════════════════════════════════════════════════
    prompt = RAG_PROMPT.format(
        subject=subject,
        unit=unit,
        topic=topic,
        marks=marks,
        context=context,
        question=question
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
    # STEP 5: EXTRACT METADATA - Pages and sources
    # ════════════════════════════════════════════════════════════════
    pages = sorted({
        str(doc.metadata.get("page", "N/A"))
        for doc in context_docs
    })

    sources = [
        {
            "page": doc.metadata.get("page", "N/A"),
            "text": doc.page_content[:250]
        }
        for doc in context_docs
    ]

    return {
        "answer": response,
        "pages": pages,
        "sources": sources,
        "error": False
    }
