import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-white flex font-sans relative overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-blob mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-cyan-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <Sidebar />
      <main className="flex-1 md:ml-64 pb-24 md:pb-0 overflow-y-auto h-screen relative scroll-smooth">
        <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10 pt-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
