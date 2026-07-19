import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useMission } from '../context/MissionContext';

const PROGRESS_STEPS = [
  "Uploading Image",
  "Detecting Terrain",
  "Locating Craters",
  "Finding Rocks",
  "Calculating Roughness",
  "Computing Landing Zone",
  "Building Navigation Graph",
  "Generating Safe Routes",
  "Preparing Mission Report",
  "Mission Ready"
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
      // Speed up animation for more stages
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
    
    // Cache Check
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
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Upload Terrain Data</h1>
        <p className="text-gray-400">Provide orbital or lander imagery for AI processing.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div 
          {...getRootProps()} 
          className={`glass-card p-12 text-center border-2 border-dashed transition-all cursor-pointer ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-white/40'} ${isAnalyzing ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          
          {preview ? (
            <div className="space-y-4">
              <div className="relative h-64 w-full rounded-xl overflow-hidden border border-white/10">
                <img src={preview} alt="Preview" className="object-cover w-full h-full" />
              </div>
              {!isAnalyzing && <p className="text-sm text-gray-400">Click or drag to replace image</p>}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="p-4 bg-white/5 rounded-full">
                <Upload size={48} className="text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium">Drag & drop your image here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse from device</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 border border-primary/30 bg-primary/5"
          >
            <div className="flex items-center gap-4 mb-6">
              <Loader2 className="animate-spin text-primary" size={24} />
              <div className="flex-1">
                <h3 className="font-bold text-lg uppercase tracking-widest text-primary">System Processing</h3>
                <p className="text-sm text-gray-400 font-mono">Executing sequence {progressStep + 1} of {PROGRESS_STEPS.length}</p>
              </div>
              <div className="text-3xl font-mono text-primary font-bold">
                {Math.round(((progressStep + 1) / PROGRESS_STEPS.length) * 100)}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {PROGRESS_STEPS.map((step, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-2 rounded ${idx < progressStep ? 'text-green-400 bg-green-400/10' : idx === progressStep ? 'text-primary bg-primary/10 animate-pulse' : 'text-gray-600'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${idx < progressStep ? 'border-green-400 bg-green-400' : idx === progressStep ? 'border-primary' : 'border-gray-600'}`}>
                    {idx < progressStep && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-xs font-mono uppercase">{step}</span>
                </div>
              ))}
            </div>

            <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-out" 
                style={{ width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
              ></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {file && !isAnalyzing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <button 
            onClick={handleAnalyze} 
            className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(30,136,229,0.4)]"
          >
            <FileImage size={20} />
            Initiate Analysis
          </button>
        </motion.div>
      )}
    </div>
  );
}
