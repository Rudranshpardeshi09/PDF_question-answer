from app.rag.prompts import RAG_PROMPT
from app.rag.retriever import get_retriever
from app.services.gemini_llm import generate_text


def run_rag(question: str, vectorstore):
    """
    Runs RAG using modern LangChain runnable pattern.
    Compatible with LangChain >= 0.1
    """
    retriever = get_retriever(vectorstore)
    docs = retriever.invoke(question)

    # 1. Retrieve relevant docs
    docs = retriever.invoke(question)

    if not docs:
        return {
            "answer": "Not found in the document",
            "pages": [],
            "sources": []
        }

    # 2. Build context
    context = "\n\n".join([doc.page_content for doc in docs])

    # 3. Format prompt
    prompt = RAG_PROMPT.format(
        context=context,
        question=question
    )

    # 4. Call Gemini
    response =  generate_text(prompt)

    # 5. Extract metadata
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
