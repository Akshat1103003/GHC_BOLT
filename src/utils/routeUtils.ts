import { Hospital, Route } from '../types';

// Calculate distance between two points using Haversine formula
export const calculateDistance = (
  point1: [number, number],
  point2: [number, number]
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2[0] - point1[0]) * Math.PI / 180;
  const dLon = (point2[1] - point1[1]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate duration for emergency vehicles
export const calculateDuration = (
  point1: [number, number],
  point2: [number, number]
): number => {
  const distance = calculateDistance(point1, point2);
  const baseSpeed = 35; // km/h for emergency vehicles
  const cityTrafficPenalty = 1.4; // 40% slower due to traffic
  
  return (distance / baseSpeed) * 60 * cityTrafficPenalty; // Convert to minutes
};

// Generate realistic waypoints for a route
export const generateWaypoints = (
  start: [number, number],
  end: [number, number]
): [number, number][] => {
  const waypoints: [number, number][] = [start];
  
  // Calculate the number of intermediate points based on distance
  const distance = calculateDistance(start, end);
  const numPoints = Math.max(3, Math.min(8, Math.floor(distance / 5))); // 1 point per 5km, min 3, max 8
  
  // Create intermediate points with realistic curves
  for (let i = 1; i <= numPoints; i++) {
    const ratio = i / (numPoints + 1);
    const lat = start[0] + (end[0] - start[0]) * ratio;
    const lng = start[1] + (end[1] - start[1]) * ratio;
    
    // Add realistic curve variations for road-like paths
    const curveOffset = Math.sin(ratio * Math.PI) * 0.003; // Larger curve for realism
    const perpendicularOffset = Math.cos(ratio * Math.PI * 2) * 0.001; // Add variation
    
    waypoints.push([
      lat + curveOffset, 
      lng + curveOffset + perpendicularOffset
    ]);
  }
  
  waypoints.push(end);
  
  console.log(`🗺️ Generated ${waypoints.length} waypoints for ${distance.toFixed(1)}km route`);
  return waypoints;
};

// Create a route between ambulance and hospital
export const createRoute = (
  startLocation: [number, number],
  hospital: Hospital
): Route => {
  if (!hospital || !hospital.coordinates) {
    throw new Error('Invalid hospital data provided');
  }

  console.log('🗺️ Creating route:', {
    from: startLocation,
    to: hospital.coordinates,
    hospital: hospital.name
  });

  const waypoints = generateWaypoints(startLocation, hospital.coordinates);
  const distance = calculateDistance(startLocation, hospital.coordinates);
  const duration = calculateDuration(startLocation, hospital.coordinates);

  const route: Route = {
    id: `route-${Date.now()}-${hospital.id}`,
    startLocation,
    endLocation: hospital.coordinates,
    waypoints,
    distance,
    duration,
  };

  console.log(`✅ Route created: ${distance.toFixed(1)}km, ${Math.ceil(duration)} minutes, ${waypoints.length} waypoints`);
  return route;
};

// Calculate total distance of a route with waypoints
export const calculateRouteDistance = (waypoints: [number, number][]): number => {
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistance(waypoints[i], waypoints[i + 1]);
  }
  return totalDistance;
};

// Validate route data
export const validateRoute = (route: Route): boolean => {
  if (!route || !route.waypoints || route.waypoints.length < 2) {
    return false;
  }
  
  if (!route.startLocation || !route.endLocation) {
    return false;
  }
  
  if (route.distance <= 0 || route.duration <= 0) {
    return false;
  }
  
  return true;
};