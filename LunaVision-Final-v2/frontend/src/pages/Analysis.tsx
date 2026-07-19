import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, AlertTriangle, Crosshair, ArrowRight, ShieldAlert, Route as RouteIcon, Zap, Clock, Navigation, Loader2 } from 'lucide-react';
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
        <button onClick={() => navigate('/upload')} className="px-6 py-2 bg-primary rounded-lg font-medium">
          Go to Upload
        </button>
      </div>
    );
  }

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
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
    
    // Store responsive marker percentages relative to the exact layout box (offset parent)
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
  };

  const handleGenerateMission = async () => {
    if (!targetCoordinate || isPlanning) return;
    
    setIsPlanning(true);
    setLoadingText("Calculating optimal routes...");

    try {
      setTimeout(() => setLoadingText("Optimizing energy..."), 500);
      setTimeout(() => setLoadingText("Generating mission report..."), 1000);
      
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

  const selectedRoute = (analysisResult.routes && analysisResult.routes.length > 0) ? analysisResult.routes[selectedRouteIdx] : null;

  const globalStatCards = [
    { label: 'Overall Safety', value: `${analysisResult.safety_score}/100`, icon: ShieldAlert, color: 'text-blue-400' },
    { label: 'Terrain Roughness', value: analysisResult.terrain_roughness, icon: Map, color: 'text-yellow-400' },
    { label: 'Hazard Index', value: analysisResult.hazard_index, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Landing Confidence', value: `${analysisResult.landing_confidence}%`, icon: Crosshair, color: 'text-green-400' },
  ];

  const routeStatCards = selectedRoute ? [
    { label: 'Distance', value: selectedRoute.distance, icon: Navigation, color: 'text-gray-200' },
    { label: 'Est. Energy', value: selectedRoute.energy_consumption, icon: Zap, color: 'text-yellow-400' },
    { label: 'Travel Time', value: selectedRoute.travel_time, icon: Clock, color: 'text-blue-400' },
    { label: 'Hazards Crossed', value: selectedRoute.hazards_crossed.toString(), icon: AlertTriangle, color: 'text-orange-400' },
  ] : [];

  return (
    <div className="space-y-6 relative">
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-1">Terrain Analysis</h1>
          <p className="text-gray-400">Processed optical data & hazard mapping.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1">Status</div>
          <div className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold border whitespace-nowrap ${analysisResult.readiness_status === 'GO' ? 'bg-green-500/20 text-green-400 border-green-500/50' : analysisResult.readiness_status === 'CAUTION' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}>
            {analysisResult.readiness_status}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 relative">
          
          {(!analysisResult.routes || analysisResult.routes.length === 0) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-primary/90 text-white px-4 py-1.5 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400 flex items-center gap-2 w-max max-w-[90%]"
            >
              <Crosshair size={14} className="animate-pulse text-blue-200 shrink-0" />
              <span className="font-bold tracking-wide text-xs sm:text-sm">Select destination</span>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden border border-white/20 p-2 relative group">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              
              <div className="relative flex items-center justify-center max-h-full max-w-full">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={selectedRoute?.route_id || 'default'}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    src={selectedRoute ? selectedRoute.image_base64 : analysisResult.original_image_base64} 
                    alt="Analyzed Surface" 
                    className={`max-h-full max-w-full object-contain ${isPlanning ? 'opacity-50' : 'hover:cursor-crosshair'}`}
                    onClick={handleImageClick}
                  />
                </AnimatePresence>

                {/* Interaction Loading Overlay */}
                {isPlanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                     <Loader2 className="animate-spin text-primary mb-4" size={48} />
                     <p className="text-white font-mono font-bold tracking-widest bg-black/50 px-4 py-2 rounded">{loadingText}</p>
                  </div>
                )}

                {/* Temporary Target Marker before route is fully generated */}
                {markerPos && (!analysisResult.routes || analysisResult.routes.length === 0 || isPlanning) && (
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute z-10 pointer-events-none"
                    style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <Crosshair className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" size={32} />
                  </motion.div>
                )}
              </div>

            </div>
          </motion.div>
          
          {/* Route Selector */}
          {analysisResult.routes && analysisResult.routes.length > 0 && !isPlanning && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {analysisResult.routes.map((route, idx) => {
                const isSelected = selectedRouteIdx === idx;
                const borderColors: Record<string, string> = {
                  'green': 'border-green-500/50',
                  'blue': 'border-blue-500/50',
                  'orange': 'border-orange-500/50'
                };
                const bgColors: Record<string, string> = {
                  'green': 'bg-green-500/10',
                  'blue': 'bg-blue-500/10',
                  'orange': 'bg-orange-500/10'
                };
                return (
                  <button
                    key={route.route_id}
                    onClick={() => setSelectedRouteIdx(idx)}
                    className={`p-4 rounded-xl border text-left transition-all ${isSelected ? `${borderColors[route.color] || 'border-primary'} ${bgColors[route.color] || 'bg-primary/20'} ring-1 ring-${route.color}-500 shadow-lg` : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <RouteIcon size={16} className={`text-${route.color}-400`} />
                      <h3 className="font-bold text-sm truncate">{route.name}</h3>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>Diff: {route.difficulty}</p>
                      <p>Risk: {route.risk_level}</p>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          {selectedRoute && !isPlanning ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Selected Route Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                {routeStatCards.map((stat, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + idx * 0.1 }} className="glass-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={16} className={stat.color} />
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                    <p className="text-sm font-bold font-mono">{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
             <div className="glass-card p-6 flex flex-col items-center justify-center text-center opacity-50 border-dashed">
                <Navigation className="text-gray-500 mb-3" size={32} />
                <p className="text-sm text-gray-400">Select a destination on the terrain<br/>to calculate navigation paths.</p>
             </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Global Area Metrics</h3>
            <div className="space-y-3">
              {globalStatCards.map((stat, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + idx * 0.1 }} className="glass-card p-3 flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-sm font-bold font-mono">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="pt-2 border-t border-white/10 space-y-3">
            {(!analysisResult.routes || analysisResult.routes.length === 0) && (
              <button 
                onClick={handleGenerateMission} 
                disabled={!targetCoordinate || isPlanning}
                className={`w-full py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${targetCoordinate && !isPlanning ? 'bg-primary hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(30,136,229,0.5)]' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
              >
                {isPlanning ? <Loader2 className="animate-spin" size={18} /> : <RouteIcon size={18} />}
                Generate Mission
              </button>
            )}

            <button 
              onClick={() => navigate('/report', { state: { selectedRouteIdx } })} 
              disabled={!selectedRoute || isPlanning}
              className={`w-full py-3 rounded-xl font-medium transition-all flex justify-center items-center gap-2 ${selectedRoute && !isPlanning ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
            >
              Generate PDF Report <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
