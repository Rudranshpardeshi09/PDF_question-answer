import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    VECTOR_DB_PATH: str = "app/data/vector_db"
    CHUNK_SIZE: int = 1000        # Increased from 700 for better context
    CHUNK_OVERLAP: int = 200      # Increased from 150 for better continuity
    TOP_K: int = 8                # Increased from 5

settings = Settings()
