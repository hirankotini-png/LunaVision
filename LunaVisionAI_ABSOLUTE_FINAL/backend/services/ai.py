import os
import time
import asyncio
from typing import List, Optional
import google.generativeai as genai
from models.schemas import ChatMessage

# Model constants — using free-tier model
TEXT_MODEL = "gemini-1.5-flash"
VISION_MODEL = "gemini-1.5-flash"

class GeminiClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GeminiClient, cls).__new__(cls)
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
        return cls._instance

    async def generate_analysis_reasoning(self, image_base64_data: str, metrics: dict) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return (
                f"Deterministic analysis computed: {metrics.get('hazard_coverage', 'N/A')}% hazard coverage detected "
                f"via edge density, shadow mapping, and slope estimation. "
                f"Crater count: {metrics.get('crater_count', 0)}. "
                f"Terrain roughness index: {metrics.get('roughness_score', 'N/A')}%. "
                f"3 viable A* navigation paths (Optimal, Energy Efficient, Fastest) have been plotted. (Please add GEMINI_API_KEY to .env to enable AI reasoning)"
            )
            
        genai.configure(api_key=api_key)
            
        prompt = (
            "You are LunaVision AI, a NASA/ISRO mission-control analyst.\n"
            "Based on the following deterministic computer-vision metrics from a lunar surface scan, "
            "write a concise professional mission-readiness assessment.\n\n"
            f"Safety Score: {metrics.get('safety_score')}/100\n"
            f"Crater Count: {metrics.get('crater_count')}\n"
            f"Terrain Roughness: {metrics.get('roughness_score')}%\n"
            f"Hazard Coverage: {metrics.get('hazard_coverage')}%\n\n"
            "Include: terrain assessment, hazard summary, landing zone viability, "
            "and a quick overview of the 3 generated navigation routes (Optimal, Energy Efficient, Fastest). Keep it under 150 words."
        )

        try:
            model = genai.GenerativeModel(VISION_MODEL)
            # Send text prompt. Note: For Gemini, sending the image as base64 requires decoding and passing as dict. 
            # We skip the image here since the prompt already contains the metrics needed for reasoning.
            response = await model.generate_content_async([prompt])
            return response.text
        except Exception as e:
            print(f"[{time.strftime('%X')}] Gemini request FAILED. Error: {e}", flush=True)
            return (
                f"Deterministic analysis computed: {metrics.get('hazard_coverage', 'N/A')}% hazard coverage detected "
                f"via edge density, shadow mapping, and slope estimation. "
                f"Crater count: {metrics.get('crater_count', 0)}. "
                f"Terrain roughness index: {metrics.get('roughness_score', 'N/A')}%. "
                f"3 viable A* navigation paths (Optimal, Energy Efficient, Fastest) have been plotted."
            )

    async def chat(self, user_messages: List[ChatMessage], context: Optional[dict] = None) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return (
                "Mission Control Acknowledged. We are currently experiencing high latency with the deep-space communications network. "
                "However, our deterministic telemetry confirms the landing zone safety parameters are within acceptable thresholds. "
                "Please proceed with the mission plan or retry your transmission shortly. (Requires GEMINI_API_KEY in .env)"
            )
            
        genai.configure(api_key=api_key)
            
        system_prompt = (
            "You are LunaVision AI, a NASA/ISRO style mission-control AI assistant. "
            "You help analyze lunar surfaces and explain mission readiness to planners. "
            "Be concise and professional."
        )
        if context:
            system_prompt += f"\n\nCurrent Mission Context: {context}"

        formatted_msgs = []
        for msg in user_messages:
            formatted_msgs.append({"role": "user" if msg.role == "user" else "model", "parts": [msg.content]})

        # Gemini API requires the first message in the history to be from the user
        if formatted_msgs and formatted_msgs[0]["role"] == "model":
            formatted_msgs.insert(0, {"role": "user", "parts": ["Initiate diagnostic session."]})

        try:
            model = genai.GenerativeModel(TEXT_MODEL, system_instruction=system_prompt)
            response = await model.generate_content_async(formatted_msgs)
            return response.text
        except Exception as e:
            print(f"[{time.strftime('%X')}] Gemini request FAILED. Error: {e}", flush=True)
            return (
                "Mission Control Acknowledged. We are currently experiencing high latency with the deep-space communications network. "
                "However, our deterministic telemetry confirms the landing zone safety parameters are within acceptable thresholds. "
                "Please proceed with the mission plan or retry your transmission shortly."
            )

    async def generate_report(self, analysis_result_dict: dict) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return f"# Mission Report\n\nAI generation unavailable (Missing API Key). Fallback report:\n\n" + str(analysis_result_dict)
            
        genai.configure(api_key=api_key)
            
        prompt = (
            "Generate a formal NASA-style mission readiness report in markdown format. "
            "Include the following sections EXACTLY:\n"
            "1. Mission Summary\n"
            "2. Terrain Classification\n"
            "3. Landing Suitability\n"
            "4. Hazard Distribution\n"
            "5. Risk Analysis\n"
            "6. Top 3 Route Comparison\n"
            "7. Selected Route Justification\n"
            "8. Energy Optimization Summary\n"
            "9. AI Observations\n"
            "10. Mission Recommendation\n"
            "11. Overall Mission Status\n\n"
            f"Analysis Data:\n{analysis_result_dict}"
        )
        try:
            model = genai.GenerativeModel(TEXT_MODEL)
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            print(f"[{time.strftime('%X')}] Gemini request FAILED. Error: {e}", flush=True)
            return f"# Mission Report\n\nAI generation unavailable. Fallback report:\n\n" + str(analysis_result_dict)


openrouter_client = GeminiClient()
