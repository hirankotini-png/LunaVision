from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[dict] = None

class ChatResponse(BaseModel):
    reply: str

class Coordinate(BaseModel):
    x: int
    y: int

class Route(BaseModel):
    route_id: str
    name: str
    route_type: str
    distance: str
    energy_consumption: str
    travel_time: str
    difficulty: str
    safety_score: int
    risk_level: str
    hazards_crossed: int
    color: str
    points: List[Coordinate]
    image_base64: str

class LandingZone(BaseModel):
    x: int
    y: int
    radius: int
    reason: str

class AnalysisResult(BaseModel):
    session_id: str
    safety_score: int
    landing_confidence: float
    crater_density: str
    rock_density: str
    terrain_roughness: str
    slope: str
    shadow_coverage: str
    hazard_index: str
    mission_readiness_score: int
    readiness_status: str
    recommended_landing_zone: LandingZone
    routes: Optional[List[Route]] = []
    analysis_explanation: Optional[str] = None
    original_image_base64: str
    hazard_map_base64: str

class PlanRouteRequest(BaseModel):
    session_id: str
    target_x: int
    target_y: int

class PlanRouteResponse(BaseModel):
    routes: List[Route]
    analysis_explanation: str

class HealthResponse(BaseModel):
    status: str
    ai_available: bool

class ReportRequest(BaseModel):
    analysis_result: AnalysisResult

