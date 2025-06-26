import { EmergencyCheckpoint, CheckpointRoute, Hospital } from '../types';
import { calculateDistance, calculateDuration } from './routeUtils';

// Generate emergency checkpoints at 5km intervals
export const generateEmergencyCheckpoints = (
  patientLocation: [number, number],
  hospitalLocation: [number, number],
  hospital: Hospital
): CheckpointRoute => {
  const totalDistance = calculateDistance(patientLocation, hospitalLocation);
  const estimatedTravelTime = calculateDuration(patientLocation, hospitalLocation);
  const emergencyTravelTime = estimatedTravelTime * 0.7; // 30% faster in emergency mode
  
  const checkpoints: EmergencyCheckpoint[] = [];
  const checkpointInterval = 5; // 5 kilometers
  
  // Calculate number of checkpoints needed
  const numberOfCheckpoints = Math.floor(totalDistance / checkpointInterval);
  
  console.log(`🚨 Generating ${numberOfCheckpoints} emergency checkpoints for ${totalDistance.toFixed(1)}km route`);
  
  for (let i = 1; i <= numberOfCheckpoints; i++) {
    const distanceFromStart = i * checkpointInterval;
    const progress = distanceFromStart / totalDistance;
    
    // Calculate checkpoint coordinates using linear interpolation
    const checkpointLat = patientLocation[0] + (hospitalLocation[0] - patientLocation[0]) * progress;
    const checkpointLng = patientLocation[1] + (hospitalLocation[1] - patientLocation[1]) * progress;
    const coordinates: [number, number] = [checkpointLat, checkpointLng];
    
    // Generate realistic checkpoint data
    const checkpoint = generateCheckpointData(i, coordinates, distanceFromStart, hospital);
    checkpoints.push(checkpoint);
  }
  
  // Add final checkpoint at hospital if distance is significant
  if (totalDistance % checkpointInterval > 2) {
    const finalCheckpoint = generateHospitalCheckpoint(
      numberOfCheckpoints + 1,
      hospitalLocation,
      totalDistance,
      hospital
    );
    checkpoints.push(finalCheckpoint);
  }
  
  const route: CheckpointRoute = {
    routeId: `route-${Date.now()}-${hospital.id}`,
    patientLocation,
    hospitalLocation,
    totalDistance,
    checkpoints,
    createdAt: new Date(),
    estimatedTravelTime,
    emergencyTravelTime
  };
  
  console.log(`✅ Generated ${checkpoints.length} emergency checkpoints covering ${totalDistance.toFixed(1)}km`);
  return route;
};

// Generate checkpoint data with realistic facilities and landmarks
const generateCheckpointData = (
  index: number,
  coordinates: [number, number],
  distanceFromStart: number,
  hospital: Hospital
): EmergencyCheckpoint => {
  const checkpointCode = `CP${index}`;
  
  // Generate realistic landmarks based on location
  const landmarks = generateLandmarks(coordinates, index);
  const intersection = generateIntersection(coordinates, index);
  const stoppingArea = generateStoppingArea(index);
  
  return {
    id: `checkpoint-${Date.now()}-${index}`,
    code: checkpointCode,
    coordinates,
    distanceFromStart,
    landmark: landmarks.primary,
    streetIntersection: intersection,
    safeStoppingArea: stoppingArea,
    facilities: {
      firstAid: true,
      defibrillator: index % 2 === 0, // Every other checkpoint has defibrillator
      oxygenSupply: index % 3 === 0, // Every third checkpoint has oxygen
      emergencyPhone: true,
      restroom: index % 2 === 1,
      shelter: true
    },
    visibility: {
      roadVisibility: index % 4 === 0 ? 'excellent' : index % 3 === 0 ? 'good' : 'fair',
      signage: true,
      lighting: true,
      emergencyBeacon: true
    },
    accessibility: {
      available24_7: true,
      wheelchairAccessible: true,
      emergencyVehicleAccess: true
    },
    emergencyServices: {
      nearestHospital: hospital.name,
      distanceToHospital: calculateDistance(coordinates, hospital.coordinates),
      nearestFireStation: `Fire Station ${index + 10}`,
      distanceToFireStation: Math.random() * 3 + 1, // 1-4 km
      nearestPoliceStation: `Police Station ${index + 20}`,
      distanceToPoliceStation: Math.random() * 2 + 0.5 // 0.5-2.5 km
    },
    lastInspected: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
    status: Math.random() > 0.1 ? 'operational' : 'maintenance' // 90% operational
  };
};

// Generate hospital checkpoint (final checkpoint)
const generateHospitalCheckpoint = (
  index: number,
  hospitalLocation: [number, number],
  totalDistance: number,
  hospital: Hospital
): EmergencyCheckpoint => {
  return {
    id: `checkpoint-hospital-${Date.now()}`,
    code: `CP${index}`,
    coordinates: hospitalLocation,
    distanceFromStart: totalDistance,
    landmark: `${hospital.name} - Emergency Entrance`,
    streetIntersection: `${hospital.name} Main Entrance`,
    safeStoppingArea: {
      type: 'hospital_entrance',
      description: 'Hospital emergency entrance with dedicated ambulance bay',
      capacity: 8
    },
    facilities: {
      firstAid: true,
      defibrillator: true,
      oxygenSupply: true,
      emergencyPhone: true,
      restroom: true,
      shelter: true
    },
    visibility: {
      roadVisibility: 'excellent',
      signage: true,
      lighting: true,
      emergencyBeacon: true
    },
    accessibility: {
      available24_7: true,
      wheelchairAccessible: true,
      emergencyVehicleAccess: true
    },
    emergencyServices: {
      nearestHospital: hospital.name,
      distanceToHospital: 0,
      nearestFireStation: 'Hospital Fire Safety Unit',
      distanceToFireStation: 0.1,
      nearestPoliceStation: 'Hospital Security',
      distanceToPoliceStation: 0.1
    },
    lastInspected: new Date(),
    status: 'operational'
  };
};

// Generate realistic landmarks based on coordinates and checkpoint number
const generateLandmarks = (coordinates: [number, number], index: number) => {
  const [lat, lng] = coordinates;
  
  // Determine region for realistic landmarks
  let region = 'urban';
  if (lat >= 40.7 && lat <= 40.8 && lng >= -74.1 && lng <= -73.9) {
    region = 'nyc';
  } else if (lat >= 51.4 && lat <= 51.6 && lng >= -0.3 && lng <= 0.1) {
    region = 'london';
  } else if (lat >= 48.8 && lat <= 48.9 && lng >= 2.2 && lng <= 2.5) {
    region = 'paris';
  }
  
  const landmarkTypes = [
    'Shopping Center', 'Gas Station', 'School', 'Park', 'Community Center',
    'Library', 'Bank', 'Restaurant', 'Hotel', 'Office Building'
  ];
  
  const regionSpecificLandmarks = {
    nyc: ['Subway Station', 'Bodega', 'Pizza Place', 'Deli', 'Pharmacy'],
    london: ['Pub', 'Tube Station', 'Post Office', 'Tesco', 'NHS Clinic'],
    paris: ['Café', 'Boulangerie', 'Metro Station', 'Pharmacie', 'Mairie'],
    urban: landmarkTypes
  };
  
  const landmarks = regionSpecificLandmarks[region] || landmarkTypes;
  const selectedLandmark = landmarks[index % landmarks.length];
  
  return {
    primary: `${selectedLandmark} ${index + 100}`,
    secondary: `Near ${landmarkTypes[(index + 1) % landmarkTypes.length]} ${index + 200}`
  };
};

// Generate realistic street intersections
const generateIntersection = (coordinates: [number, number], index: number): string => {
  const [lat, lng] = coordinates;
  
  // Street naming patterns by region
  const streetTypes = ['St', 'Ave', 'Blvd', 'Rd', 'Way', 'Dr', 'Ln'];
  const streetNames = [
    'Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Park', 'First', 'Second', 'Third',
    'Washington', 'Lincoln', 'Madison', 'Jefferson', 'Franklin', 'Central', 'Broadway',
    'Market', 'Church', 'School', 'Mill', 'Spring', 'Hill', 'Valley', 'River'
  ];
  
  const street1 = `${streetNames[index % streetNames.length]} ${streetTypes[index % streetTypes.length]}`;
  const street2 = `${streetNames[(index + 5) % streetNames.length]} ${streetTypes[(index + 2) % streetTypes.length]}`;
  
  return `${street1} & ${street2}`;
};

// Generate safe stopping area details
const generateStoppingArea = (index: number) => {
  const stoppingAreaTypes = [
    {
      type: 'parking_lot' as const,
      description: 'Large public parking lot with emergency vehicle access',
      capacity: 12
    },
    {
      type: 'emergency_bay' as const,
      description: 'Dedicated emergency vehicle stopping area',
      capacity: 4
    },
    {
      type: 'fire_station' as const,
      description: 'Fire station parking area with emergency facilities',
      capacity: 6
    },
    {
      type: 'police_station' as const,
      description: 'Police station parking with 24/7 security',
      capacity: 8
    }
  ];
  
  return stoppingAreaTypes[index % stoppingAreaTypes.length];
};

// Calculate checkpoint statistics
export const getCheckpointStatistics = (route: CheckpointRoute) => {
  const operational = route.checkpoints.filter(cp => cp.status === 'operational').length;
  const withDefibrillator = route.checkpoints.filter(cp => cp.facilities.defibrillator).length;
  const withOxygen = route.checkpoints.filter(cp => cp.facilities.oxygenSupply).length;
  const excellentVisibility = route.checkpoints.filter(cp => cp.visibility.roadVisibility === 'excellent').length;
  
  return {
    total: route.checkpoints.length,
    operational,
    maintenance: route.checkpoints.length - operational,
    withDefibrillator,
    withOxygen,
    excellentVisibility,
    averageSpacing: route.totalDistance / route.checkpoints.length,
    totalCoverage: route.totalDistance
  };
};

// Find nearest checkpoint to a given location
export const findNearestCheckpoint = (
  location: [number, number],
  route: CheckpointRoute
): { checkpoint: EmergencyCheckpoint; distance: number } | null => {
  if (route.checkpoints.length === 0) return null;
  
  let nearest = route.checkpoints[0];
  let minDistance = calculateDistance(location, nearest.coordinates);
  
  for (const checkpoint of route.checkpoints) {
    const distance = calculateDistance(location, checkpoint.coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = checkpoint;
    }
  }
  
  return { checkpoint: nearest, distance: minDistance };
};

// Validate checkpoint accessibility and status
export const validateCheckpoint = (checkpoint: EmergencyCheckpoint): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check operational status
  if (checkpoint.status !== 'operational') {
    issues.push(`Checkpoint ${checkpoint.code} is currently ${checkpoint.status}`);
  }
  
  // Check last inspection date
  const daysSinceInspection = (Date.now() - checkpoint.lastInspected.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceInspection > 30) {
    issues.push(`Checkpoint ${checkpoint.code} last inspected ${Math.floor(daysSinceInspection)} days ago`);
    recommendations.push('Schedule inspection within 7 days');
  }
  
  // Check essential facilities
  if (!checkpoint.facilities.firstAid) {
    issues.push(`Checkpoint ${checkpoint.code} lacks first aid facilities`);
  }
  
  if (!checkpoint.facilities.emergencyPhone) {
    issues.push(`Checkpoint ${checkpoint.code} lacks emergency communication`);
  }
  
  // Check visibility
  if (checkpoint.visibility.roadVisibility === 'fair') {
    recommendations.push(`Improve road visibility at checkpoint ${checkpoint.code}`);
  }
  
  if (!checkpoint.visibility.emergencyBeacon) {
    issues.push(`Checkpoint ${checkpoint.code} lacks emergency beacon`);
  }
  
  // Check accessibility
  if (!checkpoint.accessibility.available24_7) {
    issues.push(`Checkpoint ${checkpoint.code} not available 24/7`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
};

// Export checkpoint data for emergency services
export const exportCheckpointData = (route: CheckpointRoute): string => {
  const data = {
    routeInfo: {
      routeId: route.routeId,
      totalDistance: `${route.totalDistance.toFixed(1)} km`,
      estimatedTime: `${Math.ceil(route.estimatedTravelTime)} minutes`,
      emergencyTime: `${Math.ceil(route.emergencyTravelTime)} minutes`,
      checkpointCount: route.checkpoints.length
    },
    checkpoints: route.checkpoints.map(cp => ({
      code: cp.code,
      coordinates: cp.coordinates,
      distanceFromStart: `${cp.distanceFromStart.toFixed(1)} km`,
      landmark: cp.landmark,
      intersection: cp.streetIntersection,
      status: cp.status,
      facilities: cp.facilities,
      emergencyServices: cp.emergencyServices
    }))
  };
  
  return JSON.stringify(data, null, 2);
};