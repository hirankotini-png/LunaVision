import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Cpu } from 'lucide-react';
import axios from 'axios';
import { useMission } from '../context/MissionContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const { analysisResult } = useMission();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'LunaVision AI online. How can I assist with your mission planning today?' }
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
      const response = await axios.post('http://localhost:8000/api/chat', {
        messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMsg }],
        context: analysisResult ? {
          safety_score: analysisResult.safety_score,
          status: analysisResult.readiness_status,
          roughness: analysisResult.terrain_roughness
        } : null
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
    } catch (error) {
      console.error('Chat error', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Communication link degraded. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Cpu className="text-primary" /> AI Assistant
        </h1>
        <p className="text-gray-400">Direct link to LunaVision analytical core.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 glass-card flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Bot size={16} />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none shadow-[0_0_15px_rgba(30,136,229,0.3)]' : 'bg-white/5 border border-white/10 rounded-bl-none text-gray-200'}`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none p-4 flex gap-1 items-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about the terrain, hazards, or mission parameters..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-gray-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-primary hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-xl transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(30,136,229,0.3)] disabled:shadow-none"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
