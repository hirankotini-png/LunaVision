from typing import Dict, Any

# Simple in-memory cache for session data
# Format: session_id -> { 'img': np.ndarray, 'hazard_mask': np.ndarray, 'slope_mask': np.ndarray, 'edges': np.ndarray, 'center_x': int, 'center_y': int, 'radius': int, 'metrics': dict }
_session_cache: Dict[str, Any] = {}

def store_session_data(session_id: str, data: Any):
    _session_cache[session_id] = data

def get_session_data(session_id: str) -> Any:
    return _session_cache.get(session_id)
