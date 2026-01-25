import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    VECTOR_DB_PATH: str = "app/data/vector_db"
    CHUNK_SIZE: int = 700
    CHUNK_OVERLAP: int = 150
    TOP_K: int = 5

settings = Settings()
