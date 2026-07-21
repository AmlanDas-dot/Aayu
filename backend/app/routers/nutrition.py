"""
Nutrition API Router — serves disease-diet nutrition guidance.

GET /nutrition                  → list all nutrition entries
GET /nutrition/search?q=        → search by disease/condition name
GET /nutrition/disease/{name}   → get guidance for a specific condition
"""

from __future__ import annotations

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from app.services.nutrition_service import NutritionService

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

NUTRITION_PROFILES = {
  "default": {
    "score": 72,
    "calories": { "val": "1,650", "max": 2000, "pct": 82, "remaining": "350 kcal" },
    "protein": { "val": "56", "max": 60, "pct": 69 },
    "iron": { "val": "12", "max": 18, "pct": 71 },
    "swaps": [
      { "from": { "icon": "🍟", "name": "Chips", "note": "(High in fat)" }, "to": { "icon": "🌽", "name": "Roasted Chana", "note": "(Rich in protein & fibre)" } },
      { "from": { "icon": "🧃", "name": "Sugary Drinks", "note": "(High sugar)" }, "to": { "icon": "🥛", "name": "Buttermilk", "note": "(Good for gut & hydration)" } },
      { "from": { "icon": "🥬", "name": "Leafy Greens", "note": "Dairy" }, "to": { "icon": "🌽", "name": "Roasted Chana", "note": "Rich in protein & fibre" } },
    ],
    "mealPlan": [
      { "meal": "Breakfast", "name": "Poha + Milk", "icon": "🍚", "price": 20, "note": "Energy-rich start" },
      { "meal": "Mid-Morning", "name": "Guava", "icon": "🍈", "price": 10, "note": "Rich in Vitamin C" },
      { "meal": "Lunch", "name": "Rice + Dal + Seasonal Salad", "icon": "🥗", "price": 35, "note": "Balanced & filling" },
      { "meal": "Evening Snack", "name": "Roasted Chana + Banana", "icon": "🍌", "price": 15, "note": "Keeps you active" },
      { "meal": "Dinner", "name": "2 Rotis + Mixed Vegetables", "icon": "🫓", "price": 20, "note": "Light & nutritious" },
    ],
    "topNutrients": [
      { "name": "Protein", "current": "51g", "target": "60g", "pct": 85, "color": "#0d9488" },
      { "name": "Iron", "current": "10mg", "target": "18mg", "pct": 55, "color": "#f59e0b" },
      { "name": "Calcium", "current": "450mg", "target": "1000mg", "pct": 45, "color": "#3b82f6" },
      { "name": "Fibre", "current": "14g", "target": "25g", "pct": 56, "color": "#10b981" },
    ],
    "tip": "💡 Eat more iron-rich foods like leafy greens, dates and millets."
  },
  "pregnant": {
    "score": 65,
    "calories": { "val": "2,100", "max": 2500, "pct": 84, "remaining": "400 kcal" },
    "protein": { "val": "68", "max": 75, "pct": 90 },
    "iron": { "val": "15", "max": 27, "pct": 55 },
    "swaps": [
      { "from": { "icon": "☕", "name": "Tea/Coffee with meals", "note": "(Blocks iron)" }, "to": { "icon": "🍋", "name": "Lemon Water", "note": "(Boosts iron absorption)" } },
      { "from": { "icon": "🍚", "name": "White Rice", "note": "(Low nutrient)" }, "to": { "icon": "🌾", "name": "Ragi/Millets", "note": "(High Calcium & Iron)" } },
    ],
    "mealPlan": [
      { "meal": "Breakfast", "name": "Ragi Dosa + Egg", "icon": "🥞", "price": 25, "note": "High protein & calcium" },
      { "meal": "Mid-Morning", "name": "Amla + Dates", "icon": "🫐", "price": 15, "note": "Iron + Vitamin C combo" },
      { "meal": "Lunch", "name": "Rice + Spinach Dal", "icon": "🍛", "price": 40, "note": "Folic acid rich" },
      { "meal": "Evening Snack", "name": "Sprouted Moong Salad", "icon": "🥗", "price": 15, "note": "Easy to digest" },
      { "meal": "Dinner", "name": "Rotis + Paneer/Soybean", "icon": "🫓", "price": 30, "note": "Protein rich" },
    ],
    "topNutrients": [
      { "name": "Protein", "current": "68g", "target": "75g", "pct": 90, "color": "#0d9488" },
      { "name": "Iron", "current": "15mg", "target": "27mg", "pct": 55, "color": "#ef4444" },
      { "name": "Calcium", "current": "800mg", "target": "1000mg", "pct": 80, "color": "#3b82f6" },
      { "name": "Folic Acid", "current": "400mcg", "target": "600mcg", "pct": 66, "color": "#10b981" },
    ],
    "tip": "💡 Iron is crucial right now! Pair your iron supplements with vitamin C (like lemon juice) and avoid tea/coffee with meals."
  },
  "child": {
    "score": 80,
    "calories": { "val": "1,200", "max": 1400, "pct": 85, "remaining": "200 kcal" },
    "protein": { "val": "30", "max": 35, "pct": 85 },
    "iron": { "val": "8", "max": 10, "pct": 80 },
    "swaps": [
      { "from": { "icon": "🍬", "name": "Candies/Chocolates", "note": "(Empty calories)" }, "to": { "icon": "🥜", "name": "Peanut Chikki", "note": "(Protein & Iron rich)" } },
      { "from": { "icon": "🍞", "name": "White Bread", "note": "(Low fibre)" }, "to": { "icon": "🌾", "name": "Dalia/Oats", "note": "(Complex carbs)" } },
    ],
    "mealPlan": [
      { "meal": "Breakfast", "name": "Milk + Upma", "icon": "🥣", "price": 20, "note": "Energy for the day" },
      { "meal": "Mid-Morning", "name": "Apple/Banana", "icon": "🍎", "price": 10, "note": "Natural sugars" },
      { "meal": "Lunch", "name": "Khichdi + Curd", "icon": "🍛", "price": 25, "note": "Easy to digest" },
      { "meal": "Evening Snack", "name": "Boiled Egg/Chana", "icon": "🥚", "price": 10, "note": "Muscle growth" },
      { "meal": "Dinner", "name": "Roti + Dal + Veggies", "icon": "🫓", "price": 25, "note": "Balanced nutrition" },
    ],
    "topNutrients": [
      { "name": "Protein", "current": "30g", "target": "35g", "pct": 85, "color": "#0d9488" },
      { "name": "Iron", "current": "8mg", "target": "10mg", "pct": 80, "color": "#f59e0b" },
      { "name": "Calcium", "current": "500mg", "target": "600mg", "pct": 83, "color": "#3b82f6" },
      { "name": "Vitamin A", "current": "300mcg", "target": "400mcg", "pct": 75, "color": "#10b981" },
    ],
    "tip": "💡 Growing kids need protein and calcium. Ensure 2 servings of dairy/eggs/pulses daily!"
  }
}
class NutritionEntry(BaseModel):
    id: str = ""
    display_name: str = ""
    type: str = ""
    recommended_foods: list[str] = []
    avoid_foods: list[str] = []
    guidance: str = ""
    urgency: str = "low"
    source: str = ""


class NutritionListResponse(BaseModel):
    count: int
    items: list[NutritionEntry]


def _to_entry(raw: dict) -> NutritionEntry:
    """Convert any normalised dict to NutritionEntry safely — never raises."""
    return NutritionEntry(
        id=str(raw.get("id", "")),
        display_name=str(raw.get("display_name", raw.get("disease", raw.get("name", "")))),
        type=str(raw.get("type", "")),
        recommended_foods=raw.get("recommended_foods", []),
        avoid_foods=raw.get("avoid_foods", []),
        guidance=str(raw.get("guidance", "")),
        urgency=str(raw.get("urgency", "low")),
        source=str(raw.get("source", "")),
    )


@router.get("", response_model=NutritionListResponse, summary="List all nutrition entries")
async def list_all_nutrition() -> NutritionListResponse:
    svc = NutritionService.get_instance()
    items = svc.get_all_foods()
    return NutritionListResponse(
        count=len(items),
        items=[_to_entry(f) for f in items],
    )


@router.get("/search", response_model=NutritionListResponse, summary="Search by disease or food")
async def search_nutrition(
    q: str = Query(..., min_length=1, description="e.g. diabetes, anemia, pregnancy"),
    limit: int = Query(default=20, ge=1, le=100),
) -> NutritionListResponse:
    svc = NutritionService.get_instance()
    items = svc.search_foods(q)[:limit]
    return NutritionListResponse(
        count=len(items),
        items=[_to_entry(f) for f in items],
    )


@router.get("/disease/{name}", response_model=NutritionEntry, summary="Get nutrition for a specific condition")
async def get_nutrition_for_disease(name: str) -> NutritionEntry:
    svc = NutritionService.get_instance()
    results = svc.search_foods(name)
    if not results:
        raise HTTPException(status_code=404, detail=f"No nutrition guidance found for '{name}'")
    return _to_entry(results[0])


@router.get("/profile/{profile_type}", summary="Get rich nutrition profile data")
async def get_nutrition_profile(profile_type: str):
    if profile_type not in NUTRITION_PROFILES:
        raise HTTPException(status_code=404, detail=f"Profile type '{profile_type}' not found")
    return NUTRITION_PROFILES[profile_type]


@router.get("/diet-plan/{goal}", response_model=NutritionListResponse, summary="Get diet plan suggestions for a goal")
async def suggest_diet_for_goal(
    goal: str,
    limit: int = Query(default=10, ge=1, le=50)
) -> NutritionListResponse:
    svc = NutritionService.get_instance()
    try:
        items = svc.suggest_diet_for_goal(goal, limit)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return NutritionListResponse(
        count=len(items),
        items=[_to_entry(f) for f in items],
    )

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
        
        # Enforce 5MB limit
        MAX_UPLOAD_SIZE = 5 * 1024 * 1024
        if len(image_bytes) > MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")
            
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
