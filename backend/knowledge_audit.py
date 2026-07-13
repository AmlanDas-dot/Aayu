from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from app.services.symptom_dictionary import (
    build_question_candidates,
    classify_metadata_field,
    question_text_for_phrase,
    score_generated_question,
)

BASE_DIR = Path(__file__).resolve().parent
KNOWLEDGE_DIR = BASE_DIR / "app" / "data" / "healthknowledge"

EXAMPLE_PHRASES = [
    "annular, scaly, erythematous plaque with central clearing",
    "ring-shaped, skin-coloured or red papules, often on dorsa of hands and feet",
    "sudden eruption of small, red-yellow papules on buttocks, back, extremities",
    "may resolve spontaneously",
]


def _build_example_record(phrase: str) -> dict[str, object]:
    candidates, issues = build_question_candidates([phrase])
    question_examples = []
    for candidate in candidates:
        question = question_text_for_phrase(candidate) or f"Have you experienced {candidate}?"
        score, score_issues = score_generated_question(question)
        question_examples.append(
            {
                "candidate": candidate,
                "question": question,
                "score": score,
                "issues": score_issues,
            }
        )
    return {
        "raw_phrase": phrase,
        "question_candidates": candidates,
        "issues": issues,
        "questions": question_examples,
    }


def build_audit_report() -> dict[str, object]:
    field_inventory: Counter[str] = Counter()
    field_groups: Counter[str] = Counter()
    collection_counts: Counter[str] = Counter()
    total_entries = 0
    entries_with_symptoms = 0
    raw_symptom_phrases = 0
    total_question_candidates = 0
    total_candidate_issues = 0
    total_question_score = 0
    scored_questions = 0
    low_quality_questions: list[dict[str, object]] = []

    for filepath in sorted(KNOWLEDGE_DIR.glob("*.json")):
        with filepath.open(encoding="utf-8") as handle:
            entries = json.load(handle)

        collection_counts[filepath.stem] = len(entries)
        for entry in entries:
            total_entries += 1
            for field_name in entry:
                field_inventory[field_name] += 1
                field_groups[classify_metadata_field(field_name)] += 1

            symptoms = entry.get("symptoms", [])
            if not symptoms:
                continue

            entries_with_symptoms += 1
            raw_symptom_phrases += len(symptoms)
            candidates, issues = build_question_candidates([str(symptom) for symptom in symptoms])
            total_question_candidates += len(candidates)
            total_candidate_issues += len(issues)

            for candidate in candidates:
                question = question_text_for_phrase(candidate) or f"Have you experienced {candidate}?"
                score, score_issues = score_generated_question(question)
                total_question_score += score
                scored_questions += 1
                if score < 8 and len(low_quality_questions) < 20:
                    low_quality_questions.append(
                        {
                            "candidate": candidate,
                            "question": question,
                            "score": score,
                            "issues": score_issues,
                        }
                    )

    candidate_coverage = (total_question_candidates / raw_symptom_phrases) if raw_symptom_phrases else 0.0
    avg_question_score = (total_question_score / scored_questions) if scored_questions else 0.0
    issue_ratio = (total_candidate_issues / raw_symptom_phrases) if raw_symptom_phrases else 0.0
    knowledge_quality_score = round(
        ((avg_question_score / 10.0) * 70.0) + (min(candidate_coverage, 1.0) * 20.0) + ((1.0 - min(issue_ratio, 1.0)) * 10.0),
        2,
    )

    return {
        "collections": dict(collection_counts),
        "field_inventory": dict(field_inventory),
        "field_groups": dict(field_groups),
        "entries": {
            "total": total_entries,
            "with_symptoms": entries_with_symptoms,
            "raw_symptom_phrases": raw_symptom_phrases,
        },
        "question_generation": {
            "question_candidates": total_question_candidates,
            "candidate_coverage_ratio": round(candidate_coverage, 4),
            "candidate_issue_count": total_candidate_issues,
            "average_question_score_10": round(avg_question_score, 2),
            "knowledge_quality_score_100": knowledge_quality_score,
        },
        "low_quality_questions": low_quality_questions,
        "before_after_examples": [_build_example_record(phrase) for phrase in EXAMPLE_PHRASES],
    }


if __name__ == "__main__":
    print(json.dumps(build_audit_report(), indent=2))
