import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Cpu, UploadCloud, ChevronRight } from 'lucide-react';
import { useMission } from '../context/MissionContext';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const { analysisResult } = useMission();
  const [backendHealth, setBackendHealth] = useState({ status: 'Connecting...', ai_available: false });

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    axios.get(`${apiUrl}/api/health`)
      .then(res => setBackendHealth(res.data))
      .catch(() => setBackendHealth({ status: 'OFFLINE', ai_available: false }));
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-16 relative">
      {/* Cinematic Hero Section */}
      <div className="relative pt-12 pb-20 flex flex-col items-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none z-[-1]"
        >
          {/* 3D Orb Effect using layered gradients */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-cyan-500/20 to-purple-600/30 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute inset-20 bg-gradient-to-b from-white/5 to-transparent rounded-full border border-white/10 shadow-[inset_0_0_80px_rgba(255,255,255,0.05)] hologram"></div>
          <div className="absolute inset-40 bg-gradient-to-t from-primary/40 to-transparent rounded-full blur-xl animate-float"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 space-y-6 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-primary/30 mb-4">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendHealth.status === 'OK' ? 'bg-success' : 'bg-warning'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${backendHealth.status === 'OK' ? 'bg-success' : 'bg-warning'}`}></span>
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-gray-300">
              System Core: {backendHealth.status}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            Next-Generation <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(30,136,229,0.3)]">
              Surface Intelligence
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Advanced neural networks and computer vision for real-time hazard detection, terrain classification, and autonomous route planning.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/upload" className="premium-btn group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-semibold hover:bg-gray-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              <UploadCloud size={20} className="group-hover:scale-110 transition-transform" />
              Initialize Scan
            </Link>
            {analysisResult && (
              <Link to="/analysis" className="glass-panel group flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all">
                View Active Mission
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform text-gray-400" />
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
      >
        <motion.div variants={itemAnim} className="glass-card p-6 group hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(30,136,229,0.2)]">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">System Health</p>
              <h3 className="text-xl font-semibold mt-1">{backendHealth.status}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemAnim} className="glass-card p-6 group hover:border-purple-500/50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Cpu size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">AI Neural Link</p>
              <h3 className="text-xl font-semibold mt-1 flex items-center gap-2">
                {backendHealth.ai_available ? 'ONLINE' : 'FALLBACK'}
                {backendHealth.ai_available && <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_5px_#10B981]"></div>}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemAnim} className="glass-card p-6 group hover:border-green-500/50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Readiness State</p>
              <h3 className={`text-xl font-semibold mt-1 ${analysisResult ? (analysisResult.readiness_status === 'GO' ? 'text-green-400' : analysisResult.readiness_status === 'CAUTION' ? 'text-yellow-400' : 'text-red-400') : 'text-gray-500'}`}>
                {analysisResult ? `${analysisResult.mission_readiness_score}/100 (${analysisResult.readiness_status})` : 'AWAITING DATA'}
              </h3>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {analysisResult && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card overflow-hidden group"
        >
          <div className="grid md:grid-cols-2">
            <div className="p-8 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-widest text-gray-300">Active Session</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Tactical Overview</h2>
              <p className="text-gray-400 mb-8 font-light leading-relaxed">
                Review the latest generated telemetry, detected hazards, and pathfinding results for your most recent orbital scan.
              </p>
              <Link to="/analysis" className="flex items-center gap-2 text-primary font-medium hover:text-white transition-colors w-fit group/link">
                Enter Dashboard 
                <ChevronRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="relative h-64 md:h-auto overflow-hidden border-l border-white/5">
              <div className="absolute inset-0 bg-gradient-to-r from-[#050816] to-transparent z-10 w-1/3"></div>
              <img 
                src={analysisResult.original_image_base64} 
                alt="Analyzed terrain" 
                className="object-cover w-full h-full opacity-60 group-hover:scale-105 transition-transform duration-1000 ease-out filter contrast-125"
              />
              <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-20"></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
