import asyncio
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.services.screening_service import start_screening, submit_answer
from app.services.clinical_reasoning_service import rank_candidates
from app.services.clinical_nlp_service import extract_clinical_entities
import json

scenarios = [
    "I ate mushroom momos yesterday and now I feel nauseous",
    "I have fever, chills and mosquito exposure.",
    "I have burning while urinating.",
    "I feel weird.",
    "My stomach feels funny.",
    "Something is wrong.",
    "I don't know.",
    "Pain.",
    "I have everything.",
    "I have nothing.",
    "I ate spicy food.",
    "My arm hurts after gym.",
    "I think I'm dying.",
    "I forgot.",
    "I don't know if I have fever."
]

async def run_scenario(text):
    print(f"\n{'='*50}\nSCENARIO: {text}\n{'='*50}")
    try:
        # We simulate the chat start
        res = await start_screening(
            session_id="test_session",
            user_id="test_user",
            initial_message=text,
            user_profile={"age": 30, "gender": "male"}
        )
        print("Screening Started:")
        print(json.dumps(res, indent=2))
    except Exception as e:
        print("Error during start_screening:", type(e).__name__, e)

async def main():
    # Only run 2 for now to test the script
    for s in scenarios[:2]:
        await run_scenario(s)

if __name__ == "__main__":
    asyncio.run(main())
