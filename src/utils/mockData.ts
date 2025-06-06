import { Hospital, TrafficSignal, EmergencyStatus, Route } from '../types';

export const mockHospitals: Hospital[] = [
  {
    id: 'h1',
    name: 'City General Hospital',
    address: '123 Main St, City Center',
    coordinates: [40.7589, -73.9851], // Fixed position - Upper East Side
    phone: '(555) 123-4567',
    specialties: ['Emergency', 'Trauma', 'Cardiology'],
    emergencyReady: true,
  },
  {
    id: 'h2',
    name: 'Memorial Medical Center',
    address: '456 Park Ave, Downtown',
    coordinates: [40.7282, -73.9942], // Fixed position - Midtown
    phone: '(555) 987-6543',
    specialties: ['Emergency', 'Neurology', 'Pediatrics'],
    emergencyReady: true,
  },
  {
    id: 'h3',
    name: 'University Hospital',
    address: '789 College Blvd, Uptown',
    coordinates: [40.7831, -73.9712], // Fixed position - Upper West Side
    phone: '(555) 246-8135',
    specialties: ['Emergency', 'Oncology', 'Surgery'],
    emergencyReady: false,
  },
  {
    id: 'h4',
    name: 'Riverside Health Center',
    address: '321 River Rd, Eastside',
    coordinates: [40.7505, -73.9934], // Fixed position - East Side
    phone: '(555) 369-7412',
    specialties: ['Emergency', 'Orthopedics', 'Geriatrics'],
    emergencyReady: true,
  },
];

export const mockTrafficSignals: TrafficSignal[] = [
  {
    id: 't1',
    coordinates: [40.7200, -74.0050], // Near starting point
    intersection: 'Main St & 1st Ave',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't2',
    coordinates: [40.7350, -73.9900], // Mid route
    intersection: 'Park Ave & 5th St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't3',
    coordinates: [40.7450, -73.9850], // Approaching hospital area
    intersection: 'Broadway & 10th St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't4',
    coordinates: [40.7520, -73.9880], // Near hospital
    intersection: 'Liberty Ave & Madison St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't5',
    coordinates: [40.7600, -73.9820], // Hospital vicinity
    intersection: 'Central Ave & Washington Blvd',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't6',
    coordinates: [40.7300, -73.9950], // Alternative route
    intersection: 'Queens Blvd & 3rd Ave',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't7',
    coordinates: [40.7400, -73.9750], // Cross street
    intersection: 'Lexington Ave & 42nd St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't8',
    coordinates: [40.7250, -73.9980], // Downtown area
    intersection: 'Houston St & Broadway',
    status: EmergencyStatus.INACTIVE,
  },
];

export const mockRoutes: Route[] = [
  {
    id: 'r1',
    startLocation: [40.7128, -74.0060], // Starting point (Lower Manhattan)
    endLocation: [40.7589, -73.9851], // City General Hospital
    waypoints: [
      [40.7128, -74.0060], // Start
      [40.7200, -74.0050], // Near t1
      [40.7350, -73.9900], // Near t2
      [40.7450, -73.9850], // Near t3
      [40.7520, -73.9880], // Near t4
      [40.7589, -73.9851], // Hospital
    ],
    distance: 8.2,
    duration: 12,
    trafficSignalsOnRoute: ['t1', 't2', 't3', 't4'],
  },
  {
    id: 'r2',
    startLocation: [40.7128, -74.0060],
    endLocation: [40.7282, -73.9942], // Memorial Medical Center
    waypoints: [
      [40.7128, -74.0060], // Start
      [40.7200, -74.0050], // Near t1
      [40.7250, -73.9980], // Near t8
      [40.7282, -73.9942], // Hospital
    ],
    distance: 4.5,
    duration: 8,
    trafficSignalsOnRoute: ['t1', 't8'],
  },
];

export const calculateRoute = (
  startLocation: [number, number],
  hospitalId: string
): Route => {
  const hospital = mockHospitals.find((h) => h.id === hospitalId);
  if (!hospital) {
    throw new Error('Hospital not found');
  }

  // Find existing route or create optimized route
  const existingRoute = mockRoutes.find(r => 
    Math.abs(r.endLocation[0] - hospital.coordinates[0]) < 0.001 &&
    Math.abs(r.endLocation[1] - hospital.coordinates[1]) < 0.001
  );

  if (existingRoute) {
    // Update start location to current ambulance position
    const updatedRoute = {
      ...existingRoute,
      startLocation,
      waypoints: [startLocation, ...existingRoute.waypoints.slice(1)]
    };
    return updatedRoute;
  }

  // Create optimized route with traffic signals along the path
  const routeWaypoints = generateOptimalWaypoints(startLocation, hospital.coordinates);
  const trafficSignalsOnRoute = findTrafficSignalsOnPath(routeWaypoints);

  const directRoute: Route = {
    id: `r-${Date.now()}`,
    startLocation,
    endLocation: hospital.coordinates,
    waypoints: routeWaypoints,
    distance: calculateTotalDistance(routeWaypoints),
    duration: calculateDuration(startLocation, hospital.coordinates),
    trafficSignalsOnRoute,
  };

  return directRoute;
};

// Generate optimal waypoints that pass near traffic signals
const generateOptimalWaypoints = (
  start: [number, number],
  end: [number, number]
): [number, number][] => {
  const waypoints: [number, number][] = [start];
  
  // Find intermediate points that pass near traffic signals
  const relevantSignals = mockTrafficSignals.filter(signal => {
    const distToStart = calculateDistance(start, signal.coordinates);
    const distToEnd = calculateDistance(end, signal.coordinates);
    const directDistance = calculateDistance(start, end);
    
    // Include signals that are roughly on the path
    return distToStart + distToEnd < directDistance * 1.3;
  });
  
  // Sort signals by distance from start
  relevantSignals.sort((a, b) => 
    calculateDistance(start, a.coordinates) - calculateDistance(start, b.coordinates)
  );
  
  // Add waypoints near traffic signals
  relevantSignals.forEach(signal => {
    // Add a point slightly offset from the signal to simulate passing by
    const offset = 0.001; // Small offset to simulate road position
    waypoints.push([
      signal.coordinates[0] + (Math.random() - 0.5) * offset,
      signal.coordinates[1] + (Math.random() - 0.5) * offset
    ]);
  });
  
  waypoints.push(end);
  return waypoints;
};

// Calculate total distance of route
const calculateTotalDistance = (waypoints: [number, number][]): number => {
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistance(waypoints[i], waypoints[i + 1]);
  }
  return totalDistance;
};

// Enhanced distance calculation using Haversine formula
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

// Enhanced duration calculation for emergency vehicles
export const calculateDuration = (
  point1: [number, number],
  point2: [number, number]
): number => {
  // Emergency vehicles average 50-60 km/h in city traffic with priority
  const distance = calculateDistance(point1, point2);
  return (distance / 55) * 60; // Convert to minutes
};

// Find traffic signals along the route path
export const findTrafficSignalsOnPath = (waypoints: [number, number][]): string[] => {
  const signalsOnRoute: string[] = [];
  
  mockTrafficSignals.forEach(signal => {
    // Check if signal is close to any segment of the route
    for (let i = 0; i < waypoints.length - 1; i++) {
      const segmentStart = waypoints[i];
      const segmentEnd = waypoints[i + 1];
      
      // Calculate distance from signal to line segment
      const distanceToSegment = distanceToLineSegment(
        signal.coordinates,
        segmentStart,
        segmentEnd
      );
      
      // If signal is within 0.5km of the route, include it
      if (distanceToSegment < 0.5) {
        signalsOnRoute.push(signal.id);
        break;
      }
    }
  });
  
  return signalsOnRoute;
};

// Calculate distance from point to line segment
const distanceToLineSegment = (
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number => {
  const A = point[0] - lineStart[0];
  const B = point[1] - lineStart[1];
  const C = lineEnd[0] - lineStart[0];
  const D = lineEnd[1] - lineStart[1];

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return calculateDistance(point, lineStart);
  }
  
  let param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart[0];
    yy = lineStart[1];
  } else if (param > 1) {
    xx = lineEnd[0];
    yy = lineEnd[1];
  } else {
    xx = lineStart[0] + param * C;
    yy = lineStart[1] + param * D;
  }
  
  return calculateDistance(point, [xx, yy]);
};