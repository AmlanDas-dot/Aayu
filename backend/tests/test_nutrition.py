"""
tests/test_nutrition.py

Run with:
    python -m pytest backend/tests/test_nutrition.py -v
"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app.services.nutrition_service import NutritionService


@pytest.fixture(scope="module")
def svc() -> NutritionService:
    return NutritionService.get_instance()


def test_data_loaded(svc: NutritionService) -> None:
    assert svc.count > 0


def test_get_food_nutrition_exact_and_fuzzy(svc: NutritionService) -> None:
    roti = svc.get_food_nutrition("roti")
    assert roti is not None
    assert "Roti" in roti["name"]


def test_get_food_nutrition_not_found(svc: NutritionService) -> None:
    assert svc.get_food_nutrition("nonexistent food xyz") is None


def test_high_protein_sorted_desc(svc: NutritionService) -> None:
    items = svc.suggest_high_protein_foods()
    proteins = [f["protein"] for f in items]
    assert proteins == sorted(proteins, reverse=True)
    assert all(p >= 5 for p in proteins)


def test_low_calorie_sorted_asc(svc: NutritionService) -> None:
    items = svc.suggest_low_calorie_foods()
    calories = [f["calories"] for f in items]
    assert calories == sorted(calories)
    assert all(c <= 100 for c in calories)


@pytest.mark.parametrize("goal", ["Weight Loss", "Weight Gain", "Diabetes", "High Protein", "General Health"])
def test_diet_for_goal_all_goals(svc: NutritionService, goal: str) -> None:
    items = svc.suggest_diet_for_goal(goal)
    assert isinstance(items, list)


def test_diet_for_goal_invalid(svc: NutritionService) -> None:
    with pytest.raises(ValueError):
        svc.suggest_diet_for_goal("not a real goal")


def test_search_foods(svc: NutritionService) -> None:
    results = svc.search_foods("anemia")
    assert isinstance(results, list)


def test_get_all_foods(svc: NutritionService) -> None:
    all_foods = svc.get_all_foods()
    assert len(all_foods) == svc.count
