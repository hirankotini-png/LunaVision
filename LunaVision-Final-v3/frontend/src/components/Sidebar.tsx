import { Link, useLocation } from 'react-router-dom';
import { Home, UploadCloud, BarChart2, FileText, MessageSquare, Info } from 'lucide-react';

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
    <aside className="hidden md:flex flex-col w-64 h-screen border-r border-white/10 bg-black/20 backdrop-blur-lg fixed">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent filter drop-shadow-[0_0_5px_rgba(30,136,229,0.5)]">LunaVision AI</h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Mission Control</p>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active ? 'bg-primary/20 text-blue-400 border border-primary/50 shadow-[0_0_15px_rgba(30,136,229,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-center text-green-500 font-mono tracking-wider animate-pulse">
        SYSTEM ONLINE
      </div>
    </aside>
  );
}
