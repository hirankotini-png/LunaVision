import os
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

async def main():
    msgs = [
        {"role": "user", "parts": ["Initiate diagnostic session."]},
        {"role": "model", "parts": ["Hello."]},
        {"role": "user", "parts": ["What is safety score?"]}
    ]
    try:
        res = await model.generate_content_async(msgs)
        print("SUCCESS:", res.text)
    except Exception as e:
        print("ERROR:", str(e))

asyncio.run(main())
