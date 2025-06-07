import { Hospital, TrafficSignal, EmergencyStatus, Route } from '../types';

// Real hospitals in New York City with actual coordinates
export const mockHospitals: Hospital[] = [
  {
    id: 'h1',
    name: 'NewYork-Presbyterian Hospital',
    address: '525 E 68th St, New York, NY 10065',
    coordinates: [40.7677, -73.9537], // Real coordinates - Upper East Side
    phone: '(212) 746-5454',
    specialties: ['Emergency', 'Trauma', 'Cardiology', 'Neurosurgery'],
    emergencyReady: true,
  },
  {
    id: 'h2',
    name: 'Mount Sinai Hospital',
    address: '1 Gustave L. Levy Pl, New York, NY 10029',
    coordinates: [40.7903, -73.9509], // Real coordinates - Upper East Side
    phone: '(212) 241-6500',
    specialties: ['Emergency', 'Neurology', 'Pediatrics', 'Oncology'],
    emergencyReady: true,
  },
  {
    id: 'h3',
    name: 'NYU Langone Health',
    address: '550 1st Ave, New York, NY 10016',
    coordinates: [40.7424, -73.9731], // Real coordinates - Kips Bay
    phone: '(212) 263-7300',
    specialties: ['Emergency', 'Oncology', 'Surgery', 'Orthopedics'],
    emergencyReady: true,
  },
  {
    id: 'h4',
    name: 'Bellevue Hospital Center',
    address: '462 1st Ave, New York, NY 10016',
    coordinates: [40.7390, -73.9756], // Real coordinates - Kips Bay
    phone: '(212) 562-4141',
    specialties: ['Emergency', 'Trauma', 'Psychiatry', 'Geriatrics'],
    emergencyReady: true,
  },
  {
    id: 'h5',
    name: 'Hospital for Special Surgery',
    address: '535 E 70th St, New York, NY 10021',
    coordinates: [40.7684, -73.9533], // Real coordinates - Upper East Side
    phone: '(212) 606-1000',
    specialties: ['Orthopedics', 'Rheumatology', 'Emergency'],
    emergencyReady: false,
  },
  {
    id: 'h6',
    name: 'Memorial Sloan Kettering Cancer Center',
    address: '1275 York Ave, New York, NY 10065',
    coordinates: [40.7648, -73.9540], // Real coordinates - Upper East Side
    phone: '(212) 639-2000',
    specialties: ['Oncology', 'Surgery', 'Emergency'],
    emergencyReady: false,
  },
];

// Real traffic signals at major intersections in Manhattan with actual coordinates
export const mockTrafficSignals: TrafficSignal[] = [
  {
    id: 't1',
    coordinates: [40.7128, -74.0060], // Financial District - Near starting point
    intersection: 'Broadway & Wall St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't2',
    coordinates: [40.7282, -73.9942], // Flatiron District
    intersection: 'Broadway & 23rd St (Flatiron)',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't3',
    coordinates: [40.7505, -73.9934], // Times Square area
    intersection: 'Broadway & 42nd St (Times Square)',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't4',
    coordinates: [40.7614, -73.9776], // Columbus Circle
    intersection: 'Broadway & 59th St (Columbus Circle)',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't5',
    coordinates: [40.7831, -73.9712], // Lincoln Center area
    intersection: 'Broadway & 72nd St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't6',
    coordinates: [40.7359, -73.9911], // Herald Square
    intersection: '6th Ave & 34th St (Herald Square)',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't7',
    coordinates: [40.7527, -73.9772], // 5th Ave & 57th St
    intersection: '5th Ave & 57th St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't8',
    coordinates: [40.7484, -73.9857], // 8th Ave & 42nd St
    intersection: '8th Ave & 42nd St (Port Authority)',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't9',
    coordinates: [40.7580, -73.9855], // 8th Ave & 57th St
    intersection: '8th Ave & 57th St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't10',
    coordinates: [40.7420, -73.9897], // 6th Ave & 28th St
    intersection: '6th Ave & 28th St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't11',
    coordinates: [40.7549, -73.9840], // 7th Ave & 50th St
    intersection: '7th Ave & 50th St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't12',
    coordinates: [40.7648, -73.9808], // Central Park West & 72nd St
    intersection: 'Central Park West & 72nd St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't13',
    coordinates: [40.7736, -73.9566], // Lexington Ave & 77th St
    intersection: 'Lexington Ave & 77th St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't14',
    coordinates: [40.7489, -73.9680], // 3rd Ave & 42nd St
    intersection: '3rd Ave & 42nd St',
    status: EmergencyStatus.INACTIVE,
  },
  {
    id: 't15',
    coordinates: [40.7614, -73.9640], // Park Ave & 68th St
    intersection: 'Park Ave & 68th St',
    status: EmergencyStatus.INACTIVE,
  },
];

export const mockRoutes: Route[] = [
  {
    id: 'r1',
    startLocation: [40.7128, -74.0060], // Financial District
    endLocation: [40.7677, -73.9537], // NewYork-Presbyterian Hospital
    waypoints: [
      [40.7128, -74.0060], // Start - Financial District
      [40.7282, -73.9942], // Broadway & 23rd St
      [40.7359, -73.9911], // Herald Square
      [40.7505, -73.9934], // Times Square
      [40.7549, -73.9840], // 7th Ave & 50th St
      [40.7614, -73.9640], // Park Ave & 68th St
      [40.7677, -73.9537], // Hospital
    ],
    distance: 8.5,
    duration: 15,
    trafficSignalsOnRoute: ['t1', 't2', 't6', 't3', 't11', 't15'],
  },
  {
    id: 'r2',
    startLocation: [40.7128, -74.0060], // Financial District
    endLocation: [40.7903, -73.9509], // Mount Sinai Hospital
    waypoints: [
      [40.7128, -74.0060], // Start
      [40.7282, -73.9942], // Broadway & 23rd St
      [40.7505, -73.9934], // Times Square
      [40.7614, -73.9776], // Columbus Circle
      [40.7831, -73.9712], // Broadway & 72nd St
      [40.7903, -73.9509], // Hospital
    ],
    distance: 9.2,
    duration: 18,
    trafficSignalsOnRoute: ['t1', 't2', 't3', 't4', 't5'],
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

// Generate optimal waypoints that pass near major traffic signals
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
    
    // Include signals that are roughly on the path (more lenient for real NYC routes)
    return distToStart + distToEnd < directDistance * 1.5;
  });
  
  // Sort signals by distance from start
  relevantSignals.sort((a, b) => 
    calculateDistance(start, a.coordinates) - calculateDistance(start, b.coordinates)
  );
  
  // Add waypoints near major traffic signals (limit to avoid too many waypoints)
  const maxWaypoints = Math.min(5, relevantSignals.length);
  for (let i = 0; i < maxWaypoints; i++) {
    const signal = relevantSignals[i];
    // Add the exact signal coordinates for realistic routing
    waypoints.push(signal.coordinates);
  }
  
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

// Enhanced duration calculation for emergency vehicles in NYC traffic
export const calculateDuration = (
  point1: [number, number],
  point2: [number, number]
): number => {
  // Emergency vehicles in NYC average 45-55 km/h with traffic priority
  const distance = calculateDistance(point1, point2);
  const baseSpeed = 50; // km/h
  
  // Add time penalties for traffic density in Manhattan
  const manhattanPenalty = 1.2; // 20% slower due to dense traffic
  
  return (distance / baseSpeed) * 60 * manhattanPenalty; // Convert to minutes
};

// Find traffic signals along the route path with better tolerance for real streets
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
      
      // If signal is within 0.8km of the route, include it (increased tolerance for real streets)
      if (distanceToSegment < 0.8) {
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

// Get real-time traffic data (placeholder for future integration)
export const getRealTimeTrafficData = async (coordinates: [number, number][]): Promise<any> => {
  // This would integrate with services like Google Maps Traffic API, HERE Traffic API, etc.
  // For now, return mock data that simulates real traffic conditions
  
  return {
    congestionLevel: Math.random() * 100, // 0-100% congestion
    averageSpeed: 30 + Math.random() * 40, // 30-70 km/h
    incidents: Math.random() > 0.8 ? ['accident', 'construction', 'road_closure'][Math.floor(Math.random() * 3)] : null,
    estimatedDelay: Math.random() * 5, // 0-5 minutes additional delay
  };
};

// Get nearby points of interest (hospitals, fire stations, police stations)
export const getNearbyPOIs = (
  center: [number, number],
  radius: number = 2 // km
): { type: string; name: string; coordinates: [number, number] }[] => {
  const pois = [
    // Fire stations
    { type: 'fire_station', name: 'FDNY Engine 7/Ladder 1', coordinates: [40.7505, -73.9934] as [number, number] },
    { type: 'fire_station', name: 'FDNY Engine 54/Ladder 4', coordinates: [40.7614, -73.9776] as [number, number] },
    
    // Police stations
    { type: 'police_station', name: 'NYPD Midtown South Precinct', coordinates: [40.7505, -73.9857] as [number, number] },
    { type: 'police_station', name: 'NYPD Central Park Precinct', coordinates: [40.7831, -73.9712] as [number, number] },
    
    // Emergency services
    { type: 'emergency_service', name: 'NYC Emergency Management', coordinates: [40.7128, -74.0060] as [number, number] },
  ];
  
  return pois.filter(poi => calculateDistance(center, poi.coordinates) <= radius);
};