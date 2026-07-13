import requests
import json

data = {
    "session_id": "test-123",
    "question_id": "controller:start_new",
    "answer": ""
}
res = requests.post("http://127.0.0.1:8000/chat/screening/answer", json=data)
print(json.dumps(res.json(), indent=2))
