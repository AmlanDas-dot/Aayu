import asyncio
from app.services.screening_service import start_screening, submit_answer
import json

session_id = "test_session_123"
res1 = start_screening(session_id, ["knee pain"], {}, [])
q_id = res1["question"]["id"]
for i in range(10):
    res = submit_answer(session_id, q_id, "yes")
    if res.get("screening_complete"):
        with open("output_test.txt", "w", encoding="utf-8") as f:
            f.write(res.get("response", ""))
        break
    q_id = res["question"]["id"]
