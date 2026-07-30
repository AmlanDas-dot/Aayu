
from __future__ import annotations
import asyncio
import os
import sys
import pytest
from starlette.requests import Request
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.routers.chat import ChatRequest, chat
from app.services.conversation_service import extract_clinical_findings, extract_patient_context_from_message
from app.services.screening_service import _sessions, get_session, is_screening_active, start_screening, submit_answer
JARGON_TERMS = {'polyuria', 'polydipsia', 'polyphagia', 'orthopnea', 'melena', 'steatorrhea', 'dyspnea', 'hematemesis', 'hematuria'}

def _dummy_request() -> Request:
    return Request({'type': 'http', 'method': 'POST', 'path': '/chat', 'headers': []})

def test_negation_and_positive_findings_are_separated() -> None:
    (reported, denied) = extract_clinical_findings('I do not have fever, but I have a cough and watery stools.')
    assert ('fever' in denied)
    assert ('cough' in reported)
    assert ('diarrhea' in reported)
    assert ('fever' not in reported)

def test_hidden_family_context_is_extracted_and_removed_from_message() -> None:
    message = '[System: The user is asking on behalf of their family member: Rani, Age: 5, Conditions: asthma, Allergies: dust]\nMy child has diarrhea'
    (clean_message, ctx) = extract_patient_context_from_message(message)
    assert (clean_message == 'My child has diarrhea')
    assert (ctx['member_name'] == 'Rani')
    assert (ctx['age'] == 5)
    assert (ctx['conditions'] == ['asthma'])
    assert (ctx['relationship'] == 'child')

@pytest.mark.anyio
async def test_screening_question_is_empathetic_explanatory_and_not_repeated() -> None:
    session_id = 'phase7_constant_hunger'
    _sessions.pop(session_id, None)
    (reported, denied) = extract_clinical_findings('I am constantly hungry and have lost weight and I am urinating much more often.')
    payload = (await (start_screening(session_id, reported, {'age': 45, 'gender': 'male'}, denied)))
    assert payload['response'].startswith('I understand')
    assert (payload['question']['id'] not in {'polyphagia', 'weight loss', 'polyuria'})
    assert payload['question']['hint'].startswith('I am asking because')
    assert (not any(((term in payload['question']['text'].lower()) for term in JARGON_TERMS)))
    seen_questions = {payload['question']['id']}
    current = payload
    for _ in range(3):
        current = (await (submit_answer(session_id, current['question']['id'], 'Yes')))
        if current.get('screening_complete'):
            break
        valid_intros = ['Thank you', 'Got it', 'I understand', 'Good', 'Okay', 'Almost', 'That is helpful', 'I know']
        assert any(intro in current['response'] for intro in valid_intros)
        next_id = current['question']['id']
        assert (next_id not in seen_questions)
        seen_questions.add(next_id)
        assert (not any(((term in current['question']['text'].lower()) for term in JARGON_TERMS)))
    _sessions.pop(session_id, None)

@pytest.mark.anyio
async def test_summary_mode_uses_uncertain_clinical_language() -> None:
    session_id = 'phase7_child_diarrhea'
    _sessions.pop(session_id, None)
    (reported, denied) = extract_clinical_findings('My child has diarrhea and vomiting.')
    payload = (await (start_screening(session_id, reported, {'age': 5, 'gender': 'male', 'relationship': 'child'}, denied)))
    for _ in range(5):
        if payload.get('screening_complete'):
            break
        payload = (await (submit_answer(session_id, payload['question']['id'], 'Yes')))
    assert (payload['screening_complete'] is True)
    response = payload['response']
    assert ('Thank you for answering those questions' in response)
    assert ('plausible explanation' in response or 'possible explanation' in response or 'most likely explanation' in response)
    assert ('What to do now:' in response or 'Recommended actions' in response or 'If symptoms persist' in response)
    assert ('Please seek urgent medical care' in response or 'seek emergency care' in response or 'seek medical care' in response)
    assert ('You have ' not in response)
    _sessions.pop(session_id, None)

@pytest.mark.anyio
async def test_emergency_chat_response_is_calm_and_actionable() -> None:
    body = ChatRequest(message='My father has chest pain and cannot breathe', session_id='phase7_emergency')
    response = await chat(body, _dummy_request())
    assert (response.emergency is not None)
    assert (response.emergency['is_emergency'] is True)
    assert ('I am concerned' in response.response)
    assert ('call 108' in response.response.lower())
    assert ('POSSIBLE MEDICAL EMERGENCY' not in response.response)

@pytest.mark.anyio
@pytest.mark.parametrize(('session_id', 'complaint', 'patient_context'), [('phase7_const_hunger', 'I am constantly hungry', {'age': 45, 'gender': 'male'}), ('phase7_child_diarrhea_case', 'My child has diarrhea', {'age': 5, 'gender': 'male', 'relationship': 'child'}), ('phase7_pregnancy_headache', 'I am 28 weeks pregnant and have a severe headache', {'age': 29, 'gender': 'female', 'pregnancy_related': True}), ('phase7_memory_loss', 'My grandfather is forgetting names and getting confused', {'age': 78, 'gender': 'male'}), ('phase7_joint_pain', 'My joints are stiff and painful every morning', {'age': 42, 'gender': 'female'}), ('phase7_persistent_cough', 'I have had a cough for 3 weeks', {'age': 40, 'gender': 'male'}), ('phase7_anxiety', 'I keep feeling anxious and worried all the time', {'age': 35, 'gender': 'male'}), ('phase7_depression', 'I have been very sad and do not want to do anything', {'age': 28, 'gender': 'female'})])
async def test_phase7_scenarios_have_natural_non_repetitive_flow(session_id: str, complaint: str, patient_context: dict[(str, object)]) -> None:
    _sessions.pop(session_id, None)
    (reported, denied) = extract_clinical_findings(complaint)
    payload = (await (start_screening(session_id, (reported or [complaint]), patient_context, denied)))
    assert payload['response']
    assert (payload['response'].splitlines()[0] in {'I understand.', 'I am sorry your child is unwell.'})
    seen_ids: set[str] = set()
    seen_texts: set[str] = set()
    for _ in range(4):
        if payload.get('screening_complete'):
            break
        question = (payload.get('question') or {})
        assert question.get('id')
        assert (question['id'] not in seen_ids)
        assert (question['text'] not in seen_texts)
        assert question['hint'].startswith('I am asking because')
        assert (not any(((term in question['text'].lower()) for term in JARGON_TERMS)))
        seen_ids.add(question['id'])
        seen_texts.add(question['text'])
        payload = (await (submit_answer(session_id, question['id'], 'Yes')))
        if (not payload.get('screening_complete')):
            valid_intros = ['Thank you', 'Got it', 'I understand', 'Good', 'Okay', 'Almost', 'That is helpful', 'I know']
            assert any(intro in payload['response'] for intro in valid_intros)
    if payload.get('screening_complete'):
        assert ('Thank you for answering those questions.' in payload['response'])
    _sessions.pop(session_id, None)

@pytest.mark.anyio
async def test_snake_bite_emergency_response_is_calm_and_direct() -> None:
    body = ChatRequest(message='A snake bit my son 30 minutes ago', session_id='phase7_snake_bite')
    response = await chat(body, _dummy_request())
    assert (response.emergency is not None)
    assert (response.emergency['is_emergency'] is True)
    assert ('call 108' in response.response.lower())
    assert ('I am concerned' in response.response)

@pytest.mark.anyio
async def test_phase8_new_medical_complaint_offers_continue_or_restart() -> None:
    session_id = 'phase8_new_complaint'
    _sessions.pop(session_id, None)
    (await (start_screening(session_id, ['stomach pain'], {'age': 30, 'gender': 'male'})))
    response = await chat(ChatRequest(message='My left knee hurts.', session_id=session_id), _dummy_request())
    assert (response.screening_mode is True)
    assert (response.question is not None)
    assert ('different health concern' in response.response)
    assert (response.question.options == ['Continue current assessment', 'Start new assessment'])
    assert (is_screening_active(session_id) is True)
    _sessions.pop(session_id, None)

@pytest.mark.anyio
async def test_phase8_emergency_interrupts_active_screening() -> None:
    session_id = 'phase8_emergency_interrupt'
    _sessions.pop(session_id, None)
    (await (start_screening(session_id, ['diarrhea'], {'age': 5, 'gender': 'male', 'relationship': 'child'})))
    response = await chat(ChatRequest(message='My child has fainted.', session_id=session_id), _dummy_request())
    assert (response.emergency is not None)
    assert (response.emergency['is_emergency'] is True)
    assert (response.screening_mode is False)
    assert (is_screening_active(session_id) is False)

@pytest.mark.anyio
async def test_phase8_clarification_explains_term_and_resumes_screening() -> None:
    session_id = 'phase8_clarification'
    _sessions.pop(session_id, None)
    (await (start_screening(session_id, ['stomach pain'], {'age': 30, 'gender': 'female'})))
    response = await chat(ChatRequest(message='What does nausea mean?', session_id=session_id), _dummy_request())
    assert (response.screening_mode is True)
    assert (response.question is not None)
    assert ('feeling sick to your stomach' in response.response.lower())
    _sessions.pop(session_id, None)

@pytest.mark.anyio
async def test_phase8_stop_ends_session() -> None:
    session_id = 'phase8_stop'
    _sessions.pop(session_id, None)
    (await (start_screening(session_id, ['fever'], {'age': 22, 'gender': 'male'})))
    response = await chat(ChatRequest(message='Stop', session_id=session_id), _dummy_request())
    assert (response.screening_mode is False)
    assert (response.screening_complete is True)
    assert ('ended the current assessment' in response.response)
    assert (is_screening_active(session_id) is False)

@pytest.mark.anyio
async def test_phase8_restart_starts_fresh_screening() -> None:
    session_id = 'phase8_restart'
    _sessions.pop(session_id, None)
    (await (start_screening(session_id, ['stomach pain'], {'age': 30, 'gender': 'male'})))
    response = await chat(ChatRequest(message='Restart', session_id=session_id), _dummy_request())
    assert (response.screening_mode is True)
    assert (response.screening_complete is False)
    assert (response.question_index == 0)
    assert ('start the assessment again' in response.response.lower())
    assert (is_screening_active(session_id) is True)
    _sessions.pop(session_id, None)

@pytest.mark.anyio
async def test_phase8_change_patient_switches_context() -> None:
    session_id = 'phase8_change_patient'
    _sessions.pop(session_id, None)
    (await (start_screening(session_id, ['cough'], {'age': 42, 'gender': 'male', 'member_name': 'Ramesh'})))
    response = await chat(ChatRequest(message='This is actually about my daughter.', session_id=session_id), _dummy_request())
    session = (get_session(session_id) or {})
    assert (response.screening_mode is True)
    assert ('start a fresh assessment' in response.response.lower())
    assert (session.get('patient_context', {}).get('relationship') == 'child')
    assert (is_screening_active(session_id) is True)
    _sessions.pop(session_id, None)

@pytest.mark.anyio
async def test_phase8_maybe_is_treated_as_not_sure() -> None:
    session_id = 'phase8_not_sure'
    _sessions.pop(session_id, None)
    first = (await (start_screening(session_id, ['headache'], {'age': 27, 'gender': 'female'})))
    response = await chat(ChatRequest(message='Maybe', session_id=session_id), _dummy_request())
    assert (response.screening_mode is True)
    assert (response.question_index in {1, 0})
    assert ((response.question is None) or (response.question.id != first['question']['id']) or response.screening_complete)
    _sessions.pop(session_id, None)

@pytest.mark.anyio
async def test_phase8_why_question_gets_short_explanation_and_resumes() -> None:
    session_id = 'phase8_why'
    _sessions.pop(session_id, None)
    (await (start_screening(session_id, ['cough'], {'age': 31, 'gender': 'male'})))
    response = await chat(ChatRequest(message='Why are you asking that?', session_id=session_id), _dummy_request())
    assert (response.screening_mode is True)
    assert (response.question is not None)
    assert ('please let me know which option fits best' in response.response.lower())
    _sessions.pop(session_id, None)

@pytest.mark.anyio
async def test_phase8_gratitude_does_not_advance_screening() -> None:
    session_id = 'phase8_gratitude'
    _sessions.pop(session_id, None)
    first = (await (start_screening(session_id, ['cough'], {'age': 31, 'gender': 'male'})))
    response = await chat(ChatRequest(message='Thank you', session_id=session_id), _dummy_request())
    assert (response.screening_mode is True)
    assert (response.question is not None)
    assert (response.question.id == first['question']['id'])
    assert ('whenever you are ready' in response.response.lower())
    _sessions.pop(session_id, None)

@pytest.mark.anyio
async def test_phase8_vague_symptom_shift_is_not_treated_as_answer() -> None:
    session_id = 'phase8_vague_shift'
    _sessions.pop(session_id, None)
    (await (start_screening(session_id, ['stomach pain'], {'age': 31, 'gender': 'male'})))
    response = await chat(ChatRequest(message='My headache became worse.', session_id=session_id), _dummy_request())
    assert (response.screening_mode is True)
    assert (response.question is not None)
    assert ('different health concern' in response.response)
    assert (response.question.options == ['Continue current assessment', 'Start new assessment'])
    _sessions.pop(session_id, None)

@pytest.mark.anyio
@pytest.mark.parametrize('uncertain_reply', ['Maybe', 'Sometimes', 'Occasionally', 'Hard to tell', 'Not sure', "I don't know"])
async def test_phase8_uncertainty_phrases_are_not_treated_as_free_text(uncertain_reply: str) -> None:
    safe_reply = uncertain_reply.replace(' ', '_').replace("'", '')
    session_id = f'phase8_uncertain_{safe_reply}'
    _sessions.pop(session_id, None)
    first = (await (start_screening(session_id, ['headache'], {'age': 27, 'gender': 'female'})))
    response = await chat(ChatRequest(message=uncertain_reply, session_id=session_id), _dummy_request())
    assert (response.screening_mode is True)
    assert (response.question_index in {1, 0})
    assert ((response.question is None) or (response.question.id != first['question']['id']) or response.screening_complete)
    _sessions.pop(session_id, None)
