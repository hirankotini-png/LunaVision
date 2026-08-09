from fastapi import APIRouter, File, UploadFile, HTTPException
from models.schemas import AnalysisResult, ChatRequest, ChatResponse, ReportRequest, HealthResponse, PlanRouteRequest, PlanRouteResponse
from services.vision import process_lunar_image, plan_routes
from services.ai import openrouter_client
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    key_exists = bool(os.getenv("GEMINI_API_KEY"))
    return HealthResponse(status="OK", ai_available=key_exists)

@router.get("/test-models")
async def test_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "No GEMINI_API_KEY found"}
    try:
        genai.configure(api_key=api_key)
        models = []
        for m in genai.list_models():
            if "generateContent" in m.supported_generation_methods:
                models.append(m.name)
        return {"available_models": models}
    except Exception as e:
        return {"error": str(e)}

@router.post("/analyse", response_model=AnalysisResult)
async def analyse_image(file: UploadFile = File(...)):
    print(f">>> Backend received POST request at /api/analyse with file: {file.filename}", flush=True)
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    
    contents = await file.read()
    # Process image using vision service
    result = await process_lunar_image(contents)
    return result

@router.post("/plan_routes", response_model=PlanRouteResponse)
async def plan_routes_endpoint(request: PlanRouteRequest):
    print(f">>> Backend calculating routes for session: {request.session_id}", flush=True)
    result = await plan_routes(request.session_id, request.target_x, request.target_y)
    return result

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    reply = await openrouter_client.chat(request.messages, request.context)
    return ChatResponse(reply=reply)

@router.post("/report")
async def generate_report(request: ReportRequest):
    # We will return a dict that matches whatever the frontend expects, which might just be JSON with a message
    # Let's generate the markdown text
    report_text = await openrouter_client.generate_report(request.analysis_result.model_dump())
    return {"status": "success", "message": report_text}
