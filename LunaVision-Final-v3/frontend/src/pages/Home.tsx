import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Cpu, UploadCloud } from 'lucide-react';
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

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white">Mission Status</h1>
          <p className="text-gray-400 font-mono text-sm uppercase tracking-widest mt-1">Current active session overview.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">System Health</p>
              <h3 className="text-xl font-bold font-mono text-green-400">{backendHealth.status}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
              <Cpu size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">AI Module</p>
              <h3 className={`text-xl font-bold font-mono ${backendHealth.ai_available ? 'text-green-400' : 'text-yellow-400'}`}>
                {backendHealth.ai_available ? 'ONLINE' : 'FALLBACK'}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg text-green-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Mission Readiness</p>
              <h3 className={`text-xl font-bold font-mono ${analysisResult ? (analysisResult.readiness_status === 'GO' ? 'text-green-400' : analysisResult.readiness_status === 'CAUTION' ? 'text-yellow-400' : 'text-red-400') : 'text-gray-500'}`}>
                {analysisResult ? `${analysisResult.mission_readiness_score}/100 (${analysisResult.readiness_status})` : 'NO DATA'}
              </h3>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="glass-card p-8 flex flex-col items-center text-center">
          <UploadCloud size={64} className="text-primary mb-6 animate-pulse" />
          <h2 className="text-2xl font-black uppercase tracking-widest mb-2">New Surface Analysis</h2>
          <p className="text-gray-400 mb-8 max-w-sm font-mono text-sm">Upload lunar surface imagery to generate hazard maps, safe landing zones, and rover pathing.</p>
          <Link to="/upload" className="premium-btn px-8 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(30,136,229,0.4)]">
            Start Upload
          </Link>
        </motion.div>
        
        {analysisResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="glass-card p-6 overflow-hidden relative">
            <h2 className="text-xl font-bold mb-4">Recent Analysis</h2>
            <div className="rounded-xl overflow-hidden mb-4 border border-white/10 h-48 relative">
              <img src={analysisResult.original_image_base64} alt="Analyzed terrain" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${analysisResult.readiness_status === 'GO' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : analysisResult.readiness_status === 'CAUTION' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                  STATUS: {analysisResult.readiness_status}
                </span>
              </div>
            </div>
            <Link to="/analysis" className="text-primary hover:text-blue-400 text-sm font-medium flex items-center gap-2">
              View Full Details &rarr;
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
