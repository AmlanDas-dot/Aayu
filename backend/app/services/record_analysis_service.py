import os
import json
import logging
import httpx
from pydantic import BaseModel
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

# Prompt defining the exact JSON schema requested by the user
RECORD_ANALYSIS_PROMPT = """
You are a highly capable AI medical assistant. Analyze the provided medical document (which could be an image or PDF) and extract the structured information requested below.

CRITICAL RULES FOR EXTRACTION:
1. Extract data EXACTLY as it appears in the document. DO NOT infer, guess, or calculate values.
2. If a piece of information is not present or illegible, set its value to null or an empty array as per the schema.
3. Return ONLY a valid JSON object matching the schema exactly. Do not include markdown code blocks (e.g., ```json) or any other text outside the JSON.

SCHEMA:
{
  "classification": "Prescription" | "Blood Test" | "Urine Test" | "MRI" | "CT Scan" | "X-Ray" | "ECG" | "Echo" | "Discharge Summary" | "Vaccination" | "Insurance" | "Referral" | "Surgery" | "Prescription Renewal" | "Medical Certificate" | "Other",
  "metadata": {
    "documentTitle": "string or null",
    "hospitalName": "string or null",
    "doctorName": "string or null",
    "visitDate": "YYYY-MM-DD or null",
    "patientName": "string or null",
    "medicines": ["list of strings"] or [],
    "diagnoses": ["list of strings"] or [],
    "labTests": ["list of strings"] or [],
    "importantValues": {"Blood Sugar": "value string", "HbA1c": "value string", "Hemoglobin": "value string", "Creatinine": "value string", "BP": "value string", "Pulse": "value string", "Temperature": "value string", "Weight": "value string", "Height": "value string", "BMI": "value string", "Cholesterol": "value string", "Vitamin D": "value string", "TSH": "value string", "Platelets": "value string", "WBC": "value string", "...other tests": "value string"} or {},
    "prescribedMedications": [
      {
        "medicineName": "string",
        "strength": "string or null",
        "frequency": "string (e.g. '1-0-1', 'Once a day')",
        "timesPerDay": 2,
        "specificTimes": ["08:00", "20:00"] or [],
        "duration": "string or null (e.g. '5 days')",
        "beforeFood": true or false,
        "afterFood": true or false,
        "instructions": "string or null",
        "warnings": "string or null"
      }
    ] or [],
    "followUpDate": "YYYY-MM-DD or null",
    "language": "string",
    "confidenceScore": 0.0 to 100.0 (float)
  },
  "summaries": {
    "aiSummary": "A concise paragraph summarizing the document's main purpose and findings.",
    "shortSummary": "1-2 sentence summary",
    "detailedSummary": "A longer, detailed explanation of the findings, implications, and notes.",
    "keyFindings": ["list of strings"],
    "warnings": ["list of strings, e.g., abnormal values or critical alerts"] or [],
    "recommendedFollowUp": "string or null"
  },
  "extractedText": "The full exact text extracted from the document using OCR. Maintain formatting where possible."
}
"""

class RecordAnalysisService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error("Failed to initialize Gemini Client for records: %s", e)

    async def download_file(self, file_url: str) -> bytes:
        async with httpx.AsyncClient() as client:
            response = await client.get(file_url)
            response.raise_for_status()
            return response.content

    async def analyze_document(self, file_url: str, mime_type: str) -> dict:
        if not self.client:
            raise Exception("Gemini client is not initialized")
            
        logger.info(f"Downloading file for analysis: {file_url}")
        file_bytes = await self.download_file(file_url)
        
        logger.info(f"Analyzing document of type {mime_type} ({len(file_bytes)} bytes)")
        
        part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
        
        try:
            # We use flash as default, it's fast and supports multimodal parsing.
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[part, RECORD_ANALYSIS_PROMPT],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )
            
            result_text = response.text
            if not result_text:
                raise Exception("Empty response from Gemini")
                
            # Clean up potential markdown formatting (just in case, despite instructions and JSON mode)
            result_text = result_text.strip()
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
                
            data = json.loads(result_text)
            return data
            
        except Exception as e:
            logger.error("Error during record analysis: %s", e)
            raise Exception(f"Failed to analyze document: {str(e)}")
