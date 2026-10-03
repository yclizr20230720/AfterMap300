export type AspectRatio = '16:9' | '9:16';
export type Resolution = '1080p' | '720p';

export type WaypointAction = 
  | 'fly-through' 
  | 'hover-photo' 
  | 'orbit-focus' 
  | 'hyperlapse-burst' 
  | 'nadir-scan' 
  | 'spiral-climb';

export interface Waypoint {
  id: string;
  name: string;
  x: number; // percentage 0-100 on map canvas
  y: number; // percentage 0-100 on map canvas
  altitude: number; // meters AGL (30m - 4000m)
  speed: number; // km/h (20 - 350 km/h)
  heading: number; // degrees 0-360 (drone yaw)
  gimbalPitch?: number; // degrees -90 (nadir/straight down) to +20 (skyward look)
  cameraRoll?: number; // degrees -30 to +30 (FPV banking angle)
  action?: WaypointAction;
  hoverDuration?: number; // seconds (0 - 30)
  poiId?: string | null; // target point of interest ID
  curveRadius?: number; // corner rounding radius in meters
}

export interface PointOfInterest {
  id: string;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  altitude: number; // elevation of focal point
  color?: string;
  category?: 'landmark' | 'summit' | 'monument' | 'hazard' | 'target';
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'cylinder' | 'perimeter' | 'danger-zone';
  x: number;
  y: number;
  radius: number; // in percentage of map width
  maxAltitude: number;
  warningText: string;
}

export interface FlightPlan {
  id: string;
  name: string;
  locationName: string;
  coordinates: string; // e.g., "35.6595° N, 139.7005° E"
  terrainType: 'metropolis' | 'alpine' | 'volcanic' | 'oceanic' | 'desert' | 'fjord' | 'canyon';
  flightStyle: string;
  waypoints: Waypoint[];
  pois?: PointOfInterest[];
  geofences?: GeofenceZone[];
  basePrompt: string;
  enhancedPrompt?: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  lighting: string;
  lensType: string;
  totalDistanceMeters?: number;
  estimatedFlightSeconds?: number;
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
    waypointCount?: number;
    poiCount?: number;
    totalDistance?: string;
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

export type EditorTool = 'select' | 'add-waypoint' | 'add-poi' | 'add-geofence' | 'measure' | 'pan';
export type MapLayerStyle = 'cyber' | 'satellite' | 'topo-vector' | 'thermal' | 'golden';
