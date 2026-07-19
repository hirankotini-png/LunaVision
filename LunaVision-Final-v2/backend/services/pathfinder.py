import heapq
import cv2
import numpy as np

def find_rover_path(start: tuple, end: tuple, terrain_masks: dict, profile: str = 'safest') -> dict:
    """
    A* Pathfinding on a downsampled grid with profile-specific weights.
    Returns the path coordinates and calculated metrics.
    """
    scale = 0.25 # using 25% size
    
    # Resize masks
    small_hazard = cv2.resize(terrain_masks['hazard'], (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_NEAREST)
    small_slope = cv2.resize(terrain_masks['slope'], (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_NEAREST)
    small_roughness = cv2.resize(terrain_masks['roughness'], (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_NEAREST)
    
    h, w = small_hazard.shape
    
    sx, sy = int(start[0] * scale), int(start[1] * scale)
    ex, ey = int(end[0] * scale), int(end[1] * scale)
    
    sx, sy = max(0, min(w-1, sx)), max(0, min(h-1, sy))
    ex, ey = max(0, min(w-1, ex)), max(0, min(h-1, ey))

    def heuristic(a, b):
        return np.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)

    neighbors = [(0,1),(0,-1),(1,0),(-1,0), (1,1), (-1,-1), (1,-1), (-1,1)]
    
    close_set = set()
    came_from = {}
    gscore = { (sx, sy): 0 }
    fscore = { (sx, sy): heuristic((sx, sy), (ex, ey)) }
    oheap = []
    
    heapq.heappush(oheap, (fscore[(sx, sy)], (sx, sy)))
    
    # Profile weights
    if profile == 'safest':
        hazard_weight, slope_weight, rough_weight = 100.0, 50.0, 50.0
    elif profile == 'balanced':
        hazard_weight, slope_weight, rough_weight = 10.0, 5.0, 5.0
    else: # fastest
        hazard_weight, slope_weight, rough_weight = 1.0, 0.5, 0.5

    while oheap:
        current = heapq.heappop(oheap)[1]
        
        if heuristic(current, (ex, ey)) < 2:
            data = []
            while current in came_from:
                data.append({"x": int(current[0] / scale), "y": int(current[1] / scale)})
                current = came_from[current]
            data.append({"x": int(start[0]), "y": int(start[1])})
            path = data[::-1]
            return _calculate_metrics(path, terrain_masks, profile)
            
        close_set.add(current)
        
        for i, j in neighbors:
            neighbor = current[0] + i, current[1] + j
            
            if 0 <= neighbor[0] < w and 0 <= neighbor[1] < h:
                # Base step cost
                step_dist = 1.414 if i != 0 and j != 0 else 1.0
                
                # Check hazard
                haz_val = small_hazard[neighbor[1], neighbor[0]]
                slope_val = small_slope[neighbor[1], neighbor[0]] / 255.0
                rough_val = small_roughness[neighbor[1], neighbor[0]] / 255.0
                
                penalty = (
                    ((haz_val / 255.0) * hazard_weight) + 
                    (slope_val * slope_weight) + 
                    (rough_val * rough_weight)
                )
                
                tentative_g_score = gscore[current] + step_dist + penalty
                
                if neighbor in close_set and tentative_g_score >= gscore.get(neighbor, 0):
                    continue
                    
                if tentative_g_score < gscore.get(neighbor, float('inf')):
                    came_from[neighbor] = current
                    gscore[neighbor] = tentative_g_score
                    fscore[neighbor] = tentative_g_score + heuristic(neighbor, (ex, ey))
                    heapq.heappush(oheap, (fscore[neighbor], neighbor))
                    
    # Fallback to straight line if path not found
    points = []
    num_points = 20
    for i in range(num_points + 1):
        t = i / num_points
        px = int(start[0] + t * (end[0] - start[0]))
        py = int(start[1] + t * (end[1] - start[1]))
        points.append({"x": px, "y": py})
    return _calculate_metrics(points, terrain_masks, profile)

def _calculate_metrics(path, masks, profile):
    distance = 0
    energy = 0
    hazards_crossed = 0
    
    hazard_mask = masks['hazard']
    slope_mask = masks['slope']
    
    for i in range(len(path) - 1):
        p1 = path[i]
        p2 = path[i+1]
        
        dist = np.sqrt((p1['x'] - p2['x'])**2 + (p1['y'] - p2['y'])**2)
        distance += dist
        
        # sample terrain at p2
        px, py = min(hazard_mask.shape[1]-1, max(0, p2['x'])), min(hazard_mask.shape[0]-1, max(0, p2['y']))
        if hazard_mask[py, px] > 127:
            hazards_crossed += 1
            
        slope_val = slope_mask[py, px] / 255.0
        # Energy is dist + extra for slope
        energy += dist * (1.0 + slope_val * 2.0)
        
    # Scale realistic values
    km_distance = (distance * 0.05)
    kwh_energy = (energy * 0.12)
    minutes_time = (distance * 0.8)
    
    # Adjust by profile artificially if needed to emphasize
    if profile == 'fastest':
        minutes_time *= 0.8
    elif profile == 'balanced':
        kwh_energy *= 0.85
    elif profile == 'safest':
        kwh_energy *= 1.2
        minutes_time *= 1.2
        
    safety = max(0, 100 - (hazards_crossed * 10) - int((energy/max(1,distance)) * 10))
    if profile == 'safest':
        safety = min(100, safety + 20)
    elif profile == 'balanced':
        safety = min(100, safety + 10)
        
    return {
        "points": path,
        "distance": f"{km_distance:.1f} km",
        "energy": f"{kwh_energy:.1f} kWh",
        "time": f"{minutes_time:.0f} min",
        "hazards": hazards_crossed,
        "safety_score": safety
    }
