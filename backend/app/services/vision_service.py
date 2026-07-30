from __future__ import annotations

import io
import json
import base64
import logging
from pathlib import Path
from dotenv import load_dotenv
from PIL import Image
import httpx
from google import genai
from google.genai import types
import asyncio

logger = logging.getLogger(__name__)

# Resolve the .env path relative to this file: backend/app/services/ -> backend/.env
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"

class VisionService:
    _instance = None

    @classmethod
    def get_instance(cls) -> VisionService:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        load_dotenv(_ENV_PATH, override=True)
        self.groq_api_key = settings.GROQ_API_KEY
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.gemini_client = None
        if self.gemini_api_key:
            try:
                self.gemini_client = genai.Client(api_key=self.gemini_api_key)
            except Exception as e:
                logger.error("Failed to initialize Gemini Client: %s", e)

    def validate_image(self, image_bytes: bytes, filename: str, content_type: str | None) -> tuple[bool, str, Image.Image | None]:
        """
        Validate image type, size, and dimensions.
        Returns (is_valid, error_message, PIL Image object if valid)
        """
        logger.info("[VisionService] Validating image: filename=%s content_type=%s size=%d bytes",
                    filename, content_type, len(image_bytes))

        # Validate format
        allowed_mimes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
        ext = filename.split(".")[-1].lower() if filename else ""
        
        is_allowed_mime = content_type in allowed_mimes
        is_allowed_ext = ext in ["png", "jpg", "jpeg", "webp"]
        
        if not (is_allowed_mime or is_allowed_ext):
            msg = f"Unsupported image format: {content_type or ext}. Only PNG, JPEG, and WebP are allowed."
            logger.warning("[VisionService] Validation failed: %s", msg)
            return False, msg, None

        # Validate size (10 MB limit)
        max_size = 10 * 1024 * 1024
        if len(image_bytes) > max_size:
            msg = "Image file size exceeds the 10MB limit."
            logger.warning("[VisionService] Validation failed: %s", msg)
            return False, msg, None

        # Validate resolution using Pillow
        try:
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            logger.info("[VisionService] Image dimensions: %dx%d mode=%s", width, height, img.mode)
            if width < 200 or height < 200:
                msg = f"Image resolution too low ({width}x{height}). Minimum required is 200x200 pixels."
                logger.warning("[VisionService] Validation failed: %s", msg)
                return False, msg, None
            logger.info("[VisionService] Validation passed.")
            return True, "", img
        except Exception as e:
            msg = f"Invalid or corrupt image file: {e}"
            logger.error("[VisionService] Validation error: %s", msg)
            return False, msg, None

    def optimize_image(self, img: Image.Image) -> tuple[bytes, str]:
        """
        Resize image if long edge > 1280px.
        Compress to JPEG 80% quality.
        Returns (optimized_image_bytes, mime_type)
        """
        max_dim = 1280
        width, height = img.size
        
        if width > max_dim or height > max_dim:
            if width > height:
                new_width = max_dim
                new_height = int(height * (max_dim / width))
            else:
                new_height = max_dim
                new_width = int(width * (max_dim / height))
            
            logger.info("Resizing image from %dx%d to %dx%d", width, height, new_width, new_height)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Convert RGBA/palette modes to RGB for JPEG compression
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            mask = img.split()[3] if img.mode == "RGBA" else None
            background.paste(img, mask=mask)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Save compressed JPEG to memory (no disk usage)
        output_buffer = io.BytesIO()
        img.save(output_buffer, format="JPEG", quality=80)
        optimized_bytes = output_buffer.getvalue()
        
        return optimized_bytes, "image/jpeg"

    async def generate_description(self, image_bytes: bytes, filename: str, content_type: str | None) -> tuple[str, list[str], bool]:
        """
        Validates, optimizes, and sends the image to Groq or Gemini for visual findings description.
        Returns (description_text, warnings_list, is_medical_record)
        """
        logger.info("[VisionService] generate_description called: filename=%s", filename)

        # 1. Validation
        is_valid, err_msg, img = self.validate_image(image_bytes, filename, content_type)
        if not is_valid or img is None:
            logger.error("[VisionService] Validation rejected image: %s", err_msg)
            raise ValueError(err_msg)

        # 2. Optimization
        logger.info("[VisionService] Optimization started.")
        opt_bytes, opt_mime = self.optimize_image(img)
        logger.info("[VisionService] Optimization complete: %d bytes -> %d bytes (%s)",
                    len(image_bytes), len(opt_bytes), opt_mime)
        
        # Reload keys
        load_dotenv(_ENV_PATH, override=True)
        self.groq_api_key = settings.GROQ_API_KEY
        self.gemini_api_key = settings.GEMINI_API_KEY
        
        if not self.groq_api_key and not self.gemini_api_key:
            raise RuntimeError("Neither GROQ_API_KEY nor GEMINI_API_KEY is configured.")

        # 3. Prompt definition
        prompt = (
            "You are assisting a healthcare information chatbot.\n\n"
            "Carefully examine the uploaded image.\n\n"
            "Only describe observable visual findings. Do NOT diagnose. "
            "Do NOT identify diseases as certain. Mention uncertainty whenever appropriate.\n\n"
            "If the image is a medical record (like a lab report, prescription, scan, bill, discharge summary), extract the key text and findings.\n\n"
            "Return ONLY a valid JSON object matching this schema exactly. Ensure it is valid JSON and contains no extra text or markdown formatting:\n"
            "{\n"
            '  "description": "Concise description of observable findings, or transcription of the medical record text",\n'
            '  "is_medical_record": true if it is a medical document/report/scan, false otherwise\n'
            "}"
        )

        warnings = []
        orig_w, orig_h = img.size
        if orig_w > 1280 or orig_h > 1280:
            warnings.append("Image was resized to optimize transmission times.")

        description_text = ""
        is_medical_record = False

        if self.groq_api_key:
            logger.info("[VisionService] Sending image to Groq API (llama-3.2-11b-vision-preview)...")
            base64_image = base64.b64encode(opt_bytes).decode('utf-8')
            
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "llama-3.2-11b-vision-preview",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{opt_mime};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                "temperature": 0.2
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                if resp.status_code != 200:
                    logger.error("[VisionService] Groq API returned %s: %s", resp.status_code, resp.text)
                    raise RuntimeError(f"Groq API returned {resp.status_code}: {resp.text}")
                
                resp_json = resp.json()
                content = resp_json["choices"][0]["message"]["content"]
                
                try:
                    import re
                    content_clean = re.sub(r"```json\s*", "", content)
                    content_clean = re.sub(r"```\s*", "", content_clean).strip()
                    data = json.loads(content_clean)
                    description_text = data.get("description", "").strip()
                    is_medical_record = data.get("is_medical_record", False)
                except json.JSONDecodeError:
                    logger.error("[VisionService] Failed to parse Groq response as JSON. Raw response: %s", content)
                    raise RuntimeError("Failed to parse Groq vision response.")
                    
        else:
            logger.info("[VisionService] Sending image to Gemini API (gemini-2.5-flash)...")
            if self.gemini_client is None:
                self.gemini_client = genai.Client(api_key=self.gemini_api_key)

            loop = asyncio.get_running_loop()
            
            def call_gemini():
                response = self.gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[
                        types.Part.from_bytes(data=opt_bytes, mime_type=opt_mime),
                        prompt
                    ],
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                return response.text
                
            try:
                result_json = await loop.run_in_executor(None, call_gemini)
                if not result_json:
                    raise RuntimeError("Gemini returned an empty response.")
                
                data = json.loads(result_json)
                description_text = data.get("description", "").strip()
                is_medical_record = data.get("is_medical_record", False)
            except Exception as e:
                logger.error("[VisionService] Gemini API call error: %s", e, exc_info=True)
                raise RuntimeError(f"Gemini API execution failed: {e}")

        logger.info(f"[VisionService] Description received ({len(description_text)} chars), is_medical_record={is_medical_record}")

        desc_lower = description_text.lower()
        if any(w in desc_lower for w in ["poor quality", "blurry", "low resolution", "out of focus", "dark"]):
            warnings.append("Image quality may limit interpretation.")
            
        return description_text, warnings, is_medical_record
