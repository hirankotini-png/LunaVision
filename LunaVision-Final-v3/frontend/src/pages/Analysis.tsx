import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, AlertTriangle, Crosshair, ArrowRight, ShieldAlert, Route as RouteIcon, Zap, Clock, Navigation, Loader2, Target, CheckCircle, Activity, Info } from 'lucide-react';
import { useMission } from '../context/MissionContext';

export default function Analysis() {
  const { analysisResult, setAnalysisResult, targetCoordinate, setTargetCoordinate } = useMission();
  const navigate = useNavigate();
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Calculating optimal routes...");
  
  const [markerPos, setMarkerPos] = useState<{x: number, y: number} | null>(null);

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Map size={64} className="text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
        <p className="text-gray-400 mb-6">Please upload an image to begin analysis.</p>
        <button onClick={() => navigate('/upload')} className="premium-btn px-6 py-2 bg-primary rounded-lg font-medium">
          Go to Upload
        </button>
      </div>
    );
  }

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (isPlanning) return;
    setPlanningError(null);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { naturalWidth, naturalHeight } = e.currentTarget;

    const imgRatio = naturalWidth / naturalHeight;
    const boxRatio = rect.width / rect.height;

    let displayedWidth, displayedHeight, imageLeft = 0, imageTop = 0;

    if (boxRatio > imgRatio + 0.001) {
      displayedHeight = rect.height;
      displayedWidth = displayedHeight * imgRatio;
      imageLeft = (rect.width - displayedWidth) / 2;
    } else if (imgRatio > boxRatio + 0.001) {
      displayedWidth = rect.width;
      displayedHeight = displayedWidth / imgRatio;
      imageTop = (rect.height - displayedHeight) / 2;
    } else {
      displayedWidth = rect.width;
      displayedHeight = rect.height;
    }

    const imageClickX = clickX - imageLeft;
    const imageClickY = clickY - imageTop;

    if (imageClickX < 0 || imageClickX > displayedWidth || imageClickY < 0 || imageClickY > displayedHeight) {
      return;
    }
    
    const parentContainer = e.currentTarget.parentElement;
    if (parentContainer) {
      const parentRect = parentContainer.getBoundingClientRect();
      setMarkerPos({ 
        x: ((e.clientX - parentRect.left) / parentRect.width) * 100, 
        y: ((e.clientY - parentRect.top) / parentRect.height) * 100 
      });
    }

    const originalX = Math.round((imageClickX / displayedWidth) * naturalWidth);
    const originalY = Math.round((imageClickY / displayedHeight) * naturalHeight);

    setTargetCoordinate({ x: originalX, y: originalY });
    
    if (analysisResult.routes && analysisResult.routes.length > 0) {
      setAnalysisResult({ ...analysisResult, routes: [], analysis_explanation: undefined });
      setSelectedRouteIdx(0);
    }
  }, [isPlanning, analysisResult, setAnalysisResult, setTargetCoordinate]);

  const handleGenerateMission = async () => {
    if (!targetCoordinate || isPlanning) return;
    
    setIsPlanning(true);
    setLoadingText("Building Navigation Graph...");

    try {
      setTimeout(() => setLoadingText("Optimizing energy parameters..."), 400);
      setTimeout(() => setLoadingText("Generating safe routes..."), 800);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/plan_routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: analysisResult.session_id,
          target_x: targetCoordinate.x,
          target_y: targetCoordinate.y
        })
      });

      if (!response.ok) {
        const err = await response.json();
        setPlanningError(err.detail || 'Failed to plan route');
        setIsPlanning(false);
        setMarkerPos(null);
        setTargetCoordinate(null);
        return;
      }

      const data = await response.json();
      setAnalysisResult({ ...analysisResult, routes: data.routes, analysis_explanation: data.analysis_explanation });
    } catch (err) {
      setPlanningError("Network error calculating route.");
      setMarkerPos(null);
      setTargetCoordinate(null);
    } finally {
      setIsPlanning(false);
    }
  };

  const selectedRoute = useMemo(() => {
    return (analysisResult.routes && analysisResult.routes.length > 0) ? analysisResult.routes[selectedRouteIdx] : null;
  }, [analysisResult.routes, selectedRouteIdx]);

  return (
    <div className="space-y-6 relative max-w-full">
      {/* Toast Error */}
      <AnimatePresence>
        {planningError && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3"
          >
            <AlertTriangle className="text-red-400" />
            <span className="font-medium">{planningError}</span>
            <button onClick={() => setPlanningError(null)} className="ml-4 text-sm text-red-200 hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Dashboard */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-black mb-1 uppercase tracking-widest text-white flex items-center gap-3">
            <Activity className="text-primary" /> Mission Dashboard
          </h1>
          <p className="text-gray-400 font-mono text-sm">LunaVision Advanced Pathfinder System</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-mono">AI Core Status</div>
            <div className="px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap bg-green-500/10 text-green-400 border-green-500/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> ONLINE
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-mono">Mission Readiness</div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${analysisResult.readiness_status === 'GO' ? 'bg-green-500/20 text-green-400 border-green-500/50' : analysisResult.readiness_status === 'CAUTION' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}>
              {analysisResult.readiness_status}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Main Terrain Viewer - Left Side (Larger) */}
        <div className="xl:col-span-8 flex flex-col gap-4 relative">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
              <Map size={16} className="text-blue-400" /> Tactical Surface Viewer
            </h3>
            {targetCoordinate && (
               <div className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-300 flex items-center gap-2">
                 <Target size={12} className="text-yellow-400"/>
                 TGT: {targetCoordinate.x}, {targetCoordinate.y}
               </div>
            )}
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="glass-card overflow-hidden border border-white/10 p-1 relative group w-full h-[50vh] xl:h-[65vh]">
            {(!analysisResult.routes || analysisResult.routes.length === 0) && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full border border-blue-500/50 flex items-center gap-3 animate-slide-up shadow-[0_0_20px_rgba(30,136,229,0.3)]">
                <Crosshair size={16} className="text-blue-400 animate-pulse shrink-0" />
                <span className="font-mono text-sm tracking-wide">CLICK TERRAIN TO DESIGNATE TARGET</span>
              </div>
            )}

            <div className="relative rounded-lg overflow-hidden bg-[#050B14] w-full h-full flex items-center justify-center">
              <div className="relative flex items-center justify-center w-full h-full max-h-full max-w-full">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={selectedRoute?.route_id || 'default'}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                    src={selectedRoute ? selectedRoute.image_base64 : analysisResult.original_image_base64} 
                    alt="Analyzed Surface" 
                    className={`max-h-full max-w-full object-contain ${isPlanning ? 'opacity-50' : 'cursor-crosshair'}`}
                    onClick={handleImageClick}
                  />
                </AnimatePresence>

                {isPlanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                     <div className="relative">
                       <div className="absolute inset-0 animate-ping rounded-full bg-primary/40 opacity-75"></div>
                       <Loader2 className="relative animate-spin text-primary mb-6" size={56} />
                     </div>
                     <p className="text-white font-mono text-sm font-bold tracking-widest bg-black/60 px-6 py-2 rounded-full border border-primary/30 uppercase shadow-[0_0_15px_rgba(30,136,229,0.4)]">
                       {loadingText}
                     </p>
                  </div>
                )}

                {markerPos && (!analysisResult.routes || analysisResult.routes.length === 0 || isPlanning) && (
                  <div 
                    className="absolute z-10 pointer-events-none marker-pulse"
                    style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%`, transform: 'translate(-50%, -50%)', width: '30px', height: '30px' }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Route Selector (Below Image) */}
          {analysisResult.routes && analysisResult.routes.length > 0 && !isPlanning && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {analysisResult.routes.map((route, idx) => {
                const isSelected = selectedRouteIdx === idx;
                const borderColors: Record<string, string> = { 'green': 'border-green-500/50', 'blue': 'border-blue-500/50', 'orange': 'border-orange-500/50' };
                const bgColors: Record<string, string> = { 'green': 'bg-green-500/10', 'blue': 'bg-blue-500/10', 'orange': 'bg-orange-500/10' };
                return (
                  <button
                    key={route.route_id}
                    onClick={() => setSelectedRouteIdx(idx)}
                    className={`premium-btn p-4 rounded-xl border text-left transition-all ${isSelected ? `${borderColors[route.color] || 'border-primary'} ${bgColors[route.color] || 'bg-primary/20'} ring-1 ring-${route.color}-500 shadow-[0_0_15px_rgba(255,255,255,0.05)]` : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <RouteIcon size={16} className={`text-${route.color}-400`} />
                      <h3 className="font-bold text-sm truncate uppercase tracking-wider">{route.name}</h3>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                      <span>Diff: {route.difficulty}</span>
                      <span className={route.risk_level === 'High' ? 'text-red-400' : 'text-green-400'}>{route.risk_level}</span>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          )}
        </div>

        {/* Live Statistics Dashboard - Right Side */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          <div className="glass-card p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
              <ShieldAlert size={14} className="text-blue-400" /> Primary Telemetry
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Safety Score</span>
                <span className="text-xl font-black text-white">{analysisResult.safety_score}/100</span>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Landing Conf.</span>
                <span className="text-xl font-black text-green-400">{analysisResult.landing_confidence}%</span>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Hazard Index</span>
                <span className="text-xl font-black text-red-400">{analysisResult.hazard_index}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Roughness</span>
                <span className="text-xl font-black text-yellow-400">{analysisResult.terrain_roughness}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
              <Info size={14} className="text-purple-400" /> Terrain Classification
            </h3>
            <ul className="space-y-3 font-mono text-sm">
              <li className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span className="text-gray-400 text-xs">Rock Density</span>
                <span className="font-bold text-white">{analysisResult.rock_density}</span>
              </li>
              <li className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span className="text-gray-400 text-xs">Crater Density</span>
                <span className="font-bold text-white">{analysisResult.crater_density}</span>
              </li>
              <li className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span className="text-gray-400 text-xs">Slope Profile</span>
                <span className="font-bold text-white">{analysisResult.slope}</span>
              </li>
            </ul>
          </div>

          {selectedRoute && !isPlanning && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border-blue-500/20 bg-blue-900/10">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-blue-500/20 pb-2">
                <Navigation size={14} /> Selected Route Metrics
              </h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Distance</span>
                  <span className="font-bold text-white">{selectedRoute.distance}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Est. Energy</span>
                  <span className="font-bold text-yellow-400">{selectedRoute.energy_consumption}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Travel Time</span>
                  <span className="font-bold text-white">{selectedRoute.travel_time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Hazards Crossed</span>
                  <span className="font-bold text-orange-400">{selectedRoute.hazards_crossed}</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mt-auto space-y-3 pt-4">
            {(!analysisResult.routes || analysisResult.routes.length === 0) && (
              <button 
                onClick={handleGenerateMission} 
                disabled={!targetCoordinate || isPlanning}
                className={`premium-btn w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all flex justify-center items-center gap-2 text-sm ${targetCoordinate && !isPlanning ? 'bg-primary hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(30,136,229,0.4)]' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'}`}
              >
                {isPlanning ? <Loader2 className="animate-spin" size={18} /> : <RouteIcon size={18} />}
                Generate Navigation
              </button>
            )}

            <button 
              onClick={() => navigate('/report', { state: { selectedRouteIdx } })} 
              disabled={!selectedRoute || isPlanning}
              className={`premium-btn w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all flex justify-center items-center gap-2 text-sm ${selectedRoute && !isPlanning ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/10'}`}
            >
              <CheckCircle size={18} /> Review Mission Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
