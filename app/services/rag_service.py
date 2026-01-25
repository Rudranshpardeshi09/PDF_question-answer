from app.rag.prompts import RAG_PROMPT
from app.rag.retriever import get_retriever
from app.services.gemini_llm import generate_text


# ✅ ADD THIS HERE (TOP LEVEL)
def filter_docs_for_question(docs, question: str):
    question = question.lower()

    if "certification" in question:
        keywords = [
            "certificate",
            "certification",
            "certified",
            "udemy",
            "coursera",
            "training"
        ]
        return [
            d for d in docs
            if any(k in d.page_content.lower() for k in keywords)
        ]

    return docs


# ✅ ADD THIS HERE (TOP LEVEL)
def validate_certifications(answer: str):
    invalid_terms = [
        "project",
        "system",
        "application",
        "developed",
        "implemented"
    ]

    for term in invalid_terms:
        if term.lower() in answer.lower():
            return (
                "The document does not explicitly list certifications. "
                "Only formally mentioned certifications can be confirmed."
            )

    return answer



def run_rag(question: str, vectorstore):
    """
    Runs RAG using modern LangChain runnable pattern.
    Compatible with LangChain >= 0.1
    """
    retriever = get_retriever(vectorstore)

    # 1️⃣ Retrieve documents
    docs = retriever.invoke(question)

    if not docs:
        return {
            "answer": "Not found in the document",
            "pages": [],
            "sources": []
        }

    # 2️⃣ 🔥 FILTER DOCS BASED ON QUESTION INTENT
    docs = filter_docs_for_question(docs, question)

    if not docs:
        return {
            "answer": (
                "The document does not explicitly mention this information."
            ),
            "pages": [],
            "sources": []
        }

    # 3️⃣ Build context ONLY from filtered docs
    context = "\n\n".join(doc.page_content for doc in docs)

    # 4️⃣ Format prompt
    prompt = RAG_PROMPT.format(
        context=context,
        question=question
    )

    # 5️⃣ Call Gemini
    response = generate_text(prompt)

    # 6️⃣ 🔥 POST-VALIDATION (ONLY FOR CERTIFICATION QUESTIONS)
    if "certification" in question.lower():
        response = validate_certifications(response)

    # 7️⃣ Extract metadata
    pages = sorted({
        str(doc.metadata.get("page", "N/A"))
        for doc in docs
    })

    sources = [
        {
            "page": doc.metadata.get("page"),
            "text": doc.page_content[:300]
        }
        for doc in docs
    ]

    return {
        "answer": response,
        "pages": pages,
        "sources": sources
    }
