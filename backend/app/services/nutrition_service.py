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
_FOODS_FILE = None  # deprecated

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

    def _load_foods(self) -> list[dict]:
        """Auto-discover and normalise all *.json files in the nutrition/ directory."""
        import glob as _glob
        files = sorted(_glob.glob(os.path.join(_DATA_DIR, "*.json")))
        all_items: list[dict] = []
        for filepath in files:
            try:
                with open(filepath, encoding="utf-8") as f:
                    data = json.load(f)
                source = os.path.splitext(os.path.basename(filepath))[0]
                for item in data:
                    normalised = self._normalise(item, source)
                    if normalised:
                        all_items.append(normalised)
            except Exception as exc:
                logger.warning("[Nutrition] Failed to load %s: %s", filepath, exc)
        logger.info("[Nutrition] Loaded %d entries from %d files.", len(all_items), len(files))
        return all_items

    def _normalise(self, item: dict, source: str) -> dict | None:
        """Convert any nutrition schema to a unified shape."""
        item_id = str(item.get("id", item.get("name", item.get("disease", ""))))
        if not item_id:
            return None
        
        # Make id lowercased and slugified if it was derived from name
        item_id = item_id.lower().replace(" ", "_").replace("(", "").replace(")", "").strip()

        # Schema 1: disease-diet
        if "disease" in item:
            return {
                "id": item_id,
                "display_name": item.get("disease", ""),
                "type": "disease_diet",
                "recommended_foods": item.get("recommended_foods", []),
                "avoid_foods": item.get("avoid_foods", []),
                "guidance": item.get("guidance", ""),
                "urgency": item.get("urgency", "low"),
                "source": source,
            }

        # Schema 2: pregnancy
        if "focus" in item:
            return {
                "id": item_id,
                "display_name": f"Pregnancy — {item.get('category', '')}",
                "type": "pregnancy",
                "recommended_foods": item.get("recommended_foods", []),
                "avoid_foods": item.get("avoid_foods", []),
                "guidance": f"{item.get('focus', '')}. {item.get('guidance', '')}",
                "urgency": "medium",
                "source": source,
            }

        # Schema 3: food item
        name = item.get("name", item_id.replace("_", " ").title())
        benefits = item.get("benefits", [])
        good_for = item.get("good_for", [])
        nutrients = item.get("nutrients", {})
        nutrient_str = (
            ", ".join(f"{k}: {v}" for k, v in nutrients.items())
            if isinstance(nutrients, dict) else ""
        )
        return {
            "id": item_id,
            "display_name": name,
            "type": "food_item",
            "recommended_foods": benefits,  # repurpose as benefits list
            "avoid_foods": [],
            "guidance": f"Nutrients: {nutrient_str}. Best time: {item.get('best_time', '')}. Good for: {', '.join(good_for)}.",
            "urgency": "low",
            "source": source,
        }

    @property
    def count(self) -> int:
        return len(self._foods)

    # ------------------------------------------------------------------ #
    # Lookups
    # ------------------------------------------------------------------ #

    def get_food_nutrition(self, food_name: str) -> Optional[dict[str, Any]]:
        """Exact match first, then substring match."""
        target = food_name.lower().strip()

        for food in self._foods:
            name_val = food.get("display_name", "")
            if name_val.lower() == target:
                return food

        for food in self._foods:
            name_val = food.get("display_name", "")
            sname = name_val.lower()
            if sname and (target in sname or sname in target):
                return food

        return None

    def get_foods_by_category(self, category: str) -> list[dict[str, Any]]:
        target = category.lower().strip()
        return [f for f in self._foods if f.get("source", "").lower() == target]

    def get_all_foods(self) -> list[dict[str, Any]]:
        """Return all foods in the dataset."""
        return self._foods

    def search_foods(self, query: str) -> list[dict]:
        q = query.lower().strip()
        return [
            item for item in self._foods
            if q in (
                item.get("display_name", "") + " " +
                item.get("guidance", "") + " " +
                " ".join(item.get("recommended_foods", []))
            ).lower()
        ]

    # ------------------------------------------------------------------ #
    # Suggestions
    # ------------------------------------------------------------------ #

    def suggest_high_protein_foods(self, limit: int = 10) -> list[dict[str, Any]]:
        return sorted(
            (f for f in self._foods if f.get("protein", 0) >= 5),
            key=lambda f: f.get("protein", 0),
            reverse=True,
        )[:limit]

    def suggest_low_calorie_foods(self, limit: int = 10) -> list[dict[str, Any]]:
        return sorted(
            (f for f in self._foods if f.get("calories", 0) <= 100),
            key=lambda f: f.get("calories", 0),
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
            res = []
            for f in self._foods:
                disease = f.get("disease", "").lower()
                good_for = [str(x).lower() for x in (f.get("good_for") or f.get("benefits") or [])]
                avoid_if = [str(x).lower() for x in f.get("avoid_if", [])]
                avoid_foods = [str(x).lower() for x in f.get("avoid_foods", [])]
                if ("diabetes" in disease or 
                    ("diabetes" in good_for and "diabetes" not in avoid_if and "diabetes" not in avoid_foods)):
                    res.append(f)
            return res[:limit]

        if g == "high protein":
            return self.suggest_high_protein_foods(limit)

        if g == "general health":
            return sorted(self._foods, key=lambda f: f.get("fiber", 0), reverse=True)[:limit]

        raise ValueError(f"Unknown goal '{goal}'. Valid goals: {VALID_GOALS}")
