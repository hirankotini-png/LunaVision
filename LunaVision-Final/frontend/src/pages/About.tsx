import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">About LunaVision AI</h1>
        <p className="text-gray-400">Odisha Zonal Tech Hackathon Submission.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 space-y-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="p-4 bg-primary/20 rounded-2xl text-primary">
            <Rocket size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mission Overview</h2>
            <p className="text-gray-400 text-sm">Empowering lunar exploration with AI.</p>
          </div>
        </div>

        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>
            LunaVision AI is a production-ready Progressive Web Application designed for mission planners and lunar exploration teams. 
            By leveraging computer vision and generative AI, it automates the complex task of hazard detection, landing zone selection, and rover pathfinding.
          </p>
          <p>
            The interface is built to mimic the high-contrast, data-dense aesthetics of NASA and ISRO mission control centers, providing 
            critical information at a glance.
          </p>
        </div>
        
        <div className="pt-6 border-t border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Developers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
              <p className="font-bold text-gray-200 text-lg uppercase tracking-wide">GUDLA UDAY BHASKAR</p>
              <div className="mt-2 text-gray-300 text-sm space-y-1">
                <p className="font-bold">Roll No: 25cseaiml313</p>
                <p className="font-bold">Phone: 8106675342</p>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
              <p className="font-bold text-gray-200 text-lg uppercase tracking-wide">HIRAN KOTNI</p>
              <div className="mt-2 text-gray-300 text-sm space-y-1">
                <p className="font-bold">Roll No: 25cseaiml303</p>
                <p className="font-bold">Phone: 9439224935</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
