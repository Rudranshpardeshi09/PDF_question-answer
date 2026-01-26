def get_retriever(vectorstore):
    """
    Get a retriever optimized for Q&A tasks.
    
    MMR (Max Marginal Relevance) search:
    - Returns diverse, relevant documents
    - k: number of results to return
    - fetch_k: candidates to consider before MMR
    - lambda_mult: 1.0 = max relevance, 0.0 = max diversity (0.7 = balanced)
    """
    return vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 8,           # Increased from 5 to 8
            "fetch_k": 20,    # Increased from 15 to 20
            "lambda_mult": 0.85  # Higher relevance focus (increased from 0.7)
        }
    )
