from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
import logging

from app.services.record_analysis_service import RecordAnalysisService
from app.core.auth import verify_firebase_token
from app.core.rate_limit import limiter

router = APIRouter(prefix="/records", tags=["records"])
logger = logging.getLogger(__name__)

class AnalyzeRecordRequest(BaseModel):
    file_url: str
    mime_type: str

class AnalyzeRecordResponse(BaseModel):
    classification: str
    metadata: dict
    summaries: dict

@router.post("/analyze", response_model=AnalyzeRecordResponse)
@limiter.limit("10/minute")
async def analyze_record(
    request: Request,
    body: AnalyzeRecordRequest,
    token: dict = Depends(verify_firebase_token)
):
    """
    Downloads a medical record from the provided URL, processes it via Gemini Vision/PDF,
    and returns extracted structured data and summaries.
    """
    try:
        service = RecordAnalysisService.get_instance()
        result = await service.analyze_document(body.file_url, body.mime_type)
        return AnalyzeRecordResponse(
            classification=result.get("classification", "Other"),
            metadata=result.get("metadata", {}),
            summaries=result.get("summaries", {})
        )
    except Exception as e:
        logger.error(f"Failed to analyze record: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
