from __future__ import annotations

import os
import io
import logging
from pathlib import Path
from dotenv import load_dotenv
from PIL import Image
from google import genai
from google.genai import types
import asyncio

logger = logging.getLogger(__name__)

# Resolve the .env path relative to this file: backend/app/services/ -> backend/.env
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"

class GeminiVisionService:
    _instance = None

    @classmethod
    def get_instance(cls) -> GeminiVisionService:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error("Failed to initialize Gemini Client: %s", e)

    def validate_image(self, image_bytes: bytes, filename: str, content_type: str | None) -> tuple[bool, str, Image.Image | None]:
        """
        Validate image type, size, and dimensions.
        Returns (is_valid, error_message, PIL Image object if valid)
        """
        logger.info("[GeminiVision] Validating image: filename=%s content_type=%s size=%d bytes",
                    filename, content_type, len(image_bytes))

        # Validate format
        allowed_mimes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
        ext = filename.split(".")[-1].lower() if filename else ""
        
        is_allowed_mime = content_type in allowed_mimes
        is_allowed_ext = ext in ["png", "jpg", "jpeg", "webp"]
        
        if not (is_allowed_mime or is_allowed_ext):
            msg = f"Unsupported image format: {content_type or ext}. Only PNG, JPEG, and WebP are allowed."
            logger.warning("[GeminiVision] Validation failed: %s", msg)
            return False, msg, None

        # Validate size (10 MB limit)
        max_size = 10 * 1024 * 1024
        if len(image_bytes) > max_size:
            msg = "Image file size exceeds the 10MB limit."
            logger.warning("[GeminiVision] Validation failed: %s", msg)
            return False, msg, None

        # Validate resolution using Pillow
        try:
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            logger.info("[GeminiVision] Image dimensions: %dx%d mode=%s", width, height, img.mode)
            if width < 200 or height < 200:
                msg = f"Image resolution too low ({width}x{height}). Minimum required is 200x200 pixels."
                logger.warning("[GeminiVision] Validation failed: %s", msg)
                return False, msg, None
            logger.info("[GeminiVision] Validation passed.")
            return True, "", img
        except Exception as e:
            msg = f"Invalid or corrupt image file: {e}"
            logger.error("[GeminiVision] Validation error: %s", msg)
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

    async def generate_description(self, image_bytes: bytes, filename: str, content_type: str | None) -> tuple[str, list[str]]:
        """
        Validates, optimizes, and sends the image to Gemini 2.5 Flash for visual findings description.
        Returns (description_text, warnings_list)
        """
        logger.info("[GeminiVision] generate_description called: filename=%s", filename)

        # 1. Validation
        is_valid, err_msg, img = self.validate_image(image_bytes, filename, content_type)
        if not is_valid or img is None:
            logger.error("[GeminiVision] Validation rejected image: %s", err_msg)
            raise ValueError(err_msg)

        # 2. Optimization
        logger.info("[GeminiVision] Optimization started.")
        opt_bytes, opt_mime = self.optimize_image(img)
        logger.info("[GeminiVision] Optimization complete: %d bytes -> %d bytes (%s)",
                    len(image_bytes), len(opt_bytes), opt_mime)
        
        # Check API Key — re-read from disk so the key is picked up even if
        # the server started before .env was created or the key was changed.
        load_dotenv(_ENV_PATH, override=True)
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        logger.info("[GeminiVision] GEMINI_API_KEY present: %s", bool(self.api_key))
        if not self.api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured. "
                f"Open {_ENV_PATH} and set GEMINI_API_KEY=<your key>."
            )

        # Lazily initialize client if needed
        if self.client is None:
            logger.info("[GeminiVision] Lazily initializing Gemini client.")
            self.client = genai.Client(api_key=self.api_key)

        # 3. Prompt definition
        prompt = (
            "You are assisting a healthcare information chatbot.\n\n"
            "Carefully examine the uploaded image.\n\n"
            "Only describe observable visual findings.\n\n"
            "Do NOT diagnose.\n\n"
            "Do NOT identify diseases as certain.\n\n"
            "Mention uncertainty whenever appropriate.\n\n"
            "Describe:\n"
            "* Color\n"
            "* Shape\n"
            "* Size\n"
            "* Texture\n"
            "* Swelling\n"
            "* Redness\n"
            "* Bleeding\n"
            "* Symmetry\n"
            "* Visible abnormalities\n\n"
            "If the image quality is poor, clearly mention that.\n\n"
            "If the image is not medical in nature, state that.\n\n"
            "Return only a concise description of observable findings."
        )

        warnings = []
        orig_w, orig_h = img.size
        if orig_w > 1280 or orig_h > 1280:
            warnings.append("Image was resized to optimize transmission times.")

        # 4. Asynchronous Client Execution
        # FIX: use asyncio.get_running_loop() instead of deprecated get_event_loop()
        # inside an already-running async context (FastAPI/uvicorn event loop)
        loop = asyncio.get_running_loop()
        
        def call_gemini():
            logger.info("[GeminiVision] Sending image to Gemini API (gemini-2.5-flash)...")
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    types.Part.from_bytes(
                        data=opt_bytes,
                        mime_type=opt_mime,
                    ),
                    prompt
                ]
            )
            logger.info("[GeminiVision] Gemini API responded.")
            return response.text

        try:
            description = await loop.run_in_executor(None, call_gemini)
            if not description:
                raise RuntimeError("Gemini returned an empty response.")
            
            description_text = description.strip()
            logger.info("[GeminiVision] Description received (%d chars).", len(description_text))

            desc_lower = description_text.lower()
            if any(w in desc_lower for w in ["poor quality", "blurry", "low resolution", "out of focus", "dark"]):
                warnings.append("Image quality may limit interpretation.")
                
            return description_text, warnings
        except Exception as e:
            logger.error("[GeminiVision] Gemini API call error: %s", e, exc_info=True)
            raise RuntimeError(f"Gemini API execution failed: {e}")
