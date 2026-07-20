import { Link, useLocation } from 'react-router-dom';
import { Home, UploadCloud, BarChart2, FileText, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="glass-panel p-2 flex justify-around items-center rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center p-2 px-4 rounded-xl transition-all duration-300 ${active ? 'text-[var(--color-primary)]' : 'text-gray-500 dark:text-gray-400 hover:text-[var(--color-primary)]'}`}
            >
              {active && (
                <motion.div 
                  layoutId="activeBottomTab"
                  className="absolute inset-0 bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20 rounded-xl border border-[var(--color-primary)]/20 dark:border-[var(--color-primary)]/30"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className="relative z-10 flex flex-col items-center">
                <item.icon size={22} className={`mb-1 transition-all duration-300 ${active ? 'text-[var(--color-primary)] filter drop-shadow-[0_0_8px_var(--color-primary)] scale-110' : ''}`} />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
