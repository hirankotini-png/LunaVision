import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileText, ChevronLeft, Map as MapIcon, Target, Activity, ShieldAlert, Route as RouteIcon } from 'lucide-react';
import { useMission } from '../context/MissionContext';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function MissionReport() {
  const { analysisResult, targetCoordinate } = useMission();
  const navigate = useNavigate();
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(location.state?.selectedRouteIdx || 0);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <FileText size={64} className="text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Report Available</h2>
        <p className="text-gray-400 mb-6">Analyze an image first to generate a report.</p>
        <button onClick={() => navigate('/upload')} className="px-6 py-2 bg-primary rounded-lg font-medium">
          Upload Image
        </button>
      </div>
    );
  }

  const handleDownload = () => {
    setIsGenerating(true);
    const element = reportRef.current;
    if (element) {
      const opt: any = {
        margin: [10, 10],
        filename: 'LunaVision-Mission-Report.pdf',
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0B101E', windowWidth: 1024 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save().then(() => {
        setIsGenerating(false);
      });
    }
  };

  const selectedRoute = analysisResult.routes?.[selectedRouteIdx];
  
  // Format markdown from AI
  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mt-6 mb-3">{line.replace('# ', '')}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-gray-200 mt-5 mb-2">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-gray-300 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1 text-gray-300 list-disc">{line.replace('- ', '')}</li>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="mb-2 text-gray-300 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('/analysis')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={20} /> Back to Analysis
        </button>
        <button 
          onClick={handleDownload} 
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-600 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(30,136,229,0.5)]"
        >
          {isGenerating ? <Activity className="animate-spin" size={16} /> : <Download size={16} />} 
          {isGenerating ? 'Generating PDF...' : 'Download PDF Report'}
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {analysisResult.routes?.map((route, idx) => (
          <button
            key={route.route_id}
            onClick={() => setSelectedRouteIdx(idx)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedRouteIdx === idx ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            Show {route.name}
          </button>
        ))}
      </div>

      {/* The Printable Report Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-[#0B101E] border border-white/10 rounded-xl p-4 sm:p-8 md:p-12 shadow-2xl" 
        ref={reportRef}
      >
        {/* Header */}
        <div className="border-b border-white/20 pb-6 mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-primary/20 rounded-xl text-primary shrink-0">
              <Target size={28} className="sm:w-8 sm:h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black tracking-widest text-white uppercase">LunaVision AI</h2>
              <p className="text-gray-400 uppercase tracking-widest text-[10px] sm:text-sm mt-1 font-mono">Official Mission Report</p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="font-mono text-xs sm:text-sm text-gray-400">TS: {new Date().toLocaleString()}</p>
            <div className="mt-2 inline-block px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold border border-current">
              <span className={analysisResult.readiness_status === 'GO' ? 'text-green-400' : analysisResult.readiness_status === 'CAUTION' ? 'text-yellow-400' : 'text-red-400'}>
                STATUS: {analysisResult.readiness_status}
              </span>
            </div>
          </div>
        </div>

        {/* Global Metrics & Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-3 uppercase border-b border-white/10 pb-2 text-white flex items-center gap-2">
                <MapIcon size={18} className="text-blue-400" /> Terrain Classification
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <p className="text-gray-500 uppercase text-[10px] tracking-wider mb-1">Safety Score</p>
                  <p className="text-xl font-mono text-white font-bold">{analysisResult.safety_score}/100</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <p className="text-gray-500 uppercase text-[10px] tracking-wider mb-1">Landing Confidence</p>
                  <p className="text-xl font-mono text-green-400 font-bold">{analysisResult.landing_confidence}%</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <p className="text-gray-500 uppercase text-[10px] tracking-wider mb-1">Hazard Index</p>
                  <p className="text-xl font-mono text-red-400 font-bold">{analysisResult.hazard_index}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <p className="text-gray-500 uppercase text-[10px] tracking-wider mb-1">Roughness</p>
                  <p className="text-xl font-mono text-yellow-400 font-bold">{analysisResult.terrain_roughness}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3 uppercase border-b border-white/10 pb-2 text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-red-400" /> Hazard Distribution
              </h3>
              <ul className="space-y-2 font-mono text-sm">
                <li className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                  <span className="text-gray-400">Slope Profile:</span> 
                  <strong className="text-white">{analysisResult.slope}</strong>
                </li>
                <li className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                  <span className="text-gray-400">Shadow Coverage:</span> 
                  <strong className="text-white">{analysisResult.shadow_coverage}</strong>
                </li>
                <li className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                  <span className="text-gray-400">Crater Density:</span> 
                  <strong className="text-white">{analysisResult.crater_density}</strong>
                </li>
                <li className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                  <span className="text-gray-400">Rock Density:</span> 
                  <strong className="text-white">{analysisResult.rock_density}</strong>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3 uppercase border-b border-white/10 pb-2 text-white flex items-center gap-2">
                <Target size={18} className="text-green-400" /> Mission Coordinates
              </h3>
              <ul className="space-y-2 font-mono text-sm">
                <li className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                  <span className="text-gray-400">Landing Zone:</span> 
                  <strong className="text-green-400">({analysisResult.recommended_landing_zone.x}, {analysisResult.recommended_landing_zone.y})</strong>
                </li>
                {targetCoordinate && (
                  <li className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                    <span className="text-gray-400">Target Destination:</span> 
                    <strong className="text-yellow-400">({targetCoordinate.x}, {targetCoordinate.y})</strong>
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-3 uppercase border-b border-white/10 pb-2 text-white flex items-center gap-2">
              <Activity size={18} className="text-purple-400" /> Visual Mapping
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">Original Scan</p>
                <div className="border border-white/10 rounded-lg overflow-hidden bg-black">
                  <img src={analysisResult.original_image_base64} alt="Original" className="w-full h-auto object-cover opacity-80" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-red-500 uppercase tracking-wider font-mono">Hazard Map</p>
                <div className="border border-red-500/30 rounded-lg overflow-hidden bg-black">
                  <img src={analysisResult.hazard_map_base64} alt="Hazards" className="w-full h-auto object-cover opacity-90" />
                </div>
              </div>
            </div>
            
            <div className="space-y-1 pt-2">
              <p className="text-xs text-blue-400 uppercase tracking-wider font-mono">Selected: {selectedRoute?.name}</p>
              <div className="border border-blue-500/50 rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                <img src={selectedRoute?.image_base64} alt="Selected Route" className="max-h-full object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Route Details */}
        {selectedRoute && (
          <div className="mb-10 bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 uppercase text-white flex items-center gap-2">
              <RouteIcon size={18} className={`text-${selectedRoute.color}-400`} /> 
              Selected Route Justification: {selectedRoute.name}
            </h3>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-4">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase">Distance</p>
                <p className="text-sm font-mono text-white">{selectedRoute.distance}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase">Est. Energy</p>
                <p className="text-sm font-mono text-white">{selectedRoute.energy_consumption}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase">Travel Time</p>
                <p className="text-sm font-mono text-white">{selectedRoute.travel_time}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase">Hazards</p>
                <p className="text-sm font-mono text-white">{selectedRoute.hazards_crossed}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase">Difficulty</p>
                <p className="text-sm font-mono text-white">{selectedRoute.difficulty}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase">Risk Level</p>
                <p className={`text-sm font-mono font-bold ${selectedRoute.risk_level === 'High' ? 'text-red-400' : selectedRoute.risk_level === 'Low' || selectedRoute.risk_level === 'Very Low' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {selectedRoute.risk_level}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Route Comparison */}
        {analysisResult.routes && analysisResult.routes.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-3 uppercase border-b border-white/10 pb-2 text-white flex items-center gap-2">
              <RouteIcon size={18} className="text-gray-400" /> Route Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-gray-400 uppercase">
                    <th className="p-3">Route</th>
                    <th className="p-3">Distance</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Energy</th>
                    <th className="p-3">Hazards</th>
                    <th className="p-3">Safety Score</th>
                    <th className="p-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResult.routes.map((route, i) => (
                    <tr key={route.route_id} className={`border-b border-white/5 ${selectedRouteIdx === i ? 'bg-primary/20 text-white' : 'text-gray-300'}`}>
                      <td className="p-3 font-bold flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${route.color}-500`}></div>
                        {route.name}
                      </td>
                      <td className="p-3">{route.distance}</td>
                      <td className="p-3">{route.travel_time}</td>
                      <td className="p-3">{route.energy_consumption}</td>
                      <td className="p-3">{route.hazards_crossed}</td>
                      <td className="p-3">{route.safety_score}/100</td>
                      <td className={`p-3 font-bold ${route.risk_level === 'High' ? 'text-red-400' : route.risk_level === 'Low' || route.risk_level === 'Very Low' ? 'text-green-400' : 'text-yellow-400'}`}>{route.risk_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Analysis Sections */}
        <div className="mb-8 p-6 bg-blue-900/10 border border-blue-500/20 rounded-xl">
          <h3 className="text-lg font-bold mb-4 uppercase text-white flex items-center gap-2">
            <Activity size={18} className="text-blue-400" /> AI Summary & Mission Recommendation
          </h3>
          {analysisResult.analysis_explanation ? formatMarkdown(analysisResult.analysis_explanation) : <p className="text-gray-400">No AI summary available.</p>}
        </div>

        <div className="mt-12 pt-6 border-t border-white/20 text-center space-y-2">
          <p className="text-sm text-gray-500 font-mono tracking-widest uppercase">
            Confidential - LunaVision Mission Control
          </p>
          <p className="text-xs text-gray-600 font-mono">
            Generated automatically by LunaVision AI Pathfinder System
          </p>
        </div>
      </motion.div>
    </div>
  );
}
