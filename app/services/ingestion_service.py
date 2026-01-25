import tempfile
from langchain_community.document_loaders import PyPDFLoader

from app.rag.chunking import chunk_documents
from app.vectorstore.faiss_store import save_vectorstore


def ingest_pdf(uploaded_file):
    """
    Handles PDF ingestion:
    - Saves temp PDF
    - Loads page-aware documents
    - Chunks intelligently for large PDFs
    - Stores embeddings in FAISS
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(uploaded_file.file.read())
        pdf_path = tmp.name

    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    chunks = chunk_documents(documents)
    save_vectorstore(chunks)
