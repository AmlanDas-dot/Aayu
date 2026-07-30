import asyncio
from app.services.search_service import SearchService
from app.services.clinical_reasoning_service import rank_candidates, select_next_question, _split_candidate_values, normalize_symptom_concept, _TAG_BLACKLIST, GROUP_C_NEVER, GROUP_D_DOCTOR, _QUESTION_MAPPING
from app.services.symptom_dictionary import classify_symptom_phrase, rewrite_symptom_phrase, question_text_for_phrase

def _normalize_symptom(s: str) -> str:
    return normalize_symptom_concept(s)

svc = SearchService.get_instance()
results = svc.search('anxiety', collection='mental_health', top_k=5)
ranked = rank_candidates(results, ['anxiety'], {'age': 35, 'gender': 'male'})
top_3 = ranked[:3]

for disease in top_3:
    print(disease.get("title"), float(disease.get("clinical_score", 0)))
    q_cand = disease.get("question_candidates")
    if q_cand is not None:
        qs = q_cand
    else:
        qs = disease.get("raw_symptoms") or disease.get("tags", "")
    for tag in _split_candidate_values(str(qs)):
        raw_tag = tag.strip().lower()
        tag = _normalize_symptom(raw_tag)
        group, _ = classify_symptom_phrase(raw_tag)
        rewritten = rewrite_symptom_phrase(raw_tag)
        if rewritten:
            tag = _normalize_symptom(rewritten)
        has_curated = bool(question_text_for_phrase(tag) or question_text_for_phrase(raw_tag))
        token_count = len(tag.replace("_", " ").split())
        print(f"  TAG: {tag!r}, group={group}, rewritten={rewritten!r}, token_count={token_count}, has_cur={has_curated}")
        if any(bl in tag for bl in _TAG_BLACKLIST):
            print("    -> BLACKLISTED")
        elif group in {GROUP_C_NEVER, GROUP_D_DOCTOR}:
            print("    -> GROUP_C/D")
        elif (len(tag) < 5 or token_count > 6) and not has_curated:
            print("    -> TOO SHORT/LONG")
        elif tag in ['anxiety']:
            print("    -> EXCLUDED")
        elif token_count < 2 and not has_curated and raw_tag not in _QUESTION_MAPPING:
            print("    -> ONE TOKEN NON CURATED")
