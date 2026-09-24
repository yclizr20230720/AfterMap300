import { FlightPlan, VideoProject } from '../types/aftermap';

export interface LocationPreset {
  id: string;
  name: string;
  country: string;
  coordinates: string;
  terrainType: 'metropolis' | 'alpine' | 'volcanic' | 'oceanic' | 'desert' | 'fjord' | 'canyon';
  recommendedLighting: string;
  recommendedLens: string;
  recommendedAspect: '16:9' | '9:16';
  description: string;
  defaultPrompt: string;
  waypoints: { x: number; y: number; altitude: number; speed: number; heading: number }[];
}

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'tokyo-shibuya',
    name: 'Shibuya Crossing & Shinjuku Skyway',
    country: 'Tokyo, Japan',
    coordinates: '35.6595° N, 139.7005° E',
    terrainType: 'metropolis',
    recommendedLighting: 'Midnight Neon & Rain Puddle Reflections',
    recommendedLens: '24mm Anamorphic with Cyan Blue Streak Flares',
    recommendedAspect: '16:9',
    description: 'Dynamic drone flythrough over wet neon-drenched Tokyo crosswalks and illuminated cybernetic skyscraper towers.',
    defaultPrompt: 'Cinematic FPV drone sweeping over Tokyo Shibuya crossing at midnight during light rain. Wet asphalt reflecting vibrant neon billboards, ultra-detailed glass facades, smooth descent between glowing skyscrapers, anamorphic lens flares, photorealistic 1080p aerial cinematography.',
    waypoints: [
      { x: 18, y: 78, altitude: 45, speed: 65, heading: 45 },
      { x: 38, y: 55, altitude: 120, speed: 95, heading: 35 },
      { x: 58, y: 40, altitude: 280, speed: 110, heading: 70 },
      { x: 82, y: 22, altitude: 450, speed: 130, heading: 50 },
    ],
  },
  {
    id: 'iceland-volcano',
    name: 'Fimmvörðuháls Volcanic Caldera & Glacier',
    country: 'South Iceland',
    coordinates: '63.6300° N, 19.4500° W',
    terrainType: 'volcanic',
    recommendedLighting: 'Volcanic Ember Glow & Glacial Twilight',
    recommendedLens: '35mm Cine Prime with Atmospheric Mist Diffusion',
    recommendedAspect: '16:9',
    description: 'High-speed terrain skim over jet-black volcanic basalt ridges clashing with ice-blue glacial melt lagoons.',
    defaultPrompt: 'Epic aerial tracking shot carving through a rugged Icelandic volcanic canyon. Glowing molten orange lava veins beneath black basalt crust, drifting geothermal steam, turquoise glacial river cascading down black stone cliffs, crisp morning sunlight, 1080p National Geographic cinematic style.',
    waypoints: [
      { x: 22, y: 25, altitude: 80, speed: 140, heading: 135 },
      { x: 45, y: 48, altitude: 150, speed: 175, heading: 110 },
      { x: 68, y: 62, altitude: 90, speed: 160, heading: 85 },
      { x: 88, y: 75, altitude: 210, speed: 120, heading: 60 },
    ],
  },
  {
    id: 'dolomites-alpine',
    name: 'Tre Cime di Lavaredo Summit Spire',
    country: 'Dolomites, Italy',
    coordinates: '46.6186° N, 12.3028° E',
    terrainType: 'alpine',
    recommendedLighting: 'Golden Hour Cloud Inversion & Rim Light',
    recommendedLens: '50mm Telephoto Horizon Compression',
    recommendedAspect: '16:9',
    description: 'Ascending orbital spin piercing through sea of alpine clouds to reveal razor-sharp limestone pinnacles.',
    defaultPrompt: 'Sweeping orbital helicopter shot circling the dramatic limestone peaks of Tre Cime di Lavaredo at sunrise. Golden sunbeams piercing a thick sea of low-hanging white alpine clouds, jagged cliffs cast in warm amber rim lighting, crisp mountain air, 8k hyperrealistic nature documentary.',
    waypoints: [
      { x: 20, y: 80, altitude: 1200, speed: 110, heading: 20 },
      { x: 42, y: 45, altitude: 2400, speed: 85, heading: 340 },
      { x: 65, y: 30, altitude: 2850, speed: 70, heading: 290 },
      { x: 80, y: 60, altitude: 2600, speed: 90, heading: 210 },
    ],
  },
  {
    id: 'dubai-zenith',
    name: 'Burj Khalifa Spire Zenith Orbital',
    country: 'Dubai, UAE',
    coordinates: '25.1972° N, 55.2744° E',
    terrainType: 'metropolis',
    recommendedLighting: 'Sunset Crimson Gradient with Fog Blanket',
    recommendedLens: '16mm Ultra-wide Vertical Axis',
    recommendedAspect: '9:16',
    description: 'Dramatic vertical reel fly-up ascending the glistening needle of the world tallest tower above coastal evening fog.',
    defaultPrompt: 'Spectacular vertical 9:16 aerial camera pull-up accelerating upwards along the glass and steel spire of Burj Khalifa in Dubai. The setting sun paints the Persian Gulf in deep magenta and gold, illuminated dancing fountains below, ultra-luxurious modern architecture, crystal clear 4k.',
    waypoints: [
      { x: 50, y: 88, altitude: 150, speed: 60, heading: 0 },
      { x: 50, y: 60, altitude: 450, speed: 90, heading: 0 },
      { x: 50, y: 35, altitude: 720, speed: 120, heading: 0 },
      { x: 50, y: 12, altitude: 950, speed: 80, heading: 0 },
    ],
  },
  {
    id: 'grand-canyon',
    name: 'Horseshoe Bend & Colorado River Dive',
    country: 'Arizona, USA',
    coordinates: '36.0544° N, 112.1401° W',
    terrainType: 'canyon',
    recommendedLighting: 'Late Afternoon Warm Terracotta Glow',
    recommendedLens: '20mm Wide-angle FPV with Horizon Lock',
    recommendedAspect: '16:9',
    description: 'High-adrenalin FPV canyon run diving between red sandstone precipices down to emerald river rapids.',
    defaultPrompt: 'Fast-paced FPV acrobatic drone dive plunging into the dramatic red rock precipices of Horseshoe Bend. Gliding inches above terracotta sandstone canyon walls, skimming the emerald green Colorado river winding through the gorge, warm sunset shadows, thrilling motion blur.',
    waypoints: [
      { x: 15, y: 20, altitude: 1200, speed: 210, heading: 120 },
      { x: 40, y: 45, altitude: 600, speed: 230, heading: 140 },
      { x: 55, y: 55, altitude: 180, speed: 190, heading: 180 },
      { x: 80, y: 75, altitude: 350, speed: 150, heading: 90 },
    ],
  },
  {
    id: 'milford-sound',
    name: 'Milford Sound Fjord Waterfall Skim',
    country: 'Fiordland, New Zealand',
    coordinates: '44.6414° S, 167.8974° E',
    terrainType: 'fjord',
    recommendedLighting: 'Moody Overcast Mist with Sun Rays (Crepuscular Rays)',
    recommendedLens: '35mm High-contrast Cinematic',
    recommendedAspect: '9:16',
    description: 'Vertical cinematic ascent over colossal vertical fjord cliffs with cascading glacial waterfalls into turquoise waters.',
    defaultPrompt: 'Awe-inspiring vertical 9:16 drone ascent along the sheer moss-covered rock walls of Milford Sound, New Zealand. Roaring waterfalls plunging hundreds of meters into crystal clear dark fjord water, dramatic mountain peaks shrouded in ethereal morning mist, pristine nature cinematic.',
    waypoints: [
      { x: 30, y: 85, altitude: 40, speed: 50, heading: 10 },
      { x: 42, y: 55, altitude: 350, speed: 75, heading: 25 },
      { x: 58, y: 32, altitude: 780, speed: 65, heading: 40 },
      { x: 75, y: 15, altitude: 1200, speed: 55, heading: 15 },
    ],
  },
];

export const FLIGHT_STYLES = [
  {
    id: 'canyon-threader',
    name: 'Canyon Threader / Low Skim',
    badge: 'FPV RACING',
    description: 'Low-altitude, high-velocity glide navigating natural contours and valleys.',
    altRange: '30m - 180m',
    speedDefault: 180,
  },
  {
    id: 'orbital-zenith',
    name: 'Orbital Zenith 360°',
    badge: 'CINEMATIC SURVEY',
    description: 'Continuous circular yaw orbit around a mountain spire or architectural apex.',
    altRange: '200m - 900m',
    speedDefault: 75,
  },
  {
    id: 'sub-orbital',
    name: 'Sub-Orbital Horizon Glide',
    badge: 'STRATOSPHERIC',
    description: 'Extreme high-altitude flight capturing planetary horizon curvature and cloud layers.',
    altRange: '2,500m - 15,000m',
    speedDefault: 450,
  },
  {
    id: 'hyperlapse',
    name: 'Urban Motion Hyperlapse',
    badge: 'TIME COMPRESSION',
    description: 'Rapid point-to-point traversal across city grids with animated traffic light trails.',
    altRange: '100m - 500m',
    speedDefault: 240,
  },
];

export const OPTICAL_LENSES = [
  { id: '24mm-anamorphic', label: '24mm Anamorphic (Cinematic Oval Bokeh, Horizontal Flare)' },
  { id: '14mm-ultrawide', label: '14mm Ultra-Wide Angle (Expansive Topography & Edge Distortion)' },
  { id: '35mm-prime', label: '35mm Director Prime (Natural Human Perspective & Depth)' },
  { id: '50mm-telephoto', label: '50mm Anamorphic Telephoto (Horizon Compression)' },
  { id: 'fpv-action', label: '110° FOV FPV Action Cam (Dynamic Acrobatic Motion Blur)' },
];

export const LIGHTING_PRESETS = [
  'Golden Hour Sunset Rim Light & Long Mountain Shadows',
  'Midnight Cyberpunk Neon & Rain Puddle Wet Reflections',
  'Crisp Alpine Morning Sunrise & Piercing Sunbeams',
  'Dramatic Storm Cloud Inversion with Distant Lightning Flash',
  'Ethereal Geothermal Steam & Glacial Twilight Ambient',
  'High-Noon Mediterranean Clear Azure & Turquoise Water Shimmer',
];

// Curated high quality showcase aerial loops for initial discovery and comparison
export const SHOWCASE_VIDEOS: VideoProject[] = [
  {
    id: 'showcase-shibuya-16-9',
    title: 'Tokyo Cyber Metropolis Flight',
    prompt: 'Cinematic FPV drone sweeping over Tokyo Shibuya crossing at midnight during light rain. Wet asphalt reflecting vibrant neon billboards, ultra-detailed glass facades, smooth descent between glowing skyscrapers, anamorphic lens flares, photorealistic 1080p aerial cinematography.',
    aspectRatio: '16:9',
    resolution: '1080p',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-drone-view-of-a-metropolitan-city-at-night-42848-large.mp4',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    flightData: {
      location: 'Shibuya Crossing & Shinjuku Skyway',
      coordinates: '35.6595° N, 139.7005° E',
      maxAltitude: 450,
      avgSpeed: 95,
      flightStyle: 'Urban Motion Hyperlapse',
    },
    isSample: true,
  },
  {
    id: 'showcase-alpine-16-9',
    title: 'Dolomites Alpine Sunrise Spire',
    prompt: 'Sweeping orbital helicopter shot circling the dramatic limestone peaks of Tre Cime di Lavaredo at sunrise. Golden sunbeams piercing a thick sea of low-hanging white alpine clouds, jagged cliffs cast in warm amber rim lighting, crisp mountain air, 8k hyperrealistic nature documentary.',
    aspectRatio: '16:9',
    resolution: '1080p',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-snow-covered-mountain-peaks-32867-large.mp4',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    flightData: {
      location: 'Tre Cime di Lavaredo Summit',
      coordinates: '46.6186° N, 12.3028° E',
      maxAltitude: 2850,
      avgSpeed: 82,
      flightStyle: 'Orbital Zenith 360°',
    },
    isSample: true,
  },
  {
    id: 'showcase-coastal-9-16',
    title: 'Icelandic Black Sand & Breakers (Vertical 9:16)',
    prompt: 'Spectacular vertical 9:16 aerial drone tracking shot sweeping over black sand volcanic coastline. Powerful azure ocean waves breaking into white foam along volcanic basalt sea stacks, mood atmospheric fog, 60fps cinematic fluidity.',
    aspectRatio: '9:16',
    resolution: '1080p',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-waves-crashing-on-a-rocky-coast-42858-large.mp4',
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    flightData: {
      location: 'Vik Reynisfjara Basalt Coast',
      coordinates: '63.4042° N, 19.0494° W',
      maxAltitude: 180,
      avgSpeed: 110,
      flightStyle: 'Canyon Threader / Low Skim',
    },
    isSample: true,
  },
  {
    id: 'showcase-canyon-16-9',
    title: 'Red Rock Sandstone Gorge Dive',
    prompt: 'Fast-paced FPV acrobatic drone dive plunging into the dramatic red rock precipices of Horseshoe Bend. Gliding inches above terracotta sandstone canyon walls, skimming the emerald green river winding through the gorge, warm sunset shadows.',
    aspectRatio: '16:9',
    resolution: '1080p',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-flight-over-desert-canyon-at-sunset-41712-large.mp4',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    flightData: {
      location: 'Horseshoe Bend Canyon',
      coordinates: '36.0544° N, 112.1401° W',
      maxAltitude: 1200,
      avgSpeed: 210,
      flightStyle: 'FPV Acrobatic Dive',
    },
    isSample: true,
  },
];
