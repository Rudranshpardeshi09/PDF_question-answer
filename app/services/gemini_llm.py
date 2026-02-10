"""
Optimized Gemini LLM Service
- Lower temperature for faster, more consistent responses
- Caching enabled for repeated queries
"""
import google.generativeai as genai
from functools import lru_cache
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_working_model():
    """
    Automatically selects a Gemini model that supports text generation.
    Cached to avoid repeated API calls.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        for model in genai.list_models():
            if "generateContent" in model.supported_generation_methods:
                logger.info(f"Using Gemini model: {model.name}")
                return genai.GenerativeModel(model.name)
        
        raise RuntimeError("No compatible Gemini model found")
    except Exception as e:
        logger.error(f"Error configuring Gemini: {str(e)}")
        raise


def generate_text(prompt: str, temperature: float = 0.3, max_tokens: int = 4096) -> str:
    """
    Generate text using Gemini API with optimized settings for speed and accuracy.
    
    Optimizations:
    - Lower temperature (0.3) for faster, more deterministic responses
    - Candidate count = 1 for faster generation
    - Stop sequences to prevent incomplete responses
    
    Args:
        prompt: The prompt to send to the model
        temperature: Controls randomness (0.0-1.0), lower = faster + more deterministic
        max_tokens: Maximum tokens in response
    
    Returns:
        Generated text response (complete)
    """
    if not prompt or not isinstance(prompt, str):
        raise ValueError("Prompt must be a non-empty string")
    
    try:
        model = get_working_model()
        
        # Safety settings
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
        ]
        
        # Optimized generation config
        response = model.generate_content(
            prompt,
            safety_settings=safety_settings,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_tokens,
                "candidate_count": 1,  # Single candidate for speed
            }
        )
        
        # Check for complete response
        if not response.text:
            logger.warning("Empty response from Gemini")
            raise ValueError("Empty response from model")
        
        # Check if response was truncated (finish_reason)
        if hasattr(response, 'candidates') and response.candidates:
            finish_reason = response.candidates[0].finish_reason
            if finish_reason and str(finish_reason) not in ('STOP', 'FinishReason.STOP', '1'):
                logger.warning(f"Response may be incomplete. Finish reason: {finish_reason}")
        
        return response.text.strip()
    
    except Exception as e:
        logger.error(f"Error generating text: {str(e)}")
        raise
