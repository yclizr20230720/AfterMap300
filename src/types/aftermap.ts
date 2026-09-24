export type AspectRatio = '16:9' | '9:16';
export type Resolution = '1080p' | '720p';

export interface Waypoint {
  id: string;
  name: string;
  x: number; // percentage 0-100 on map canvas
  y: number; // percentage 0-100 on map canvas
  altitude: number; // meters AGL
  speed: number; // km/h
  heading: number; // degrees 0-360
  action?: string;
}

export interface FlightPlan {
  id: string;
  name: string;
  locationName: string;
  coordinates: string; // e.g., "35.6595° N, 139.7005° E"
  terrainType: 'metropolis' | 'alpine' | 'volcanic' | 'oceanic' | 'desert' | 'fjord' | 'canyon';
  flightStyle: 'canyon-threader' | 'orbital-zenith' | 'sub-orbital' | 'fpv-acro' | 'hyperlapse' | 'low-skim';
  waypoints: Waypoint[];
  basePrompt: string;
  enhancedPrompt?: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  lighting: string;
  lensType: string;
}

export interface VideoProject {
  id: string;
  title: string;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  videoUrl: string; // blob url or external mp4 url
  thumbnailUrl?: string;
  createdAt: number;
  flightData?: {
    location: string;
    coordinates: string;
    maxAltitude: number;
    avgSpeed: number;
    flightStyle: string;
  };
  isSample?: boolean;
}

export interface GenerationStatus {
  isGenerating: boolean;
  operationName?: string;
  progressPercent: number;
  stageMessage: string;
  elapsedSeconds: number;
  error?: string | null;
  aspectRatio: AspectRatio;
  prompt: string;
}
