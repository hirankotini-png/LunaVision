import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, FileText, ChevronRight, Activity, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMission } from '../context/MissionContext';
import { useNavigate } from 'react-router-dom';

export default function ReportHistory({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const { setAnalysisResult, setOriginalImage } = useMission();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('luna_vision_history');
      if (saved) {
        try {
          setHistory(JSON.parse(saved).reverse());
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  const loadReport = (item: any) => {
    setAnalysisResult(item.result);
    setOriginalImage(item.image);
    onClose();
    navigate('/report');
  };

  const clearHistory = () => {
    localStorage.removeItem('luna_vision_history');
    setHistory([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--bg-base)] border-l border-[var(--glass-border)] shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between bg-black/5 dark:bg-black/20 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Clock className="text-[var(--color-primary)]" size={24} />
                <h2 className="text-lg font-bold uppercase tracking-widest">Medical History</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                  <FileText size={48} className="mb-4" />
                  <p className="font-mono text-xs uppercase tracking-widest">No saved reports found</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} onClick={() => loadReport(item)} className="glass-card p-4 rounded-xl cursor-pointer hover:border-[var(--color-primary)] transition-all group relative overflow-hidden">
                    <div className="flex gap-4">
                      {item.image ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-[var(--glass-border)]">
                          <img src={item.image} alt="Scan" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 border border-[var(--glass-border)]">
                          <Activity size={24} className="text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-sm text-[var(--text-base)]">Patient Scan #{item.id || (history.length - idx)}</h3>
                          <ChevronRight size={16} className="text-gray-500 group-hover:text-[var(--color-primary)] transition-colors" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{new Date(item.timestamp).toLocaleString()}</p>
                        <div className="mt-2 flex gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${item.result?.readiness_status === 'GO' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' : item.result?.readiness_status === 'CAUTION' ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]' : 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]'}`}>
                            {item.result?.readiness_status || 'UNKNOWN'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="p-6 border-t border-[var(--glass-border)] bg-black/5 dark:bg-black/20">
                <button onClick={clearHistory} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors font-mono text-xs uppercase tracking-widest font-bold">
                  <Trash2 size={16} /> Clear History
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
