from langchain_core.prompts import PromptTemplate

RAG_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are a document question-answering assistant.

Rules:
- Answer strictly from the provided context
- If the answer is not present, say: "Not found in the document"
- Cite page numbers clearly

Context:
{context}

Question:
{question}

Answer (include page numbers):
"""
)
