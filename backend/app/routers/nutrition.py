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
