import os
import requests
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

SARVAM_URL = "https://api.sarvam.ai/speech-to-text"

def transcribe(file_path: str, language: str) -> str:
    # Read API key dynamically at call time
    SARVAM_API_KEY = settings.SARVAM_API_KEY
    if not SARVAM_API_KEY:
        raise ValueError("SARVAM_API_KEY is not set in the environment.")
    
    # Map languages
    lang_map = {
        "hi": "hi-IN",
        "gu": "gu-IN",
        "or": "od-IN"
    }
    sarvam_lang = lang_map.get(language, "hi-IN")

    headers = {
        "api-subscription-key": SARVAM_API_KEY
    }

    data = {
        "model": "saaras:v3",
        "mode": "transcribe",
        "language_code": sarvam_lang,
    }

    with open(file_path, "rb") as f:
        files = {
            "file": (os.path.basename(file_path), f, "audio/wav")
        }
        
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(SARVAM_URL, headers=headers, data=data, files=files)
                response.raise_for_status()
                
                res_data = response.json()

                print("\n========== SARVAM RESPONSE ==========")
                print(res_data)
                print("=====================================\n")

                transcript = res_data.get("transcript", "")
                return transcript
        except Exception as e:
            logger.error(f"Sarvam API error: {e}")
            raise
