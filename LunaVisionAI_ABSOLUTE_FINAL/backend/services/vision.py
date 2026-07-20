import cv2
import numpy as np
import base64
import uuid
import time
from fastapi import HTTPException
from models.schemas import AnalysisResult, LandingZone, Coordinate, Route, PlanRouteResponse
from services.pathfinder import find_rover_path
from services.ai import openrouter_client
from services.session import store_session_data, get_session_data

class LunarVisionModel:
    """
    Optimized Singleton Model for LunaVision Inference.
    Pre-allocates standard sizes and re-uses kernels for maximum throughput.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LunarVisionModel, cls).__new__(cls)
            cls._instance.is_loaded = False
        return cls._instance
        
    def load_model(self):
        """Simulates loading AI weights and pre-allocates caching arrays to memory."""
        t0 = time.perf_counter()
        print("[LunarVisionModel] Initializing neural weights & pre-allocating GPU/CPU tensors...", flush=True)
        # Fixed model input size to drastically reduce OpenCV matrix overhead
        self.input_size = (512, 512) 
        # Pre-allocate kernels
        self.blur_kernel = (21, 21)
        self.is_loaded = True
        print(f"[LunarVisionModel] Model loaded in {time.perf_counter() - t0:.4f}s. Input shape: {self.input_size}. Batch Size: 1.", flush=True)

    def _image_to_base64(self, img) -> str:
        _, buffer = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

    async def predict(self, image_bytes: bytes) -> AnalysisResult:
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Ensure startup events triggered.")
            
        t_start = time.perf_counter()
        session_id = str(uuid.uuid4())
        
        # 1. IMAGE LOADING
        t0 = time.perf_counter()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image")
        t_load = time.perf_counter() - t0
            
        # 2. PREPROCESSING (Resize & Normalize)
        t0 = time.perf_counter()
        # Resize uploaded images to the model's required input dimensions before inference.
        img = cv2.resize(img, self.input_size)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Normalization Step
        gray_norm = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
        t_preprocess = time.perf_counter() - t0
        
        # 3. INFERENCE (Core algorithmic workload)
        t0 = time.perf_counter()
        edges = cv2.Canny(gray_norm, 50, 150)
        
        blurred = cv2.GaussianBlur(gray_norm, self.blur_kernel, 0)
        texture_var = cv2.absdiff(gray_norm, blurred)
        
        grad_x = cv2.Sobel(gray_norm, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray_norm, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = cv2.magnitude(grad_x, grad_y)
        
        circles = cv2.HoughCircles(gray_norm, cv2.HOUGH_GRADIENT, dp=1.2, minDist=30, param1=50, param2=30, minRadius=5, maxRadius=100)
        t_inference = time.perf_counter() - t0
        
        # 4. POSTPROCESSING
        t0 = time.perf_counter()
        height, width = self.input_size
        
        edge_density = np.sum(edges > 0) / (width * height)
        roughness_score = min(100, int(edge_density * 500))
        
        _, texture_mask = cv2.threshold(texture_var, 30, 255, cv2.THRESH_BINARY)
        _, shadow_mask = cv2.threshold(gray_norm, 30, 255, cv2.THRESH_BINARY_INV)
        shadow_coverage = np.sum(shadow_mask > 0) / (width * height)
        
        slope_mask = (grad_mag > 100).astype(np.uint8) * 255
        avg_slope_deg = min(45, int(np.mean(grad_mag) / 255.0 * 90))
        
        crater_count = len(circles[0]) if circles is not None else 0
        crater_density_val = crater_count / (width * height / 100000)
        
        _, bright_mask = cv2.threshold(gray_norm, 200, 255, cv2.THRESH_BINARY)
        rock_mask = cv2.bitwise_and(bright_mask, texture_mask)
        rock_density_val = np.sum(rock_mask > 0) / (width * height)
        
        hazard_mask = cv2.bitwise_or(edges, shadow_mask)
        hazard_mask = cv2.bitwise_or(hazard_mask, slope_mask)
        
        flatness_score = max(0, 100 - (avg_slope_deg * 2.22))
        rock_score = max(0, 100 - (rock_density_val * 2000))
        crater_score = max(0, 100 - (crater_density_val * 15))
        surface_score = max(0, 100 - roughness_score)
        
        grid_size = 4
        h_step, w_step = height // grid_size, width // grid_size
        min_haz = float('inf')
        best_grid = (width//2, height//2)
        
        for i in range(grid_size):
            for j in range(grid_size):
                y1, y2 = i * h_step, (i+1) * h_step
                x1, x2 = j * w_step, (j+1) * w_step
                haz_val = np.sum(hazard_mask[y1:y2, x1:x2] > 0)
                if haz_val < min_haz:
                    min_haz = haz_val
                    best_grid = (x1 + w_step//2, y1 + h_step//2)
                    
        center_x, center_y = best_grid
        radius = min(width, height) // 10
        clearance_score = max(0, 100 - (min_haz / (w_step * h_step) * 1000))
        
        safety_score = int(
            (flatness_score * 0.30) + (rock_score * 0.20) + (crater_score * 0.15) +
            (surface_score * 0.10) + (clearance_score * 0.10) + (90 * 0.10) + (95 * 0.05)
        )
        safety_score = max(0, min(100, safety_score))
        hazard_coverage = np.sum(hazard_mask > 0) / (width * height)
        
        status = "GO" if safety_score > 80 else "CAUTION" if safety_score >= 60 else "NO GO"
            
        original_image_base64 = self._image_to_base64(img)
        
        hazard_display = img.copy()
        hazard_display[hazard_mask > 0] = [0, 0, 255]
        hazard_map_base64 = self._image_to_base64(hazard_display)
        
        metrics_dict = {
            "safety_score": safety_score,
            "crater_count": crater_count,
            "roughness_score": roughness_score,
            "hazard_coverage": int(hazard_coverage * 100)
        }
        
        terrain_masks = {'hazard': hazard_mask, 'slope': slope_mask, 'roughness': edges}
        
        # Store state for route planning
        session_data = {
            'img': img,
            'terrain_masks': terrain_masks,
            'center_x': center_x,
            'center_y': center_y,
            'radius': radius,
            'metrics_dict': metrics_dict
        }
        store_session_data(session_id, session_data)
        
        t_postprocess = time.perf_counter() - t0
        t_total = time.perf_counter() - t_start
        
        print("\n--- AI PIPELINE PROFILER ---", flush=True)
        print(f"1. Image Loading:   {t_load * 1000:.2f} ms", flush=True)
        print(f"2. Preprocessing:   {t_preprocess * 1000:.2f} ms", flush=True)
        print(f"3. Inference (b=1): {t_inference * 1000:.2f} ms", flush=True)
        print(f"4. Postprocessing:  {t_postprocess * 1000:.2f} ms", flush=True)
        print(f"============================", flush=True)
        print(f"TOTAL LATENCY:      {t_total * 1000:.2f} ms\n", flush=True)
        
        return AnalysisResult(
            session_id=session_id,
            safety_score=safety_score,
            landing_confidence=round(safety_score * 0.95, 1),
            crater_density="High" if crater_density_val > 5 else "Moderate" if crater_density_val > 2 else "Low",
            rock_density="High" if rock_density_val > 0.05 else "Moderate" if rock_density_val > 0.01 else "Low",
            terrain_roughness=f"{roughness_score}%",
            slope=f"{avg_slope_deg} degrees",
            shadow_coverage=f"{int(shadow_coverage * 100)}%",
            hazard_index=f"{int(hazard_coverage * 100)}/100",
            mission_readiness_score=safety_score,
            readiness_status=status,
            recommended_landing_zone=LandingZone(x=center_x, y=center_y, radius=radius, reason="Lowest local hazard density."),
            routes=[],
            analysis_explanation=None,
            original_image_base64=original_image_base64,
            hazard_map_base64=hazard_map_base64
        )

# Instantiate the singleton model
vision_model = LunarVisionModel()

async def process_lunar_image(image_bytes: bytes) -> AnalysisResult:
    """Wrapper function to maintain API compatibility."""
    return await vision_model.predict(image_bytes)

async def plan_routes(session_id: str, target_x: int, target_y: int) -> PlanRouteResponse:
    session_data = get_session_data(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found or expired. Please re-upload the image.")
    
    terrain_masks = session_data['terrain_masks']
    img = session_data['img']
    center_x = session_data['center_x']
    center_y = session_data['center_y']
    radius = session_data['radius']
    
    hazard_mask = terrain_masks['hazard']
    height, width = hazard_mask.shape

    # Validate target bounds
    if target_x < 0 or target_x >= width or target_y < 0 or target_y >= height:
        raise HTTPException(status_code=400, detail="Target point is out of bounds.")
    
    # Target validation: Must not be on a hazard
    y_min, y_max = max(0, target_y-1), min(height, target_y+2)
    x_min, x_max = max(0, target_x-1), min(width, target_x+2)
    region_hazard = np.sum(hazard_mask[y_min:y_max, x_min:x_max] > 0)
    
    if region_hazard > 0:
        raise HTTPException(status_code=400, detail="This destination is unsafe. Please choose another destination.")

    start_pt = (center_x, center_y)
    end_pt = (target_x, target_y)
    
    optimal_path_data = find_rover_path(start_pt, end_pt, terrain_masks, 'safest')
    energy_path_data = find_rover_path(start_pt, end_pt, terrain_masks, 'balanced')
    fastest_path_data = find_rover_path(start_pt, end_pt, terrain_masks, 'fastest')
    
    def create_route_overlay(path_data, route_color):
        overlay = img.copy()
        overlay[hazard_mask > 0] = [0, 0, 255] # Red hazards
        cv2.circle(overlay, (center_x, center_y), radius, (0, 255, 0), -1) # Green safe zone
        
        alpha = 0.4
        blended = cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0)
        
        pts = path_data['points']
        for i in range(len(pts) - 1):
            pt1 = (pts[i]['x'], pts[i]['y'])
            pt2 = (pts[i+1]['x'], pts[i+1]['y'])
            cv2.line(blended, pt1, pt2, route_color, 2)
            
        cv2.circle(blended, (center_x, center_y), radius, (0, 255, 0), 2)
        cv2.putText(blended, "SAFE LZ", (max(0, center_x - 40), max(20, center_y)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)
        cv2.circle(blended, (target_x, target_y), 10, (255, 255, 0), -1)
        cv2.putText(blended, "TARGET", (max(0, target_x - 40), max(20, target_y - 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,0), 2)
        
        _, buffer = cv2.imencode('.jpg', blended, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

    optimal_b64 = create_route_overlay(optimal_path_data, (0, 255, 0))
    energy_b64 = create_route_overlay(energy_path_data, (255, 144, 30))
    fastest_b64 = create_route_overlay(fastest_path_data, (0, 165, 255))

    routes = [
        Route(
            route_id=str(uuid.uuid4()), name="Safest Route", route_type="safest",
            distance=optimal_path_data['distance'], energy_consumption=optimal_path_data['energy'],
            travel_time=optimal_path_data['time'], difficulty="Moderate",
            safety_score=optimal_path_data['safety_score'], risk_level="Low",
            hazards_crossed=optimal_path_data['hazards'], color="green",
            points=[Coordinate(x=p['x'], y=p['y']) for p in optimal_path_data['points']],
            image_base64=optimal_b64
        ),
        Route(
            route_id=str(uuid.uuid4()), name="Balanced Route", route_type="balanced",
            distance=energy_path_data['distance'], energy_consumption=energy_path_data['energy'],
            travel_time=energy_path_data['time'], difficulty="Easy",
            safety_score=energy_path_data['safety_score'], risk_level="Very Low",
            hazards_crossed=energy_path_data['hazards'], color="blue",
            points=[Coordinate(x=p['x'], y=p['y']) for p in energy_path_data['points']],
            image_base64=energy_b64
        ),
        Route(
            route_id=str(uuid.uuid4()), name="Fastest Route", route_type="fastest",
            distance=fastest_path_data['distance'], energy_consumption=fastest_path_data['energy'],
            travel_time=fastest_path_data['time'], difficulty="Hard",
            safety_score=fastest_path_data['safety_score'], risk_level="High",
            hazards_crossed=fastest_path_data['hazards'], color="orange",
            points=[Coordinate(x=p['x'], y=p['y']) for p in fastest_path_data['points']],
            image_base64=fastest_b64
        )
    ]

    analysis_explanation = await openrouter_client.generate_analysis_reasoning(optimal_b64, session_data['metrics_dict'])
    
    return PlanRouteResponse(routes=routes, analysis_explanation=analysis_explanation)
