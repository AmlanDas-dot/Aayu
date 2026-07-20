from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.recovery_service import RecoveryService

router = APIRouter(tags=["Recovery & Behavioral Health"])

class JournalRequest(BaseModel):
    patient_id: str
    entry: str

class MoodRequest(BaseModel):
    patient_id: str
    mood_score: int
    condition: str

class ScreeningRequest(BaseModel):
    patient_id: str
    screening_type: str
    score: int
    responses: dict

@router.post("/journal")
async def add_journal_entry(req: JournalRequest):
    try:
        result = await RecoveryService.analyze_and_save_journal(req.patient_id, req.entry)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mood")
async def log_mood(req: MoodRequest):
    try:
        result = await RecoveryService.log_mood(req.patient_id, req.mood_score, req.condition)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data/{patient_id}")
async def get_patient_recovery_data(patient_id: str):
    try:
        result = await RecoveryService.get_recovery_data(patient_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/screening")
async def log_screening(req: ScreeningRequest):
    try:
        result = await RecoveryService.process_screening(req.patient_id, req.screening_type, req.score, req.responses)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/missions/{patient_id}")
async def get_missions(patient_id: str):
    try:
        result = await RecoveryService.get_daily_missions(patient_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
