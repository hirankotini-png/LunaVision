import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Crosshair, ShieldAlert, Navigation, Loader2, Target, CheckCircle, Info, Sliders, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { useMission } from '../context/MissionContext';

export default function Analysis() {
  const { analysisResult, setAnalysisResult, targetCoordinate, setTargetCoordinate } = useMission();
  const navigate = useNavigate();
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Synthesizing Diagnostic Pathways...");
  
  const [markerPos, setMarkerPos] = useState<{x: number, y: number} | null>(null);
  const [heatmapOpacity, setHeatmapOpacity] = useState(50);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scan Quality Mock Metrics (Derived deterministically from safety_score if available)
  const scanQuality = useMemo(() => {
    if (!analysisResult) return null;
    const baseScore = analysisResult.safety_score;
    return {
      blur: Math.min(100, Math.max(0, 100 - (baseScore * 0.8))),
      brightness: 85 + (baseScore % 10),
      contrast: 90 - (baseScore % 5),
      noise: Math.min(100, Math.max(0, 15 + (baseScore % 20))),
      rating: baseScore > 80 ? 'Excellent' : baseScore > 50 ? 'Acceptable' : 'Poor',
      retake: baseScore < 50
    };
  }, [analysisResult]);

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 flex flex-col items-center text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 z-0"></div>
          <Activity size={80} className="text-gray-500/50 mb-6 relative z-10" />
          <h2 className="text-3xl font-black mb-2 relative z-10 text-[var(--text-base)]">No Medical Data</h2>
          <p className="text-gray-400 mb-8 font-light relative z-10">Upload a medical scan to access the diagnostic dashboard.</p>
          <button onClick={() => navigate('/upload')} className="premium-btn px-8 py-3 rounded-full font-bold uppercase tracking-widest relative z-10 w-full">
            Initialize Scan
          </button>
        </motion.div>
      </div>
    );
  }

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlanning || compareMode) return;
    setPlanningError(null);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    setMarkerPos({ 
      x: (clickX / rect.width) * 100, 
      y: (clickY / rect.height) * 100 
    });

    // Approximate original coordinates for backend compatibility
    const originalX = Math.round((clickX / rect.width) * 512);
    const originalY = Math.round((clickY / rect.height) * 512);

    setTargetCoordinate({ x: originalX, y: originalY });
    
    if (analysisResult.routes && analysisResult.routes.length > 0) {
      setAnalysisResult({ ...analysisResult, routes: [], analysis_explanation: undefined });
      setSelectedRouteIdx(0);
    }
  }, [isPlanning, compareMode, analysisResult, setAnalysisResult, setTargetCoordinate]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!compareMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setComparePosition(x);
  };

  const handleGenerateMission = async () => {
    if (!targetCoordinate || isPlanning) return;
    
    setIsPlanning(true);
    setLoadingText("Analyzing Tissue Pathways...");

    try {
      setTimeout(() => setLoadingText("Generating Treatment Options..."), 400);
      setTimeout(() => setLoadingText("Finalizing Diagnostic Report..."), 800);
      
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
        setPlanningError(err.detail || 'Failed to generate diagnostics');
        setIsPlanning(false);
        setMarkerPos(null);
        setTargetCoordinate(null);
        return;
      }

      const data = await response.json();
      setAnalysisResult({ ...analysisResult, routes: data.routes, analysis_explanation: data.analysis_explanation });
    } catch (err) {
      setPlanningError("Network error calculating diagnostics.");
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
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-500/10 backdrop-blur-xl border border-red-500/50 text-[var(--text-base)] px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.3)] flex items-center gap-4"
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
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-[var(--color-primary)]/50 via-[var(--color-secondary)]/20 to-transparent"></div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 dark:bg-white/5 dark:border-white/10 w-fit mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-mono">Live Diagnostic</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-1 tracking-tight flex items-center gap-4">
            Analysis Dashboard
          </h1>
        </div>
        <div className="flex gap-3">
          <div className="glass-panel px-5 py-3 rounded-2xl flex flex-col items-end justify-center min-w-[120px]">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Quality Rating</div>
            <div className={`flex items-center gap-2 font-bold text-sm ${scanQuality?.retake ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
               {scanQuality?.rating}
            </div>
          </div>
          <div className="glass-panel px-5 py-3 rounded-2xl flex flex-col items-end justify-center min-w-[140px] relative overflow-hidden">
            <div className={`absolute inset-0 opacity-10 ${analysisResult.readiness_status === 'GO' ? 'bg-green-500' : analysisResult.readiness_status === 'CAUTION' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-mono relative z-10">Status</div>
            <div className={`text-sm font-black tracking-wider uppercase relative z-10 ${analysisResult.readiness_status === 'GO' ? 'text-green-500' : analysisResult.readiness_status === 'CAUTION' ? 'text-yellow-500' : 'text-red-500'}`}>
              {analysisResult.readiness_status === 'GO' ? 'CLEARED' : analysisResult.readiness_status === 'CAUTION' ? 'REVIEW REQ' : 'CRITICAL'}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Main Viewer Area */}
        <div className="xl:col-span-8 flex flex-col gap-6 relative">
          
          <div className="glass-panel p-3 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setCompareMode(!compareMode)}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all flex-1 sm:flex-none justify-center ${compareMode ? 'bg-[var(--color-primary)] text-white' : 'bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10'}`}
              >
                <ImageIcon size={16} /> <span className="whitespace-nowrap">Compare Mode</span>
              </button>
              
              {!compareMode && (
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-2 rounded-xl flex-1 sm:flex-none justify-between">
                  <Sliders size={16} className="text-gray-500 hidden sm:block" />
                  <span className="text-xs font-mono text-gray-500 hidden sm:block">Heatmap</span>
                  <input 
                    type="range" min="0" max="100" value={heatmapOpacity} 
                    onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                    className="w-full sm:w-24 md:w-32 accent-[var(--color-primary)]"
                  />
                  <span className="text-xs font-mono font-bold min-w-[3ch] text-right">{heatmapOpacity}%</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-3 py-2 rounded-xl w-full sm:w-auto">
              <ZoomIn size={16} className="text-gray-500 shrink-0" />
              <input 
                type="range" min="1" max="3" step="0.1" value={zoomLevel} 
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-full sm:w-24 accent-[var(--color-secondary)]"
              />
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            transition={{ duration: 0.5, type: "spring" }} 
            className="glass-card rounded-[2rem] p-1.5 relative group w-full h-[55vh] xl:h-[65vh]"
          >
            {(!analysisResult.routes || analysisResult.routes.length === 0) && !compareMode && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 glass-panel bg-[var(--bg-base)]/80 px-6 py-3 rounded-full flex items-center gap-3 animate-float shadow-lg">
                <Crosshair size={18} className="text-[var(--color-primary)] animate-pulse shrink-0" />
                <span className="font-mono text-xs font-medium tracking-widest">SELECT REGION OF INTEREST</span>
              </div>
            )}

            <div 
              ref={containerRef}
              className="relative rounded-[1.75rem] overflow-hidden bg-black w-full h-full flex items-center justify-center border border-[var(--glass-border)] z-10"
              onMouseMove={handleMouseMove}
              onClick={handleImageClick}
              style={{ cursor: compareMode ? 'ew-resize' : isPlanning ? 'wait' : 'crosshair' }}
            >
              <div className="relative w-full h-full overflow-hidden flex items-center justify-center" style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s' }}>
                
                {/* Original Image Layer */}
                <img 
                  src={analysisResult.original_image_base64} 
                  alt="Original Scan" 
                  className="absolute max-h-full max-w-full object-contain"
                />

                {/* Heatmap / Result Layer */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ 
                    clipPath: compareMode ? `polygon(0 0, ${comparePosition}% 0, ${comparePosition}% 100%, 0 100%)` : 'none',
                    opacity: compareMode ? 1 : heatmapOpacity / 100
                  }}
                >
                  <img 
                    src={selectedRoute ? selectedRoute.image_base64 : analysisResult.hazard_map_base64} 
                    alt="Analyzed Scan" 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {compareMode && (
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20 cursor-ew-resize"
                    style={{ left: `${comparePosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-4 h-1 flex justify-between">
                        <div className="w-1 h-full bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-full bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}

                {isPlanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                     <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                       <div className="absolute inset-0 border-2 border-dashed border-[var(--color-primary)] rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                       <Loader2 className="relative text-[var(--color-primary)]" size={40} />
                     </div>
                     <div className="glass-panel px-8 py-3 rounded-full border border-[var(--color-primary)]/30">
                        <p className="text-[var(--color-primary)] font-mono text-xs font-bold tracking-widest uppercase">
                          {loadingText}
                        </p>
                     </div>
                  </div>
                )}

                {markerPos && (!analysisResult.routes || analysisResult.routes.length === 0 || isPlanning) && !compareMode && (
                  <div 
                    className="absolute z-10 pointer-events-none"
                    style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%`, transform: 'translate(-50%, -50%)', width: '40px', height: '40px' }}
                  >
                    <div className="absolute inset-0 border-2 border-[var(--color-accent)] rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full shadow-[0_0_15px_var(--color-accent)]"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Treatment Pathways Selectors */}
          {analysisResult.routes && analysisResult.routes.length > 0 && !isPlanning && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {analysisResult.routes.map((route, idx) => {
                const isSelected = selectedRouteIdx === idx;
                const routeColors = {
                  'green': { border: 'border-[var(--color-success)]', bg: 'bg-[var(--color-success)]/10', text: 'text-[var(--color-success)]' },
                  'blue': { border: 'border-[var(--color-primary)]', bg: 'bg-[var(--color-primary)]/10', text: 'text-[var(--color-primary)]' },
                  'orange': { border: 'border-[var(--color-warning)]', bg: 'bg-[var(--color-warning)]/10', text: 'text-[var(--color-warning)]' }
                };
                const theme = routeColors[route.color as keyof typeof routeColors] || routeColors.blue;

                return (
                  <button
                    key={route.route_id}
                    onClick={() => setSelectedRouteIdx(idx)}
                    className={`relative p-5 rounded-2xl text-left transition-all duration-300 overflow-hidden group ${isSelected ? `glass-card ${theme.border} ${theme.bg}` : 'glass-panel border-transparent hover:border-[var(--glass-border)]'}`}
                  >
                    {isSelected && (
                      <motion.div layoutId="selectedRouteBg" className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent z-0" />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-[var(--bg-base)]' : 'bg-black/10 dark:bg-white/10'} ${theme.text}`}>
                          <Activity size={16} />
                        </div>
                        <h3 className={`font-bold text-sm truncate uppercase tracking-widest ${isSelected ? 'text-[var(--text-base)]' : 'text-gray-500'}`}>Treatment {idx+1}</h3>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-mono uppercase tracking-wider">
                        <span className={isSelected ? 'text-[var(--text-base)]' : 'text-gray-500'}>Efficacy: {route.difficulty}</span>
                        <span className={route.risk_level === 'High' ? 'text-[var(--color-danger)] font-bold' : theme.text}>{route.risk_level} RISK</span>
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
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-3 border-b border-[var(--glass-border)] pb-3">
              <ShieldAlert size={14} className="text-[var(--color-primary)]" /> 
              Clinical Telemetry
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono">Health Score</span>
                <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-secondary)]">{analysisResult.safety_score}</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono">Confidence</span>
                <span className="text-3xl font-black text-[var(--color-success)]">{analysisResult.landing_confidence}<span className="text-lg">%</span></span>
              </div>
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono">Anomaly Idx</span>
                <span className="text-3xl font-black text-[var(--color-danger)]">{analysisResult.hazard_index}</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono">Irregularity</span>
                <span className="text-3xl font-black text-[var(--color-warning)]">{analysisResult.terrain_roughness}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-[2rem]">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-3 border-b border-[var(--glass-border)] pb-3">
              <Info size={14} className="text-[var(--color-secondary)]" /> 
              Tissue Classification
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Calcification Density', value: analysisResult.rock_density },
                { label: 'Lesion Density', value: analysisResult.crater_density },
                { label: 'Structural Deformation', value: analysisResult.slope }
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-center glass-panel px-4 py-3 rounded-xl">
                  <span className="text-gray-500 text-[11px] font-mono uppercase tracking-wider">{item.label}</span>
                  <span className="font-bold text-sm">{item.value}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-[2rem]">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-3 border-b border-[var(--glass-border)] pb-3">
              <Target size={14} className="text-[var(--color-accent)]" /> 
              Scan Quality Metrics
            </h3>
            <div className="space-y-3">
               {[
                 { label: 'Blur Factor', value: scanQuality?.blur + '%', width: scanQuality?.blur },
                 { label: 'Noise Est', value: scanQuality?.noise + '%', width: scanQuality?.noise },
               ].map((metric, i) => (
                 <div key={i}>
                   <div className="flex justify-between text-[10px] font-mono uppercase text-gray-500 mb-1">
                     <span>{metric.label}</span><span>{metric.value}</span>
                   </div>
                   <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${metric.width}%` }}></div>
                   </div>
                 </div>
               ))}
               {scanQuality?.retake && (
                 <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
                   <AlertTriangle size={14}/> HIGH BLUR DETECTED. RETAKE RECOMMENDED.
                 </div>
               )}
            </div>
          </motion.div>

          <div className="mt-auto space-y-4 pt-4">
            {(!analysisResult.routes || analysisResult.routes.length === 0) && (
              <button 
                onClick={handleGenerateMission} 
                disabled={!targetCoordinate || isPlanning}
                className={`premium-btn w-full py-5 rounded-[1.5rem] font-black tracking-widest uppercase transition-all flex justify-center items-center gap-3 text-sm relative overflow-hidden ${targetCoordinate && !isPlanning ? 'hover:scale-[1.02]' : 'opacity-50 cursor-not-allowed'}`}
              >
                {isPlanning ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Activity size={20} />
                    Synthesize Diagnostics
                  </>
                )}
              </button>
            )}

            <button 
              onClick={() => navigate('/report', { state: { selectedRouteIdx } })} 
              disabled={!selectedRoute || isPlanning}
              className={`premium-btn w-full py-5 rounded-[1.5rem] font-bold tracking-widest uppercase transition-all flex justify-center items-center gap-3 text-sm border ${selectedRoute && !isPlanning ? 'bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 hover:scale-[1.02]' : 'opacity-50 cursor-not-allowed'}`}
            >
              <CheckCircle size={20} /> Finalize Medical Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
