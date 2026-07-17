
from __future__ import annotations
import pytest
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.clinical_reasoning_service import format_question_text, select_next_question
from app.services.indexer import _build_doc
from app.services.screening_service import _sessions, start_screening, submit_answer
from app.services.symptom_dictionary import build_question_candidates, question_text_for_phrase, score_generated_question

def test_phase9_complex_phrase_is_split_into_patient_safe_candidates() -> None:
    (candidates, issues) = build_question_candidates(['annular, scaly, erythematous plaque with central clearing'])
    assert ('a ring-shaped rash' in candidates)
    assert ('peeling skin' in candidates)
    assert ('redness' in candidates)
    assert ('a raised patch on the skin' in candidates)
    assert ('a rash with a lighter center and a ring around it' in candidates)
    assert issues

def test_phase9_question_selection_avoids_fragment_questions() -> None:
    top_diseases = [{'id': 'skin_diseases__ringworm', 'clinical_score': 0.88, 'question_candidates': 'a ring-shaped rash || a rash with a lighter center and a ring around it || itching', 'raw_symptoms': 'annular, scaly, erythematous plaque with central clearing || itching', 'tags': '', 'title': 'Ringworm'}, {'id': 'skin_diseases__granuloma_annulare', 'clinical_score': 0.82, 'question_candidates': 'a ring-shaped rash || redness', 'raw_symptoms': 'ring-shaped, skin-coloured or red papules || central clearing', 'tags': '', 'title': 'Granuloma Annulare'}, {'id': 'skin_diseases__eczema', 'clinical_score': 0.79, 'question_candidates': 'itching || peeling skin || redness', 'raw_symptoms': 'itchy, scaly rash', 'tags': '', 'title': 'Eczema'}]
    next_symptom = select_next_question(top_diseases, asked_symptoms=['ring_shaped_rash', 'itching', 'redness'], denied_symptoms=[])
    question_text = format_question_text((next_symptom or ''))
    assert (next_symptom == 'central_clearing')
    assert ('lighter center' in question_text.lower())
    assert ('central clearing' not in question_text.lower())

def test_phase9_indexer_preserves_raw_symptoms_and_question_candidates() -> None:
    (_, _, metadata) = _build_doc({'id': 'ringworm_case', 'category': 'Ringworm', 'symptoms': ['annular, scaly, erythematous plaque with central clearing', 'itching'], 'guidance': 'Keep the area dry.', 'precautions': ['Do not share towels.'], 'urgency': 'low'}, 'skin_diseases')
    assert (metadata['doc_schema'] == 'structured')
    assert ('annular, scaly, erythematous plaque with central clearing' in metadata['raw_symptoms'])
    assert ('a ring-shaped rash' in metadata['question_candidates'])
    assert (metadata['question_candidate_count'] >= 4)

@pytest.mark.anyio
async def test_phase9_generated_questions_score_well_and_final_response_is_present() -> None:
    (candidates, _) = build_question_candidates(['sudden eruption of small, red-yellow papules on buttocks, back, extremities'])
    scores = []
    for candidate in candidates:
        question = (question_text_for_phrase(candidate) or f'Have you experienced {candidate}?')
        (score, _) = score_generated_question(question)
        scores.append(score)
    assert scores
    assert (min(scores) >= 8)
    session_id = 'phase9_final_response'
    _sessions.pop(session_id, None)
    payload = (await start_screening(session_id, ['joint_pain'], {'age': 44, 'gender': 'male'}))
    while payload.get('screening_mode'):
        payload = (await submit_answer(session_id, payload['question']['id'], 'Yes'))
    assert (payload['screening_complete'] is True)
    assert payload['response'].strip()
    _sessions.pop(session_id, None)
