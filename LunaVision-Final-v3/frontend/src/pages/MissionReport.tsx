import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileText, ChevronLeft, Map as MapIcon, Target, Activity, ShieldAlert, Route as RouteIcon, Info, Database } from 'lucide-react';
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
        <button onClick={() => navigate('/upload')} className="premium-btn px-6 py-2 bg-primary rounded-lg font-medium">
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
        filename: 'LunaVision_Mission_Report_RESTRICTED.pdf',
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
  
  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2 uppercase tracking-widest border-b border-white/20 pb-1">{line.replace('# ', '')}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-gray-200 mt-3 mb-1 uppercase tracking-wider">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-gray-300 mt-2 mb-1">{line.replace('### ', '')}</h3>;
      if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1 text-gray-300 list-disc font-mono text-sm">{line.replace('- ', '')}</li>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="mb-2 text-gray-300 leading-relaxed font-sans text-sm">{line}</p>;
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <button onClick={() => navigate('/analysis')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={20} /> Back to Analysis
        </button>
        
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {analysisResult.routes?.map((route, idx) => (
            <button
              key={route.route_id}
              onClick={() => setSelectedRouteIdx(idx)}
              className={`premium-btn px-4 py-2 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors ${selectedRouteIdx === idx ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}
            >
              SHOW {route.name}
            </button>
          ))}
        </div>

        <button 
          onClick={handleDownload} 
          disabled={isGenerating}
          className="premium-btn w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-600 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(30,136,229,0.5)]"
        >
          {isGenerating ? <Activity className="animate-spin" size={16} /> : <Download size={16} />} 
          {isGenerating ? 'EXPORTING...' : 'EXPORT PDF'}
        </button>
      </div>

      {/* The Printable Report Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-[#0B101E] border-2 border-white/20 rounded-sm p-6 sm:p-10 md:p-14 shadow-2xl relative" 
        ref={reportRef}
      >
        {/* Official Header */}
        <div className="border-b-4 border-white pb-6 mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 border-2 border-white text-white shrink-0">
              <Target size={36} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-widest text-white uppercase font-sans">LunaVision</h2>
              <h3 className="text-xl font-bold tracking-widest text-gray-400 uppercase font-sans -mt-1">Mission Control</h3>
              <p className="text-gray-500 uppercase tracking-widest text-[10px] mt-2 font-mono">Document Ref: LV-MC-{analysisResult.session_id.substring(0,8).toUpperCase()}</p>
            </div>
          </div>
          <div className="text-left md:text-right flex flex-col items-start md:items-end justify-between h-full">
            <div>
              <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">Date: {new Date().toISOString().split('T')[0]}</p>
              <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">Clearance: RESTRICTED</p>
            </div>
            <div className="mt-4 px-6 py-2 border-2 border-current">
              <span className={`text-xl font-black tracking-widest uppercase ${analysisResult.readiness_status === 'GO' ? 'text-green-500' : analysisResult.readiness_status === 'CAUTION' ? 'text-yellow-500' : 'text-red-500'}`}>
                {analysisResult.readiness_status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          {/* Mission Telemetry Summary */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black mb-4 uppercase tracking-widest text-white flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                <Database size={18} className="text-blue-500" /> Primary Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/20 p-4">
                  <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-1">Safety Score</p>
                  <p className="text-3xl font-mono text-white font-bold">{analysisResult.safety_score}<span className="text-lg text-gray-600">/100</span></p>
                </div>
                <div className="border border-white/20 p-4">
                  <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-1">Landing Confidence</p>
                  <p className="text-3xl font-mono text-green-500 font-bold">{analysisResult.landing_confidence}<span className="text-lg text-green-500/50">%</span></p>
                </div>
                <div className="border border-white/20 p-4">
                  <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-1">Hazard Index</p>
                  <p className="text-2xl font-mono text-red-500 font-bold">{analysisResult.hazard_index}</p>
                </div>
                <div className="border border-white/20 p-4">
                  <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-1">Roughness</p>
                  <p className="text-2xl font-mono text-yellow-500 font-bold">{analysisResult.terrain_roughness}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black mb-4 uppercase tracking-widest text-white flex items-center gap-2 border-l-4 border-purple-500 pl-3">
                <ShieldAlert size={18} className="text-purple-500" /> Surface Distribution
              </h3>
              <table className="w-full text-left font-mono text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/10"><th className="py-2 text-gray-500 font-normal">Slope Profile</th><td className="py-2 text-right font-bold text-white">{analysisResult.slope}</td></tr>
                  <tr className="border-b border-white/10"><th className="py-2 text-gray-500 font-normal">Shadow Coverage</th><td className="py-2 text-right font-bold text-white">{analysisResult.shadow_coverage}</td></tr>
                  <tr className="border-b border-white/10"><th className="py-2 text-gray-500 font-normal">Crater Density</th><td className="py-2 text-right font-bold text-white">{analysisResult.crater_density}</td></tr>
                  <tr className="border-b border-white/10"><th className="py-2 text-gray-500 font-normal">Rock Density</th><td className="py-2 text-right font-bold text-white">{analysisResult.rock_density}</td></tr>
                  <tr className="border-b border-white/10"><th className="py-2 text-gray-500 font-normal">Landing Zone (opt)</th><td className="py-2 text-right font-bold text-green-500">X:{analysisResult.recommended_landing_zone.x} Y:{analysisResult.recommended_landing_zone.y}</td></tr>
                  {targetCoordinate && (
                    <tr className="border-b border-white/10"><th className="py-2 text-gray-500 font-normal">Target Destination</th><td className="py-2 text-right font-bold text-yellow-500">X:{targetCoordinate.x} Y:{targetCoordinate.y}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Visual Evidence */}
          <div className="space-y-6">
            <h3 className="text-lg font-black mb-4 uppercase tracking-widest text-white flex items-center gap-2 border-l-4 border-white pl-3">
              <MapIcon size={18} className="text-white" /> Visual Evidence
            </h3>
            <div className="space-y-4">
              <div className="border border-white/20 p-2 relative">
                <div className="absolute top-0 left-0 bg-white text-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase z-10">FIG 1: ORIGINAL SCAN</div>
                <img src={analysisResult.original_image_base64} alt="Original" className="w-full h-auto object-cover opacity-90" />
              </div>
              <div className="border border-white/20 p-2 relative">
                <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase z-10">FIG 2: HAZARD OVERLAY</div>
                <img src={analysisResult.hazard_map_base64} alt="Hazards" className="w-full h-auto object-cover opacity-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Route Detailed Analysis */}
        {selectedRoute && (
          <div className="mb-10 border-2 border-white/20 p-6 sm:p-8 relative">
            <div className="absolute top-[-14px] left-8 bg-[#0B101E] px-4">
              <h3 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                <RouteIcon size={20} className={`text-${selectedRoute.color}-500`} /> 
                EXECUTION PLAN: {selectedRoute.name}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div>
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Total Distance</p>
                      <p className="text-xl font-mono font-bold text-white">{selectedRoute.distance}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Est. Duration</p>
                      <p className="text-xl font-mono font-bold text-white">{selectedRoute.travel_time}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Power Req.</p>
                      <p className="text-xl font-mono font-bold text-yellow-500">{selectedRoute.energy_consumption}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Risk Factor</p>
                      <p className={`text-xl font-mono font-bold ${selectedRoute.risk_level === 'High' ? 'text-red-500' : selectedRoute.risk_level === 'Low' || selectedRoute.risk_level === 'Very Low' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {selectedRoute.risk_level}
                      </p>
                    </div>
                 </div>
              </div>
              <div className="border border-white/20 p-2 relative h-48 flex items-center justify-center bg-black">
                <div className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase z-10">FIG 3: ROUTE TRAJECTORY</div>
                <img src={selectedRoute.image_base64} alt="Selected Route" className="max-h-full object-contain" />
              </div>
            </div>
          </div>
        )}

        {/* Route Comparison Table */}
        {analysisResult.routes && analysisResult.routes.length > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-black mb-4 uppercase tracking-widest text-white border-b-2 border-white/20 pb-2">
              Route Alternatives Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono border-collapse">
                <thead>
                  <tr className="bg-white/10 text-white uppercase tracking-widest text-[10px]">
                    <th className="p-3 border border-white/20">Route ID</th>
                    <th className="p-3 border border-white/20">Dist</th>
                    <th className="p-3 border border-white/20">Time</th>
                    <th className="p-3 border border-white/20">Energy</th>
                    <th className="p-3 border border-white/20">Hazards</th>
                    <th className="p-3 border border-white/20">Safe Score</th>
                    <th className="p-3 border border-white/20">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResult.routes.map((route, i) => (
                    <tr key={route.route_id} className={`border-b border-white/20 ${selectedRouteIdx === i ? 'bg-white/5 font-bold' : 'text-gray-300'}`}>
                      <td className="p-3 border border-white/20 flex items-center gap-2">
                        <div className={`w-2 h-2 bg-${route.color}-500`}></div>
                        {route.name}
                      </td>
                      <td className="p-3 border border-white/20">{route.distance}</td>
                      <td className="p-3 border border-white/20">{route.travel_time}</td>
                      <td className="p-3 border border-white/20">{route.energy_consumption}</td>
                      <td className="p-3 border border-white/20">{route.hazards_crossed}</td>
                      <td className="p-3 border border-white/20">{route.safety_score}/100</td>
                      <td className={`p-3 border border-white/20 ${route.risk_level === 'High' ? 'text-red-500' : route.risk_level === 'Low' || route.risk_level === 'Very Low' ? 'text-green-500' : 'text-yellow-500'}`}>{route.risk_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Analysis Sections */}
        <div className="mb-10 p-6 sm:p-8 bg-white/5 border border-white/20">
          <h3 className="text-lg font-black mb-4 uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/20 pb-2">
            <Activity size={18} className="text-white" /> AI System Recommendation
          </h3>
          {analysisResult.analysis_explanation ? formatMarkdown(analysisResult.analysis_explanation) : <p className="text-gray-400 font-mono text-sm">NO SYSTEM RECOMMENDATION PROVIDED.</p>}
        </div>

        {/* Official Footer */}
        <div className="mt-16 pt-6 border-t-4 border-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-4 opacity-50 font-mono text-xs uppercase tracking-widest">
             <div className="border border-white px-2 py-1">AUTH: LUNA-AI</div>
             <div className="border border-white px-2 py-1">VER: 2.4.1-STABLE</div>
          </div>
          <div className="text-right">
             <p className="text-sm font-black text-white uppercase tracking-widest">End of Report</p>
             <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">Generated by LunaVision Autonomous System</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
