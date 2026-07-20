import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface Coordinate {
  x: number;
  y: number;
}

export interface LandingZone {
  x: number;
  y: number;
  radius: number;
  reason: string;
}

export interface Route {
  route_id: string;
  name: string;
  route_type: string;
  distance: string;
  energy_consumption: string;
  travel_time: string;
  difficulty: string;
  safety_score: number;
  risk_level: string;
  hazards_crossed: number;
  color: string;
  points: Coordinate[];
  image_base64: string;
}

export interface AnalysisResult {
  session_id: string;
  safety_score: number;
  landing_confidence: number;
  crater_density: string;
  rock_density: string;
  terrain_roughness: string;
  slope: string;
  shadow_coverage: string;
  hazard_index: string;
  mission_readiness_score: number;
  readiness_status: string;
  recommended_landing_zone: LandingZone;
  routes?: Route[];
  analysis_explanation?: string;
  original_image_base64: string;
  hazard_map_base64: string;
}

interface MissionContextType {
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  originalImage: string | null;
  setOriginalImage: (image: string | null) => void;
  cachedFileSignature: string | null;
  setCachedFileSignature: (signature: string | null) => void;
  targetCoordinate: Coordinate | null;
  setTargetCoordinate: (coord: Coordinate | null) => void;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export const MissionProvider = ({ children }: { children: ReactNode }) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cachedFileSignature, setCachedFileSignature] = useState<string | null>(null);
  const [targetCoordinate, setTargetCoordinate] = useState<Coordinate | null>(null);

  return (
    <MissionContext.Provider value={{ 
      analysisResult, setAnalysisResult, 
      originalImage, setOriginalImage, 
      cachedFileSignature, setCachedFileSignature,
      targetCoordinate, setTargetCoordinate
    }}>
      {children}
    </MissionContext.Provider>
  );
};

export const useMission = () => {
  const context = useContext(MissionContext);
  if (!context) throw new Error('useMission must be used within a MissionProvider');
  return context;
};

