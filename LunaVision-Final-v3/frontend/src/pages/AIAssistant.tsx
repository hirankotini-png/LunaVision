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
    <div className="max-w-7xl mx-auto h-[80vh] flex flex-col xl:flex-row gap-6">
      {/* Telemetry Sidebar */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
         <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5 h-full flex flex-col">
           <h2 className="text-sm font-black mb-4 uppercase tracking-widest text-primary flex items-center gap-2 border-b border-white/10 pb-2">
             <Activity size={16} /> System Telemetry
           </h2>

           <div className="space-y-4 flex-1">
             <div className="bg-black/30 p-3 rounded border border-white/5">
               <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">System Health</p>
               <div className="flex items-center gap-2 text-green-400 font-bold font-mono text-sm">
                 <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> OPERATIONAL
               </div>
             </div>

             <div className="bg-black/30 p-3 rounded border border-white/5">
               <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Mission Status</p>
               <div className={`font-bold font-mono text-sm flex items-center gap-2 ${!analysisResult ? 'text-gray-500' : analysisResult.readiness_status === 'GO' ? 'text-green-500' : analysisResult.readiness_status === 'CAUTION' ? 'text-yellow-500' : 'text-red-500'}`}>
                 {analysisResult ? <CheckCircle size={14}/> : <Target size={14}/>}
                 {analysisResult ? analysisResult.readiness_status : 'AWAITING DATA'}
               </div>
             </div>

             {analysisResult && (
               <>
                 <div className="bg-black/30 p-3 rounded border border-white/5">
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Identified Hazards</p>
                   <div className="flex items-start gap-2 text-red-400 font-mono text-xs">
                     <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                     <span>Index: {analysisResult.hazard_index} | Rock: {analysisResult.rock_density} | Crater: {analysisResult.crater_density}</span>
                   </div>
                 </div>

                 <div className="bg-black/30 p-3 rounded border border-white/5">
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Navigation Advice</p>
                   <div className="flex items-start gap-2 text-blue-400 font-mono text-xs">
                     <Navigation size={14} className="shrink-0 mt-0.5" />
                     <span>{analysisResult.routes && analysisResult.routes.length > 0 ? 'Routes generated. Review alternatives based on risk vs energy.' : 'Target not designated. Please designate target in Analysis.'}</span>
                   </div>
                 </div>
               </>
             )}

             {!analysisResult && (
               <div className="bg-black/30 p-3 rounded border border-white/5 opacity-50 flex flex-col items-center text-center justify-center h-32">
                 <ShieldAlert size={24} className="text-gray-500 mb-2"/>
                 <p className="text-[10px] text-gray-400 font-mono uppercase">No telemetry available. Please upload image.</p>
               </div>
             )}
           </div>

           <div className="mt-4 pt-4 border-t border-white/10 text-center">
             <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">LunaVision Core AI System v2.4.1</p>
           </div>
         </motion.div>
      </div>

      {/* Main Chat Interface */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 glass-card flex flex-col overflow-hidden relative border border-blue-500/20 shadow-[0_0_30px_rgba(30,136,229,0.1)]">
        
        {/* Terminal Header */}
        <div className="bg-black/50 border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="text-blue-500" size={20} /> 
            <div>
               <h1 className="text-sm font-bold uppercase tracking-widest text-white">Mission Commander Interface</h1>
               <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Secure Link Active</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 border border-green-400 shadow-[0_0_10px_#4ade80]"></div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-blue-900/5">
          {messages.map((msg, idx) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-sm bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
                  <Bot size={16} />
                </div>
              )}
              <div className={`max-w-[80%] p-4 text-sm font-sans leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl shadow-[0_0_15px_rgba(30,136,229,0.3)]' : 'bg-black/60 border border-blue-500/20 rounded-r-xl rounded-tl-xl text-gray-300'}`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-sm bg-white/10 border border-white/20 flex items-center justify-center text-gray-300 shrink-0">
                  <User size={16} />
                </div>
              )}
            </motion.div>
          ))}
          
          <AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-sm bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-black/60 border border-blue-500/20 rounded-r-xl rounded-tl-xl p-4 flex gap-2 items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 border-t border-blue-500/20 bg-black/60 backdrop-blur-md">
          <div className="flex gap-4 relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="TRANSMIT TO AI CORE..."
              className="flex-1 bg-black/50 border border-blue-500/30 rounded-lg px-4 py-4 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all text-white placeholder:text-gray-600 font-mono text-sm uppercase tracking-wide"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="premium-btn px-6 py-4 bg-primary hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-transparent text-white rounded-lg transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(30,136,229,0.3)] disabled:shadow-none border border-blue-400"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
