import React, { useState, useRef, useEffect } from 'react';
import { 
  Crosshair, 
  Plus, 
  Trash2, 
  RotateCw, 
  Navigation, 
  Mountain, 
  Gauge, 
  Wind, 
  Eye, 
  Maximize2,
  Compass as CompassIcon,
  Play,
  RotateCcw,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Waypoint } from '../types/aftermap';
import { LOCATION_PRESETS, LocationPreset } from '../data/presets';

interface MapStudioProps {
  waypoints: Waypoint[];
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
  selectedPreset: LocationPreset;
  onSelectPreset: (preset: LocationPreset) => void;
  flightStyle: string;
  onFlightStyleChange: (style: string) => void;
  aspectRatio: '16:9' | '9:16';
}

type MapMode = 'cyber' | 'satellite' | 'thermal' | 'golden';

export const MapStudio: React.FC<MapStudioProps> = ({
  waypoints,
  setWaypoints,
  selectedPreset,
  onSelectPreset,
  flightStyle,
  onFlightStyleChange,
  aspectRatio,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('cyber');
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<number>(0);
  const [isSimulatingFlight, setIsSimulatingFlight] = useState<boolean>(true);
  const [flightProgress, setFlightProgress] = useState<number>(0);
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Animation loop for drone traveling on flight path
  useEffect(() => {
    let animId: number;
    if (isSimulatingFlight && waypoints.length >= 2) {
      const step = () => {
        setFlightProgress((prev) => (prev + 0.003) % 1);
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isSimulatingFlight, waypoints.length]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Map Background based on mapMode
    if (mapMode === 'cyber') {
      // Dark cybernetic grid with topographic elevation rings
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Topo contours
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const cx = width * 0.4 + (i * 20);
        const cy = height * 0.45 - (i * 10);
        const rx = 140 + i * 45;
        const ry = 90 + i * 35;
        ctx.ellipse(cx, cy, rx, ry, (i * 15 * Math.PI) / 180, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (mapMode === 'satellite') {
      // Realistic satellite photogrammetry look
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1c2e26');
      grad.addColorStop(0.3, '#1e382b');
      grad.addColorStop(0.6, '#2d4734');
      grad.addColorStop(1, '#13231c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ridge textures & river
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.7);
      ctx.bezierCurveTo(width * 0.3, height * 0.65, width * 0.5, height * 0.8, width, height * 0.55);
      ctx.stroke();

      // Shaded mountain reliefs
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(width * (0.2 + i * 0.22), height * (0.3 + (i % 2) * 0.3), 60 + i * 20, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (mapMode === 'thermal') {
      // FLIR Thermal infrared
      const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 40, width * 0.5, height * 0.5, width * 0.6);
      grad.addColorStop(0, '#ff3b30');
      grad.addColorStop(0.3, '#ff9500');
      grad.addColorStop(0.6, '#5856d6');
      grad.addColorStop(1, '#05021a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (mapMode === 'golden') {
      // Warm golden hour sunlight across hills
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#3a1c0d');
      grad.addColorStop(0.5, '#78350f');
      grad.addColorStop(0.8, '#b45309');
      grad.addColorStop(1, '#1c1917');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Sunlit ridges
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(width * 0.1, height * (0.2 + i * 0.15));
        ctx.quadraticCurveTo(width * 0.5, height * (0.1 + i * 0.15), width * 0.9, height * (0.3 + i * 0.15));
        ctx.stroke();
      }
    }

    // 2. Draw Aspect Ratio Frame Guide
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    if (aspectRatio === '16:9') {
      // Widescreen rectangle
      const frameW = width * 0.94;
      const frameH = (frameW * 9) / 16;
      const frameX = (width - frameW) / 2;
      const frameY = (height - frameH) / 2;
      ctx.strokeRect(frameX, frameY, frameW, frameH);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText('VEO 3 FRAME GUIDE [16:9 CINEMATIC]', frameX + 8, frameY + 16);
    } else {
      // Vertical 9:16 rectangle
      const frameH = height * 0.94;
      const frameW = (frameH * 9) / 16;
      const frameX = (width - frameW) / 2;
      const frameY = (height - frameH) / 2;
      ctx.strokeRect(frameX, frameY, frameW, frameH);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText('VEO 3 FRAME GUIDE [9:16 VERTICAL]', frameX + 6, frameY + 16);
    }
    ctx.restore();

    // 3. Draw Flight Spline / Trajectory
    if (waypoints.length > 0) {
      // Flight trajectory path
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      const points = waypoints.map((w) => ({
        x: (w.x / 100) * width,
        y: (w.y / 100) * height,
      }));

      ctx.moveTo(points[0].x, points[0].y);
      if (points.length === 2) {
        ctx.lineTo(points[1].x, points[1].y);
      } else {
        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      }
      ctx.stroke();

      // Spline Glow
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 8;
      ctx.stroke();

      // 4. Draw Waypoints
      waypoints.forEach((wp, idx) => {
        const px = (wp.x / 100) * width;
        const py = (wp.y / 100) * height;
        const isSelected = idx === selectedWaypointIndex;

        // Altitude stalk line
        ctx.strokeStyle = isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + 14);
        ctx.stroke();

        // Shadow node on terrain
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(px, py + 14, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.fillStyle = isSelected ? '#f59e0b' : '#0f172a';
        ctx.strokeStyle = isSelected ? '#fbbf24' : '#38bdf8';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;

        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 8 : 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner pip
        ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Waypoint Label & Altitude Tag
        ctx.font = '10px monospace';
        ctx.fillStyle = isSelected ? '#fbbf24' : '#e2e8f0';
        ctx.fillText(`WP-${idx + 1}`, px + 10, py - 4);

        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.fillText(`${wp.altitude}m | ${wp.speed}km/h`, px + 10, py + 8);
      });

      // 5. Draw Animated Camera / Drone position along the flight path
      if (waypoints.length >= 2) {
        const totalSegments = points.length - 1;
        const progressScaled = flightProgress * totalSegments;
        const currentSegment = Math.min(Math.floor(progressScaled), totalSegments - 1);
        const segmentT = progressScaled - currentSegment;

        const p1 = points[currentSegment];
        const p2 = points[currentSegment + 1];

        const droneX = p1.x + (p2.x - p1.x) * segmentT;
        const droneY = p1.y + (p2.y - p1.y) * segmentT;

        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        ctx.save();
        ctx.translate(droneX, droneY);
        ctx.rotate(angle);

        // Drone camera reticle & heading cone
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(45, -20);
        ctx.lineTo(45, 20);
        ctx.closePath();
        ctx.fill();

        // Drone body
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    // 6. Draw Crosshair cursor if hovered
    if (hoveredCoords) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hoveredCoords.x, 0);
      ctx.lineTo(hoveredCoords.x, height);
      ctx.moveTo(0, hoveredCoords.y);
      ctx.lineTo(width, hoveredCoords.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [waypoints, mapMode, selectedWaypointIndex, flightProgress, hoveredCoords, aspectRatio]);

  // Click on map to select or add waypoint
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pctX = Math.round((clickX / rect.width) * 100);
    const pctY = Math.round((clickY / rect.height) * 100);

    // Check if clicked close to an existing waypoint
    const clickedIdx = waypoints.findIndex((w) => {
      const wx = (w.x / 100) * rect.width;
      const wy = (w.y / 100) * rect.height;
      const dist = Math.hypot(wx - clickX, wy - clickY);
      return dist < 14;
    });

    if (clickedIdx !== -1) {
      setSelectedWaypointIndex(clickedIdx);
    } else {
      // Add a new waypoint at click location
      const prevWp = waypoints[waypoints.length - 1];
      const newWp: Waypoint = {
        id: `wp-${Date.now()}`,
        name: `WP-${waypoints.length + 1}`,
        x: pctX,
        y: pctY,
        altitude: prevWp ? prevWp.altitude : 250,
        speed: prevWp ? prevWp.speed : 120,
        heading: 45,
      };
      setWaypoints([...waypoints, newWp]);
      setSelectedWaypointIndex(waypoints.length);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setHoveredCoords({ x: mouseX, y: mouseY });

    if (isDragging && draggedIndex !== null) {
      const pctX = Math.min(Math.max(Math.round((mouseX / rect.width) * 100), 2), 98);
      const pctY = Math.min(Math.max(Math.round((mouseY / rect.height) * 100), 2), 98);

      setWaypoints((prev) =>
        prev.map((w, idx) => (idx === draggedIndex ? { ...w, x: pctX, y: pctY } : w))
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clickedIdx = waypoints.findIndex((w) => {
      const wx = (w.x / 100) * rect.width;
      const wy = (w.y / 100) * rect.height;
      return Math.hypot(wx - clickX, wy - clickY) < 14;
    });

    if (clickedIdx !== -1) {
      setIsDragging(true);
      setDraggedIndex(clickedIdx);
      setSelectedWaypointIndex(clickedIdx);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedIndex(null);
  };

  const activeWaypoint = waypoints[selectedWaypointIndex] || waypoints[0];

  const updateActiveWaypoint = (field: keyof Waypoint, value: any) => {
    setWaypoints((prev) =>
      prev.map((w, idx) => (idx === selectedWaypointIndex ? { ...w, [field]: value } : w))
    );
  };

  const removeActiveWaypoint = () => {
    if (waypoints.length <= 2) return;
    setWaypoints((prev) => prev.filter((_, idx) => idx !== selectedWaypointIndex));
    setSelectedWaypointIndex((prev) => Math.max(0, prev - 1));
  };

  const resetToPreset = () => {
    const defaultWps: Waypoint[] = selectedPreset.waypoints.map((pw, i) => ({
      id: `wp-${i + 1}`,
      name: `WP-${i + 1}`,
      x: pw.x,
      y: pw.y,
      altitude: pw.altitude,
      speed: pw.speed,
      heading: pw.heading,
    }));
    setWaypoints(defaultWps);
    setSelectedWaypointIndex(0);
  };

  return (
    <div className="space-y-4">
      {/* Location Preset Selector Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CompassIcon className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
              Geospatial Presets & Terrain Targets
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Coordinates: <span className="text-amber-400 font-bold">{selectedPreset.coordinates}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {LOCATION_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPreset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/30'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">{preset.terrainType}</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-zinc-800 text-zinc-300">
                    {preset.recommendedAspect}
                  </span>
                </div>
                <div className="font-bold text-xs truncate mt-1 text-zinc-100">{preset.name.split('&')[0]}</div>
                <div className="text-[10px] text-zinc-400 truncate">{preset.country}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Map Top HUD Controls */}
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Layer switcher */}
          <div className="flex items-center gap-1 bg-zinc-950/80 backdrop-blur-md p-1 rounded-xl border border-zinc-800 pointer-events-auto shadow-md">
            <button
              onClick={() => setMapMode('cyber')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors ${
                mapMode === 'cyber' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cyber Lidar
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors ${
                mapMode === 'satellite' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapMode('thermal')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors ${
                mapMode === 'thermal' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Thermal FLIR
            </button>
            <button
              onClick={() => setMapMode('golden')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors ${
                mapMode === 'golden' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Golden Dawn
            </button>
          </div>

          {/* Quick Map Actions */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 backdrop-blur-md p-1 rounded-xl border border-zinc-800 pointer-events-auto shadow-md">
            <button
              onClick={() => setIsSimulatingFlight(!isSimulatingFlight)}
              title="Toggle Flight Path Drone Simulation"
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
                isSimulatingFlight ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate</span>
            </button>
            <button
              onClick={resetToPreset}
              title="Reset Waypoints to Preset"
              className="p-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Path</span>
            </button>
          </div>
        </div>

        {/* Canvas Element */}
        <canvas
          ref={canvasRef}
          width={840}
          height={480}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setHoveredCoords(null);
            handleMouseUp();
          }}
          className="w-full h-[360px] sm:h-[460px] cursor-crosshair block select-none"
        />

        {/* Bottom Map Telemetry Banner */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px] font-mono">
          <div className="bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-300 flex items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-1 text-amber-400">
              <Crosshair className="w-3.5 h-3.5" />
              <span>CLICK TO ADD WAYPOINTS</span>
            </div>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              WAYPOINTS: <strong className="text-zinc-100">{waypoints.length}</strong>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              TARGET: <strong className="text-zinc-100">{selectedPreset.name.split(' ')[0]}</strong>
            </span>
          </div>

          <div className="bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-400 pointer-events-auto">
            {hoveredCoords ? (
              <span>GRID: X {hoveredCoords.x.toFixed(0)} | Y {hoveredCoords.y.toFixed(0)}</span>
            ) : (
              <span>GPS LOCK: ACTIVE RTK</span>
            )}
          </div>
        </div>
      </div>

      {/* Waypoint Inspector & Flight Telemetry Drawer */}
      {activeWaypoint && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-black font-mono text-xs">
                {activeWaypoint.name}
              </span>
              <span className="text-xs font-mono text-zinc-300">
                Active Node Parameters
              </span>
            </div>

            <div className="flex items-center gap-2">
              {waypoints.length > 2 && (
                <button
                  onClick={removeActiveWaypoint}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove WP</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Altitude Slider */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5 text-cyan-400" /> Altitude (AGL)
                </span>
                <span className="text-cyan-300 font-bold">{activeWaypoint.altitude} m</span>
              </div>
              <input
                type="range"
                min="30"
                max="4000"
                step="10"
                value={activeWaypoint.altitude}
                onChange={(e) => updateActiveWaypoint('altitude', Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>30m (Tree-skimming)</span>
                <span>4000m (Summit)</span>
              </div>
            </div>

            {/* Flight Speed Slider */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" /> Velocity
                </span>
                <span className="text-amber-300 font-bold">{activeWaypoint.speed} km/h</span>
              </div>
              <input
                type="range"
                min="30"
                max="350"
                step="5"
                value={activeWaypoint.speed}
                onChange={(e) => updateActiveWaypoint('speed', Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>30 km/h (Hover)</span>
                <span>350 km/h (Sprint)</span>
              </div>
            </div>

            {/* Camera Heading / Yaw */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Camera Bearing
                </span>
                <span className="text-emerald-300 font-bold">{activeWaypoint.heading}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={activeWaypoint.heading}
                onChange={(e) => updateActiveWaypoint('heading', Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>0° (North)</span>
                <span>180° (South)</span>
                <span>360°</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
