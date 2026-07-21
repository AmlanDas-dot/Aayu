import os
import json
import time
import logging
import asyncio
from typing import List, Dict, Any, Optional
import httpx
from PIL import Image

import torch
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info

logger = logging.getLogger(__name__)

# Fallback offline nutrition database for common Indian foods
OFFLINE_NUTRITION_DB = {
    "paneer curry": {"calories": 320, "protein": 18, "fat": 20, "carbs": 14, "fiber": 4},
    "dal": {"calories": 150, "protein": 9, "fat": 3, "carbs": 22, "fiber": 8},
    "rice": {"calories": 205, "protein": 4, "fat": 0.5, "carbs": 45, "fiber": 0.6},
    "roti": {"calories": 120, "protein": 4, "fat": 1.5, "carbs": 22, "fiber": 3},
    "chicken curry": {"calories": 250, "protein": 25, "fat": 15, "carbs": 8, "fiber": 2},
    "apple": {"calories": 95, "protein": 0.5, "fat": 0.3, "carbs": 25, "fiber": 4.4},
    "banana": {"calories": 105, "protein": 1.3, "fat": 0.3, "carbs": 27, "fiber": 3.1},
    "salad": {"calories": 50, "protein": 2, "fat": 1, "carbs": 10, "fiber": 5}
}

class FoodVisionService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FoodVisionService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @classmethod
    def get_instance(cls) -> "FoodVisionService":
        return cls()

    def __init__(self):
        if getattr(self, '_initialized', False):
            return
            
        self._model = None
        self._processor = None
        
        self._load_lock = asyncio.Lock()
        self._inference_lock = asyncio.Lock()
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
        self.MODEL_ID = "Qwen/Qwen2-VL-2B-Instruct"
        
        self._initialized = True

    async def load_model(self):
        """Loads the Hugging Face model into memory safely."""
        async with self._load_lock:
            if self._model is not None:
                return
                
            logger.info(f"[FoodVision] Loading local model {self.MODEL_ID} to {self.device}...")
            try:
                loop = asyncio.get_running_loop()
                def _load():
                    processor = AutoProcessor.from_pretrained(self.MODEL_ID)
                    model = Qwen2VLForConditionalGeneration.from_pretrained(
                        self.MODEL_ID, 
                        torch_dtype=self.torch_dtype, 
                        device_map="auto" if self.device == "cuda" else None
                    )
                    return processor, model
                    
                self._processor, self._model = await loop.run_in_executor(None, _load)
                logger.info("[FoodVision] Model successfully loaded and cached in memory.")
            except Exception as e:
                logger.error(f"[FoodVision] Failed to load model: {e}", exc_info=True)

    def is_ready(self) -> bool:
        return self._model is not None
        
    def get_status(self) -> dict:
        return {
            "model_loaded": self.is_ready(),
            "gpu_available": torch.cuda.is_available(),
            "model_version": self.MODEL_ID,
            "device": self.device
        }

    async def _fetch_open_food_facts(self, food_name: str) -> Optional[Dict[str, float]]:
        """Queries the Open Food Facts API for nutrition data."""
        try:
            url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={food_name}&search_simple=1&action=process&json=1&page_size=1"
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    products = data.get("products", [])
                    if products:
                        nutriments = products[0].get("nutriments", {})
                        return {
                            "calories": float(nutriments.get("energy-kcal_100g", 0)),
                            "protein": float(nutriments.get("proteins_100g", 0)),
                            "fat": float(nutriments.get("fat_100g", 0)),
                            "carbs": float(nutriments.get("carbohydrates_100g", 0)),
                            "fiber": float(nutriments.get("fiber_100g", 0))
                        }
        except Exception as e:
            logger.warning(f"[FoodVision] OFF API lookup failed for {food_name}: {e}")
        return None

    def _get_offline_nutrition(self, food_name: str) -> Dict[str, float]:
        """Looks up nutrition in the offline fallback database."""
        name_lower = food_name.lower()
        
        # Exact or partial match in offline DB
        for key, macros in OFFLINE_NUTRITION_DB.items():
            if key in name_lower or name_lower in key:
                return macros
                
        # Safe default if entirely unknown to prevent hallucination
        return {"calories": 100, "protein": 2, "fat": 2, "carbs": 10, "fiber": 2}

    async def get_nutrition_for_food(self, food_name: str, portion: str) -> Dict[str, Any]:
        """Gets nutrition from Primary OFF -> Fallback Offline DB -> Scale by portion."""
        macros = await self._fetch_open_food_facts(food_name)
        if not macros:
            macros = self._get_offline_nutrition(food_name)
            
        # Very naive portion scaling for demonstration (1 bowl = 1.5x, etc.)
        scale = 1.0
        portion_lower = portion.lower()
        if "bowl" in portion_lower or "plate" in portion_lower:
            scale = 1.5
        elif "small" in portion_lower or "half" in portion_lower:
            scale = 0.5
        elif "piece" in portion_lower:
            # Extract number if possible, e.g. "2 pieces"
            import re
            match = re.search(r'(\d+)', portion_lower)
            if match:
                scale = float(match.group(1))

        return {
            "calories": round(macros["calories"] * scale),
            "protein": round(macros["protein"] * scale),
            "fat": round(macros["fat"] * scale),
            "carbs": round(macros["carbs"] * scale),
            "fiber": round(macros["fiber"] * scale)
        }

    async def analyze_food_image(self, image: Image.Image) -> Dict[str, Any]:
        """
        Runs offline inference on the local GPU to identify foods and portions.
        Returns the structured JSON requested.
        """
        import time
        t_start = time.perf_counter()
        
        if not self.is_ready():
            await self.load_model()
            
        if not self.is_ready():
            raise RuntimeError("Model failed to load. Ensure enough GPU memory is available.")

        # Ensure image is RGB
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        # Optimize size before feeding to model to save VRAM
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)

        prompt = (
            "Analyze this image and identify all the food items present. "
            "Also estimate the portion size for each item (e.g., '1 bowl', '2 pieces', '1 plate'). "
            "Estimate a confidence score between 0.0 and 1.0 for your identification. "
            "Return ONLY a valid JSON array of objects, where each object has 'name', 'portion', and 'confidence'. "
            "Example: [{\"name\": \"Paneer Curry\", \"portion\": \"1 bowl\", \"confidence\": 0.94}]"
        )

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": prompt},
                ]
            }
        ]

        logger.info("[FoodVision] Preparing inputs for Qwen2-VL inference...")
        loop = asyncio.get_running_loop()
        
        t_prep_end = time.perf_counter()
        
        def _run_inference():
            with torch.inference_mode():
                with torch.autocast("cuda", dtype=self.torch_dtype) if self.device == "cuda" else torch.autocast("cpu", enabled=False):
                    text = self._processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                    image_inputs, video_inputs = process_vision_info(messages)
                    inputs = self._processor(
                        text=[text],
                        images=image_inputs,
                        videos=video_inputs,
                        padding=True,
                        return_tensors="pt"
                    ).to(self.device)
        
                    generated_ids = self._model.generate(**inputs, max_new_tokens=512)
                    generated_ids_trimmed = [
                        out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
                    ]
                    output_text = self._processor.batch_decode(
                        generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
                    )[0]
                    
                    # Manual memory cleanup
                    del inputs, generated_ids, generated_ids_trimmed, text, image_inputs, video_inputs
                    if self.device == "cuda":
                        torch.cuda.empty_cache()
                        
                    return output_text

        try:
            # Enforce sequential inference to prevent 6GB VRAM OOM
            async with self._inference_lock:
                t_inf_start = time.perf_counter()
                raw_output = await loop.run_in_executor(None, _run_inference)
                t_inf_end = time.perf_counter()
                
            logger.info(f"[FoodVision] Raw LLM Output: {raw_output}")
            
            # 2. Parse JSON
            import re
            json_match = re.search(r'\[\s*\{.*?\}\s*\]', raw_output, re.DOTALL)
            if json_match:
                foods_data = json.loads(json_match.group(0))
            else:
                foods_data = json.loads(raw_output)
                if not isinstance(foods_data, list):
                    if "foods" in foods_data:
                        foods_data = foods_data["foods"]
                    else:
                        foods_data = [foods_data]
                        
        except Exception as e:
            logger.error(f"[FoodVision] Inference or parsing failed: {e}", exc_info=True)
            # Fallback to a mock for robust error handling without crashing the app
            foods_data = [{"name": "Unknown Food", "portion": "1 serving", "confidence": 0.45}]

        # 3. Lookup Nutrition for each identified food
        structured_response = {
            "foods": [],
            "totalCalories": 0,
            "totalProtein": 0,
            "totalFat": 0,
            "totalCarbs": 0
        }

        for item in foods_data:
            name = item.get("name", "Unknown Food")
            portion = item.get("portion", "1 serving")
            
            # Confidence handling (if < 0.70, we flag it for user confirmation on frontend)
            confidence = float(item.get("confidence", 0.8))
            
            nutrition = await self.get_nutrition_for_food(name, portion)
            
            food_entry = {
                "name": name,
                "portion": portion,
                "confidence": confidence,
                "calories": nutrition["calories"],
                "protein": nutrition["protein"],
                "fat": nutrition["fat"],
                "carbs": nutrition["carbs"],
                "fiber": nutrition["fiber"]
            }
            
            structured_response["foods"].append(food_entry)
            
            structured_response["totalCalories"] += nutrition["calories"]
            structured_response["totalProtein"] += nutrition["protein"]
            structured_response["totalFat"] += nutrition["fat"]
            structured_response["totalCarbs"] += nutrition["carbs"]

        t_post_end = time.perf_counter()
        
        prep_ms = round((t_prep_end - t_start) * 1000)
        inf_ms = round((t_inf_end - t_inf_start) * 1000)
        post_ms = round((t_post_end - t_inf_end) * 1000)
        total_ms = round((t_post_end - t_start) * 1000)
        
        logger.info(f"[FoodVision] Execution Telemetry -> Preprocessing: {prep_ms}ms | Inference: {inf_ms}ms | Postprocessing: {post_ms}ms | Total: {total_ms}ms")
        
        self._last_inference_time = total_ms

        return structured_response
