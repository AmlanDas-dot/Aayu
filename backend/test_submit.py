import asyncio
from app.services.screening_service import start_screening, submit_answer
import json

session_id = "test_session_123"
# Start screening
res1 = start_screening(session_id, ["knee pain"], {}, [])
print("Start:", res1.get("question"))
q_id = res1["question"]["id"]

# Submit answers until complete
for i in range(10):
    print(f"Submitting 'yes' to {q_id}")
    res = submit_answer(session_id, q_id, "yes")
    if res.get("screening_complete"):
        print("Screening Complete!")
        print("Response string length:", len(res.get("response", "")))
        print("Response:", res.get("response", ""))
        break
    q_id = res["question"]["id"]
