import asyncio
from app.routers.chat import generate_title, TitleRequest

async def test():
    req = TitleRequest(message="I have been experiencing a lot of anxiety and stress lately regarding my exams.")
    try:
        res = await generate_title(req)
        print("Generated Title:", res)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test())
