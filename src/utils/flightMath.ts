import { Waypoint, PointOfInterest, GeofenceZone } from '../types/aftermap';

// Standard map canvas is calibrated to 1000m x 1000m bounding box for urban/local flights,
// or scaled up for alpine/canyon flights.
export function calculateDistanceMeters(
  p1?: { x: number; y: number } | null,
  p2?: { x: number; y: number } | null,
  scaleMeters = 2000
): number {
  if (!p1 || !p2 || typeof p1.x !== 'number' || typeof p2.x !== 'number' || typeof p1.y !== 'number' || typeof p2.y !== 'number') {
    return 0;
  }
  const dx = ((p2.x - p1.x) / 100) * scaleMeters;
  const dy = ((p2.y - p1.y) / 100) * scaleMeters;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateTotalFlightMetrics(waypoints: Waypoint[] = [], scaleMeters = 2500) {
  const validWaypoints = (waypoints || []).filter(
    (w) => w && typeof w.x === 'number' && typeof w.y === 'number' && typeof w.altitude === 'number'
  );

  if (validWaypoints.length < 2) {
    return {
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      avgSpeedKmh: validWaypoints[0]?.speed || 0,
      maxAltitude: validWaypoints[0]?.altitude || 0,
      minAltitude: validWaypoints[0]?.altitude || 0,
      batteryConsumptionPct: 0,
    };
  }

  let totalDist = 0;
  let totalTimeSec = 0;
  let maxAlt = -Infinity;
  let minAlt = Infinity;
  let totalSpeed = 0;

  for (let i = 0; i < validWaypoints.length; i++) {
    const wp = validWaypoints[i];
    maxAlt = Math.max(maxAlt, wp.altitude ?? 0);
    minAlt = Math.min(minAlt, wp.altitude ?? 0);
    totalSpeed += wp.speed ?? 0;

    if (i < validWaypoints.length - 1) {
      const nextWp = validWaypoints[i + 1];
      const horizDist = calculateDistanceMeters(wp, nextWp, scaleMeters);
      const vertDist = Math.abs((nextWp.altitude ?? 0) - (wp.altitude ?? 0));
      const segmentDist3D = Math.sqrt(horizDist * horizDist + vertDist * vertDist);
      totalDist += segmentDist3D;

      const avgSegSpeedMs = ((((wp.speed ?? 80) + (nextWp.speed ?? 80)) / 2) * 1000) / 3600;
      const segTimeSec = avgSegSpeedMs > 0 ? segmentDist3D / avgSegSpeedMs : 0;
      const hoverSec = wp.hoverDuration || 0;
      totalTimeSec += segTimeSec + hoverSec;
    }
  }

  const avgSpeed = Math.round(totalSpeed / Math.max(1, validWaypoints.length));
  const climbWork = Math.max(0, maxAlt - minAlt) * 0.005;
  const timeWork = (totalTimeSec / 60) * 4.5;
  const batteryPct = Math.min(Math.round(timeWork + climbWork), 100);

  return {
    totalDistanceMeters: Math.round(totalDist),
    totalDurationSeconds: Math.round(totalTimeSec),
    avgSpeedKmh: avgSpeed,
    maxAltitude: maxAlt === -Infinity ? 0 : maxAlt,
    minAltitude: minAlt === Infinity ? 0 : minAlt,
    batteryConsumptionPct: Math.max(batteryPct, 4),
  };
}

// Generate simulated terrain height for coordinates (x: 0-100, y: 0-100)
export function getSimulatedTerrainElevation(
  x = 50,
  y = 50,
  terrainType = 'metropolis'
): number {
  const nx = (x ?? 50) / 100;
  const ny = (y ?? 50) / 100;

  switch (terrainType) {
    case 'alpine':
      return Math.round(
        600 +
          Math.sin(nx * 5) * 800 +
          Math.cos(ny * 6) * 750 +
          Math.sin(nx * 10 + ny * 10) * 400
      );
    case 'volcanic':
      const distFromCenter = Math.hypot(nx - 0.5, ny - 0.5);
      return Math.round(
        300 + Math.sin(distFromCenter * 8) * 400 + Math.cos(nx * 8) * 120
      );
    case 'canyon':
      const canyonValley = Math.abs(ny - (0.3 + 0.3 * Math.sin(nx * 4)));
      return Math.round(
        canyonValley < 0.15 ? 120 + canyonValley * 500 : 750 + Math.sin(nx * 6) * 150
      );
    case 'metropolis':
      const gridX = Math.floor((x ?? 50) / 10);
      const gridY = Math.floor((y ?? 50) / 10);
      const buildingHash = Math.sin(gridX * 12.9898 + gridY * 78.233) * 43758.5453;
      const bHeight = Math.abs(buildingHash - Math.floor(buildingHash));
      return Math.round(20 + bHeight * 380);
    case 'fjord':
      const cliffWall = Math.min(nx, 1 - nx);
      return Math.round(cliffWall < 0.2 ? 50 + cliffWall * 2500 : 850);
    default:
      return Math.round(100 + Math.sin(nx * 4) * 80 + Math.cos(ny * 4) * 60);
  }
}

// Check if any waypoint violates a geofence
export function checkGeofenceViolations(
  waypoints: Waypoint[] = [],
  geofences: GeofenceZone[] = []
): { waypointId: string; geofenceName: string }[] {
  const violations: { waypointId: string; geofenceName: string }[] = [];

  for (const wp of waypoints || []) {
    if (!wp || typeof wp.x !== 'number' || typeof wp.y !== 'number') continue;
    for (const geo of geofences || []) {
      if (!geo || typeof geo.x !== 'number' || typeof geo.y !== 'number') continue;
      const dist = Math.hypot(wp.x - geo.x, wp.y - geo.y);
      if (dist < (geo.radius ?? 10) && (wp.altitude ?? 0) <= (geo.maxAltitude ?? 300)) {
        violations.push({
          waypointId: wp.id,
          geofenceName: geo.name,
        });
      }
    }
  }

  return violations;
}

// Generate pattern presets
export function generateOrbitPattern(
  centerX = 50,
  centerY = 50,
  radiusPct = 20,
  altitude = 350,
  speed = 80,
  poiId?: string
): Waypoint[] {
  const points: Waypoint[] = [];
  const nodeCount = 8;
  const cx = centerX ?? 50;
  const cy = centerY ?? 50;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * 2 * Math.PI;
    const x = Math.round(Math.min(Math.max(cx + Math.cos(angle) * radiusPct, 5), 95));
    const y = Math.round(Math.min(Math.max(cy + Math.sin(angle) * radiusPct, 5), 95));
    const headingToCenter = Math.round(((angle + Math.PI) * (180 / Math.PI) + 360) % 360);

    points.push({
      id: `wp-orbit-${i + 1}`,
      name: `ORB-${i + 1}`,
      x,
      y,
      altitude: altitude ?? 350,
      speed: speed ?? 80,
      heading: headingToCenter,
      gimbalPitch: -25,
      cameraRoll: -5,
      action: 'orbit-focus',
      poiId: poiId || null,
    });
  }

  return points;
}

export function generateSurveyGridPattern(
  bounds = { minX: 18, maxX: 82, minY: 18, maxY: 82 },
  rows = 4,
  altitude = 120,
  speed = 60
): Waypoint[] {
  const points: Waypoint[] = [];
  const stepY = (bounds.maxY - bounds.minY) / Math.max(1, rows - 1);
  let idCounter = 1;

  for (let r = 0; r < rows; r++) {
    const currentY = bounds.minY + r * stepY;
    const isEven = r % 2 === 0;
    const startX = isEven ? bounds.minX : bounds.maxX;
    const endX = isEven ? bounds.maxX : bounds.minX;

    points.push({
      id: `wp-survey-${idCounter++}`,
      name: `SRV-${idCounter - 1}`,
      x: Math.round(startX),
      y: Math.round(currentY),
      altitude: altitude ?? 120,
      speed: speed ?? 60,
      heading: isEven ? 90 : 270,
      gimbalPitch: -90,
      cameraRoll: 0,
      action: 'nadir-scan',
    });

    points.push({
      id: `wp-survey-${idCounter++}`,
      name: `SRV-${idCounter - 1}`,
      x: Math.round(endX),
      y: Math.round(currentY),
      altitude: altitude ?? 120,
      speed: speed ?? 60,
      heading: isEven ? 90 : 270,
      gimbalPitch: -90,
      cameraRoll: 0,
      action: 'nadir-scan',
    });
  }

  return points;
}

export function generateSpiralAscentPattern(
  centerX = 50,
  centerY = 50,
  minAlt = 60,
  maxAlt = 900
): Waypoint[] {
  const points: Waypoint[] = [];
  const nodeCount = 9;
  const cx = centerX ?? 50;
  const cy = centerY ?? 50;

  for (let i = 0; i < nodeCount; i++) {
    const t = i / Math.max(1, nodeCount - 1);
    const radius = 8 + t * 30;
    const angle = t * 3.5 * Math.PI;
    const x = Math.round(Math.min(Math.max(cx + Math.cos(angle) * radius, 5), 95));
    const y = Math.round(Math.min(Math.max(cy + Math.sin(angle) * radius, 5), 95));
    const alt = Math.round(minAlt + t * (maxAlt - minAlt));
    const speed = Math.round(60 + t * 60);
    const heading = Math.round(((angle + Math.PI / 2) * (180 / Math.PI)) % 360);

    points.push({
      id: `wp-spiral-${i + 1}`,
      name: `SP-${i + 1}`,
      x,
      y,
      altitude: alt,
      speed,
      heading,
      gimbalPitch: Math.round(-60 + t * 45),
      cameraRoll: 12,
      action: 'spiral-climb',
    });
  }

  return points;
}
