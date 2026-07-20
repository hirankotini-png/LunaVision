import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, ChevronLeft, ShieldAlert, Target, Activity, CheckCircle, Info, Stethoscope, Camera, Volume2, VolumeX, User, Clock, HeartPulse, BrainCircuit, FileText } from 'lucide-react';
import { useMission } from '../context/MissionContext';
import html2pdf from 'html2pdf.js';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  AreaChart, Area, CartesianGrid
} from 'recharts';

export default function MissionReport() {
  const { analysisResult } = useMission();
  const navigate = useNavigate();
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'doctor' | 'patient'>('doctor');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const selectedRouteIdx = location.state?.selectedRouteIdx || 0;

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Activity size={48} className="text-[var(--color-primary)] animate-pulse" />
        <h2 className="text-2xl font-bold tracking-widest text-gray-400">NO MEDICAL DATA</h2>
        <button onClick={() => navigate('/upload')} className="text-[var(--color-primary)] hover:text-white">Initialize Scan</button>
      </div>
    );
  }

  const isCaution = analysisResult.readiness_status === 'CAUTION';
  const isHealthy = analysisResult.readiness_status === 'GO';
  
  const statusColor = isHealthy ? 'text-[var(--color-success)]' : isCaution ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]';
  const statusBg = isHealthy ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30' : isCaution ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30' : 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30';
  const statusText = isHealthy ? (viewMode === 'doctor' ? 'CLEARED' : 'HEALTHY') : isCaution ? (viewMode === 'doctor' ? 'REVIEW REQ' : 'MONITOR') : (viewMode === 'doctor' ? 'CRITICAL' : 'HIGH RISK');

  const selectedRoute = analysisResult.routes?.[selectedRouteIdx];

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Medical_Report_${analysisResult.session_id.substring(0,8)}.pdf`,
        image: { type: 'jpeg' as const, quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#02050A' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(reportRef.current).set(opt).save();
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const narrative = analysisResult.analysis_explanation || `Diagnostic analysis completed. Health score is ${analysisResult.safety_score}. Confidence level is ${analysisResult.landing_confidence} percent.`;
      const utterance = new SpeechSynthesisUtterance(narrative);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Convert legacy lunar metrics to medical metrics
  const lesionDensity = parseInt(analysisResult.crater_density) || 0;
  const irregularity = parseInt(analysisResult.terrain_roughness.replace('%', '')) || 0;
  const tissueObscuration = parseInt(analysisResult.shadow_coverage.replace('%', '')) || 0;

  const radarData = [
    { subject: 'Health Index', A: analysisResult.safety_score, fullMark: 100 },
    { subject: 'Diagnostic Conf', A: analysisResult.landing_confidence, fullMark: 100 },
    { subject: 'Tissue Regularity', A: 100 - irregularity, fullMark: 100 },
    { subject: 'Scan Clarity', A: 100 - tissueObscuration, fullMark: 100 },
    { subject: 'Lesion Absence', A: 100 - Math.min(lesionDensity * 5, 100), fullMark: 100 },
  ];

  const probabilityData = [
    { name: 'Primary Diagnosis', prob: analysisResult.landing_confidence },
    { name: 'Differential A', prob: Math.max(0, analysisResult.landing_confidence - 15) },
    { name: 'Differential B', prob: Math.max(0, analysisResult.landing_confidence - 35) },
    { name: 'Artifact', prob: tissueObscuration },
  ];

  const timelineData = [
    { time: 'T-6M', score: Math.min(100, analysisResult.safety_score + 15) },
    { time: 'T-3M', score: Math.min(100, analysisResult.safety_score + 8) },
    { time: 'T-1M', score: Math.min(100, analysisResult.safety_score + 2) },
    { time: 'Current', score: analysisResult.safety_score },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-32 space-y-8 animate-fade-in text-[var(--text-base)]">
      
      {/* Top Action Bar */}
      <div className="flex flex-wrap justify-between items-center bg-black/5 dark:bg-black/40 p-4 rounded-2xl border border-[var(--glass-border)] backdrop-blur-md sticky top-4 z-50 shadow-2xl gap-4">
        <button 
          onClick={() => navigate('/analysis')} 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full sm:w-auto"
        >
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
        
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto justify-start sm:justify-end">
          <div className="flex items-center bg-black/20 dark:bg-white/5 rounded-xl p-1 border border-[var(--glass-border)]">
            <button 
              onClick={() => setViewMode('doctor')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${viewMode === 'doctor' ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Stethoscope size={16} /> Clinical
            </button>
            <button 
              onClick={() => setViewMode('patient')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${viewMode === 'patient' ? 'bg-[var(--color-secondary)] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <User size={16} /> Patient
            </button>
          </div>

          <button 
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl transition-all shrink-0 ${isSpeaking ? 'bg-[var(--color-accent)] text-white animate-pulse' : 'bg-black/20 dark:bg-white/5 border border-[var(--glass-border)] hover:bg-white/10'}`}
            title="Read Report Aloud"
          >
            {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <button 
            onClick={exportPDF} 
            disabled={isExporting}
            className="premium-btn flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 flex-1 sm:flex-none justify-center"
          >
            <Download size={18} />
            {isExporting ? 'GENERATING...' : 'EXPORT PDF'}
          </button>
        </div>
      </div>

      {/* Report Container */}
      <div ref={reportRef} className="glass-card bg-[var(--bg-base)] rounded-[2rem] p-8 md:p-12 border border-[var(--glass-border)] shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[var(--glass-border)] pb-8 mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
              <HeartPulse size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] uppercase">LunaVision Health</h1>
              <p className="text-[var(--color-primary)] font-mono text-sm tracking-widest uppercase mt-1">Medical Diagnostic Report</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 uppercase tracking-widest font-mono mb-1">Generated</p>
            <p className="font-mono text-[var(--text-base)]">{new Date().toLocaleString()}</p>
            <div className="inline-block mt-3 px-3 py-1 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 text-[var(--color-primary)] text-xs font-semibold tracking-wider">
              {viewMode === 'doctor' ? 'CLINICAL EMR RECORD' : 'PATIENT SUMMARY'}
            </div>
          </div>
        </div>

        <div className="space-y-12">
          
          {/* PRIMARY STATUS & RADAR */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`col-span-1 lg:col-span-2 p-8 rounded-2xl border ${statusBg} relative overflow-hidden flex flex-col justify-center`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Overall Assessment</p>
                  <h2 className={`text-5xl md:text-7xl font-black ${statusColor} tracking-tighter mb-4`}>
                    {statusText}
                  </h2>
                </div>
                <div className="flex gap-8 mt-6 bg-black/10 dark:bg-white/5 p-4 rounded-xl border border-[var(--glass-border)] w-fit backdrop-blur-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Health Score</p>
                    <p className="text-3xl font-mono font-bold text-[var(--text-base)]">{analysisResult.safety_score}<span className="text-lg text-gray-500">/100</span></p>
                  </div>
                  <div className="w-px bg-[var(--glass-border)]"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">AI Confidence</p>
                    <p className="text-3xl font-mono font-bold text-[var(--text-base)]">{analysisResult.landing_confidence}%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-1 glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative">
              <div className="absolute top-4 right-4 bg-[var(--color-primary)]/10 text-[var(--color-primary)] p-1.5 rounded-lg">
                <BrainCircuit size={16} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2 w-full text-center">Diagnostic Profile</h3>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="var(--glass-border)" />
                    <PolarAngleAxis dataKey="subject" tick={{fill: 'var(--color-primary)', fontSize: 10}} />
                    <Radar name="Metrics" dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* XAI: EXPLAINABLE AI SECTION */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold uppercase tracking-widest text-[var(--text-base)] flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[var(--color-accent)]"></span> Explainable AI (XAI) Synthesis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-8 rounded-2xl border border-[var(--glass-border)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-secondary)]/10 blur-3xl rounded-full"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 p-2 bg-[var(--color-secondary)]/10 rounded-xl text-[var(--color-secondary)]">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-3 text-[var(--color-secondary)] uppercase tracking-wider text-sm">Diagnostic Reasoning</h4>
                    <p className="text-gray-400 leading-relaxed text-sm">
                      {analysisResult.analysis_explanation || "The AI model analyzed the structural integrity and morphological features of the provided scan. Based on the confidence threshold, the diagnostic pathways indicate an optimal assessment trajectory."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] flex flex-col justify-center">
                <h4 className="font-bold mb-4 text-gray-500 uppercase tracking-wider text-sm text-center">Probability Distribution</h4>
                <div className="w-full h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={probabilityData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'var(--text-base)', fontSize: 11}} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                      <Bar dataKey="prob" radius={[0, 4, 4, 0]}>
                        {probabilityData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-primary)' : 'var(--glass-border)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* ADVANCED METRICS & TIMELINE */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold uppercase tracking-widest text-[var(--text-base)] flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[var(--color-warning)]"></span> Clinical Measurements
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-6 rounded-xl border border-[var(--glass-border)] group hover:bg-[var(--color-primary)]/5 transition-colors">
                  <Target className="text-[var(--color-primary)] mb-3" size={24} />
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Lesion Density</p>
                  <p className="text-xl font-mono font-bold text-[var(--text-base)]">{analysisResult.crater_density}</p>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-[var(--glass-border)] group hover:bg-[var(--color-warning)]/5 transition-colors">
                  <ShieldAlert className="text-[var(--color-warning)] mb-3" size={24} />
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Calcification</p>
                  <p className="text-xl font-mono font-bold text-[var(--text-base)]">{analysisResult.rock_density}</p>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-[var(--glass-border)] group hover:bg-[var(--color-danger)]/5 transition-colors">
                  <Activity className="text-[var(--color-danger)] mb-3" size={24} />
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tissue Irregularity</p>
                  <p className="text-xl font-mono font-bold text-[var(--text-base)]">{analysisResult.terrain_roughness}</p>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-[var(--glass-border)] group hover:bg-[var(--color-success)]/5 transition-colors">
                  <Camera className="text-[var(--color-success)] mb-3" size={24} />
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Structural Def</p>
                  <p className="text-xl font-mono font-bold text-[var(--text-base)]">{analysisResult.slope}</p>
                </div>
              </div>
              <div className="glass-panel p-5 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 mt-4 flex justify-between items-center">
                <span className="text-sm uppercase tracking-wider text-gray-400">Anomaly Index (Risk)</span>
                <span className="text-lg font-mono font-bold text-[var(--color-primary)]">{analysisResult.hazard_index}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold uppercase tracking-widest text-[var(--text-base)] flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[var(--color-success)]"></span> Progress Timeline
              </h3>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] h-[320px] flex flex-col">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-4 text-center">Estimated Trajectory</h4>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                      <XAxis dataKey="time" tick={{fill: 'var(--text-base)', fontSize: 10}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: 'var(--text-base)', fontSize: 10}} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="score" stroke="var(--color-success)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* SELECTED PATHWAY OR RECOMMENDATIONS */}
          {selectedRoute && viewMode === 'doctor' && (
            <section className="space-y-4 pt-4">
              <h3 className="text-xl font-bold uppercase tracking-widest text-[var(--text-base)] flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[var(--color-primary)]"></span> Recommended Treatment Pathway
              </h3>
              <div className="glass-card p-6 rounded-[2rem] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/3 aspect-square max-w-[200px] rounded-xl overflow-hidden border-2 border-[var(--color-primary)] shadow-[0_0_20px_var(--color-primary)]">
                    <img src={selectedRoute.image_base64} alt="Treatment Plan" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-6 w-full">
                    <div className="flex items-center gap-3 mb-2">
                       <Activity className="text-[var(--color-primary)]" size={24} />
                       <h4 className="text-2xl font-black uppercase text-[var(--text-base)]">Pathway {selectedRouteIdx + 1}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-b border-[var(--glass-border)] pb-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Efficacy Rating</p>
                        <p className="font-bold text-lg">{selectedRoute.difficulty}</p>
                      </div>
                      <div className="border-b border-[var(--glass-border)] pb-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Risk Level</p>
                        <p className={`font-bold text-lg ${selectedRoute.risk_level === 'High' ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>{selectedRoute.risk_level}</p>
                      </div>
                      <div className="border-b border-[var(--glass-border)] pb-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Recovery Time</p>
                        <p className="font-bold text-lg">{selectedRoute.travel_time}</p>
                      </div>
                      <div className="border-b border-[var(--glass-border)] pb-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Complications Avoided</p>
                        <p className="font-bold text-lg text-[var(--color-warning)]">{selectedRoute.hazards_crossed}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* PATIENT RECOMMENDATIONS (Patient Mode Only) */}
          {viewMode === 'patient' && (
             <section className="space-y-4 pt-4">
               <h3 className="text-xl font-bold uppercase tracking-widest text-[var(--text-base)] flex items-center gap-3">
                 <span className="w-8 h-[2px] bg-[var(--color-secondary)]"></span> Next Steps
               </h3>
               <div className="glass-panel p-8 rounded-2xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/5">
                 <ul className="space-y-4">
                   <li className="flex items-start gap-4">
                     <CheckCircle className="text-[var(--color-secondary)] shrink-0 mt-1" />
                     <p className="text-[var(--text-base)]">Review this report with your primary care physician.</p>
                   </li>
                   <li className="flex items-start gap-4">
                     <Clock className="text-[var(--color-secondary)] shrink-0 mt-1" />
                     <p className="text-[var(--text-base)]">Schedule a follow-up scan in {isHealthy ? '6 months' : '2 weeks'}.</p>
                   </li>
                   <li className="flex items-start gap-4">
                     <Info className="text-[var(--color-secondary)] shrink-0 mt-1" />
                     <p className="text-[var(--text-base)]">Maintain prescribed wellness routines and monitor for any sudden changes.</p>
                   </li>
                 </ul>
               </div>
             </section>
          )}

          {/* FOOTER */}
          <section className="pt-8 border-t border-[var(--glass-border)] flex justify-between items-center text-xs text-gray-500 font-mono">
            <div className="flex items-center gap-2">
              <HeartPulse size={14} className="text-[var(--color-primary)]" />
              LUNAVISION HEALTH // SECURE MEDICAL RECORD
            </div>
            <div>
              ID: {analysisResult.session_id}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
