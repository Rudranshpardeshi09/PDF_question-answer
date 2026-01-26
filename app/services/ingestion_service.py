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
    
    Returns:
    {
        "status": "success",
        "message": "PDF ingested successfully",
        "filename": "filename.pdf",
        "pages": <number of pages>
    }
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = uploaded_file.file.read()
        tmp.write(content)
        pdf_path = tmp.name

    try:
        # Load documents with page information
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()

        total_pages = len(documents)

        # Chunk documents intelligently
        chunks = chunk_documents(documents)

        # Save to vector store
        save_vectorstore(chunks)

        return {
            "status": "success",
            "message": "PDF ingested successfully",
            "filename": uploaded_file.filename,
            "pages": total_pages,
            "chunks": len(chunks)
        }
    except Exception as e:
        raise Exception(f"Error processing PDF: {str(e)}")
