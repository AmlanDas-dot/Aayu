"""
Nutrition Service.

Loads the local nutrition database (backend/app/data/nutrition/foods.json)
and provides lookups and goal-based diet recommendations.

Dataset is regionally focused (Odisha/Indian staple foods) with both common
and local names, e.g. "Roti (Chapati)", "Moringa (Sajana Chhuin / Drumstick)".

Usage:
    from app.services.nutrition_service import NutritionService
    svc = NutritionService.get_instance()
    food = svc.get_food_nutrition("roti")
    plan = svc.suggest_diet_for_goal("Weight Loss")
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Optional

logger = logging.getLogger(__name__)

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "nutrition")
_FOODS_FILE = "foods.json"

VALID_GOALS = ["weight loss", "weight gain", "diabetes", "high protein", "general health"]


class NutritionService:
    """Singleton wrapper around the nutrition dataset."""

    _instance: Optional["NutritionService"] = None

    def __init__(self) -> None:
        self._foods: list[dict[str, Any]] = self._load_foods()

    @classmethod
    def get_instance(cls) -> "NutritionService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ------------------------------------------------------------------ #
    # Loading
    # ------------------------------------------------------------------ #

    def _load_foods(self) -> list[dict[str, Any]]:
        path = os.path.join(_DATA_DIR, _FOODS_FILE)
        if not os.path.exists(path):
            logger.warning("[Nutrition] Data file not found: %s", path)
            return []
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    @property
    def count(self) -> int:
        return len(self._foods)

    # ------------------------------------------------------------------ #
    # Lookups
    # ------------------------------------------------------------------ #

    def get_food_nutrition(self, food_name: str) -> Optional[dict[str, Any]]:
        """Exact match first, then substring match (handles 'roti' -> 'Roti (Chapati)')."""
        target = food_name.lower().strip()

        for food in self._foods:
            if food["name"].lower() == target:
                return food

        for food in self._foods:
            name = food["name"].lower()
            if target in name or name in target:
                return food

        return None

    def get_foods_by_category(self, category: str) -> list[dict[str, Any]]:
        target = category.lower().strip()
        return [f for f in self._foods if f.get("category", "").lower() == target]

    def get_all_foods(self) -> list[dict[str, Any]]:
        """Return all foods in the dataset."""
        return self._foods

    def search_foods(self, query: str) -> list[dict[str, Any]]:
        """Search foods by name, category, good_for, or rich_in (case-insensitive)."""
        target = query.lower().strip()
        return [
            f for f in self._foods
            if target in f.get("name", "").lower()
            or target in f.get("category", "").lower()
            or any(target in g.lower() for g in f.get("good_for", []))
            or any(target in r.lower() for r in f.get("rich_in", []))
        ]

    # ------------------------------------------------------------------ #
    # Suggestions
    # ------------------------------------------------------------------ #

    def suggest_high_protein_foods(self, limit: int = 10) -> list[dict[str, Any]]:
        return sorted(
            (f for f in self._foods if f.get("protein", 0) >= 5),
            key=lambda f: f["protein"],
            reverse=True,
        )[:limit]

    def suggest_low_calorie_foods(self, limit: int = 10) -> list[dict[str, Any]]:
        return sorted(
            (f for f in self._foods if f.get("calories", 0) <= 100),
            key=lambda f: f["calories"],
        )[:limit]

    def suggest_diet_for_goal(self, goal: str, limit: int = 10) -> list[dict[str, Any]]:
        """
        Goals: "Weight Loss", "Weight Gain", "Diabetes", "High Protein",
        "General Health" (case-insensitive).
        """
        g = goal.lower().strip()

        if g == "weight loss":
            return sorted(
                (
                    f for f in self._foods
                    if f.get("fiber", 0) >= 1.5
                    and f.get("calories", 0) <= 120
                    and "weight gain" not in [x.lower() for x in f.get("good_for", [])]
                ),
                key=lambda f: f["fiber"],
                reverse=True,
            )[:limit]

        if g == "weight gain":
            return sorted(
                (
                    f for f in self._foods
                    if f.get("calories", 0) >= 110
                    and (f.get("protein", 0) >= 2.5 or f.get("fat", 0) >= 3)
                ),
                key=lambda f: f["calories"],
                reverse=True,
            )[:limit]

        if g == "diabetes":
            return [
                f for f in self._foods
                if "diabetes" in [x.lower() for x in f.get("good_for", [])]
                and "diabetes" not in [x.lower() for x in f.get("avoid_if", [])]
            ][:limit]

        if g == "high protein":
            return self.suggest_high_protein_foods(limit)

        if g == "general health":
            return sorted(self._foods, key=lambda f: f.get("fiber", 0), reverse=True)[:limit]

        raise ValueError(f"Unknown goal '{goal}'. Valid goals: {VALID_GOALS}")
