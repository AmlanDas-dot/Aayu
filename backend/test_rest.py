import requests
import json
import time

session_id = "rest_test_123"

# Start screening via chat
print("Starting screening via chat message...")
res = requests.post("http://127.0.0.1:8000/chat", json={
    "session_id": session_id,
    "message": "knee pain"
})
data = res.json()
print("Chat start response screening_complete:", data.get("screening_complete"))
q_id = data.get("question", {}).get("id")

for i in range(10):
    if not q_id:
        break
    print(f"Answering {q_id}...")
    res = requests.post("http://127.0.0.1:8000/chat/screening/answer", json={
        "session_id": session_id,
        "question_id": q_id,
        "answer": "yes"
    })
    data = res.json()
    print("screening_complete:", data.get("screening_complete"))
    if data.get("screening_complete"):
        with open("rest_output.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print("Done!")
        break
    q_id = data.get("question", {}).get("id")
