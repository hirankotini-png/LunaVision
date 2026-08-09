import os
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv

def test():
    try:
        load_dotenv()
        # Mock configure so it doesn't fail on missing API key immediately if we just want to check signature
        # Actually we need a real API key to test the API request. 
        # If no key, we just exit.
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("NO API KEY")
            return
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        msgs = [
            {"role": "user", "parts": ["Initiate diagnostic session."]},
            {"role": "model", "parts": ["Hello. I am Luna."]},
            {"role": "user", "parts": ["What is safety score?"]}
        ]
        res = model.generate_content(msgs)
        print("SUCCESS:", res.text)
    except Exception as e:
        print("ERROR:", str(e))

if __name__ == "__main__":
    test()
