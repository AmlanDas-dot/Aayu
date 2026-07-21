import os
import re

filepath = r"d:\Aayu\backend\app\services\food_vision_service.py"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Singleton & Locks
init_pattern = re.compile(r"class FoodVisionService:\n.*?def load_model\(self\):", re.DOTALL)

new_init = """class FoodVisionService:
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

    async def load_model(self):"""

match = init_pattern.search(content)
if match:
    content = content[:match.start()] + new_init + content[match.end():]

# 2. Update load_model to use _load_lock
load_pattern = re.compile(r"async def load_model\(self\):.*?def is_ready\(self\) -> bool:", re.DOTALL)

new_load = """async def load_model(self):
        \"\"\"Loads the Hugging Face model into memory safely.\"\"\"
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

    def is_ready(self) -> bool:"""

match = load_pattern.search(content)
if match:
    content = content[:match.start()] + new_load + content[match.end():]

# 3. Update analyze_food_image to use _inference_lock, memory management, and telemetry
analyze_pattern = re.compile(r"async def analyze_food_image.*?def _run_inference\(\):.*?return output_text.*?except Exception as e:", re.DOTALL)

new_analyze = """async def analyze_food_image(self, image: Image.Image) -> Dict[str, Any]:
        \"\"\"
        Runs offline inference on the local GPU to identify foods and portions.
        Returns the structured JSON requested.
        \"\"\"
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
            "Example: [{\\"name\\": \\"Paneer Curry\\", \\"portion\\": \\"1 bowl\\", \\"confidence\\": 0.94}]"
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
            json_match = re.search(r'\\[\\s*\\{.*?\\}\\s*\\]', raw_output, re.DOTALL)
            if json_match:
                foods_data = json.loads(json_match.group(0))
            else:
                foods_data = json.loads(raw_output)
                if not isinstance(foods_data, list):
                    if "foods" in foods_data:
                        foods_data = foods_data["foods"]
                    else:
                        foods_data = [foods_data]
                        
        except Exception as e:"""

match = analyze_pattern.search(content)
if match:
    content = content[:match.start()] + new_analyze + content[match.end():]

# 4. Modify Telemetry logging at the end of analyze_food_image
telemetry_pattern = re.compile(r"inference_time = round\(\(time\.time\(\) - start_time\) \* 1000\).*?return structured_response", re.DOTALL)

new_telemetry = """t_post_end = time.perf_counter()
        
        prep_ms = round((t_prep_end - t_start) * 1000)
        inf_ms = round((t_inf_end - t_inf_start) * 1000)
        post_ms = round((t_post_end - t_inf_end) * 1000)
        total_ms = round((t_post_end - t_start) * 1000)
        
        logger.info(f"[FoodVision] Execution Telemetry -> Preprocessing: {prep_ms}ms | Inference: {inf_ms}ms | Postprocessing: {post_ms}ms | Total: {total_ms}ms")
        
        self._last_inference_time = total_ms

        return structured_response"""

match = telemetry_pattern.search(content)
if match:
    content = content[:match.start()] + new_telemetry + content[match.end():]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied.")
