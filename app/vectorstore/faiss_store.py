"""
FAISS Vector Store Module
Handles embeddings storage with support for accumulating multiple PDFs
"""

import os
import logging
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from app.core.config import settings

logger = logging.getLogger(__name__)

# Cache embeddings model to avoid reloading (memory optimization)
_embeddings_cache = None


def get_embeddings():
    """
    Local embeddings for large-document RAG.
    No API quota. Production safe.
    Uses caching to prevent repeated model loading.
    """
    global _embeddings_cache
    if _embeddings_cache is None:
        logger.info("Loading embeddings model...")
        _embeddings_cache = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return _embeddings_cache


def save_vectorstore(chunks, replace=False):
    """
    Save chunks to vectorstore.
    
    Args:
        chunks: List of document chunks to add
        replace: If True, replace entire vectorstore. If False, merge with existing.
    
    This function ACCUMULATES documents by default, so all uploaded PDFs
    are searchable together.
    """
    embeddings = get_embeddings()
    
    # Check if vectorstore exists and we should merge
    if not replace and os.path.exists(settings.VECTOR_DB_PATH):
        try:
            # Load existing vectorstore
            logger.info("Loading existing vectorstore to merge new documents...")
            existing_db = FAISS.load_local(
                settings.VECTOR_DB_PATH,
                embeddings,
                allow_dangerous_deserialization=True
            )
            
            # Create new vectorstore from new chunks
            new_db = FAISS.from_documents(chunks, embeddings)
            
            # Merge new documents into existing
            existing_db.merge_from(new_db)
            
            # Save merged vectorstore
            existing_db.save_local(settings.VECTOR_DB_PATH)
            logger.info(f"Merged {len(chunks)} new chunks into existing vectorstore")
            
        except Exception as e:
            logger.warning(f"Failed to merge, creating new vectorstore: {e}")
            # Fallback: create new vectorstore
            db = FAISS.from_documents(chunks, embeddings)
            db.save_local(settings.VECTOR_DB_PATH)
    else:
        # Create new vectorstore (first upload or explicit replace)
        logger.info(f"Creating new vectorstore with {len(chunks)} chunks...")
        db = FAISS.from_documents(chunks, embeddings)
        db.save_local(settings.VECTOR_DB_PATH)


def replace_vectorstore(chunks):
    """
    Replace entire vectorstore with new chunks.
    Use this when rebuilding from all uploads.
    """
    save_vectorstore(chunks, replace=True)


def load_vectorstore():
    """
    Load the vectorstore for querying.
    Returns None if vectorstore doesn't exist.
    """
    if not os.path.exists(settings.VECTOR_DB_PATH):
        return None
        
    return FAISS.load_local(
        settings.VECTOR_DB_PATH,
        get_embeddings(),
        allow_dangerous_deserialization=True
    )
