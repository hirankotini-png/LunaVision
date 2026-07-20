import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, AlertTriangle, Crosshair, ShieldAlert, Route as RouteIcon, Navigation, Loader2, Target, CheckCircle, Activity, Info } from 'lucide-react';
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
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 flex flex-col items-center text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 z-0"></div>
          <Map size={80} className="text-gray-500/50 mb-6 relative z-10" />
          <h2 className="text-3xl font-black mb-2 relative z-10">No Telemetry</h2>
          <p className="text-gray-400 mb-8 font-light relative z-10">Upload a surface scan to access the tactical dashboard.</p>
          <button onClick={() => navigate('/upload')} className="premium-btn px-8 py-3 bg-white text-black rounded-full font-bold uppercase tracking-widest relative z-10 w-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            Initialize Scan
          </button>
        </motion.div>
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
    <div className="space-y-8 relative max-w-full pb-20">
      <AnimatePresence>
        {planningError && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-500/10 backdrop-blur-xl border border-red-500/50 text-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.3)] flex items-center gap-4"
          >
            <div className="p-2 bg-red-500/20 rounded-full">
              <AlertTriangle className="text-red-400" size={20} />
            </div>
            <span className="font-medium tracking-wide">{planningError}</span>
            <button onClick={() => setPlanningError(null)} className="ml-4 text-red-200 hover:text-white bg-red-500/20 p-1.5 rounded-full transition-colors">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pb-6 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-500/50 via-purple-500/20 to-transparent"></div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-widest text-cyan-200 font-mono">Live Telemetry</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-1 tracking-tight text-white flex items-center gap-4">
            Command Center
          </h1>
        </div>
        <div className="flex gap-3">
          <div className="glass-panel px-5 py-3 rounded-2xl flex flex-col items-end justify-center min-w-[120px]">
            <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-mono">System Core</div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div> ONLINE
            </div>
          </div>
          <div className="glass-panel px-5 py-3 rounded-2xl flex flex-col items-end justify-center min-w-[140px] relative overflow-hidden">
            <div className={`absolute inset-0 opacity-10 ${analysisResult.readiness_status === 'GO' ? 'bg-green-500' : analysisResult.readiness_status === 'CAUTION' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-mono relative z-10">Readiness</div>
            <div className={`text-sm font-black tracking-wider uppercase relative z-10 ${analysisResult.readiness_status === 'GO' ? 'text-green-400' : analysisResult.readiness_status === 'CAUTION' ? 'text-yellow-400' : 'text-red-400'}`}>
              {analysisResult.readiness_status}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Main Viewer Area */}
        <div className="xl:col-span-8 flex flex-col gap-6 relative">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Map size={14} className="text-cyan-400" /> Tactical Surface Map
            </h3>
            <AnimatePresence>
              {targetCoordinate && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-full text-cyan-300 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                  <Target size={12} className="text-cyan-400 animate-pulse"/>
                  TGT_COORD: [{targetCoordinate.x}, {targetCoordinate.y}]
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            transition={{ duration: 0.5, type: "spring" }} 
            className="glass-card rounded-[2rem] p-1.5 relative group w-full h-[55vh] xl:h-[70vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-transparent to-purple-500/30 rounded-[2rem] blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {(!analysisResult.routes || analysisResult.routes.length === 0) && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 glass-panel bg-black/40 text-white px-6 py-3 rounded-full flex items-center gap-3 animate-float shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <Crosshair size={18} className="text-cyan-400 animate-pulse shrink-0" />
                <span className="font-mono text-xs font-medium tracking-widest text-cyan-50">DESIGNATE TARGET SECTOR</span>
              </div>
            )}

            <div className="relative rounded-[1.75rem] overflow-hidden bg-[#02050A] w-full h-full flex items-center justify-center border border-white/5 z-10">
              <div className="relative flex items-center justify-center w-full h-full max-h-full max-w-full">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={selectedRoute?.route_id || 'default'}
                    initial={{ opacity: 0, filter: 'blur(10px)' }} 
                    animate={{ opacity: 1, filter: 'blur(0px)' }} 
                    exit={{ opacity: 0, filter: 'blur(10px)' }} 
                    transition={{ duration: 0.7 }}
                    src={selectedRoute ? selectedRoute.image_base64 : analysisResult.original_image_base64} 
                    alt="Analyzed Surface" 
                    className={`max-h-full max-w-full object-contain transition-all duration-500 ${isPlanning ? 'opacity-30 scale-105' : 'cursor-crosshair hover:scale-[1.02]'}`}
                    onClick={handleImageClick}
                  />
                </AnimatePresence>

                {isPlanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-20">
                     <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                       <div className="absolute inset-0 border-2 border-dashed border-cyan-500/50 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                       <div className="absolute inset-4 border-2 border-purple-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
                       <Loader2 className="relative text-cyan-400" size={40} />
                     </div>
                     <div className="glass-panel px-8 py-3 rounded-full border border-cyan-500/30">
                        <p className="text-cyan-300 font-mono text-xs font-bold tracking-widest uppercase">
                          {loadingText}
                        </p>
                     </div>
                  </div>
                )}

                {markerPos && (!analysisResult.routes || analysisResult.routes.length === 0 || isPlanning) && (
                  <div 
                    className="absolute z-10 pointer-events-none"
                    style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%`, transform: 'translate(-50%, -50%)', width: '40px', height: '40px' }}
                  >
                    <div className="absolute inset-0 border-2 border-cyan-400 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-2 border border-cyan-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_15px_#67e8f9]"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Route Selectors */}
          {analysisResult.routes && analysisResult.routes.length > 0 && !isPlanning && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {analysisResult.routes.map((route, idx) => {
                const isSelected = selectedRouteIdx === idx;
                const routeColors = {
                  'green': { border: 'border-green-400', bg: 'bg-green-500/10', shadow: 'shadow-[0_0_20px_rgba(74,222,128,0.2)]', text: 'text-green-400' },
                  'blue': { border: 'border-blue-400', bg: 'bg-blue-500/10', shadow: 'shadow-[0_0_20px_rgba(96,165,250,0.2)]', text: 'text-blue-400' },
                  'orange': { border: 'border-orange-400', bg: 'bg-orange-500/10', shadow: 'shadow-[0_0_20px_rgba(251,146,60,0.2)]', text: 'text-orange-400' }
                };
                const theme = routeColors[route.color as keyof typeof routeColors] || routeColors.blue;

                return (
                  <button
                    key={route.route_id}
                    onClick={() => setSelectedRouteIdx(idx)}
                    className={`relative p-5 rounded-2xl text-left transition-all duration-300 overflow-hidden group ${isSelected ? `glass-card ${theme.border} ${theme.bg} ${theme.shadow}` : 'glass-panel border-white/5 hover:border-white/20'}`}
                  >
                    {isSelected && (
                      <motion.div layoutId="selectedRouteBg" className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent z-0" />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/10' : 'bg-black/20'} ${theme.text}`}>
                          <RouteIcon size={16} />
                        </div>
                        <h3 className={`font-bold text-sm truncate uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-300'}`}>{route.name}</h3>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-mono uppercase tracking-wider">
                        <span className={isSelected ? 'text-gray-300' : 'text-gray-500'}>Diff: {route.difficulty}</span>
                        <span className={route.risk_level === 'High' ? 'text-red-400 font-bold' : theme.text}>{route.risk_level} RISK</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          )}
        </div>

        {/* Live Statistics - Right Side */}
        <div className="xl:col-span-4 flex flex-col gap-6 relative">
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-[2rem]">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-3 border-b border-white/5 pb-3">
              <ShieldAlert size={14} className="text-cyan-400" /> 
              Vital Telemetry
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono">Safety Index</span>
                <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">{analysisResult.safety_score}</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors relative overflow-hidden">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono relative z-10">Landing Conf</span>
                <span className="text-3xl font-black text-green-400 relative z-10">{analysisResult.landing_confidence}<span className="text-lg">%</span></span>
              </div>
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono relative z-10">Hazards</span>
                <span className="text-3xl font-black text-red-400 relative z-10">{analysisResult.hazard_index}</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono">Roughness</span>
                <span className="text-3xl font-black text-yellow-400">{analysisResult.terrain_roughness}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-[2rem]">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-3 border-b border-white/5 pb-3">
              <Info size={14} className="text-purple-400" /> 
              Terrain Classification
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Rock Density', value: analysisResult.rock_density },
                { label: 'Crater Density', value: analysisResult.crater_density },
                { label: 'Slope Profile', value: analysisResult.slope }
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-center glass-panel px-4 py-3 rounded-xl hover:translate-x-1 transition-transform">
                  <span className="text-gray-400 text-[11px] font-mono uppercase tracking-wider">{item.label}</span>
                  <span className="font-bold text-sm">{item.value}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {selectedRoute && !isPlanning && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 rounded-[2rem] border-cyan-500/20 bg-cyan-900/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>
              <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-5 flex items-center gap-3 border-b border-cyan-500/10 pb-3 relative z-10">
                <Navigation size={14} /> 
                Active Route Metrics
              </h3>
              <div className="space-y-4 relative z-10">
                {[
                  { label: 'Total Distance', value: selectedRoute.distance, color: 'text-white' },
                  { label: 'Est. Energy Draw', value: selectedRoute.energy_consumption, color: 'text-yellow-400 font-bold' },
                  { label: 'Travel Time', value: selectedRoute.travel_time, color: 'text-white' },
                  { label: 'Hazards Avoided', value: selectedRoute.hazards_crossed, color: 'text-orange-400 font-bold' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider">{item.label}</span>
                    <span className={`text-sm ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="mt-auto space-y-4 pt-4">
            {(!analysisResult.routes || analysisResult.routes.length === 0) && (
              <button 
                onClick={handleGenerateMission} 
                disabled={!targetCoordinate || isPlanning}
                className={`premium-btn w-full py-5 rounded-[1.5rem] font-black tracking-widest uppercase transition-all flex justify-center items-center gap-3 text-sm relative overflow-hidden ${targetCoordinate && !isPlanning ? 'bg-white text-black hover:scale-[1.02] shadow-[0_10px_40px_rgba(255,255,255,0.2)]' : 'glass-panel text-gray-400 cursor-not-allowed border border-white/10'}`}
              >
                {isPlanning ? (
                  <>
                    <Loader2 className="animate-spin text-cyan-400" size={20} />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">Processing...</span>
                  </>
                ) : (
                  <>
                    <RouteIcon size={20} className={targetCoordinate ? 'text-black' : 'text-gray-400'} />
                    Generate Navigation
                  </>
                )}
              </button>
            )}

            <button 
              onClick={() => navigate('/report', { state: { selectedRouteIdx } })} 
              disabled={!selectedRoute || isPlanning}
              className={`premium-btn w-full py-5 rounded-[1.5rem] font-bold tracking-widest uppercase transition-all flex justify-center items-center gap-3 text-sm border ${selectedRoute && !isPlanning ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/30 hover:scale-[1.02] shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'glass-panel text-gray-400 cursor-not-allowed border-white/10'}`}
            >
              <CheckCircle size={20} /> Finalize Mission Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
