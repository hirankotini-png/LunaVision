import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, Loader2, Zap } from 'lucide-react';
import axios from 'axios';
import { useMission } from '../context/MissionContext';

const PROGRESS_STEPS = [
  "Uplinking Imagery",
  "Engaging Neural Nets",
  "Topographical Mapping",
  "Hazard Detection Active",
  "Crater Analysis",
  "Surface Roughness Calc",
  "Rendering Mesh Grid",
  "Validating Safe Zones",
  "Synthesizing Report",
  "Initialization Complete"
];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const { analysisResult, setAnalysisResult, setOriginalImage, cachedFileSignature, setCachedFileSignature } = useMission();
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setProgressStep(prev => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
      }, 150);
    } else {
      setProgressStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      const objectUrl = URL.createObjectURL(selected);
      setPreview(objectUrl);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  }, [setOriginalImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  const handleAnalyze = async () => {
    if (!file) return;
    
    const currentSignature = `${file.name}-${file.size}-${file.lastModified}`;
    if (cachedFileSignature === currentSignature && analysisResult) {
      navigate('/analysis');
      return;
    }

    setIsAnalyzing(true);
    setProgressStep(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/analyse`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysisResult(response.data);
      setCachedFileSignature(currentSignature);
      navigate('/analysis');
    } catch (error) {
      console.error('>>> Analysis failed with error:', error);
      alert('Failed to analyze image. Ensure backend is running.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-cyan-500/30 mb-2">
          <Zap size={14} className="text-cyan-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">Phase 1: Data Ingestion</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">Provide Sensor <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Telemetry</span></h1>
        <p className="text-gray-400 font-light max-w-xl mx-auto">Establish a secure uplink and transmit orbital or surface imagery to the AI core for comprehensive topographic evaluation.</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
        className="relative group perspective"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[2rem] blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-50"></div>
        <div 
          {...getRootProps()} 
          className={`relative glass-card rounded-[2rem] p-2 transition-all duration-500 cursor-pointer overflow-hidden ${isAnalyzing ? 'pointer-events-none' : ''}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Animated Dashed Border using SVG */}
          <div className="absolute inset-0 m-2 rounded-[1.75rem] border-2 border-dashed border-white/20 z-10 pointer-events-none"></div>
          {isDragActive && (
            <div className="absolute inset-0 bg-cyan-500/10 z-0 animate-pulse"></div>
          )}

          <div className="relative z-20 p-12 flex flex-col items-center justify-center min-h-[400px]">
            <input {...getInputProps()} />
            
            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full h-full flex flex-col items-center space-y-6"
                >
                  <div className="relative w-full max-w-2xl aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:shadow-[0_0_50px_rgba(30,136,229,0.3)] transition-all">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none"></div>
                    <img src={preview} alt="Sensor Data" className="object-cover w-full h-full filter contrast-110" />
                    
                    {/* Futuristic scanner line on preview */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-20 animate-scan"></div>
                  </div>
                  {!isAnalyzing && (
                    <div className="px-6 py-2 rounded-full glass-panel text-sm text-gray-300 border border-white/10 hover:border-white/30 transition-colors">
                      Tap to recalibrate sensor data
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center space-y-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse-glow"></div>
                    <div className="w-24 h-24 rounded-full glass-panel border border-white/10 flex items-center justify-center relative z-10 shadow-2xl group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
                      <Upload size={40} className="text-cyan-400" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold tracking-wide">Drop Telemetry Data</h3>
                    <p className="text-gray-400 font-light">or click to browse local databanks</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel p-8 rounded-[2rem] border border-primary/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-600/5 z-0"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* 3D Glowing Loader */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <div className="absolute inset-0 border-t-2 border-r-2 border-cyan-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-b-2 border-l-2 border-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-4 border-t-2 border-l-2 border-blue-500 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="text-white animate-pulse" size={24} />
                  </div>
                </div>

                <div className="flex-1 w-full space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h3 className="font-bold text-xl uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Processing Core Active</h3>
                      <p className="text-sm text-gray-400 font-mono mt-1">Sequence {progressStep + 1} of {PROGRESS_STEPS.length}</p>
                    </div>
                    <div className="text-4xl font-black text-white/90">
                      {Math.round(((progressStep + 1) / PROGRESS_STEPS.length) * 100)}<span className="text-xl text-cyan-500">%</span>
                    </div>
                  </div>

                  <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-300 ease-out relative" 
                      style={{ width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-[2px] animate-pulse"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-4">
                    {PROGRESS_STEPS.map((step, idx) => {
                      let statusClass = "text-gray-600 border-gray-800";
                      let textClass = "text-gray-600";
                      if (idx < progressStep) {
                        statusClass = "text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
                        textClass = "text-cyan-300";
                      } else if (idx === progressStep) {
                        statusClass = "text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] bg-purple-500/20";
                        textClass = "text-white font-semibold";
                      }

                      return (
                        <div key={idx} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${statusClass} transition-all duration-300`}>
                          <span className={`text-[9px] text-center font-mono uppercase tracking-wider ${textClass}`}>{step}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {file && !isAnalyzing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center pt-4">
          <button 
            onClick={handleAnalyze}               
            disabled={isAnalyzing || !file}
            className={`premium-btn px-10 py-5 rounded-full font-bold tracking-widest uppercase transition-all flex items-center gap-3 relative overflow-hidden group ${file && !isAnalyzing ? 'bg-white text-black hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]' : 'glass-panel text-gray-300 border border-white/5 cursor-not-allowed'}`}
          >
            <div className="relative z-10 flex items-center gap-3">
              <FileImage size={20} className="text-black group-hover:rotate-12 transition-transform" />
              Initialize Analysis
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
}
