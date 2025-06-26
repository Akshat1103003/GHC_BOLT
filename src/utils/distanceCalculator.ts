// Enhanced distance calculation utilities with multiple calculation methods
import { Hospital } from '../types';

// Haversine formula for accurate distance calculation
export const calculateHaversineDistance = (
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

// Manhattan distance (city block distance) for urban areas
export const calculateManhattanDistance = (
  point1: [number, number],
  point2: [number, number]
): number => {
  const R = 6371; // Earth's radius in kilometers
  const latDiff = Math.abs(point2[0] - point1[0]) * Math.PI / 180 * R;
  const lonDiff = Math.abs(point2[1] - point1[1]) * Math.PI / 180 * R * Math.cos(point1[0] * Math.PI / 180);
  return latDiff + lonDiff;
};

// Enhanced duration calculation with traffic considerations
export const calculateEmergencyDuration = (
  point1: [number, number],
  point2: [number, number],
  emergencyMode: boolean = false
): number => {
  const distance = calculateHaversineDistance(point1, point2);
  
  // Emergency vehicle speeds (km/h)
  const baseSpeed = emergencyMode ? 45 : 35; // Higher speed in emergency mode
  const cityTrafficPenalty = emergencyMode ? 1.2 : 1.4; // Less traffic delay in emergency
  const timeOfDayFactor = getTimeOfDayFactor();
  
  // Calculate duration in minutes
  const duration = (distance / baseSpeed) * 60 * cityTrafficPenalty * timeOfDayFactor;
  
  return Math.max(1, duration); // Minimum 1 minute
};

// Get time of day factor for traffic estimation
const getTimeOfDayFactor = (): number => {
  const hour = new Date().getHours();
  
  // Rush hour penalties
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return 1.5; // 50% longer during rush hour
  } else if (hour >= 22 || hour <= 6) {
    return 0.8; // 20% faster during night
  } else {
    return 1.0; // Normal traffic
  }
};

// Calculate bearing (direction) between two points
export const calculateBearing = (
  point1: [number, number],
  point2: [number, number]
): number => {
  const dLon = (point2[1] - point1[1]) * Math.PI / 180;
  const lat1 = point1[0] * Math.PI / 180;
  const lat2 = point2[0] * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360 degrees
};

// Get cardinal direction from bearing
export const getCardinalDirection = (bearing: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
};

// Enhanced hospital distance calculation with multiple metrics
export interface HospitalDistance {
  hospital: Hospital;
  straightLineDistance: number;
  estimatedRoadDistance: number;
  duration: number;
  emergencyDuration: number;
  bearing: number;
  direction: string;
  priority: 'high' | 'medium' | 'low';
  travelTime: {
    normal: string;
    emergency: string;
  };
  distanceFormatted: {
    km: string;
    miles: string;
  };
}

// Calculate comprehensive distance data for a hospital
export const calculateHospitalDistance = (
  patientLocation: [number, number],
  hospital: Hospital,
  emergencyMode: boolean = false
): HospitalDistance => {
  const straightLineDistance = calculateHaversineDistance(patientLocation, hospital.coordinates);
  const estimatedRoadDistance = straightLineDistance * 1.3; // Road distance is typically 30% longer
  const duration = calculateEmergencyDuration(patientLocation, hospital.coordinates, false);
  const emergencyDuration = calculateEmergencyDuration(patientLocation, hospital.coordinates, true);
  const bearing = calculateBearing(patientLocation, hospital.coordinates);
  const direction = getCardinalDirection(bearing);
  
  // Determine priority based on distance and hospital readiness
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (straightLineDistance <= 5 && hospital.emergencyReady) {
    priority = 'high';
  } else if (straightLineDistance <= 15 && hospital.emergencyReady) {
    priority = 'medium';
  } else {
    priority = 'low';
  }
  
  return {
    hospital,
    straightLineDistance,
    estimatedRoadDistance,
    duration,
    emergencyDuration,
    bearing,
    direction,
    priority,
    travelTime: {
      normal: formatDuration(duration),
      emergency: formatDuration(emergencyDuration)
    },
    distanceFormatted: {
      km: `${straightLineDistance.toFixed(1)} km`,
      miles: `${(straightLineDistance * 0.621371).toFixed(1)} mi`
    }
  };
};

// Calculate distances for multiple hospitals and sort by priority
export const calculateAllHospitalDistances = (
  patientLocation: [number, number],
  hospitals: Hospital[],
  emergencyMode: boolean = false
): HospitalDistance[] => {
  const distances = hospitals.map(hospital => 
    calculateHospitalDistance(patientLocation, hospital, emergencyMode)
  );
  
  // Sort by priority (high first), then by distance
  return distances.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.straightLineDistance - b.straightLineDistance;
  });
};

// Format duration in a human-readable way
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.ceil(minutes)} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.ceil(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }
};

// Format distance with appropriate units
export const formatDistance = (km: number, unit: 'km' | 'mi' | 'auto' = 'auto'): string => {
  if (unit === 'mi') {
    return `${(km * 0.621371).toFixed(1)} mi`;
  } else if (unit === 'km') {
    return `${km.toFixed(1)} km`;
  } else {
    // Auto-select based on distance
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    } else {
      return `${km.toFixed(1)} km`;
    }
  }
};

// Get distance category for visual indicators
export const getDistanceCategory = (km: number): 'very-close' | 'close' | 'medium' | 'far' | 'very-far' => {
  if (km <= 2) return 'very-close';
  if (km <= 5) return 'close';
  if (km <= 15) return 'medium';
  if (km <= 50) return 'far';
  return 'very-far';
};

// Calculate ETA (Estimated Time of Arrival)
export const calculateETA = (durationMinutes: number): string => {
  const now = new Date();
  const eta = new Date(now.getTime() + durationMinutes * 60000);
  return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Real-time distance tracking for moving ambulance
export class DistanceTracker {
  private lastLocation: [number, number] | null = null;
  private totalDistance: number = 0;
  private startTime: Date | null = null;
  
  start(initialLocation: [number, number]) {
    this.lastLocation = initialLocation;
    this.totalDistance = 0;
    this.startTime = new Date();
  }
  
  update(currentLocation: [number, number]): { distanceTraveled: number; totalDistance: number; averageSpeed: number } {
    if (!this.lastLocation || !this.startTime) {
      this.start(currentLocation);
      return { distanceTraveled: 0, totalDistance: 0, averageSpeed: 0 };
    }
    
    const distanceTraveled = calculateHaversineDistance(this.lastLocation, currentLocation);
    this.totalDistance += distanceTraveled;
    this.lastLocation = currentLocation;
    
    const elapsedHours = (new Date().getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
    const averageSpeed = elapsedHours > 0 ? this.totalDistance / elapsedHours : 0;
    
    return {
      distanceTraveled,
      totalDistance: this.totalDistance,
      averageSpeed
    };
  }
  
  reset() {
    this.lastLocation = null;
    this.totalDistance = 0;
    this.startTime = null;
  }
}