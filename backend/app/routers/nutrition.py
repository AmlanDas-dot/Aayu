"""
Nutrition API Router.

Endpoints:
    GET  /nutrition                        — List all foods (with optional category filter)
    GET  /nutrition/search?q=              — Search foods by query
    GET  /nutrition/high-protein           — High-protein food list
    GET  /nutrition/low-calorie            — Low-calorie food list
    GET  /nutrition/diet-plan/{goal}       — Diet suggestions for a health goal
    GET  /nutrition/food/{name}            — Nutrition info for a specific food

Valid diet goals: Weight Loss, Weight Gain, Diabetes, High Protein, General Health
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.nutrition_service import NutritionService, VALID_GOALS

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


# --------------------------------------------------------------------------- #
# Response models
# --------------------------------------------------------------------------- #

class FoodItem(BaseModel):
    name: str
    category: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    serving_size: str
    rich_in: list[str] = []
    good_for: list[str] = []
    avoid_if: list[str] = []


class FoodListResponse(BaseModel):
    count: int
    items: list[FoodItem]


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #

@router.get("", response_model=FoodListResponse, summary="List all foods (optional category filter)")
async def list_all_foods(
    category: str | None = Query(default=None, description="Filter by category, e.g. 'Grains', 'Vegetables'")
) -> FoodListResponse:
    """GET /nutrition or GET /nutrition?category=Legumes"""
    svc = NutritionService.get_instance()
    items = svc.get_foods_by_category(category) if category else svc.get_all_foods()
    return FoodListResponse(count=len(items), items=[FoodItem(**f) for f in items])


@router.get("/search", response_model=FoodListResponse, summary="Search foods by query")
async def search_foods(
    q: str = Query(..., min_length=1, description="Search query — matches name, category, good_for, rich_in"),
    limit: int = Query(default=10, ge=1, le=50),
) -> FoodListResponse:
    """GET /nutrition/search?q=anemia"""
    svc = NutritionService.get_instance()
    items = svc.search_foods(q)[:limit]
    return FoodListResponse(count=len(items), items=[FoodItem(**f) for f in items])


@router.get("/high-protein", response_model=FoodListResponse, summary="List high-protein foods")
async def high_protein(limit: int = Query(default=10, ge=1, le=50)) -> FoodListResponse:
    svc = NutritionService.get_instance()
    items = svc.suggest_high_protein_foods(limit)
    return FoodListResponse(count=len(items), items=[FoodItem(**f) for f in items])


@router.get("/low-calorie", response_model=FoodListResponse, summary="List low-calorie foods")
async def low_calorie(limit: int = Query(default=10, ge=1, le=50)) -> FoodListResponse:
    svc = NutritionService.get_instance()
    items = svc.suggest_low_calorie_foods(limit)
    return FoodListResponse(count=len(items), items=[FoodItem(**f) for f in items])


@router.get("/diet-plan/{goal}", response_model=FoodListResponse, summary="Get diet suggestions for a health goal")
async def diet_plan(goal: str, limit: int = Query(default=10, ge=1, le=50)) -> FoodListResponse:
    """
    GET /nutrition/diet-plan/Weight%20Loss
    Valid goals: Weight Loss, Weight Gain, Diabetes, High Protein, General Health
    """
    svc = NutritionService.get_instance()
    try:
        items = svc.suggest_diet_for_goal(goal, limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return FoodListResponse(count=len(items), items=[FoodItem(**f) for f in items])


@router.get("/food/{name}", response_model=FoodItem, summary="Get nutrition info for a specific food item")
async def get_food(name: str) -> FoodItem:
    """GET /nutrition/food/roti -> nutrition info for 'Roti (Chapati)'."""
    svc = NutritionService.get_instance()
    food = svc.get_food_nutrition(name)
    if food is None:
        raise HTTPException(status_code=404, detail=f"No nutrition data found for '{name}'")
    return FoodItem(**food)
