import { Link, useLocation } from 'react-router-dom';
import { Home, UploadCloud, Activity, FileText, MessageSquare, Info, Moon, Sun, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: UploadCloud, label: 'Upload Scan', path: '/upload' },
  { icon: Activity, label: 'Analysis', path: '/analysis' },
  { icon: FileText, label: 'Medical Report', path: '/report' },
  { icon: MessageSquare, label: 'AI Assistant', path: '/ai' },
  { icon: Info, label: 'About', path: '/about' },
];

export default function Sidebar({ onOpenHistory }: { onOpenHistory?: () => void }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-2rem)] my-4 ml-4 glass-panel fixed z-50 overflow-hidden border border-[var(--glass-border)]">
      <div className="p-8 pb-4 relative shrink-0">
        <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-[var(--color-primary)]/30 blur-[50px] rounded-full pointer-events-none"></div>
        <h1 className="text-2xl font-bold bg-gradient-to-br from-[var(--text-base)] to-gray-500 bg-clip-text text-transparent relative z-10">
          LunaVision
        </h1>
        <p className="text-xs text-[var(--color-primary)] font-mono mt-1 tracking-widest relative z-10">MED.AI</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-3 mt-4 relative z-10 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 overflow-hidden group ${active ? 'text-[var(--color-primary)] dark:text-[var(--text-base)]' : 'text-gray-500 dark:text-gray-400 hover:text-[var(--color-primary)] dark:hover:text-[var(--text-base)]'}`}
            >
              {active && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/10 dark:from-[var(--color-primary)]/20 to-transparent border-l-2 border-[var(--color-primary)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className="relative z-10 flex items-center gap-4 w-full">
                <item.icon size={20} className={`transition-all duration-300 ${active ? 'text-[var(--color-primary)] filter drop-shadow-[0_0_8px_var(--color-primary)]' : 'group-hover:scale-110 group-hover:text-[var(--color-primary)]'}`} />
                <span className={`font-medium tracking-wide text-sm ${active ? 'font-semibold' : ''}`}>{item.label}</span>
              </div>
            </Link>
          );
        })}
        
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="w-full relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 overflow-hidden group text-gray-500 dark:text-gray-400 hover:text-[var(--color-primary)] dark:hover:text-[var(--text-base)] text-left mt-2"
          >
            <div className="relative z-10 flex items-center gap-4 w-full">
              <History size={20} className="transition-all duration-300 group-hover:scale-110 group-hover:text-[var(--color-primary)]" />
              <span className="font-medium tracking-wide text-sm">History</span>
            </div>
          </button>
        )}
      </nav>
      
      <div className="p-6 pt-4 relative z-10 space-y-4 shrink-0 border-t border-[var(--glass-border)]/30 mt-auto bg-[var(--glass-bg)]/50 backdrop-blur-md">
        <button 
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full p-3 rounded-xl bg-black/5 dark:bg-black/20 border border-[var(--glass-border)] backdrop-blur-md hover:bg-black/10 dark:hover:bg-black/30 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} className="text-yellow-400 shrink-0" /> : <Moon size={18} className="text-gray-500 shrink-0" />}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-black/5 dark:bg-black/40 border border-[var(--glass-border)] backdrop-blur-md">
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-success)] shadow-[0_0_10px_var(--color-success)]"></span>
          </div>
          <div className="text-[10px] text-gray-600 dark:text-gray-400 font-mono tracking-widest uppercase truncate">System Online</div>
        </div>
      </div>
    </aside>
  );
}
