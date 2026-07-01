import asyncio
from app.routers.chat import chat, ChatRequest

async def test():
    tests = [
        ("Hi", "general_chat"),
        ("I'm feeling lonely.", "general_chat"), # Note: It sets intent="general_chat", but system_prompt = PROMPT_MENTAL_HEALTH. That's fine.
        ("I have fever and headache.", "screening"),
        ("I have chest pain and can't breathe.", "emergency"), # actually emergency stops it early and returns emergency block
        ("What should I eat for anemia?", "nutrition"),
        ("Tell me about dengue.", "disease_information"),
        ("Nearest hospital", "hospitals"),
        ("What government schemes are available?", "schemes"),
    ]

    for msg, expected in tests:
        req = ChatRequest(message=msg, session_id="test-session")
        try:
            # We don't want to actually make an LLM call or emergency call right now, 
            # let's just print that the test is ready or mock the classifier.
            print(f"Test '{msg}' -> expected {expected}")
        except Exception as e:
            print(e)

if __name__ == "__main__":
    asyncio.run(test())
