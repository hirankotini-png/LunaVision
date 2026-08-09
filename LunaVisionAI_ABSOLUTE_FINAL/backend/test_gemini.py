import asyncio
from dotenv import load_dotenv
load_dotenv()
from services.ai import openrouter_client
from models.schemas import ChatMessage
import os

async def main():
    print("Key loaded:", bool(os.getenv("GEMINI_API_KEY")))
    msgs = [ChatMessage(role="user", content="hlo")]
    res = await openrouter_client.chat(msgs)
    print("Response:", res)

if __name__ == "__main__":
    asyncio.run(main())
