import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ChevronLeft, ShieldAlert, Target, Activity, CheckCircle, Info, Rocket, Map, Camera, Satellite } from 'lucide-react';
import { useMission } from '../context/MissionContext';
import html2pdf from 'html2pdf.js';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

export default function MissionReport() {
  const { analysisResult } = useMission();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Activity size={48} className="text-cyan-500 animate-pulse" />
        <h2 className="text-2xl font-bold tracking-widest text-gray-400">NO TELEMETRY DATA</h2>
        <button onClick={() => navigate('/upload')} className="text-cyan-400 hover:text-cyan-300">Return to Sensors</button>
      </div>
    );
  }

  const isGo = analysisResult.readiness_status === 'GO';
  const isCaution = analysisResult.readiness_status === 'CAUTION';
  const isNoGo = analysisResult.readiness_status === 'NO GO';
  
  const statusColor = isGo ? 'text-green-500' : isCaution ? 'text-yellow-500' : 'text-red-500';
  const statusBg = isGo ? 'bg-green-500/10 border-green-500/30' : isCaution ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      const opt = {
        margin: 10,
        filename: `Lunar_Mission_Report_${analysisResult.session_id.substring(0,8)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(reportRef.current).set(opt).save();
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Extract numbers for charts
  const craterNum = parseInt(analysisResult.crater_density) || 0;
  const roughnessNum = parseInt(analysisResult.terrain_roughness.replace('%', '')) || 0;
  const shadowNum = parseInt(analysisResult.shadow_coverage.replace('%', '')) || 0;

  const radarData = [
    { subject: 'Safety', A: analysisResult.safety_score, fullMark: 100 },
    { subject: 'Confidence', A: analysisResult.landing_confidence, fullMark: 100 },
    { subject: 'Roughness', A: 100 - roughnessNum, fullMark: 100 },
    { subject: 'Visibility', A: 100 - shadowNum, fullMark: 100 },
    { subject: 'Clearance', A: 100 - Math.min(craterNum * 5, 100), fullMark: 100 },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-32 space-y-8 animate-fade-in text-gray-200">
      
      {/* Top Action Bar */}
      <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md sticky top-4 z-50 shadow-2xl">
        <button 
          onClick={() => navigate('/analysis')} 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} /> Back to Command Center
        </button>
        <button 
          onClick={exportPDF} 
          disabled={isExporting}
          className="premium-btn flex items-center gap-2 px-6 py-2 rounded-xl bg-white text-black font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-[0_0_20px_rgba(30,136,229,0.2)]"
        >
          <Download size={18} />
          {isExporting ? 'TRANSMITTING...' : 'DOWNLOAD REPORT'}
        </button>
      </div>

      {/* Report Container */}
      <div ref={reportRef} className="glass-card bg-[#0a0f1c] rounded-[2rem] p-8 md:p-12 border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-8 mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Rocket size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400 uppercase">LunaVision AI</h1>
              <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mt-1">Lunar Surface Analysis Report</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 uppercase tracking-widest font-mono mb-1">Mission Date</p>
            <p className="font-mono text-white">{new Date().toLocaleString()}</p>
            <div className="inline-block mt-3 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold tracking-wider">
              TELEMETRY LOGGED
            </div>
          </div>
        </div>

        <div className="space-y-12">
          
          {/* PRIMARY STATUS */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`col-span-1 lg:col-span-2 p-8 rounded-2xl border ${statusBg} relative overflow-hidden flex flex-col justify-center`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
              <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Landing Readiness</p>
                <h2 className={`text-5xl md:text-7xl font-black ${statusColor} tracking-tighter mb-4`}>
                  {analysisResult.readiness_status}
                </h2>
                <div className="flex gap-6 mt-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Safety Score</p>
                    <p className="text-3xl font-mono text-white">{analysisResult.safety_score}<span className="text-lg text-gray-500">/100</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">AI Confidence</p>
                    <p className="text-3xl font-mono text-white">{analysisResult.landing_confidence}%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-1 glass-panel p-6 rounded-2xl flex flex-col items-center justify-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 w-full text-center">Terrain Radar Profile</h3>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{fill: '#06b6d4', fontSize: 10}} />
                    <Radar name="Terrain" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* HAZARD MAP & METRICS */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold uppercase tracking-widest text-white/90 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-blue-500"></span> Hazard Map Overlay
              </h3>
              <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group border border-white/10">
                <img src={analysisResult.hazard_map_base64} alt="Hazard Map" className="w-full h-auto rounded-xl object-cover" />
                <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono border border-white/20 text-cyan-400 flex items-center gap-2">
                  <Map size={14} /> TACTICAL VIEW
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold uppercase tracking-widest text-white/90 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-purple-500"></span> Surface Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-6 rounded-xl border border-white/5">
                  <Target className="text-purple-400 mb-3" size={24} />
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Crater Density</p>
                  <p className="text-xl font-mono text-white">{analysisResult.crater_density}</p>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-white/5">
                  <ShieldAlert className="text-orange-400 mb-3" size={24} />
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rock Density</p>
                  <p className="text-xl font-mono text-white">{analysisResult.rock_density}</p>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-white/5">
                  <Activity className="text-green-400 mb-3" size={24} />
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Terrain Roughness</p>
                  <p className="text-xl font-mono text-white">{analysisResult.terrain_roughness}</p>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-white/5">
                  <Camera className="text-blue-400 mb-3" size={24} />
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Shadow Coverage</p>
                  <p className="text-xl font-mono text-white">{analysisResult.shadow_coverage}</p>
                </div>
              </div>
              <div className="glass-panel p-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 mt-4 flex justify-between items-center">
                <span className="text-sm uppercase tracking-wider text-gray-400">Hazard Index</span>
                <span className="text-lg font-mono font-bold text-cyan-400">{analysisResult.hazard_index}</span>
              </div>
            </div>
          </section>

          {/* AI EXPLANATION */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold uppercase tracking-widest text-white/90 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-emerald-500"></span> AI Tactical Analysis
            </h3>
            <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <Satellite className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-gray-300 leading-relaxed">
                    {analysisResult.analysis_explanation || "No extended narrative generated by the core model for this sector."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <section className="pt-8 border-t border-white/10 flex justify-between items-center text-xs text-gray-600 font-mono">
            <div>
              LUNAVISION AI // ORBITAL COMMAND
            </div>
            <div>
              SESSION ID: {analysisResult.session_id}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
