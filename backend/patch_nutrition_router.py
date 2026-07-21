import os

code_to_append = """
from fastapi import UploadFile, File
import io
from PIL import Image
from app.services.food_vision_service import FoodVisionService

class FoodItem(BaseModel):
    name: str
    portion: str
    confidence: float
    calories: int
    protein: int
    fat: int
    carbs: int
    fiber: int

class NutritionAnalysisResponse(BaseModel):
    foods: list[FoodItem]
    totalCalories: int
    totalProtein: int
    totalFat: int
    totalCarbs: int

@router.post("/analyze-food", response_model=NutritionAnalysisResponse, summary="Analyze food image offline and get nutrition estimates")
async def analyze_food(image: UploadFile = File(...)):
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="No image file provided.")

    try:
        image_bytes = await image.read()
        try:
            img = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            logger.error(f"[NutritionRouter] Invalid image format: {e}")
            raise HTTPException(status_code=400, detail="Invalid image file format.")
            
        vision_svc = FoodVisionService.get_instance()
        result = await vision_svc.analyze_food_image(img)
        
        return result
        
    except RuntimeError as re:
        logger.error(f"[NutritionRouter] Model Execution Failed: {re}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(re))
    except Exception as e:
        logger.error(f"[NutritionRouter] Unhandled error during food analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during food analysis.")
"""

filepath = r"d:\Aayu\backend\app\routers\nutrition.py"
with open(filepath, "a", encoding="utf-8") as f:
    f.write(code_to_append)
print("Successfully appended analyze_food endpoint to nutrition.py")
