import { Link, useLocation } from 'react-router-dom';
import { Home, UploadCloud, BarChart2, FileText, MessageSquare } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: UploadCloud, label: 'Upload', path: '/upload' },
  { icon: BarChart2, label: 'Analysis', path: '/analysis' },
  { icon: FileText, label: 'Report', path: '/report' },
  { icon: MessageSquare, label: 'AI', path: '/ai' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-black/60 backdrop-blur-xl border-t border-white/10 z-50">
      <nav className="flex justify-around items-center p-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${active ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              <item.icon size={24} className={active ? 'filter drop-shadow-[0_0_8px_rgba(30,136,229,0.8)]' : ''} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
