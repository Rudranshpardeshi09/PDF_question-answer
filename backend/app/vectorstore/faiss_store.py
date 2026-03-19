# this file manages our FAISS vector database where we store PDF embeddings
# embeddings are numerical representations of text that allow us to search by meaning

import logging
import os
import threading

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

from app.core.config import settings

logger = logging.getLogger(__name__)

# we cache the embeddings model so it only loads once (it takes time to load)
_embeddings_cache = None
_embeddings_lock = threading.Lock()
_vectorstore_cache = None
_vectorstore_fingerprint = None
_vectorstore_lock = threading.RLock()


def _get_vectorstore_fingerprint():
    faiss_path = os.path.join(settings.VECTOR_DB_PATH, "index.faiss")
    pkl_path = os.path.join(settings.VECTOR_DB_PATH, "index.pkl")
    if not (os.path.exists(faiss_path) and os.path.exists(pkl_path)):
        return None
    return (
        os.path.getmtime(faiss_path),
        os.path.getmtime(pkl_path),
        os.path.getsize(faiss_path),
        os.path.getsize(pkl_path),
    )


def _invalidate_vectorstore_cache():
    global _vectorstore_cache, _vectorstore_fingerprint
    _vectorstore_cache = None
    _vectorstore_fingerprint = None


# loads the embedding model that converts text into numbers the AI can search
def get_embeddings():
    global _embeddings_cache
    if _embeddings_cache is None:
        with _embeddings_lock:
            if _embeddings_cache is None:
                logger.info("Loading embeddings model...")
                try:
                    _embeddings_cache = HuggingFaceEmbeddings(
                        model_name="sentence-transformers/all-MiniLM-L6-v2",
                        encode_kwargs={
                            "normalize_embeddings": True,
                            "batch_size": settings.EMBEDDING_BATCH_SIZE,
                        },
                    )
                    logger.info("Embeddings model loaded successfully")
                except Exception as e:
                    logger.error(f"Failed to load embeddings model: {e}")
                    raise
    return _embeddings_cache


# saves new text chunks into our vector database
def save_vectorstore(chunks, replace=False):
    if not chunks:
        logger.warning("Cannot save empty chunk list")
        return

    embeddings = get_embeddings()

    if not settings.VECTOR_DB_PATH:
        raise ValueError("VECTOR_DB_PATH not configured")

    os.makedirs(os.path.dirname(settings.VECTOR_DB_PATH) or ".", exist_ok=True)

    with _vectorstore_lock:
        if not replace and os.path.exists(settings.VECTOR_DB_PATH):
            try:
                logger.info("Loading existing vectorstore to merge new documents...")
                existing_db = FAISS.load_local(
                    settings.VECTOR_DB_PATH,
                    embeddings,
                    allow_dangerous_deserialization=True,
                )

                existing_chunk_ids = {
                    doc.metadata.get("chunk_id")
                    for doc in existing_db.docstore._dict.values()
                    if getattr(doc, "metadata", None)
                }
                filtered_chunks = [
                    chunk
                    for chunk in chunks
                    if chunk.metadata.get("chunk_id") not in existing_chunk_ids
                ]

                if not filtered_chunks:
                    logger.info("Skipped vectorstore merge because all chunks were already indexed")
                    return

                new_db = FAISS.from_documents(filtered_chunks, embeddings)
                existing_db.merge_from(new_db)
                existing_db.save_local(settings.VECTOR_DB_PATH)
                _invalidate_vectorstore_cache()
                logger.info("Merged %s new chunks into existing vectorstore", len(filtered_chunks))
                return
            except Exception as e:
                logger.error("Failed to merge vectorstore: %s. Creating fresh database...", e)

        try:
            logger.info("Creating new vectorstore with %s chunks...", len(chunks))
            db = FAISS.from_documents(chunks, embeddings)
            db.save_local(settings.VECTOR_DB_PATH)
            _invalidate_vectorstore_cache()
            logger.info("Vectorstore created and saved successfully")
        except Exception as e:
            logger.error("Failed to create vectorstore: %s", e)
            raise


# completely replaces the database (used after deleting a PDF to rebuild from scratch)
def replace_vectorstore(chunks):
    save_vectorstore(chunks, replace=True)


# loads the vector database from disk so we can search it
def load_vectorstore():
    global _vectorstore_cache, _vectorstore_fingerprint

    if not os.path.exists(settings.VECTOR_DB_PATH):
        logger.warning("Vectorstore not found at %s", settings.VECTOR_DB_PATH)
        return None

    with _vectorstore_lock:
        fingerprint = _get_vectorstore_fingerprint()
        if fingerprint is None:
            return None

        if _vectorstore_cache is not None and _vectorstore_fingerprint == fingerprint:
            return _vectorstore_cache

        try:
            logger.info("Loading vectorstore from %s", settings.VECTOR_DB_PATH)
            db = FAISS.load_local(
                settings.VECTOR_DB_PATH,
                get_embeddings(),
                allow_dangerous_deserialization=True
            )
            _vectorstore_cache = db
            _vectorstore_fingerprint = fingerprint
            logger.info("Vectorstore loaded successfully")
            return db
        except Exception as e:
            logger.error("Failed to load vectorstore: %s", e)
            raise
