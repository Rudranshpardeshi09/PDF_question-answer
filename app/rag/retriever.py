"""Optimized retriever configuration for speed and accuracy."""

def get_retriever(vectorstore):
    """
    Get a retriever optimized for Q&A tasks with balance of speed and accuracy.
    
    MMR (Max Marginal Relevance) search:
    - k: number of results to return (reduced for speed)
    - fetch_k: candidates to consider before MMR
    - lambda_mult: 1.0 = max relevance, 0.0 = max diversity
    """
    return vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 5,           # Reduced from 8 to 5 for speed
            "fetch_k": 15,    # Reduced from 20 to 15
            "lambda_mult": 0.9  # Higher relevance focus (was 0.85)
        }
    )
