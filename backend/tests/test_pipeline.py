"""
tests/test_pipeline.py

End-to-end pipeline tests for Sprint 2.

Tests:
    1. Rule-based triage classification (emergency / urgent / routine)
    2. Chat pipeline (text → search → triage → response)
    3. Translation service validation
    4. Response service output structure

Run with:
    cd d:\\Aayu\\backend
    python -m pytest tests/test_pipeline.py -v
"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app.services.rule_based_triage import RuleBasedTriageEngine, get_triage_engine
from app.services.response_service import TemplateResponseService, MEDICAL_DISCLAIMER
from app.services.search_service import SearchService


# ─────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def triage_engine() -> RuleBasedTriageEngine:
    """Return the shared triage engine singleton."""
    return get_triage_engine()


@pytest.fixture(scope="module")
def search_svc() -> SearchService:
    """Return the shared SearchService singleton (triggers DB init once)."""
    return SearchService.get_instance()


@pytest.fixture(scope="module")
def response_svc() -> TemplateResponseService:
    """Return a TemplateResponseService instance."""
    return TemplateResponseService()


# ─────────────────────────────────────────────────────────────
# Task 7 — End-to-End Triage Tests
# ─────────────────────────────────────────────────────────────

class TestTriageClassification:
    """Verify the rule-based triage engine with canonical test inputs."""

    def test_dog_bite_is_emergency_or_urgent(self, triage_engine: RuleBasedTriageEngine) -> None:
        """'Dog bite' should classify as emergency or urgent (Task 7)."""
        result = triage_engine.assess("Dog bite")
        assert result.risk_level in ("emergency", "urgent"), (
            f"Expected emergency or urgent for 'Dog bite', got {result.risk_level}"
        )

    def test_snake_bite_is_emergency(self, triage_engine: RuleBasedTriageEngine) -> None:
        """'Snake bite' must always be classified as emergency (Task 7)."""
        result = triage_engine.assess("Snake bite")
        assert result.risk_level == "emergency", (
            f"Expected 'emergency' for 'Snake bite', got {result.risk_level}"
        )
        assert "snake_bite" in result.matched_rules, (
            f"Expected 'snake_bite' in matched_rules, got {result.matched_rules}"
        )

    def test_high_fever_4_days_is_urgent(self, triage_engine: RuleBasedTriageEngine) -> None:
        """'High fever for 4 days' should classify as urgent (Task 7)."""
        result = triage_engine.assess("High fever for 4 days")
        assert result.risk_level == "urgent", (
            f"Expected 'urgent' for fever query, got {result.risk_level}"
        )

    def test_healthy_food_advice_is_routine(self, triage_engine: RuleBasedTriageEngine) -> None:
        """'I want healthy food advice' should classify as routine (Task 7)."""
        result = triage_engine.assess("I want healthy food advice")
        assert result.risk_level == "routine", (
            f"Expected 'routine' for food advice query, got {result.risk_level}"
        )

    # Additional emergency scenarios
    def test_chest_pain_is_emergency(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("Severe chest pain and difficulty breathing")
        assert result.risk_level == "emergency"

    def test_not_breathing_is_emergency(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("The person is not breathing")
        assert result.risk_level == "emergency"

    def test_unconscious_is_emergency(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("Someone collapsed and is unconscious")
        assert result.risk_level == "emergency"

    def test_poisoning_is_emergency(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("Child swallowed poison / pesticide")
        assert result.risk_level == "emergency"

    def test_stroke_is_emergency(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("Face drooping, slurred speech — possible stroke")
        assert result.risk_level == "emergency"

    # Additional urgent scenarios
    def test_dengue_is_urgent(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("Dengue fever with low platelets")
        assert result.risk_level == "urgent"

    def test_dehydration_is_urgent(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("Severe dehydration, sunken eyes, not urinating")
        assert result.risk_level == "urgent"

    def test_malaria_is_urgent(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("Chills and fever with shivering — possibly malaria")
        assert result.risk_level == "urgent"

    # Additional routine scenarios
    def test_nutrition_is_routine(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("What nutrition should I take during pregnancy?")
        assert result.risk_level == "routine"

    def test_mild_fever_is_routine(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("I have a mild fever of 99 degrees")
        assert result.risk_level == "routine"

    def test_lifestyle_is_routine(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("How much exercise should I do per week?")
        assert result.risk_level == "routine"


# ─────────────────────────────────────────────────────────────
# Triage result structure tests
# ─────────────────────────────────────────────────────────────

class TestTriageResultStructure:
    """Verify the TriageResult data contract."""

    def test_result_has_required_fields(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("snake bite")
        d = result.to_dict()
        required = {"risk_level", "matched_rules", "matched_keywords", "confidence"}
        missing = required - set(d.keys())
        assert not missing, f"Missing fields: {missing}"

    def test_risk_level_is_valid_string(self, triage_engine: RuleBasedTriageEngine) -> None:
        for query in ["snake bite", "fever", "diet advice", "unconscious person"]:
            result = triage_engine.assess(query)
            assert result.risk_level in ("emergency", "urgent", "routine"), (
                f"Invalid risk_level '{result.risk_level}' for query '{query}'"
            )

    def test_matched_rules_is_list(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("snake bite")
        assert isinstance(result.matched_rules, list)
        assert len(result.matched_rules) > 0

    def test_confidence_is_float(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("snake bite")
        assert isinstance(result.confidence, float)
        assert 0.0 <= result.confidence <= 1.0

    def test_empty_query_returns_routine(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("")
        assert result.risk_level == "routine"

    def test_whitespace_query_returns_routine(self, triage_engine: RuleBasedTriageEngine) -> None:
        result = triage_engine.assess("   ")
        assert result.risk_level == "routine"


# ─────────────────────────────────────────────────────────────
# Response service tests
# ─────────────────────────────────────────────────────────────

class TestResponseService:
    """Verify the TemplateResponseService output structure."""

    def test_emergency_response_has_required_fields(
        self, response_svc: TemplateResponseService
    ) -> None:
        triage = {"risk_level": "emergency", "matched_rules": ["snake_bite"], "confidence": 1.0}
        chunks: list = []
        resp = response_svc.format_response("snake bite", triage, chunks)
        d = resp.to_dict()
        required = {"risk_level", "response", "retrieved_documents", "confidence", "disclaimer"}
        missing = required - set(d.keys())
        assert not missing, f"Missing response fields: {missing}"

    def test_emergency_response_contains_action(
        self, response_svc: TemplateResponseService
    ) -> None:
        triage = {"risk_level": "emergency", "matched_rules": ["snake_bite"], "confidence": 1.0}
        resp = response_svc.format_response("snake bite", triage, [])
        assert "108" in resp.response or "emergency" in resp.response.lower()

    def test_urgent_response_contains_doctor_advice(
        self, response_svc: TemplateResponseService
    ) -> None:
        triage = {"risk_level": "urgent", "matched_rules": ["persistent_fever"], "confidence": 1.0}
        resp = response_svc.format_response("high fever for 4 days", triage, [])
        assert "doctor" in resp.response.lower() or "24 hours" in resp.response

    def test_routine_response_has_guidance(
        self, response_svc: TemplateResponseService
    ) -> None:
        triage = {"risk_level": "routine", "matched_rules": ["nutrition"], "confidence": 1.0}
        resp = response_svc.format_response("I want healthy food advice", triage, [])
        assert len(resp.response) > 50

    def test_disclaimer_is_present(
        self, response_svc: TemplateResponseService
    ) -> None:
        triage = {"risk_level": "routine", "matched_rules": [], "confidence": 1.0}
        resp = response_svc.format_response("general health question", triage, [])
        assert resp.disclaimer == MEDICAL_DISCLAIMER

    def test_risk_level_propagated(
        self, response_svc: TemplateResponseService
    ) -> None:
        for level in ("emergency", "urgent", "routine"):
            triage = {"risk_level": level, "matched_rules": [], "confidence": 1.0}
            resp = response_svc.format_response("test", triage, [])
            assert resp.risk_level == level

    def test_retrieved_documents_formatted(
        self, response_svc: TemplateResponseService
    ) -> None:
        triage = {"risk_level": "routine", "matched_rules": [], "confidence": 1.0}
        chunks = [
            {
                "title": "Test Doc",
                "content": "Some content",
                "score": 0.85,
                "collection": "first_aid",
                "category": "test",
                "source": "test_source",
            }
        ]
        resp = response_svc.format_response("test query", triage, chunks)
        assert len(resp.retrieved_documents) == 1
        doc = resp.retrieved_documents[0]
        assert doc["title"] == "Test Doc"
        assert doc["score"] == 0.85


# ─────────────────────────────────────────────────────────────
# Full pipeline integration test (search + triage + response)
# ─────────────────────────────────────────────────────────────

class TestFullPipeline:
    """
    End-to-end pipeline tests.
    Requires ChromaDB to be populated (run backend once to trigger indexing).
    """

    def test_dog_bite_pipeline(
        self,
        search_svc: SearchService,
        triage_engine: RuleBasedTriageEngine,
        response_svc: TemplateResponseService,
    ) -> None:
        """Dog bite → search results returned + emergency or urgent classification."""
        query = "Dog bite"
        results = search_svc.search(query=query, collection="all", top_k=5)
        assert len(results) > 0, "Expected search results for 'Dog bite'"

        triage = triage_engine.assess(query)
        assert triage.risk_level in ("emergency", "urgent")

        resp = response_svc.format_response(query, triage.to_dict(), results)
        assert resp.risk_level in ("emergency", "urgent")
        assert len(resp.response) > 0

    def test_snake_bite_pipeline(
        self,
        search_svc: SearchService,
        triage_engine: RuleBasedTriageEngine,
        response_svc: TemplateResponseService,
    ) -> None:
        """Snake bite → emergency classification."""
        query = "Snake bite"
        results = search_svc.search(query=query, collection="all", top_k=5)
        assert len(results) > 0, "Expected search results for 'Snake bite'"

        triage = triage_engine.assess(query)
        assert triage.risk_level == "emergency"

        resp = response_svc.format_response(query, triage.to_dict(), results)
        assert resp.risk_level == "emergency"

    def test_fever_pipeline(
        self,
        search_svc: SearchService,
        triage_engine: RuleBasedTriageEngine,
        response_svc: TemplateResponseService,
    ) -> None:
        """High fever for 4 days → urgent classification."""
        query = "High fever for 4 days"
        results = search_svc.search(query=query, collection="all", top_k=5)
        assert len(results) > 0, "Expected search results for fever query"

        triage = triage_engine.assess(query)
        assert triage.risk_level == "urgent"

        resp = response_svc.format_response(query, triage.to_dict(), results)
        assert resp.risk_level == "urgent"

    def test_nutrition_pipeline(
        self,
        search_svc: SearchService,
        triage_engine: RuleBasedTriageEngine,
        response_svc: TemplateResponseService,
    ) -> None:
        """Healthy food advice → routine classification."""
        query = "I want healthy food advice"
        triage = triage_engine.assess(query)
        assert triage.risk_level == "routine"

        resp = response_svc.format_response(query, triage.to_dict(), [])
        assert resp.risk_level == "routine"
        assert len(resp.response) > 0


# ─────────────────────────────────────────────────────────────
# Task 8 — Translation service validation
# ─────────────────────────────────────────────────────────────

class TestTranslationService:
    """Task 8 — Translation service validation."""

    def test_english_passthrough(self) -> None:
        """English text should be returned unchanged without loading the model."""
        from app.services.translation_service import translate_to_english
        result = translate_to_english("snake bite", "en")
        assert result == "snake bite", (
            f"Expected passthrough for English text, got: {result}"
        )

    def test_english_passthrough_no_model_load(self) -> None:
        """translate_to_english('en') must NOT trigger model loading."""
        from app.services.translation_service import is_model_loaded, translate_to_english
        was_loaded = is_model_loaded()
        translate_to_english("some text", "en")
        # Model should not have been loaded just for English passthrough
        assert is_model_loaded() == was_loaded, (
            "Model should not load for English passthrough"
        )

    def test_get_model_status_returns_string(self) -> None:
        """get_model_status should return a valid state string."""
        from app.services.translation_service import get_model_status
        status = get_model_status()
        assert status in ("unloaded", "loaded", "failed"), (
            f"Unexpected status: {status}"
        )

    def test_is_model_loaded_returns_bool(self) -> None:
        """is_model_loaded should always return a bool."""
        from app.services.translation_service import is_model_loaded
        result = is_model_loaded()
        assert isinstance(result, bool)

    def test_unsupported_language_graceful_fallback(self) -> None:
        """Unsupported language codes should fall back without crashing."""
        from app.services.translation_service import translate_to_english
        # 'xx' is not in LANGUAGE_MAP — should return original text
        result = translate_to_english("test input", "xx")
        # Either passthrough or model-translated — must not raise
        assert isinstance(result, str)
        assert len(result) > 0
