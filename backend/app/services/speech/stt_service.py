import logging
from app.services.speech.sarvam_service import transcribe as sarvam_transcribe

logger = logging.getLogger(__name__)

def transcribe_audio(file_path: str, language: str) -> str:
    """
    STT pipeline:
    - Hindi, Gujarati, Odia -> Sarvam AI
    - English -> Should be handled by Frontend (Browser Web Speech API)
    """
    supported_sarvam_langs = ["hi", "gu", "or"]
    
    if language in supported_sarvam_langs:
        logger.info(f"Attempting Sarvam AI transcription for {language}")
        transcript = sarvam_transcribe(file_path, language)
        if transcript:
            return transcript
        else:
            logger.error("Sarvam returned empty transcript")
            raise RuntimeError("Speech recognition failed")
    
    logger.error(f"Unsupported language for backend STT: {language}")
    raise RuntimeError("Speech recognition failed")
