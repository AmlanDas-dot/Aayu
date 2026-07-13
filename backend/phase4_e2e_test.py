"""
End-to-end clinical screening test against live ChromaDB.
Tests the full pipeline: start -> differential questions -> confidence tracking -> result.
"""
import sys

from app.services.screening_service import start_screening, submit_answer, is_screening_active

def run_scenario(name, initial_message, answers_plan, patient_ctx=None):
    print(f"\n{'='*60}")
    print(f"SCENARIO: {name}")
    print(f"Initial: {initial_message!r}")
    if patient_ctx:
        print(f"Context: {patient_ctx}")
    print("="*60)

    sid = f"test_{name.replace(' ', '_')}"
    payload = start_screening(sid, [initial_message], patient_ctx)

    q = payload.get("question", {})
    if not q:
        print("[RESULT] Screening completed immediately (no differentiating questions)")
        print("Conditions:", [c.get("name") for c in payload.get("possible_conditions", [])])
        return

    running = payload.get("running_scores", [])
    print(f"\nTop hypotheses:")
    for r in running[:3]:
        print(f"  {r['name']}: {r['score']}")

    print(f"\nQ1: {q.get('text')}")
    print(f"    (differentiates via: {q.get('id')!r})")

    # Submit planned answers
    for i, (qid, answer) in enumerate(answers_plan[:3], 2):
        if not is_screening_active(sid):
            break
        payload2 = submit_answer(sid, qid, answer)
        q2 = payload2.get("question", {})
        running2 = payload2.get("running_scores", [])

        if payload2.get("screening_complete"):
            print(f"\n[FINAL RESULT] Confidence: {payload2.get('confidence_label')}")
            conds = payload2.get("possible_conditions", [])
            for c in conds[:3]:
                print(f"  {c.get('name')}: {c.get('likelihood')}")
            break
        else:
            print(f"\nAfter answering '{answer}' to Q{i-1}:")
            for r in running2[:3]:
                print(f"  {r['name']}: {r['score']}")
            if q2:
                print(f"Q{i}: {q2.get('text')}")

    print()

# --- Test 1: Classic 'constantly hungry' (should NOT ask about fever) ---
run_scenario(
    "Constant Hunger",
    "I am constantly hungry",
    [
        ("weight loss", "Yes"),
        ("fatigue", "Yes"),
        ("frequent urination", "Yes"),
    ]
)

# --- Test 2: Child diarrhea (should enter pediatric reasoning) ---
run_scenario(
    "Child Diarrhea",
    "My child has diarrhea",
    [
        ("fever", "Yes"),
        ("vomiting", "Yes"),
    ],
    patient_ctx={"age": 5, "gender": "male"}
)

# --- Test 3: Weight loss with patient context ---
run_scenario(
    "Weight Loss with Context",
    "I have lost 8 kg in 2 months",
    [("fatigue", "Yes"), ("night sweats", "Yes")],
    patient_ctx={"age": 55, "gender": "female", "conditions": ["diabetes"]}
)

# --- Test 4: Swollen feet (elderly) ---
run_scenario(
    "Swollen Feet Elderly",
    "My grandmother has swollen feet",
    [("shortness of breath", "Yes")],
    patient_ctx={"age": 72, "gender": "female"}
)

print("\n=== END-TO-END TESTS COMPLETE ===")
