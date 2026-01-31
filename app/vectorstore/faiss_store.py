from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from app.core.config import settings



def get_embeddings():
    """
    Local embeddings for large-document RAG.
    No API quota. Production safe.
    """
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )


def save_vectorstore(chunks):
    db = FAISS.from_documents(chunks, get_embeddings())
    db.save_local(settings.VECTOR_DB_PATH)


def load_vectorstore():
    return FAISS.load_local(
        settings.VECTOR_DB_PATH,
        get_embeddings(),
        allow_dangerous_deserialization=True
    )
