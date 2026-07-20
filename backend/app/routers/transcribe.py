from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.speech.stt_service import transcribe_audio as hybrid_transcribe
import tempfile
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", tempfile.gettempdir())
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/transcribe")
async def transcribe_audio_route(
    file: UploadFile = File(...), 
    language: str = Form("en")
):
    if not file.filename.endswith(".webm"):
        # We'll just warn but continue in case other formats are passed
        pass

    logger.info(f"Received file for transcription, language: {language}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm", dir=UPLOAD_DIR) as temp:
        content = await file.read()
        temp.write(content)
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