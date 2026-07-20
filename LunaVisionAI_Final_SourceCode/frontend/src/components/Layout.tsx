import { useState } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { MessageSquare, History, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ReportHistory from './ReportHistory';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children }: { children: ReactNode }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const location = useLocation();
  const isAIPage = location.pathname === '/ai';
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-base)] flex font-sans relative overflow-hidden transition-colors duration-300">
      {/* Animated Mesh Gradient Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--aurora-1)] rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-[var(--aurora-2)] rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-[var(--aurora-3)] rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      </div>

      <Sidebar onOpenHistory={() => setIsHistoryOpen(true)} />
      <main className="flex-1 md:ml-64 pb-24 md:pb-0 overflow-y-auto h-[100dvh] relative scroll-smooth flex flex-col">
        {/* Mobile Top Navigation */}
        <div className="md:hidden flex items-center justify-between p-4 glass-panel mx-4 mt-4 rounded-2xl sticky top-4 z-[60] shadow-lg">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
               <span className="text-white font-bold text-sm">L</span>
             </div>
             <h1 className="text-lg font-bold bg-gradient-to-br from-[var(--text-base)] to-gray-500 bg-clip-text text-transparent">
               LunaVision
             </h1>
          </div>
          <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-xl bg-black/5 dark:bg-black/20 border border-[var(--glass-border)] hover:bg-black/10 dark:hover:bg-black/30 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-500" />}
          </button>
        </div>

        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 relative z-10 pt-4 md:pt-8 flex-1">
          {children}
        </div>
      </main>
      <BottomNav />
      
      {/* Floating Chat Assistant Button (hidden on /ai page) */}
      {!isAIPage && (
        <div className="fixed bottom-24 right-4 md:bottom-10 md:right-10 z-50 flex flex-col gap-4">
          <button onClick={() => setIsHistoryOpen(true)} className="p-4 bg-white/10 backdrop-blur-md border border-[var(--glass-border)] text-[var(--text-base)] rounded-full shadow-lg hover:bg-white/20 hover:scale-110 transition-all duration-300 group hidden md:block">
            <History size={24} className="group-hover:text-[var(--color-primary)] transition-colors" />
          </button>
          <Link to="/ai" className="p-4 bg-[var(--color-primary)] text-white rounded-full shadow-lg hover:shadow-[0_0_20px_var(--color-primary)] hover:scale-110 transition-all duration-300 group">
            <MessageSquare size={24} className="group-hover:animate-pulse" />
          </Link>
        </div>
      )}

      <ReportHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}
