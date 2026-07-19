import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08111F] text-white flex font-sans">
      <Sidebar />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 overflow-y-auto h-screen relative">
        {/* Background ambient light */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
