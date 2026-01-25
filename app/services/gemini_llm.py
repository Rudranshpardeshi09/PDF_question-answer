import google.generativeai as genai
from functools import lru_cache
from app.core.config import settings


@lru_cache(maxsize=1)
def get_working_model():
    """
    Automatically selects a Gemini model that supports text generation.
    Works on free tier. No hardcoded model names.
    """
    genai.configure(api_key=settings.GEMINI_API_KEY)

    for model in genai.list_models():
        if "generateContent" in model.supported_generation_methods:
            print(f"[Gemini] Using model: {model.name}")
            return genai.GenerativeModel(model.name)

    raise RuntimeError("No compatible Gemini model found")


def generate_text(prompt: str) -> str:
    model = get_working_model()
    response = model.generate_content(prompt)
    return response.text
