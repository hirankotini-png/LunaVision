import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Cpu, ShieldAlert, Activity, Navigation, Target, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useMission } from '../context/MissionContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const { analysisResult } = useMission();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'LunaVision AI Core initialized. Secure comms link established. Awaiting inquiries regarding mission parameters, telemetry, or terrain analysis.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/chat`, {
        messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMsg }],
        context: analysisResult ? {
          safety_score: analysisResult.safety_score,
          status: analysisResult.readiness_status,
          roughness: analysisResult.terrain_roughness,
          hazards: analysisResult.hazard_index
        } : null
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
    } catch (error) {
      console.error('Chat error', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'COMMUNICATION LINK DEGRADED. System unable to reach AI Core. Please verify network status.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[85vh] flex flex-col xl:flex-row gap-8 pb-10 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      {/* Telemetry Sidebar */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
         <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 h-full flex flex-col rounded-[2rem] border-white/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px] pointer-events-none"></div>
           
           <h2 className="text-[10px] font-bold mb-6 uppercase tracking-widest text-gray-400 flex items-center gap-3 border-b border-white/5 pb-4">
             <Activity size={16} className="text-cyan-400" /> System Telemetry
           </h2>

           <div className="space-y-4 flex-1">
             <div className="glass-panel p-4 rounded-2xl hover:bg-white/5 transition-colors">
               <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono">System Health</p>
               <div className="flex items-center gap-3 text-green-400 font-bold font-mono text-sm">
                 <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]"></div> OPERATIONAL
               </div>
             </div>

             <div className="glass-panel p-4 rounded-2xl hover:bg-white/5 transition-colors">
               <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono">Mission Status</p>
               <div className={`font-bold font-mono text-sm flex items-center gap-3 ${!analysisResult ? 'text-gray-500' : analysisResult.readiness_status === 'GO' ? 'text-green-500' : analysisResult.readiness_status === 'CAUTION' ? 'text-yellow-500' : 'text-red-500'}`}>
                 {analysisResult ? <CheckCircle size={16}/> : <Target size={16}/>}
                 {analysisResult ? analysisResult.readiness_status : 'AWAITING DATA'}
               </div>
             </div>

             {analysisResult && (
               <>
                 <div className="glass-panel p-4 rounded-2xl hover:bg-white/5 transition-colors">
                   <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-mono">Identified Hazards</p>
                   <div className="flex items-start gap-3 text-orange-400 font-mono text-xs">
                     <AlertTriangle size={16} className="shrink-0" />
                     <span className="leading-relaxed">Index: {analysisResult.hazard_index} | Rock: {analysisResult.rock_density} | Crater: {analysisResult.crater_density}</span>
                   </div>
                 </div>

                 <div className="glass-panel p-4 rounded-2xl hover:bg-white/5 transition-colors border-cyan-500/20 bg-cyan-900/5">
                   <p className="text-[9px] text-cyan-500 uppercase tracking-widest mb-2 font-mono">Navigation Advice</p>
                   <div className="flex items-start gap-3 text-cyan-300 font-mono text-xs">
                     <Navigation size={16} className="shrink-0" />
                     <span className="leading-relaxed">{analysisResult.routes && analysisResult.routes.length > 0 ? 'Routes generated. Review alternatives based on risk vs energy.' : 'Target not designated. Please designate target in Analysis.'}</span>
                   </div>
                 </div>
               </>
             )}

             {!analysisResult && (
               <div className="glass-panel p-4 rounded-2xl opacity-50 flex flex-col items-center text-center justify-center h-40 border-dashed border-white/20">
                 <ShieldAlert size={28} className="text-gray-500 mb-3"/>
                 <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest leading-relaxed">No telemetry available.<br/>Please upload image.</p>
               </div>
             )}
           </div>

           <div className="mt-6 pt-4 border-t border-white/5 text-center">
             <p className="text-[9px] text-gray-600 font-mono uppercase tracking-widest">LunaVision Core AI System v3.0</p>
           </div>
         </motion.div>
      </div>

      {/* Main Chat Interface */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 glass-card rounded-[2rem] flex flex-col overflow-hidden relative shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-white/5">
        
        {/* Terminal Header */}
        <div className="bg-black/40 border-b border-white/5 p-5 flex items-center justify-between backdrop-blur-xl relative z-20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-500/10 rounded-xl">
              <Cpu className="text-cyan-400" size={20} /> 
            </div>
            <div>
               <h1 className="text-sm font-bold uppercase tracking-widest text-white">Mission Commander Interface</h1>
               <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mt-0.5">Secure Quantum Link Active</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 border border-green-400 shadow-[0_0_10px_#4ade80]"></div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-b from-[#02050A] to-[#0A0B1A] relative z-10 scroll-smooth">
          {messages.map((msg, idx) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Bot size={20} />
                </div>
              )}
              <div className={`max-w-[75%] p-5 text-sm font-sans leading-relaxed shadow-xl ${msg.role === 'user' ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-2xl rounded-tr-sm' : 'glass-panel border-white/5 rounded-2xl rounded-tl-sm text-gray-200'}`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0 backdrop-blur-md">
                  <User size={20} />
                </div>
              )}
            </motion.div>
          ))}
          
          <AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Bot size={20} />
                </div>
                <div className="glass-panel border-white/5 rounded-2xl rounded-tl-sm p-6 flex gap-3 items-center">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_#22d3ee]"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_#22d3ee]" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_#22d3ee]" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-2xl relative z-20">
          <div className="flex gap-4 relative max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="TRANSMIT TO AI CORE..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:bg-white/10 transition-all text-white placeholder:text-gray-600 font-mono text-[11px] uppercase tracking-widest shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="premium-btn px-8 py-5 bg-white hover:bg-gray-200 disabled:bg-white/5 disabled:text-gray-600 disabled:border-transparent text-black rounded-2xl font-bold transition-colors flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:shadow-none"
            >
              <Send size={20} className={isLoading || !input.trim() ? '' : 'text-black'} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
