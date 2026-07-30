import os
import base64
import logging
import json
import time
import traceback
from typing import Dict, Any, Tuple, List
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class PossibleCondition(BaseModel):
    name: str
    confidence: float

class StructuredHealthGuidance(BaseModel):
    imageDescription: str
    possibleConditions: List[PossibleCondition]
    urgency: str = Field(description="Must be one of: Low | Moderate | High | Emergency")
    recommendations: List[str]
    redFlags: List[str]
    disclaimer: str = Field(default="This is not a diagnosis. Please consult a healthcare professional.")

class MedicalVisionService:
    _instance = None

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("[MedicalVisionService] OPENAI_API_KEY is not set.")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        
        # Simple in-memory rate limiting (max 10 requests per minute)
        self.rate_limit_window = 60
        self.max_requests = 10
        self.request_timestamps = []

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _check_rate_limit(self):
        now = time.time()
        # Clean up old timestamps
        self.request_timestamps = [t for t in self.request_timestamps if now - t < self.rate_limit_window]
        
        if len(self.request_timestamps) >= self.max_requests:
            raise RuntimeError("Rate limit exceeded. Please try again in a minute.")
        
        self.request_timestamps.append(now)

    async def analyze_medical_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
        """
        Sends the image to OpenAI GPT-4o Vision to strictly extract visible findings and OCR text.
        Never diagnoses.
        """
        if not self.client:
            raise RuntimeError("OpenAI API key is missing. Please configure OPENAI_API_KEY.")

        self._check_rate_limit()

        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        
        system_prompt = (
            "You are a highly analytical medical image observation system. Your ONLY job is to describe visible findings and extract text (OCR).\n"
            "CRITICAL RULES:\n"
            "1. NEVER DIAGNOSE. NEVER name a disease or condition (e.g., do NOT say 'ringworm', 'melanoma', 'pink eye').\n"
            "2. Strictly describe physical characteristics: color, shape, size estimation, texture, scaling, location, redness, swelling, etc.\n"
            "3. If text is visible (e.g., prescriptions, reports), extract ALL text verbatim.\n"
            "4. Do not hallucinate or infer details that are not clearly visible.\n"
            "Example of GOOD output: 'Red circular lesion approximately 3 cm with mild scaling on the skin.'\n"
            "Example of BAD output: 'You have ringworm.'"
        )

        try:
            # We use a simple retry wrapper
            for attempt in range(3):
                try:
                    response = await self.client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": "Please observe this image and describe the findings or extract the text."},
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:{mime_type};base64,{b64_img}",
                                            "detail": "high"
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens=800,
                        temperature=0.0
                    )
                    
                    content = response.choices[0].message.content
                    if not content:
                        raise ValueError("Received empty response from OpenAI.")
                    
                    return content.strip()
                    
                except Exception as e:
                    if attempt == 2:
                        raise e
                    logger.warning(f"OpenAI API error on attempt {attempt+1}: {e}")
                    time.sleep(1.5 ** attempt) # Exponential backoff
                    
        except Exception as e:
            logger.error(f"[MedicalVisionService] Failed to analyze image: {e}")
            logger.error(traceback.format_exc())
            raise RuntimeError(f"Failed to process medical image: {str(e)}")

    async def generate_structured_health_guidance(self, description: str, rag_context: str, user_question: str) -> StructuredHealthGuidance:
        """
        Takes the extracted vision description and the RAG context, and synthesizes it into the final JSON.
        """
        if not self.client:
            raise RuntimeError("OpenAI API key is missing.")
            
        system_prompt = (
            "You are a medical informatics AI designed to provide structured health guidance based on visual findings and RAG context.\n"
            "CRITICAL RULES:\n"
            "1. DO NOT provide definitive diagnoses. Use 'possibleConditions' with a confidence score.\n"
            "2. SAFETY FIRST: If the user question or findings suggest rapidly spreading burns, major bleeding, severe swelling, or any life-threatening presentation, you MUST classify urgency as 'Emergency' and advise seeking immediate medical care.\n"
            "3. Synthesize the visual findings, user question, and verified medical context accurately without guessing.\n"
            "4. Output MUST follow the strictly requested JSON schema."
        )
        
        user_prompt = f"User Question: {user_question}\n\nVisible Findings from Image: {description}\n\nMedical Context (RAG): {rag_context}"
        
        try:
            # We use the beta parse feature to enforce the JSON schema
            response = await self.client.beta.chat.completions.parse(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format=StructuredHealthGuidance,
                temperature=0.2
            )
            
            return response.choices[0].message.parsed
            
        except Exception as e:
            logger.error(f"[MedicalVisionService] Failed to generate structured guidance: {e}")
            logger.error(traceback.format_exc())
            raise RuntimeError(f"Failed to generate structured guidance: {str(e)}")

