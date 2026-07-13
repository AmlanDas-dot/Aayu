from app.services.clinical_reasoning_service import (
    get_specialty_collections, rank_candidates,
    select_next_question, update_hypothesis_scores, should_stop_screening
)

def test_specialty(query, expected_first):
    cols = get_specialty_collections(query)
    ok = expected_first in cols
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {query[:45]} -> {cols[:3]}")
    return ok

print("=== SPECIALTY ROUTER ===")
all_pass = True
all_pass &= test_specialty("I am constantly hungry", "chronic_diseases")
all_pass &= test_specialty("My child has diarrhea", "child_health")
all_pass &= test_specialty("My grandmother has swollen feet", "chronic_diseases")
all_pass &= test_specialty("I have lost 8 kg in 2 months", "chronic_diseases")
all_pass &= test_specialty("I have severe itching", "skin_diseases")
all_pass &= test_specialty("My joints hurt every morning", "chronic_diseases")
all_pass &= test_specialty("I cannot sleep", "mental_health")
all_pass &= test_specialty("I keep forgetting things", "mental_health")
all_pass &= test_specialty("My daughter has a rash", "skin_diseases")
all_pass &= test_specialty("My wife is pregnant and has severe headache", "maternal_health")

print("\n=== WEIGHTED RANKING ===")
fake_results = [
    {"id": "diabetes", "title": "Diabetes Mellitus", "score": 0.71,
     "tags": "excessive hunger, weight loss, frequent urination, fatigue",
     "urgency": "high", "collection": "chronic_diseases", "content": ""},
    {"id": "hyperthyroid", "title": "Hyperthyroidism", "score": 0.69,
     "tags": "excessive hunger, weight loss, anxiety, tremors",
     "urgency": "medium", "collection": "chronic_diseases", "content": ""},
    {"id": "malnutrition", "title": "Malnutrition", "score": 0.65,
     "tags": "hunger, weakness, fatigue, edema",
     "urgency": "medium", "collection": "nutrition_diseases", "content": ""},
]
ctx = {"age": 45, "gender": "male", "conditions": ["hypertension"]}
ranked = rank_candidates(fake_results, ["hunger", "weight loss"], ctx)
for r in ranked:
    print(f"  {r['title']}: clinical_score={r['clinical_score']}")

print("\n=== DIFFERENTIAL QUESTION SELECTION ===")
q = select_next_question(ranked, ["hunger"], [])
print(f"  Q after knowing hunger: {q!r}")
q2 = select_next_question(ranked, ["hunger", "weight loss"], [])
print(f"  Q after hunger+weight loss: {q2!r}")

print("\n=== CONFIDENCE UPDATES ===")
hyp = {r["id"]: r["clinical_score"] for r in ranked}
print("Before:", {k: round(v,3) for k,v in hyp.items()})
hyp2 = update_hypothesis_scores(hyp, "frequent urination", "Yes", ranked)
print("After Yes to frequent_urination:", {k: round(v,3) for k,v in hyp2.items()})
hyp3 = update_hypothesis_scores(hyp2, "tremors", "No", ranked)
print("After No to tremors:", {k: round(v,3) for k,v in hyp3.items()})

print("\n=== STOP CONDITIONS ===")
stop, reason = should_stop_screening({"d1": 0.91, "d2": 0.55}, 2)
print(f"  High confidence: stop={stop}, reason={reason!r}")
stop2, r2 = should_stop_screening({"d1": 0.80, "d2": 0.55}, 3)
print(f"  Convergence gap: stop={stop2}, reason={r2!r}")
stop3, r3 = should_stop_screening({"d1": 0.80, "d2": 0.75}, 5)
print(f"  Max questions:   stop={stop3}, reason={r3!r}")

print()
if all_pass:
    print("ALL SPECIALTY TESTS PASS")
else:
    print("SOME TESTS FAILED")
