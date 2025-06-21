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

// Generate waypoints for a route
export const generateWaypoints = (
  start: [number, number],
  end: [number, number]
): [number, number][] => {
  const waypoints: [number, number][] = [start];
  
  // Create 3 intermediate points for a smooth curve
  for (let i = 1; i <= 3; i++) {
    const ratio = i / 4;
    const lat = start[0] + (end[0] - start[0]) * ratio;
    const lng = start[1] + (end[1] - start[1]) * ratio;
    
    // Add slight curve for realism
    const curveOffset = Math.sin(ratio * Math.PI) * 0.002;
    waypoints.push([lat + curveOffset, lng + curveOffset]);
  }
  
  waypoints.push(end);
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

  const waypoints = generateWaypoints(startLocation, hospital.coordinates);
  const distance = calculateDistance(startLocation, hospital.coordinates);
  const duration = calculateDuration(startLocation, hospital.coordinates);

  const route: Route = {
    id: `route-${Date.now()}`,
    startLocation,
    endLocation: hospital.coordinates,
    waypoints,
    distance,
    duration,
  };

  console.log(`🗺️ Route created: ${distance.toFixed(1)}km, ${Math.ceil(duration)} minutes`);
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