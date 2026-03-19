# this function creates a search tool that finds relevant content from our PDFs
from app.core.config import settings


def get_retriever(vectorstore, desired_k: int | None = None):
    k = max(3, min(desired_k or settings.TOP_K, 10))
    fetch_k = max(k * 2, settings.RETRIEVER_FETCH_K)

    return vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": k,
            "fetch_k": fetch_k,
            "lambda_mult": 0.85,
        }
    )
