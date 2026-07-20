import { Link, useLocation } from 'react-router-dom';
import { Home, UploadCloud, BarChart2, FileText, MessageSquare, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: UploadCloud, label: 'Upload', path: '/upload' },
  { icon: BarChart2, label: 'Analysis', path: '/analysis' },
  { icon: FileText, label: 'Mission Report', path: '/report' },
  { icon: MessageSquare, label: 'AI Assistant', path: '/ai' },
  { icon: Info, label: 'About', path: '/about' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-2rem)] my-4 ml-4 glass-panel fixed z-50 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.8)] border border-white/5">
      <div className="p-8 pb-4 relative">
        <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-primary/30 blur-[50px] rounded-full pointer-events-none"></div>
        <h1 className="text-2xl font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent relative z-10">
          LunaVision
        </h1>
        <p className="text-xs text-primary font-mono mt-1 tracking-widest relative z-10">AI.SYSTEM</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-3 mt-6 relative z-10">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 overflow-hidden group ${active ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {active && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className="relative z-10 flex items-center gap-4 w-full">
                <item.icon size={20} className={`transition-all duration-300 ${active ? 'text-primary filter drop-shadow-[0_0_8px_rgba(30,136,229,0.8)]' : 'group-hover:scale-110 group-hover:text-primary'}`} />
                <span className={`font-medium tracking-wide text-sm ${active ? 'font-semibold' : ''}`}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 relative z-10">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
          </div>
          <div className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">System Online</div>
        </div>
      </div>
    </aside>
  );
}
