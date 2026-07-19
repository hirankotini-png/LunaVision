import os
import time
import asyncio
import httpx
from typing import List, Optional
from models.schemas import ChatMessage

# Model constants — using free-tier model
TEXT_MODEL = "google/gemma-4-31b-it:free"
VISION_MODEL = "google/gemma-4-31b-it:free"

class OpenRouterClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OpenRouterClient, cls).__new__(cls)
            cls._instance.client = httpx.AsyncClient()
        return cls._instance

    async def _call_api(self, messages: list, model: str = TEXT_MODEL) -> str:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            print(f"[{time.strftime('%X')}] OpenRouter: No API key found. Falling back.", flush=True)
            return None  # Handled by fallback in caller

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "LunaVision AI"
        }

        payload = {
            "model": model,
            "messages": messages
        }

        start_time = time.time()
        print(f"[{time.strftime('%X')}] OpenRouter request started. Model: {model}", flush=True)

        # 1 automatic retry
        for attempt in range(2):
            try:
                response = await self.client.post(url, headers=headers, json=payload, timeout=60.0)
                response.raise_for_status()
                data = response.json()

                duration = time.time() - start_time
                print(f"[{time.strftime('%X')}] OpenRouter request SUCCESS in {duration:.2f}s", flush=True)
                return data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as exc:
                err_msg = f"API Error {exc.response.status_code}: {exc.response.reason_phrase}"
                if attempt == 0:
                    print(f"[{time.strftime('%X')}] OpenRouter request FAILED (Attempt 1). Retrying in 3s... Error: {err_msg}", flush=True)
                    await asyncio.sleep(3)
                else:
                    print(f"[{time.strftime('%X')}] OpenRouter request FAILED in {time.time() - start_time:.2f}s. Error: {err_msg}", flush=True)
                    return f"ERROR: {err_msg}"
            except Exception as e:
                if attempt == 0:
                    print(f"[{time.strftime('%X')}] OpenRouter request FAILED (Attempt 1). Retrying in 3s... Error: {e}", flush=True)
                    await asyncio.sleep(3)
                else:
                    duration = time.time() - start_time
                    print(f"[{time.strftime('%X')}] OpenRouter request FAILED in {duration:.2f}s. Error: {e}", flush=True)
                    return f"ERROR: Connection Failed ({e})"

    async def generate_analysis_reasoning(self, image_base64_data: str, metrics: dict) -> str:
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

        messages = [{"role": "user", "content": prompt}]

        result = await self._call_api(messages, model=VISION_MODEL)
        if result and result.startswith("ERROR:"):
            return (
                f"Deterministic analysis computed: {metrics.get('hazard_coverage', 'N/A')}% hazard coverage detected "
                f"via edge density, shadow mapping, and slope estimation. "
                f"Crater count: {metrics.get('crater_count', 0)}. "
                f"Terrain roughness index: {metrics.get('roughness_score', 'N/A')}%. "
                f"3 viable A* navigation paths (Optimal, Energy Efficient, Fastest) have been plotted. "
                f"(AI module offline: {result})"
            )
        return result

    async def chat(self, user_messages: List[ChatMessage], context: Optional[dict] = None) -> str:
        system_prompt = (
            "You are LunaVision AI, a NASA/ISRO style mission-control AI assistant. "
            "You help analyze lunar surfaces and explain mission readiness to planners. "
            "Be concise and professional."
        )
        if context:
            system_prompt += f"\n\nCurrent Mission Context: {context}"

        formatted_msgs = [{"role": "system", "content": system_prompt}]
        for msg in user_messages:
            formatted_msgs.append({"role": msg.role, "content": msg.content})

        result = await self._call_api(formatted_msgs, model=TEXT_MODEL)
        if result and result.startswith("ERROR:"):
            return (
                f"AI module is currently unavailable. {result}\n"
                "Please verify your API limits or OPENROUTER_API_KEY environment variable."
            )
        return result

    async def generate_report(self, analysis_result_dict: dict) -> str:
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
        messages = [{"role": "user", "content": prompt}]

        result = await self._call_api(messages, model=TEXT_MODEL)
        if result and result.startswith("ERROR:"):
            return f"# Mission Report\n\nAI generation unavailable ({result}). Fallback report:\n\n" + str(analysis_result_dict)
        return result


openrouter_client = OpenRouterClient()
