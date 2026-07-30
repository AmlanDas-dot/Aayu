import os
import tempfile
from typing import List

class Settings:
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # External APIs (Validation performed at startup)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    WEATHERAPI_KEY: str = os.getenv("WEATHERAPI_KEY", "")
    NEWSDATA_API_KEY: str = os.getenv("NEWSDATA_API_KEY", "")
    VITE_GOOGLE_MAPS_API_KEY: str = os.getenv("VITE_GOOGLE_MAPS_API_KEY", "")
    GOOGLE_PLACES_API_KEY: str = os.getenv("GOOGLE_PLACES_API_KEY", "")
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    
    # LLM & Local Models
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    
    # NLP & Speech Models
    INDICTRANS2_MODEL_PATH: str = os.getenv("INDICTRANS2_MODEL_PATH", "ai4bharat/indictrans2-indic-en-1B")
    INDICTRANS2_MODEL_PATH_EN: str = os.getenv("INDICTRANS2_MODEL_PATH_EN", "ai4bharat/indictrans2-en-indic-1B")
    
    # Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", tempfile.gettempdir())
    
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        origins = os.getenv("ALLOWED_ORIGINS")
        if origins:
            return [o.strip() for o in origins.split(",")]
        # Dev fallback. In production, this resolves to [] if not explicitly configured.
        if self.ENVIRONMENT == "development":
            return [
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:4173",
                "http://localhost:5174",
            ]
        return []

settings = Settings()

# Fast-fail configuration assertions for production
if settings.ENVIRONMENT == "production":
    if not settings.OLLAMA_BASE_URL and not settings.OPENAI_API_KEY and not settings.GROQ_API_KEY and not settings.GEMINI_API_KEY:
        print("Warning: No AI provider configured in production.")
