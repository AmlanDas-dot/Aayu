from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.speech.stt_service import transcribe_audio as hybrid_transcribe
import tempfile
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio_route(
    file: UploadFile = File(...), 
    language: str = Form("en")
):
    logger.info(f"Received file for transcription, language: {language}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp:
        temp.write(await file.read())
        temp_path = temp.name

    try:
        text = hybrid_transcribe(temp_path, language)
        return {
            "transcript": text
        }
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail="Speech recognition failed")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)