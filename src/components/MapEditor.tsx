import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Crosshair,
  Plus,
  Trash2,
  Navigation,
  Mountain,
  Gauge,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Compass as CompassIcon,
  Download,
  ShieldAlert,
  Target,
  Grid,
  Ruler,
  Camera,
  Move,
  CheckCircle,
  Copy,
  AlertTriangle,
  Zap,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';
import {
  Waypoint,
  PointOfInterest,
  GeofenceZone,
  EditorTool,
  MapLayerStyle,
  AspectRatio,
  WaypointAction,
} from '../types/aftermap';
import { LOCATION_PRESETS, LocationPreset } from '../data/presets';
import {
  calculateTotalFlightMetrics,
  getSimulatedTerrainElevation,
  checkGeofenceViolations,
  generateOrbitPattern,
  generateSurveyGridPattern,
  generateSpiralAscentPattern,
  calculateDistanceMeters,
} from '../utils/flightMath';

interface MapEditorProps {
  waypoints: Waypoint[];
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
  selectedPreset: LocationPreset;
  onSelectPreset: (preset: LocationPreset) => void;
  flightStyle: string;
  onFlightStyleChange: (style: string) => void;
  aspectRatio: AspectRatio;
  onApplyToPrompt?: (flightSummary: string) => void;
  onCloseEditor?: () => void;
}

export const MapEditor: React.FC<MapEditorProps> = ({
  waypoints,
  setWaypoints,
  selectedPreset,
  onSelectPreset,
  flightStyle,
  onFlightStyleChange,
  aspectRatio,
  onApplyToPrompt,
  onCloseEditor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tools & Layers
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [mapLayer, setMapLayer] = useState<MapLayerStyle>('cyber');
  const [activeTab, setActiveTab] = useState<'node' | 'patterns' | 'timeline' | 'pois'>('node');

  // Selection state
  const [selectedWpIdx, setSelectedWpIdx] = useState<number>(0);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ canvasX: number; canvasY: number; pctX: number; pctY: number } | null>(null);

  // Dragging & Interaction
  const [isDraggingNode, setIsDraggingNode] = useState<boolean>(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [measureStart, setMeasureStart] = useState<{ canvasX: number; canvasY: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ canvasX: number; canvasY: number } | null>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Points of Interest (POIs)
  const [pois, setPois] = useState<PointOfInterest[]>([
    {
      id: 'poi-1',
      name: `${(selectedPreset?.name || 'Tokyo').split(' ')[0]} Focal Apex`,
      x: 50,
      y: 45,
      altitude: 400,
      color: '#38bdf8',
      category: 'target',
    },
  ]);

  // Geofence / Safety Zones
  const [geofences, setGeofences] = useState<GeofenceZone[]>([
    {
      id: 'geo-1',
      name: 'Restricted Airspace Ring',
      type: 'danger-zone',
      x: 75,
      y: 80,
      radius: 14,
      maxAltitude: 200,
      warningText: 'Active Heliport Corridor Buffer',
    },
  ]);

  // Flight Simulation
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [flightProgress, setFlightProgress] = useState<number>(0);
  const [simSpeed] = useState<number>(1);

  // View Guides
  const [showFovCones, setShowFovCones] = useState<boolean>(true);
  const [showAltitudeTags, setShowAltitudeTags] = useState<boolean>(true);
  const [showSafeFrames, setShowSafeFrames] = useState<boolean>(true);
  const [showTerrainGrid, setShowTerrainGrid] = useState<boolean>(true);

  // Status & Notification
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Safe filtered waypoints
  const validWaypoints = useMemo(() => {
    return (waypoints || []).filter(
      (w) => w && typeof w.x === 'number' && typeof w.y === 'number'
    );
  }, [waypoints]);

  // Metrics
  const metrics = useMemo(() => {
    return calculateTotalFlightMetrics(validWaypoints);
  }, [validWaypoints]);

  // Geofence collision check
  const violations = useMemo(() => {
    return checkGeofenceViolations(validWaypoints, geofences);
  }, [validWaypoints, geofences]);

  // Current active waypoint
  const activeWp = useMemo(() => {
    if (!validWaypoints || validWaypoints.length === 0) return null;
    return validWaypoints[selectedWpIdx] || validWaypoints[0] || null;
  }, [validWaypoints, selectedWpIdx]);

  // Animation Loop for Flight Playback
  useEffect(() => {
    let animId: number;
    if (isPlaying && validWaypoints.length >= 2) {
      let lastTime = performance.now();
      const step = (time: number) => {
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        const stepAmt = 0.04 * simSpeed * delta;
        setFlightProgress((prev) => (prev + stepAmt) % 1);
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, validWaypoints.length, simSpeed]);

  // Sync POI when location preset changes
  useEffect(() => {
    if (!selectedPreset) return;
    setPois([
      {
        id: `poi-${selectedPreset.id}`,
        name: `${selectedPreset.name.split(' ')[0]} Target`,
        x: 50,
        y: 45,
        altitude: selectedPreset.waypoints?.[1]?.altitude || 300,
        color: '#38bdf8',
        category: 'landmark',
      },
    ]);
  }, [selectedPreset]);

  // Coordinate Conversion Helpers
  const canvasToScreen = useCallback(
    (canvasPctX: number, canvasPctY: number, width: number, height: number) => {
      const baseX = ((canvasPctX ?? 50) / 100) * width;
      const baseY = ((canvasPctY ?? 50) / 100) * height;
      const zoomedX = width / 2 + (baseX - width / 2) * zoom + pan.x;
      const zoomedY = height / 2 + (baseY - height / 2) * zoom + pan.y;
      return { x: zoomedX, y: zoomedY };
    },
    [zoom, pan]
  );

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { canvasX: 0, canvasY: 0, pctX: 50, pctY: 50 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const screenX = (e.clientX - rect.left) * scaleX;
      const screenY = (e.clientY - rect.top) * scaleY;

      const unzoomedX = (screenX - pan.x - canvas.width / 2) / zoom + canvas.width / 2;
      const unzoomedY = (screenY - pan.y - canvas.height / 2) / zoom + canvas.height / 2;

      const pctX = Math.round(Math.min(Math.max((unzoomedX / canvas.width) * 100, 1), 99));
      const pctY = Math.round(Math.min(Math.max((unzoomedY / canvas.height) * 100, 1), 99));

      return { canvasX: screenX, canvasY: screenY, pctX, pctY };
    },
    [zoom, pan]
  );

  // Main Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Map Background based on layer
    if (mapLayer === 'cyber') {
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, width, height);

      if (showTerrainGrid) {
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.09)';
        ctx.lineWidth = 1;
        const gridStep = 32 * zoom;
        const offsetX = (pan.x + width / 2) % gridStep;
        const offsetY = (pan.y + height / 2) % gridStep;

        for (let x = offsetX; x < width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = offsetY; y < height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(34, 211, 238, 0.18)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 7; i++) {
          const center = canvasToScreen(50, 48, width, height);
          ctx.beginPath();
          ctx.ellipse(
            center.x + i * 15 * zoom,
            center.y - i * 8 * zoom,
            (110 + i * 35) * zoom,
            (75 + i * 24) * zoom,
            (i * 12 * Math.PI) / 180,
            0,
            Math.PI * 2
          );
          ctx.stroke();

          ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
          ctx.font = '9px monospace';
          ctx.fillText(`+${120 + i * 80}m`, center.x + (110 + i * 35) * zoom, center.y);
        }
      }
    } else if (mapLayer === 'satellite') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#15241d');
      grad.addColorStop(0.35, '#1e382b');
      grad.addColorStop(0.7, '#2a4435');
      grad.addColorStop(1, '#111e17');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 6 * zoom;
      ctx.beginPath();
      const pStart = canvasToScreen(0, 68, width, height);
      const pMid = canvasToScreen(45, 62, width, height);
      const pEnd = canvasToScreen(100, 52, width, height);
      ctx.moveTo(pStart.x, pStart.y);
      ctx.quadraticCurveTo(pMid.x, pMid.y, pEnd.x, pEnd.y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < 5; i++) {
        const pMount = canvasToScreen(20 + i * 18, 30 + (i % 2) * 25, width, height);
        ctx.beginPath();
        ctx.arc(pMount.x, pMount.y, (50 + i * 15) * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (mapLayer === 'topo-vector') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 9; i++) {
        const center = canvasToScreen(48, 50, width, height);
        ctx.beginPath();
        ctx.ellipse(
          center.x,
          center.y,
          (80 + i * 38) * zoom,
          (60 + i * 26) * zoom,
          0.3,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
    } else if (mapLayer === 'thermal') {
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        40 * zoom,
        width * 0.5,
        height * 0.5,
        width * 0.7 * zoom
      );
      grad.addColorStop(0, '#ff3b30');
      grad.addColorStop(0.25, '#ff9500');
      grad.addColorStop(0.55, '#5856d6');
      grad.addColorStop(0.85, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (mapLayer === 'golden') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#2b1408');
      grad.addColorStop(0.4, '#5e2a0c');
      grad.addColorStop(0.7, '#8f420d');
      grad.addColorStop(1, '#17120e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.lineWidth = 3 * zoom;
      for (let i = 0; i < 6; i++) {
        const p1 = canvasToScreen(10, 15 + i * 14, width, height);
        const p2 = canvasToScreen(90, 25 + i * 14, width, height);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // 2. Draw Geofences / Safety exclusion zones
    (geofences || []).forEach((geo) => {
      if (!geo || typeof geo.x !== 'number' || typeof geo.y !== 'number') return;
      const center = canvasToScreen(geo.x, geo.y, width, height);
      const radiusPx = ((geo.radius || 12) / 100) * width * zoom;

      ctx.save();
      ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);

      ctx.beginPath();
      ctx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.font = '10px monospace';
      ctx.fillText(`⛔ ${geo.name || 'Zone'} (MAX ${geo.maxAltitude || 200}m)`, center.x - 70, center.y);
      ctx.restore();
    });

    // 3. Draw Points of Interest (POIs)
    (pois || []).forEach((poi) => {
      if (!poi || typeof poi.x !== 'number' || typeof poi.y !== 'number') return;
      const pt = canvasToScreen(poi.x, poi.y, width, height);
      const isSelected = selectedPoiId === poi.id;

      ctx.save();
      ctx.translate(pt.x, pt.y);

      if (isSelected) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = poi.color || '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(9, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(4, 0);
      ctx.moveTo(0, -4);
      ctx.lineTo(0, 4);
      ctx.stroke();

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(poi.name || 'POI', 14, 4);
      ctx.restore();
    });

    // 4. Draw Waypoints & Flight Path Spline
    if (validWaypoints.length > 0) {
      const screenPoints = validWaypoints.map((w) => canvasToScreen(w.x, w.y, width, height));

      if (screenPoints.length >= 2 && screenPoints[0]) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);

        if (screenPoints.length === 2 && screenPoints[1]) {
          ctx.lineTo(screenPoints[1].x, screenPoints[1].y);
        } else {
          for (let i = 0; i < screenPoints.length - 1; i++) {
            const pA = screenPoints[i];
            const pB = screenPoints[i + 1];
            if (pA && pB) {
              const xc = (pA.x + pB.x) / 2;
              const yc = (pA.y + pB.y) / 2;
              ctx.quadraticCurveTo(pA.x, pA.y, xc, yc);
            }
          }
          const pLast = screenPoints[screenPoints.length - 1];
          if (pLast) {
            ctx.lineTo(pLast.x, pLast.y);
          }
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();

        // Directional flow arrows
        for (let i = 0; i < screenPoints.length - 1; i++) {
          const p1 = screenPoints[i];
          const p2 = screenPoints[i + 1];
          if (p1 && p2) {
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
            ctx.beginPath();
            ctx.moveTo(5, 0);
            ctx.lineTo(-4, -4);
            ctx.lineTo(-2, 0);
            ctx.lineTo(-4, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // 5. Draw Individual Waypoints
      validWaypoints.forEach((wp, idx) => {
        const pt = screenPoints[idx];
        if (!pt) return;
        const isSelected = idx === selectedWpIdx;

        // FOV cone
        if (showFovCones) {
          const headingRad = (((wp.heading ?? 45) - 90) * Math.PI) / 180;
          const fovAngle = (50 * Math.PI) / 180;
          const coneLength = 38 * zoom;

          ctx.save();
          ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.22)' : 'rgba(56, 189, 248, 0.12)';
          ctx.strokeStyle = isSelected ? 'rgba(245, 158, 11, 0.6)' : 'rgba(56, 189, 248, 0.3)';
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(
            pt.x + Math.cos(headingRad - fovAngle / 2) * coneLength,
            pt.y + Math.sin(headingRad - fovAngle / 2) * coneLength
          );
          ctx.arc(pt.x, pt.y, coneLength, headingRad - fovAngle / 2, headingRad + fovAngle / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Ray to targeted POI
        if (wp.poiId) {
          const targetPoi = (pois || []).find((p) => p && p.id === wp.poiId);
          if (targetPoi && typeof targetPoi.x === 'number' && typeof targetPoi.y === 'number') {
            const poiPt = canvasToScreen(targetPoi.x, targetPoi.y, width, height);
            ctx.save();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(poiPt.x, poiPt.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Stalk line
        ctx.strokeStyle = isSelected ? '#fbbf24' : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x, pt.y + 12);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y + 12, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Node ring
        ctx.fillStyle = isSelected ? '#f59e0b' : '#090d16';
        ctx.strokeStyle = isSelected ? '#fbbf24' : '#38bdf8';
        ctx.lineWidth = isSelected ? 3 : 1.8;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isSelected ? 10 : 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), pt.x, pt.y);

        if (showAltitudeTags) {
          ctx.textAlign = 'left';
          ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
          ctx.fillStyle = isSelected ? '#fbbf24' : '#e2e8f0';
          ctx.fillText(`WP-${idx + 1}`, pt.x + 13, pt.y - 4);

          ctx.font = '8px monospace';
          ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
          const actionTag = wp.action ? `[${wp.action.toUpperCase()}]` : '';
          ctx.fillText(`${wp.altitude ?? 150}m | ${wp.speed ?? 100}km/h ${actionTag}`, pt.x + 13, pt.y + 8);
        }
      });

      // 6. Draw Animated Flight Drone Reticle
      if (screenPoints.length >= 2) {
        const totalSegments = Math.max(1, screenPoints.length - 1);
        const progressScaled = Math.max(0, Math.min(flightProgress, 0.9999)) * totalSegments;
        const currentSegment = Math.max(0, Math.min(Math.floor(progressScaled), totalSegments - 1));
        const segmentT = progressScaled - currentSegment;

        const p1 = screenPoints[currentSegment];
        const p2 = screenPoints[currentSegment + 1] || screenPoints[currentSegment];

        if (p1 && p2 && typeof p1.x === 'number' && typeof p2.x === 'number') {
          const droneX = p1.x + (p2.x - p1.x) * segmentT;
          const droneY = p1.y + (p2.y - p1.y) * segmentT;
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

          ctx.save();
          ctx.translate(droneX, droneY);
          ctx.rotate(angle);

          ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(40, -18);
          ctx.lineTo(40, 18);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(12, 0);
          ctx.lineTo(-7, -7);
          ctx.lineTo(-4, 0);
          ctx.lineTo(-7, 7);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // 7. Measure Line Tool Preview
    if (activeTool === 'measure' && measureStart && measureEnd &&
        typeof measureStart.canvasX === 'number' && typeof measureEnd.canvasX === 'number') {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(measureStart.canvasX, measureStart.canvasY);
      ctx.lineTo(measureEnd.canvasX, measureEnd.canvasY);
      ctx.stroke();

      const distM = calculateDistanceMeters(
        { x: (measureStart.canvasX / width) * 100, y: (measureStart.canvasY / height) * 100 },
        { x: (measureEnd.canvasX / width) * 100, y: (measureEnd.canvasY / height) * 100 }
      );

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `📏 ${Math.round(distM)} m`,
        (measureStart.canvasX + measureEnd.canvasX) / 2 + 8,
        (measureStart.canvasY + measureEnd.canvasY) / 2
      );
      ctx.restore();
    }

    // 8. Safe Frame Guides (16:9 & 9:16)
    if (showSafeFrames) {
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      if (aspectRatio === '16:9') {
        const frameW = width * 0.94;
        const frameH = (frameW * 9) / 16;
        const frameX = (width - frameW) / 2;
        const frameY = (height - frameH) / 2;
        ctx.strokeRect(frameX, frameY, frameW, frameH);

        ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.font = '10px monospace';
        ctx.fillText('VEO 3 MISSION BOUNDARY [16:9 CINEMATIC]', frameX + 8, frameY + 16);
      } else {
        const frameH = height * 0.94;
        const frameW = (frameH * 9) / 16;
        const frameX = (width - frameW) / 2;
        const frameY = (height - frameH) / 2;
        ctx.strokeRect(frameX, frameY, frameW, frameH);

        ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.font = '10px monospace';
        ctx.fillText('VEO 3 MISSION BOUNDARY [9:16 VERTICAL]', frameX + 6, frameY + 16);
      }
      ctx.restore();
    }

    // 9. Coordinate Crosshairs at Cursor
    if (hoveredCoords && activeTool !== 'pan' &&
        typeof hoveredCoords.canvasX === 'number' && typeof hoveredCoords.canvasY === 'number') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 2]);

      ctx.beginPath();
      ctx.moveTo(hoveredCoords.canvasX, 0);
      ctx.lineTo(hoveredCoords.canvasX, height);
      ctx.moveTo(0, hoveredCoords.canvasY);
      ctx.lineTo(width, hoveredCoords.canvasY);
      ctx.stroke();
      ctx.restore();
    }
  }, [
    validWaypoints,
    pois,
    geofences,
    selectedWpIdx,
    selectedPoiId,
    flightProgress,
    mapLayer,
    zoom,
    pan,
    hoveredCoords,
    activeTool,
    measureStart,
    measureEnd,
    showFovCones,
    showAltitudeTags,
    showSafeFrames,
    showTerrainGrid,
    aspectRatio,
    canvasToScreen,
  ]);

  // Handle Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { canvasX, canvasY, pctX, pctY } = getCanvasCoords(e);

    if (activeTool === 'pan' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: canvasX - pan.x, y: canvasY - pan.y });
      return;
    }

    if (activeTool === 'measure') {
      setMeasureStart({ canvasX, canvasY });
      setMeasureEnd({ canvasX, canvasY });
      return;
    }

    // Check hit on existing Waypoints
    const width = canvas.width;
    const height = canvas.height;
    const clickedWpIdx = (validWaypoints || []).findIndex((w) => {
      if (!w || typeof w.x !== 'number' || typeof w.y !== 'number') return false;
      const pt = canvasToScreen(w.x, w.y, width, height);
      return Math.hypot(pt.x - canvasX, pt.y - canvasY) < 22;
    });

    if (clickedWpIdx !== -1) {
      setSelectedWpIdx(clickedWpIdx);
      setSelectedPoiId(null);
      setIsDraggingNode(true);
      setDraggedNodeId(validWaypoints[clickedWpIdx].id);
      return;
    }

    // Check hit on existing POIs
    const clickedPoi = (pois || []).find((p) => {
      if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return false;
      const pt = canvasToScreen(p.x, p.y, width, height);
      return Math.hypot(pt.x - canvasX, pt.y - canvasY) < 22;
    });

    if (clickedPoi) {
      setSelectedPoiId(clickedPoi.id);
      setIsDraggingNode(true);
      setDraggedNodeId(clickedPoi.id);
      return;
    }

    // Tool actions on terrain
    if (activeTool === 'add-waypoint') {
      const prevWp = validWaypoints[validWaypoints.length - 1];
      const newWp: Waypoint = {
        id: `wp-${Date.now()}`,
        name: `WP-${validWaypoints.length + 1}`,
        x: pctX,
        y: pctY,
        altitude: prevWp?.altitude ?? 200,
        speed: prevWp?.speed ?? 110,
        heading: 45,
        gimbalPitch: -20,
        cameraRoll: 0,
        action: 'fly-through',
      };
      setWaypoints([...validWaypoints, newWp]);
      setSelectedWpIdx(validWaypoints.length);
      showNotification(`Added Waypoint WP-${validWaypoints.length + 1}`);
    } else if (activeTool === 'add-poi') {
      const newPoi: PointOfInterest = {
        id: `poi-${Date.now()}`,
        name: `Focal Target ${(pois || []).length + 1}`,
        x: pctX,
        y: pctY,
        altitude: 250,
        color: '#38bdf8',
        category: 'landmark',
      };
      setPois([...(pois || []), newPoi]);
      setSelectedPoiId(newPoi.id);
      showNotification(`Placed Focal Point of Interest: ${newPoi.name}`);
    } else if (activeTool === 'add-geofence') {
      const newGeo: GeofenceZone = {
        id: `geo-${Date.now()}`,
        name: `Safety Buffer ${(geofences || []).length + 1}`,
        type: 'danger-zone',
        x: pctX,
        y: pctY,
        radius: 12,
        maxAltitude: 300,
        warningText: 'Exclusion zone clearance required',
      };
      setGeofences([...(geofences || []), newGeo]);
      showNotification(`Placed Geofence Zone`);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { pctX, pctY } = getCanvasCoords(e);
    const prevWp = validWaypoints[validWaypoints.length - 1];
    const newWp: Waypoint = {
      id: `wp-${Date.now()}`,
      name: `WP-${validWaypoints.length + 1}`,
      x: pctX,
      y: pctY,
      altitude: prevWp?.altitude ?? 200,
      speed: prevWp?.speed ?? 110,
      heading: 45,
      gimbalPitch: -20,
      cameraRoll: 0,
      action: 'fly-through',
    };
    setWaypoints([...validWaypoints, newWp]);
    setSelectedWpIdx(validWaypoints.length);
    showNotification(`Added Waypoint WP-${validWaypoints.length + 1}`);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { canvasX, canvasY, pctX, pctY } = getCanvasCoords(e);
    setHoveredCoords({ canvasX, canvasY, pctX, pctY });

    if (isPanning) {
      setPan({ x: canvasX - panStart.x, y: canvasY - panStart.y });
      return;
    }

    if (activeTool === 'measure' && measureStart) {
      setMeasureEnd({ canvasX, canvasY });
      return;
    }

    if (isDraggingNode && draggedNodeId) {
      if (draggedNodeId.startsWith('wp-')) {
        setWaypoints((prev) =>
          (prev || []).map((w) => (w && w.id === draggedNodeId ? { ...w, x: pctX, y: pctY } : w))
        );
      } else if (draggedNodeId.startsWith('poi-')) {
        setPois((prev) =>
          (prev || []).map((p) => (p && p.id === draggedNodeId ? { ...p, x: pctX, y: pctY } : p))
        );
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingNode(false);
    setDraggedNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.6), 2.5));
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.6), 2.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    showNotification('Map view reset to default center');
  };

  const updateActiveWaypoint = (field: keyof Waypoint, value: any) => {
    setWaypoints((prev) =>
      (prev || []).map((w, idx) => (idx === selectedWpIdx && w ? { ...w, [field]: value } : w))
    );
  };

  const removeActiveWaypoint = () => {
    if (validWaypoints.length <= 2) {
      showNotification('Flight plan requires minimum 2 waypoints');
      return;
    }
    const targetWp = validWaypoints[selectedWpIdx];
    const removedName = targetWp?.name || 'Waypoint';
    setWaypoints((prev) => (prev || []).filter((_, idx) => idx !== selectedWpIdx));
    setSelectedWpIdx((prev) => Math.max(0, prev - 1));
    showNotification(`Removed ${removedName}`);
  };

  const duplicateActiveWaypoint = () => {
    if (!activeWp || typeof activeWp.x !== 'number') return;
    const newWp: Waypoint = {
      ...activeWp,
      id: `wp-${Date.now()}`,
      name: `WP-${validWaypoints.length + 1}`,
      x: Math.min((activeWp.x ?? 50) + 6, 95),
      y: Math.min((activeWp.y ?? 50) + 6, 95),
    };
    const newArr = [...validWaypoints];
    newArr.splice(selectedWpIdx + 1, 0, newWp);
    setWaypoints(newArr);
    setSelectedWpIdx(selectedWpIdx + 1);
    showNotification(`Duplicated ${activeWp.name || 'Waypoint'}`);
  };

  const reverseFlightPath = () => {
    setWaypoints((prev) =>
      [...(prev || [])].reverse().map((w, i) => ({ ...w, name: `WP-${i + 1}` }))
    );
    setSelectedWpIdx(0);
    showNotification('Flight path reversed');
  };

  const handleApplyOrbit = () => {
    const target = (pois && pois[0]) || { x: 50, y: 50, id: 'poi-center', name: 'target' };
    const orbitWps = generateOrbitPattern(
      target?.x ?? 50,
      target?.y ?? 50,
      22,
      activeWp?.altitude || 350,
      activeWp?.speed || 80,
      target.id
    );
    setWaypoints(orbitWps);
    setSelectedWpIdx(0);
    showNotification(`Choreographed 360° Orbit around ${target.name || 'target'}`);
  };

  const handleApplySurvey = () => {
    const surveyWps = generateSurveyGridPattern(
      { minX: 18, maxX: 82, minY: 18, maxY: 82 },
      4,
      120,
      65
    );
    setWaypoints(surveyWps);
    setSelectedWpIdx(0);
    showNotification('Generated Photogrammetry Survey Grid');
  };

  const handleApplySpiral = () => {
    const spiralWps = generateSpiralAscentPattern(50, 50, 80, 1400);
    setWaypoints(spiralWps);
    setSelectedWpIdx(0);
    showNotification('Generated Golden Spiral Ascent Flight');
  };

  const handleExportJSON = () => {
    const plan = {
      name: `${selectedPreset?.name || 'Flight'} Mission`,
      location: selectedPreset?.name || '',
      coordinates: selectedPreset?.coordinates || '',
      createdAt: new Date().toISOString(),
      aspectRatio,
      metrics,
      waypoints: validWaypoints,
      pois,
      geofences,
    };
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AfterMap-Mission-${selectedPreset?.id || 'flight'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Flight plan exported as JSON');
  };

  const handleSendToDirector = () => {
    const avgAlt = metrics.maxAltitude;
    const summary = `Choreographed aerial flight along ${validWaypoints.length} precision waypoints at ${selectedPreset?.name || 'flight path'}. Cruise altitude ${avgAlt}m AGL, continuous forward velocity ${metrics.avgSpeedKmh} km/h, covering ${metrics.totalDistanceMeters}m terrain corridor. Camera gimbal pitch ${activeWp?.gimbalPitch ?? -20}°, anamorphic lens flare, photorealistic 1080p aerial rendering.`;
    if (onApplyToPrompt) {
      onApplyToPrompt(summary);
    }
    showNotification('Flight telemetry synced with Veo 3 Video Director!');
    if (onCloseEditor) {
      onCloseEditor();
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor Top Bar: Location Switcher & Quick Actions */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <CompassIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black font-mono tracking-wider text-zinc-100 uppercase flex items-center gap-2">
                Flight Plan Editor <span className="text-xs bg-amber-500 text-zinc-950 px-1.5 py-0.2 rounded font-bold">PRO</span>
              </h2>
              <p className="text-[11px] font-mono text-zinc-400">
                Choreograph 3D aerial trajectories, camera pitch, and POI targets for Veo 3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              title="Export Flight Plan as JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={handleSendToDirector}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs font-mono shadow-lg shadow-amber-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply to Veo 3 Studio</span>
            </button>
          </div>
        </div>

        {/* Location presets chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {LOCATION_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPreset?.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/30'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>{preset.terrainType}</span>
                  <span className="bg-zinc-800 px-1 rounded text-zinc-300">{preset.recommendedAspect}</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 truncate mt-1">{preset.name.split('&')[0]}</div>
                <div className="text-[10px] text-zinc-400 truncate">{preset.country}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Main Canvas & Tools Container */}
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Control Overlay: Layers & Tool Palette */}
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Tool Palette */}
          <div className="flex items-center gap-1 bg-zinc-950/85 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 pointer-events-auto shadow-lg">
            <button
              onClick={() => setActiveTool('select')}
              title="Select & Move Node (Click/drag any node, or double-click to add)"
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
                activeTool === 'select'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span className="hidden sm:inline">Select</span>
            </button>

            <button
              onClick={() => setActiveTool('add-waypoint')}
              title="Click anywhere on map to add waypoint"
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
                activeTool === 'add-waypoint'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add WP</span>
            </button>

            <button
              onClick={() => setActiveTool('add-poi')}
              title="Add Point of Interest Target"
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
                activeTool === 'add-poi'
                  ? 'bg-sky-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">POI</span>
            </button>

            <button
              onClick={() => setActiveTool('add-geofence')}
              title="Add Safety Geofence Zone"
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
                activeTool === 'add-geofence'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden sm:inline">Zone</span>
            </button>

            <button
              onClick={() => setActiveTool('measure')}
              title="Measure Distance Ruler"
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
                activeTool === 'measure'
                  ? 'bg-cyan-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span className="hidden sm:inline">Ruler</span>
            </button>

            <button
              onClick={() => setActiveTool('pan')}
              title="Pan Map View (Hand)"
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
                activeTool === 'pan'
                  ? 'bg-zinc-200 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Move className="w-4 h-4" />
              <span className="hidden sm:inline">Pan</span>
            </button>
          </div>

          {/* Cartography Layer Selector & Zoom Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 bg-zinc-950/85 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-lg">
              <button
                onClick={() => setMapLayer('cyber')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  mapLayer === 'cyber' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-zinc-400'
                }`}
              >
                Cyber Lidar
              </button>
              <button
                onClick={() => setMapLayer('satellite')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  mapLayer === 'satellite' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapLayer('topo-vector')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  mapLayer === 'topo-vector' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-zinc-400'
                }`}
              >
                Vector Topo
              </button>
              <button
                onClick={() => setMapLayer('thermal')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  mapLayer === 'thermal' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-zinc-400'
                }`}
              >
                Thermal
              </button>
              <button
                onClick={() => setMapLayer('golden')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  mapLayer === 'golden' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400'
                }`}
              >
                Golden
              </button>
            </div>

            <div className="flex items-center gap-1 bg-zinc-950/85 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-lg">
              <button
                onClick={() => handleZoom(0.2)}
                title="Zoom In"
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-zinc-400 px-1">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => handleZoom(-0.2)}
                title="Zoom Out"
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                title="Reset View"
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Notice Overlay */}
        {actionNotice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-zinc-950 font-bold px-4 py-1.5 rounded-full text-xs font-mono shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Geofence Alert Overlay */}
        {violations.length > 0 && (
          <div className="absolute top-16 right-4 z-30 bg-rose-500/90 text-white font-mono text-xs px-3 py-1.5 rounded-xl shadow-lg border border-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
            <span>AIRSPACE WARNING: Waypoint inside restricted zone!</span>
          </div>
        )}

        {/* Canvas Element */}
        <canvas
          ref={canvasRef}
          width={900}
          height={480}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onMouseLeave={() => {
            setHoveredCoords(null);
            handleMouseUp();
          }}
          className={`w-full h-[380px] sm:h-[480px] block select-none ${
            activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
          }`}
        />

        {/* Map Overlay Bottom Telemetry Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px] font-mono">
          <div className="bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-300 flex items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>{validWaypoints.length} WAYPOINTS</span>
            </div>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              DIST: <strong className="text-zinc-100">{metrics.totalDistanceMeters} m</strong>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              EST. FLIGHT: <strong className="text-zinc-100">{Math.floor(metrics.totalDurationSeconds / 60)}m {metrics.totalDurationSeconds % 60}s</strong>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              CRUISE SPEED: <strong className="text-amber-400">{metrics.avgSpeedKmh} km/h</strong>
            </span>
          </div>

          <div className="bg-zinc-950/90 backdrop-blur-md px-2 py-1 rounded-xl border border-zinc-800 text-zinc-400 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowFovCones(!showFovCones)}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                showFovCones ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-500'
              }`}
            >
              FOV
            </button>
            <button
              onClick={() => setShowAltitudeTags(!showAltitudeTags)}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                showAltitudeTags ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-500'
              }`}
            >
              TAGS
            </button>
            <button
              onClick={() => setShowSafeFrames(!showSafeFrames)}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                showSafeFrames ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-500'
              }`}
            >
              FRAME
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 rounded text-amber-400 hover:bg-zinc-800"
              title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Synchronized Terrain Elevation Cross-Section Chart */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
            <Mountain className="w-4 h-4 text-cyan-400" />
            <span>TERRAIN CLEARANCE & FLIGHT ALTITUDE PROFILE (AGL)</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400 inline-block"></span> Drone Altitude
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span> Ground Relief
            </span>
            <span className="text-zinc-500">
              Min Clearance: <strong className="text-emerald-400">45m</strong>
            </span>
          </div>
        </div>

        {/* SVG Elevation Profile Curve */}
        <div className="relative h-24 bg-zinc-950/80 rounded-xl border border-zinc-800/80 overflow-hidden px-2 pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="flightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="terrainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Terrain Profile Line */}
            {validWaypoints.length >= 2 && (
              <>
                <path
                  d={validWaypoints.reduce((acc, wp, i) => {
                    if (!wp) return acc;
                    const x = (i / Math.max(1, validWaypoints.length - 1)) * 800;
                    const terrH = getSimulatedTerrainElevation(
                      wp.x ?? 50,
                      wp.y ?? 50,
                      selectedPreset?.terrainType || 'metropolis'
                    );
                    const y = 70 - Math.min((terrH / 3000) * 55, 60);
                    return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '') + ' L 800 80 L 0 80 Z'}
                  fill="url(#terrainGrad)"
                />
                <path
                  d={validWaypoints.reduce((acc, wp, i) => {
                    if (!wp) return acc;
                    const x = (i / Math.max(1, validWaypoints.length - 1)) * 800;
                    const terrH = getSimulatedTerrainElevation(
                      wp.x ?? 50,
                      wp.y ?? 50,
                      selectedPreset?.terrainType || 'metropolis'
                    );
                    const y = 70 - Math.min((terrH / 3000) * 55, 60);
                    return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                />
              </>
            )}

            {/* Flight Altitude Profile Line */}
            {validWaypoints.length >= 2 && (
              <>
                <path
                  d={validWaypoints.reduce((acc, wp, i) => {
                    if (!wp) return acc;
                    const x = (i / Math.max(1, validWaypoints.length - 1)) * 800;
                    const y = 60 - Math.min(((wp.altitude ?? 150) / 3000) * 50, 50);
                    return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '') + ' L 800 80 L 0 80 Z'}
                  fill="url(#flightGrad)"
                />
                <path
                  d={validWaypoints.reduce((acc, wp, i) => {
                    if (!wp) return acc;
                    const x = (i / Math.max(1, validWaypoints.length - 1)) * 800;
                    const y = 60 - Math.min(((wp.altitude ?? 150) / 3000) * 50, 50);
                    return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />

                {/* Waypoint nodes on profile */}
                {validWaypoints.map((wp, i) => {
                  if (!wp) return null;
                  const x = (i / Math.max(1, validWaypoints.length - 1)) * 800;
                  const y = 60 - Math.min(((wp.altitude ?? 150) / 3000) * 50, 50);
                  const isSelected = i === selectedWpIdx;
                  return (
                    <g key={wp.id} onClick={() => setSelectedWpIdx(i)} className="cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 6 : 4}
                        fill={isSelected ? '#fbbf24' : '#090d16'}
                        stroke={isSelected ? '#ffffff' : '#f59e0b'}
                        strokeWidth={isSelected ? 2 : 1.5}
                      />
                      <text
                        x={x}
                        y={y - 8}
                        fontSize="9"
                        fontFamily="monospace"
                        fill={isSelected ? '#fbbf24' : '#94a3b8'}
                        textAnchor="middle"
                      >
                        {wp.altitude ?? 150}m
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Bottom Mission Deck: Inspector, Patterns, Timeline & POIs */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('node')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors ${
              activeTab === 'node'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Active Node [WP-{selectedWpIdx + 1}]</span>
          </button>

          <button
            onClick={() => setActiveTab('patterns')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors ${
              activeTab === 'patterns'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Pattern Generators</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors ${
              activeTab === 'timeline'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mission Timeline ({validWaypoints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pois')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors ${
              activeTab === 'pois'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>POIs & Geofences</span>
          </button>
        </div>

        {/* Tab 1: Node Parameter Inspector */}
        {activeTab === 'node' && activeWp && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-black font-mono text-xs">
                  {activeWp.name || `WP-${selectedWpIdx + 1}`}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  Position: X {activeWp.x ?? 0}% | Y {activeWp.y ?? 0}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={duplicateActiveWaypoint}
                  title="Duplicate Waypoint"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={reverseFlightPath}
                  title="Reverse Entire Path"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reverse Path</span>
                </button>
                {validWaypoints.length > 2 && (
                  <button
                    onClick={removeActiveWaypoint}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete WP</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Altitude Slider */}
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Mountain className="w-3.5 h-3.5 text-cyan-400" /> Altitude AGL
                  </span>
                  <span className="text-cyan-300 font-bold">{activeWp.altitude ?? 150} m</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="3500"
                  step="10"
                  value={activeWp.altitude ?? 150}
                  onChange={(e) => updateActiveWaypoint('altitude', Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex gap-1 pt-1">
                  {[45, 150, 450, 1200].map((alt) => (
                    <button
                      key={alt}
                      onClick={() => updateActiveWaypoint('altitude', alt)}
                      className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[9px] font-mono text-zinc-400 hover:text-cyan-300"
                    >
                      {alt}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Velocity Slider */}
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" /> Velocity
                  </span>
                  <span className="text-amber-300 font-bold">{activeWp.speed ?? 100} km/h</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="320"
                  step="5"
                  value={activeWp.speed ?? 100}
                  onChange={(e) => updateActiveWaypoint('speed', Number(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex gap-1 pt-1">
                  {[40, 80, 140, 220].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => updateActiveWaypoint('speed', spd)}
                      className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[9px] font-mono text-zinc-400 hover:text-amber-300"
                    >
                      {spd}km/h
                    </button>
                  ))}
                </div>
              </div>

              {/* Heading / Yaw */}
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Camera Heading
                  </span>
                  <span className="text-emerald-300 font-bold">{activeWp.heading ?? 45}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={activeWp.heading ?? 45}
                  onChange={(e) => updateActiveWaypoint('heading', Number(e.target.value))}
                  className="w-full accent-emerald-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 pt-1">
                  <span>0° N</span>
                  <span>90° E</span>
                  <span>180° S</span>
                  <span>270° W</span>
                </div>
              </div>

              {/* Gimbal Pitch Slider */}
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" /> Gimbal Pitch
                  </span>
                  <span className="text-indigo-300 font-bold">{activeWp.gimbalPitch ?? -20}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="20"
                  step="5"
                  value={activeWp.gimbalPitch ?? -20}
                  onChange={(e) => updateActiveWaypoint('gimbalPitch', Number(e.target.value))}
                  className="w-full accent-indigo-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex gap-1 pt-1">
                  {[-90, -45, -20, 0].map((pitch) => (
                    <button
                      key={pitch}
                      onClick={() => updateActiveWaypoint('gimbalPitch', pitch)}
                      className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[9px] font-mono text-zinc-400 hover:text-indigo-300"
                    >
                      {pitch === -90 ? 'Nadir' : `${pitch}°`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action, POI Lock & Camera Roll */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
                <label className="text-xs font-mono text-zinc-400 block">Flight Choreography Action</label>
                <select
                  value={activeWp.action || 'fly-through'}
                  onChange={(e) => updateActiveWaypoint('action', e.target.value as WaypointAction)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200"
                >
                  <option value="fly-through">Fly-Through (Smooth Spline)</option>
                  <option value="hover-photo">Hover & Capture (Still Horizon)</option>
                  <option value="orbit-focus">Orbit Focus (Track POI)</option>
                  <option value="nadir-scan">Nadir Scan (Straight Down 90°)</option>
                  <option value="spiral-climb">Spiral Climb (Ascending Vortex)</option>
                  <option value="hyperlapse-burst">Hyperlapse Burst (Motion Blur)</option>
                </select>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
                <label className="text-xs font-mono text-zinc-400 block">Camera Lock to POI</label>
                <select
                  value={activeWp.poiId || ''}
                  onChange={(e) => updateActiveWaypoint('poiId', e.target.value || null)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200"
                >
                  <option value="">None (Manual Heading)</option>
                  {(pois || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">FPV Camera Banking Roll</span>
                  <span className="text-amber-300 font-bold">{activeWp.cameraRoll ?? 0}°</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="2"
                  value={activeWp.cameraRoll ?? 0}
                  onChange={(e) => updateActiveWaypoint('cameraRoll', Number(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                  <span>-30° Left Bank</span>
                  <span>0° Flat</span>
                  <span>+30° Right Bank</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pattern Generators */}
        {activeTab === 'patterns' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-amber-400">
                <RefreshCw className="w-4 h-4" />
                <span>360° Focal Orbit</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Generates a continuous circular yaw trajectory orbiting the active target point with camera locked to center.
              </p>
              <button
                onClick={handleApplyOrbit}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Generate Orbit Pattern
              </button>
            </div>

            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-400">
                <Grid className="w-4 h-4" />
                <span>Photogrammetry Survey Grid</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Lawn-mower serpentine orthomosaic grid with nadir 90° downward gimbal pitch for 3D terrain scanning.
              </p>
              <button
                onClick={handleApplySurvey}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Generate Survey Grid
              </button>
            </div>

            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-emerald-400">
                <Mountain className="w-4 h-4" />
                <span>Golden Spiral Ascent</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Ascending logarithmic spiral vortex expanding outward from tree-level up to summit panorama.
              </p>
              <button
                onClick={handleApplySpiral}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Generate Spiral Ascent
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Mission Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-2">
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {validWaypoints.map((wp, idx) => {
                const isSelected = idx === selectedWpIdx;
                return (
                  <div
                    key={wp.id}
                    onClick={() => setSelectedWpIdx(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 text-amber-200'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-zinc-800 font-mono text-xs font-bold flex items-center justify-center text-zinc-200">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-zinc-100">{wp.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          {wp.action ? wp.action.toUpperCase() : 'TRANSIT'} | Heading: {wp.heading ?? 0}° | Pitch: {wp.gimbalPitch ?? -20}°
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-cyan-400">{wp.altitude ?? 150} m</span>
                      <span className="text-amber-400">{wp.speed ?? 100} km/h</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: POIs & Geofences */}
        {activeTab === 'pois' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-300">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <Target className="w-4 h-4" /> Points of Interest ({(pois || []).length})
                </span>
                <button
                  onClick={() => setActiveTool('add-poi')}
                  className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] cursor-pointer"
                >
                  + Click Map to Add
                </button>
              </div>

              <div className="space-y-1.5">
                {(pois || []).map((poi) => (
                  <div
                    key={poi.id}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-zinc-200">{poi.name}</span>
                    <span className="text-sky-400">{poi.altitude}m Elev</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-300">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <ShieldAlert className="w-4 h-4" /> Safety Geofences ({(geofences || []).length})
                </span>
                <button
                  onClick={() => setActiveTool('add-geofence')}
                  className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] cursor-pointer"
                >
                  + Click Map to Add
                </button>
              </div>

              <div className="space-y-1.5">
                {(geofences || []).map((geo) => (
                  <div
                    key={geo.id}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-zinc-200">{geo.name}</span>
                    <span className="text-rose-400">&lt; {geo.maxAltitude}m Buffer</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
