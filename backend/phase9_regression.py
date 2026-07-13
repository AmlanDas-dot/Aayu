import asyncio
import json
import glob
import random
from app.services.screening_service import start_screening, submit_answer, clear_session
from app.services.symptom_dictionary import score_generated_question, NEVER_EXPOSE_PATTERNS

async def run_regression_tests():
    # Gather a list of random symptom strings to trigger the engine
    triggers = []
    for file in glob.glob('app/data/healthknowledge/*.json'):
        data = json.load(open(file, encoding='utf-8'))
        for item in data:
            if 'symptoms' in item and item['symptoms']:
                for s in item['symptoms']:
                    if len(s.split()) > 1:
                        triggers.append(s)
                        
    # Pick 100 random triggers
    random.seed(42)
    selected_triggers = random.sample(triggers, min(100, len(triggers)))
    
    total = 0
    passed = 0
    failed_questions = []
    
    for i, trigger in enumerate(selected_triggers):
        session_id = f"regression_session_{i}"
        try:
            payload = start_screening(session_id, [trigger])
            question = payload.get("question")
            if not question:
                continue
                
            q_text = question["text"]
            score, issues = score_generated_question(q_text)
            
            if score >= 8: # Arbitrary passing score
                passed += 1
            else:
                failed_questions.append({
                    "trigger": trigger,
                    "question": q_text,
                    "issues": issues,
                    "score": score
                })
            total += 1
        except Exception as e:
            print(f"Error on trigger '{trigger}': {e}")
        finally:
            clear_session(session_id)
            
    print(f"--- Phase 9 Regression Testing ---")
    print(f"Total tested questions: {total}")
    print(f"Passed (Clean wording): {passed}")
    print(f"Failed (Jargon/Fragments): {len(failed_questions)}")
    
    if failed_questions:
        print("\nFailures:")
        for f in failed_questions[:10]:
            print(f"- Trigger: {f['trigger']}\n  Question: {f['question']}\n  Issues: {f['issues']}\n")
    
    with open('phase9_regression_results.json', 'w') as f:
        json.dump({"total": total, "passed": passed, "failed": failed_questions}, f, indent=2)
        
    print("Results saved to phase9_regression_results.json")

if __name__ == "__main__":
    asyncio.run(run_regression_tests())
