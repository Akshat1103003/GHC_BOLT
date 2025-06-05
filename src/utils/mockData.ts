import { Hospital, TrafficSignal, EmergencyStatus, Route } from '../types';

export const mockHospitals: Hospital[] = [
  {
    id: 'h1',
    name: 'City General Hospital',
    address: '123 Main St, City Center',
    coordinates: [40.7128, -74.0060],
    phone: '(555) 123-4567',
    specialties: ['Emergency', 'Trauma', 'Cardiology'],
    emergencyReady: true,
  },
  {
    id: 'h2',
    name: 'Memorial Medical Center',
    address: '456 Park Ave, Downtown',
    coordinates: [40.7282, -73.9942],
    phone: '(555) 987-6543',
    specialties: ['Emergency', 'Neurology', 'Pediatrics'],
    emergencyReady: true,
  },
  {
    id: 'h3',
    name: 'University Hospital',
    address: '789 College Blvd, Uptown',
    coordinates: [40.7369, -74.0323],
    phone: '(555) 246-8135',
    specialties: ['Emergency', 'Oncology', 'Surgery'],
    emergencyReady: false,
  },
  {
    id: 'h4',
    name: 'Riverside Health Center',
    address: '321 River Rd, Eastside',
    coordinates: [40.7589, -73.9851],
    phone: '(555) 369-7412',
    specialties: ['Emergency', 'Orthopedics', 'Geriatrics'],
    emergencyReady: true,
  },
];

export const mockTrafficSignals: TrafficSignal[] = [
  {
    id: 't1',
    coordinates: [40.7198, -74.0100],
    intersection: 'Main St & 1st Ave',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't2',
    coordinates: [40.7220, -74.0050],
    intersection: 'Park Ave & 5th St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't3',
    coordinates: [40.7300, -74.0020],
    intersection: 'Broadway & 10th St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't4',
    coordinates: [40.7340, -73.9980],
    intersection: 'Liberty Ave & Madison St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't5',
    coordinates: [40.7400, -73.9940],
    intersection: 'Central Ave & Washington Blvd',
    status: EmergencyStatus.INACTIVE,
  },
];

export const mockRoutes: Route[] = [
  {
    id: 'r1',
    startLocation: [40.7198, -74.0100],
    endLocation: [40.7128, -74.0060],
    waypoints: [
      [40.7198, -74.0100],
      [40.7220, -74.0050],
      [40.7300, -74.0020],
      [40.7128, -74.0060],
    ],
    distance: 3.2,
    duration: 8,
    trafficSignalsOnRoute: ['t1', 't2', 't3'],
  },
  {
    id: 'r2',
    startLocation: [40.7198, -74.0100],
    endLocation: [40.7282, -73.9942],
    waypoints: [
      [40.7198, -74.0100],
      [40.7340, -73.9980],
      [40.7400, -73.9940],
      [40.7282, -73.9942],
    ],
    distance: 4.5,
    duration: 12,
    trafficSignalsOnRoute: ['t1', 't4', 't5'],
  },
];

export const calculateRoute = (
  startLocation: [number, number],
  hospitalId: string
): Route => {
  // In a real app, this would call a routing API
  const hospital = mockHospitals.find((h) => h.id === hospitalId);
  if (!hospital) {
    throw new Error('Hospital not found');
  }

  // Find a pre-defined route or create a simple direct route
  const existingRoute = mockRoutes.find(
    (r) => 
      r.startLocation[0] === startLocation[0] && 
      r.startLocation[1] === startLocation[1] && 
      r.endLocation[0] === hospital.coordinates[0] && 
      r.endLocation[1] === hospital.coordinates[1]
  );

  if (existingRoute) {
    return existingRoute;
  }

  // Create a simple direct route
  const directRoute: Route = {
    id: `r-${Date.now()}`,
    startLocation,
    endLocation: hospital.coordinates,
    waypoints: [startLocation, hospital.coordinates],
    distance: calculateDistance(startLocation, hospital.coordinates),
    duration: calculateDuration(startLocation, hospital.coordinates),
    trafficSignalsOnRoute: findTrafficSignalsOnPath(startLocation, hospital.coordinates),
  };

  return directRoute;
};

// Simple distance calculation (in km)
export const calculateDistance = (
  point1: [number, number],
  point2: [number, number]
): number => {
  // This is a simplified version - in reality, you'd use the Haversine formula
  const latDiff = Math.abs(point1[0] - point2[0]);
  const lngDiff = Math.abs(point1[1] - point2[1]);
  // Very rough approximation: 1 degree = ~111 km
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
};

// Simple duration calculation (in minutes)
export const calculateDuration = (
  point1: [number, number],
  point2: [number, number]
): number => {
  // Assuming average speed of 40 km/h for an ambulance
  const distance = calculateDistance(point1, point2);
  return (distance / 40) * 60; // Convert to minutes
};

// Find traffic signals that are close to the direct path
export const findTrafficSignalsOnPath = (
  start: [number, number],
  end: [number, number]
): string[] => {
  return mockTrafficSignals
    .filter((signal) => {
      // Check if signal is close to the path (simplified)
      const distToStart = calculateDistance(start, signal.coordinates);
      const distToEnd = calculateDistance(end, signal.coordinates);
      const pathLength = calculateDistance(start, end);
      
      // If signal is roughly along the path
      return distToStart + distToEnd < pathLength * 1.2;
    })
    .map((signal) => signal.id);
};