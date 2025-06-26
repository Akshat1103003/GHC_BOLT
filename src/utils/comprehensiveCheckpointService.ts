import { 
  MedicalFacility, 
  TrafficData, 
  ComprehensiveCheckpointMap, 
  CheckpointSortOptions,
  Hospital,
  EmergencyCheckpoint
} from '../types';
import { calculateGreatCircleDistance } from './checkpointGenerator';

// Convert miles to kilometers
const milesToKm = (miles: number): number => miles * 1.60934;

// Generate comprehensive medical facilities within radius
export const generateMedicalFacilities = (
  patientLocation: [number, number],
  hospitalLocation: [number, number],
  radiusMiles: number = 5
): MedicalFacility[] => {
  const radiusKm = milesToKm(radiusMiles);
  const facilities: MedicalFacility[] = [];
  
  // Generate emergency response stations
  const emergencyStations = generateEmergencyStations(patientLocation, radiusKm);
  facilities.push(...emergencyStations);
  
  // Generate medical clinics
  const medicalClinics = generateMedicalClinics(patientLocation, radiusKm);
  facilities.push(...medicalClinics);
  
  // Generate ambulance stations
  const ambulanceStations = generateAmbulanceStations(patientLocation, radiusKm);
  facilities.push(...ambulanceStations);
  
  // Generate first aid centers
  const firstAidCenters = generateFirstAidCenters(patientLocation, radiusKm);
  facilities.push(...firstAidCenters);
  
  // Generate temporary medical camps
  const temporaryCamps = generateTemporaryMedicalCamps(patientLocation, radiusKm);
  facilities.push(...temporaryCamps);
  
  // Calculate distances and route proximity
  facilities.forEach(facility => {
    facility.distanceFromPatient = calculateGreatCircleDistance(patientLocation, facility.coordinates);
    facility.distanceFromRoute = calculateDistanceFromRoute(facility.coordinates, patientLocation, hospitalLocation);
    facility.lastUpdated = new Date();
  });
  
  console.log(`🏥 Generated ${facilities.length} medical facilities within ${radiusMiles} mile radius`);
  return facilities;
};

// Generate emergency response stations
const generateEmergencyStations = (center: [number, number], radiusKm: number): MedicalFacility[] => {
  const stations: MedicalFacility[] = [];
  const stationCount = Math.floor(radiusKm / 3) + 2; // More stations for larger radius
  
  for (let i = 0; i < stationCount; i++) {
    const angle = (i / stationCount) * 2 * Math.PI;
    const distance = Math.random() * radiusKm * 0.8; // Within 80% of radius
    
    const lat = center[0] + (distance / 111) * Math.cos(angle);
    const lng = center[1] + (distance / (111 * Math.cos(center[0] * Math.PI / 180))) * Math.sin(angle);
    
    stations.push({
      id: `emergency-station-${i + 1}`,
      name: `Emergency Response Station ${i + 1}`,
      type: 'emergency_station',
      coordinates: [lat, lng],
      address: `${100 + i * 50} Emergency Blvd, Emergency District`,
      phone: `(555) ${200 + i}00-${1000 + i * 100}`,
      operationalStatus: Math.random() > 0.1 ? 'operational' : 'limited',
      availability: {
        available24_7: true,
        currentlyOpen: true,
        emergencyAccess: true
      },
      services: {
        basicFirstAid: true,
        advancedLifeSupport: true,
        trauma: true,
        cardiac: true,
        pediatric: Math.random() > 0.5,
        psychiatric: false,
        pharmacy: Math.random() > 0.7,
        laboratory: false,
        imaging: false,
        surgery: false
      },
      equipment: {
        defibrillator: true,
        ventilator: Math.random() > 0.6,
        oxygenSupply: true,
        emergencyMedications: true,
        ambulanceEquipment: true,
        wheelchairAccess: true
      },
      staffing: {
        doctors: Math.floor(Math.random() * 3) + 1,
        nurses: Math.floor(Math.random() * 5) + 2,
        paramedics: Math.floor(Math.random() * 4) + 3,
        technicians: Math.floor(Math.random() * 2) + 1,
        currentCapacity: Math.floor(Math.random() * 8) + 2,
        maxCapacity: 10
      },
      responseTime: {
        averageMinutes: Math.floor(Math.random() * 5) + 2,
        currentEstimate: Math.floor(Math.random() * 8) + 3,
        priority: 'high'
      },
      distanceFromPatient: 0,
      distanceFromRoute: 0,
      lastUpdated: new Date()
    });
  }
  
  return stations;
};

// Generate medical clinics
const generateMedicalClinics = (center: [number, number], radiusKm: number): MedicalFacility[] => {
  const clinics: MedicalFacility[] = [];
  const clinicCount = Math.floor(radiusKm / 2) + 3;
  
  for (let i = 0; i < clinicCount; i++) {
    const angle = (i / clinicCount) * 2 * Math.PI + Math.PI / 4;
    const distance = Math.random() * radiusKm * 0.9;
    
    const lat = center[0] + (distance / 111) * Math.cos(angle);
    const lng = center[1] + (distance / (111 * Math.cos(center[0] * Math.PI / 180))) * Math.sin(angle);
    
    const isUrgentCare = Math.random() > 0.6;
    
    clinics.push({
      id: `medical-clinic-${i + 1}`,
      name: isUrgentCare ? `Urgent Care Center ${i + 1}` : `Medical Clinic ${i + 1}`,
      type: 'medical_clinic',
      coordinates: [lat, lng],
      address: `${300 + i * 25} Medical Ave, Healthcare District`,
      phone: `(555) ${300 + i}00-${2000 + i * 100}`,
      operationalStatus: Math.random() > 0.05 ? 'operational' : 'limited',
      availability: {
        available24_7: isUrgentCare,
        currentlyOpen: Math.random() > 0.2,
        nextOpenTime: !isUrgentCare && Math.random() > 0.8 ? new Date(Date.now() + Math.random() * 12 * 60 * 60 * 1000) : undefined,
        emergencyAccess: isUrgentCare
      },
      services: {
        basicFirstAid: true,
        advancedLifeSupport: isUrgentCare,
        trauma: isUrgentCare,
        cardiac: isUrgentCare,
        pediatric: Math.random() > 0.4,
        psychiatric: Math.random() > 0.8,
        pharmacy: Math.random() > 0.3,
        laboratory: Math.random() > 0.5,
        imaging: isUrgentCare && Math.random() > 0.6,
        surgery: false
      },
      equipment: {
        defibrillator: isUrgentCare,
        ventilator: false,
        oxygenSupply: isUrgentCare,
        emergencyMedications: true,
        ambulanceEquipment: false,
        wheelchairAccess: true
      },
      staffing: {
        doctors: Math.floor(Math.random() * 4) + 1,
        nurses: Math.floor(Math.random() * 6) + 2,
        paramedics: isUrgentCare ? Math.floor(Math.random() * 2) + 1 : 0,
        technicians: Math.floor(Math.random() * 3) + 1,
        currentCapacity: Math.floor(Math.random() * 12) + 3,
        maxCapacity: 15
      },
      responseTime: {
        averageMinutes: Math.floor(Math.random() * 10) + 5,
        currentEstimate: Math.floor(Math.random() * 15) + 8,
        priority: isUrgentCare ? 'high' : 'medium'
      },
      distanceFromPatient: 0,
      distanceFromRoute: 0,
      lastUpdated: new Date()
    });
  }
  
  return clinics;
};

// Generate ambulance stations
const generateAmbulanceStations = (center: [number, number], radiusKm: number): MedicalFacility[] => {
  const stations: MedicalFacility[] = [];
  const stationCount = Math.floor(radiusKm / 4) + 2;
  
  for (let i = 0; i < stationCount; i++) {
    const angle = (i / stationCount) * 2 * Math.PI + Math.PI / 6;
    const distance = Math.random() * radiusKm * 0.7;
    
    const lat = center[0] + (distance / 111) * Math.cos(angle);
    const lng = center[1] + (distance / (111 * Math.cos(center[0] * Math.PI / 180))) * Math.sin(angle);
    
    stations.push({
      id: `ambulance-station-${i + 1}`,
      name: `Ambulance Station ${i + 1}`,
      type: 'ambulance_station',
      coordinates: [lat, lng],
      address: `${500 + i * 30} Ambulance Way, Emergency Services District`,
      phone: `(555) ${400 + i}00-${3000 + i * 100}`,
      operationalStatus: Math.random() > 0.05 ? 'operational' : 'limited',
      availability: {
        available24_7: true,
        currentlyOpen: true,
        emergencyAccess: true
      },
      services: {
        basicFirstAid: true,
        advancedLifeSupport: true,
        trauma: true,
        cardiac: true,
        pediatric: true,
        psychiatric: false,
        pharmacy: false,
        laboratory: false,
        imaging: false,
        surgery: false
      },
      equipment: {
        defibrillator: true,
        ventilator: true,
        oxygenSupply: true,
        emergencyMedications: true,
        ambulanceEquipment: true,
        wheelchairAccess: true
      },
      staffing: {
        doctors: 0,
        nurses: Math.floor(Math.random() * 2) + 1,
        paramedics: Math.floor(Math.random() * 6) + 4,
        technicians: Math.floor(Math.random() * 3) + 2,
        currentCapacity: Math.floor(Math.random() * 6) + 2,
        maxCapacity: 8
      },
      responseTime: {
        averageMinutes: Math.floor(Math.random() * 3) + 1,
        currentEstimate: Math.floor(Math.random() * 5) + 2,
        priority: 'high'
      },
      distanceFromPatient: 0,
      distanceFromRoute: 0,
      lastUpdated: new Date()
    });
  }
  
  return stations;
};

// Generate first aid centers
const generateFirstAidCenters = (center: [number, number], radiusKm: number): MedicalFacility[] => {
  const centers: MedicalFacility[] = [];
  const centerCount = Math.floor(radiusKm / 1.5) + 4;
  
  for (let i = 0; i < centerCount; i++) {
    const angle = (i / centerCount) * 2 * Math.PI + Math.PI / 3;
    const distance = Math.random() * radiusKm;
    
    const lat = center[0] + (distance / 111) * Math.cos(angle);
    const lng = center[1] + (distance / (111 * Math.cos(center[0] * Math.PI / 180))) * Math.sin(angle);
    
    centers.push({
      id: `first-aid-center-${i + 1}`,
      name: `First Aid Center ${i + 1}`,
      type: 'first_aid_center',
      coordinates: [lat, lng],
      address: `${700 + i * 20} First Aid St, Community District`,
      phone: `(555) ${500 + i}00-${4000 + i * 100}`,
      operationalStatus: Math.random() > 0.1 ? 'operational' : 'limited',
      availability: {
        available24_7: Math.random() > 0.7,
        currentlyOpen: Math.random() > 0.3,
        nextOpenTime: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 8 * 60 * 60 * 1000) : undefined,
        emergencyAccess: true
      },
      services: {
        basicFirstAid: true,
        advancedLifeSupport: false,
        trauma: false,
        cardiac: Math.random() > 0.8,
        pediatric: Math.random() > 0.6,
        psychiatric: false,
        pharmacy: false,
        laboratory: false,
        imaging: false,
        surgery: false
      },
      equipment: {
        defibrillator: Math.random() > 0.5,
        ventilator: false,
        oxygenSupply: Math.random() > 0.7,
        emergencyMedications: true,
        ambulanceEquipment: false,
        wheelchairAccess: Math.random() > 0.4
      },
      staffing: {
        doctors: 0,
        nurses: Math.floor(Math.random() * 2) + 1,
        paramedics: Math.floor(Math.random() * 2),
        technicians: Math.floor(Math.random() * 2) + 1,
        currentCapacity: Math.floor(Math.random() * 4) + 1,
        maxCapacity: 5
      },
      responseTime: {
        averageMinutes: Math.floor(Math.random() * 8) + 3,
        currentEstimate: Math.floor(Math.random() * 12) + 5,
        priority: 'medium'
      },
      distanceFromPatient: 0,
      distanceFromRoute: 0,
      lastUpdated: new Date()
    });
  }
  
  return centers;
};

// Generate temporary medical camps
const generateTemporaryMedicalCamps = (center: [number, number], radiusKm: number): MedicalFacility[] => {
  const camps: MedicalFacility[] = [];
  const campCount = Math.floor(radiusKm / 8) + 1; // Fewer temporary camps
  
  for (let i = 0; i < campCount; i++) {
    const angle = (i / campCount) * 2 * Math.PI + Math.PI / 2;
    const distance = Math.random() * radiusKm * 0.6;
    
    const lat = center[0] + (distance / 111) * Math.cos(angle);
    const lng = center[1] + (distance / (111 * Math.cos(center[0] * Math.PI / 180))) * Math.sin(angle);
    
    camps.push({
      id: `temp-medical-camp-${i + 1}`,
      name: `Temporary Medical Camp ${i + 1}`,
      type: 'temporary_camp',
      coordinates: [lat, lng],
      address: `${900 + i * 15} Temporary Site, Emergency Zone`,
      phone: `(555) ${600 + i}00-${5000 + i * 100}`,
      operationalStatus: Math.random() > 0.2 ? 'operational' : 'limited',
      availability: {
        available24_7: true,
        currentlyOpen: Math.random() > 0.1,
        emergencyAccess: true
      },
      services: {
        basicFirstAid: true,
        advancedLifeSupport: Math.random() > 0.6,
        trauma: Math.random() > 0.7,
        cardiac: Math.random() > 0.8,
        pediatric: true,
        psychiatric: Math.random() > 0.9,
        pharmacy: Math.random() > 0.5,
        laboratory: false,
        imaging: false,
        surgery: false
      },
      equipment: {
        defibrillator: Math.random() > 0.4,
        ventilator: Math.random() > 0.8,
        oxygenSupply: Math.random() > 0.3,
        emergencyMedications: true,
        ambulanceEquipment: Math.random() > 0.7,
        wheelchairAccess: Math.random() > 0.6
      },
      staffing: {
        doctors: Math.floor(Math.random() * 3) + 1,
        nurses: Math.floor(Math.random() * 4) + 2,
        paramedics: Math.floor(Math.random() * 3) + 1,
        technicians: Math.floor(Math.random() * 2) + 1,
        currentCapacity: Math.floor(Math.random() * 10) + 5,
        maxCapacity: 20
      },
      responseTime: {
        averageMinutes: Math.floor(Math.random() * 12) + 8,
        currentEstimate: Math.floor(Math.random() * 18) + 10,
        priority: 'medium'
      },
      distanceFromPatient: 0,
      distanceFromRoute: 0,
      lastUpdated: new Date()
    });
  }
  
  return camps;
};

// Calculate distance from a point to a route line
const calculateDistanceFromRoute = (
  point: [number, number],
  routeStart: [number, number],
  routeEnd: [number, number]
): number => {
  // Simplified distance to route calculation
  // In a real implementation, this would calculate the perpendicular distance to the route line
  const distanceToStart = calculateGreatCircleDistance(point, routeStart);
  const distanceToEnd = calculateGreatCircleDistance(point, routeEnd);
  const routeLength = calculateGreatCircleDistance(routeStart, routeEnd);
  
  // Use the law of cosines to approximate perpendicular distance
  const a = distanceToStart;
  const b = distanceToEnd;
  const c = routeLength;
  
  if (c === 0) return distanceToStart;
  
  // Calculate the perpendicular distance using Heron's formula approach
  const s = (a + b + c) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
  const perpendicularDistance = (2 * area) / c;
  
  return Math.min(perpendicularDistance, Math.min(distanceToStart, distanceToEnd));
};

// Generate real-time traffic data
export const generateTrafficData = (
  routeCoordinates: [number, number][]
): TrafficData[] => {
  const trafficSegments: TrafficData[] = [];
  
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const segment = routeCoordinates.slice(i, i + 2);
    const congestionLevels = ['free', 'light', 'moderate', 'heavy', 'severe'] as const;
    const congestionLevel = congestionLevels[Math.floor(Math.random() * congestionLevels.length)];
    
    const baseSpeed = 50; // km/h
    const speedMultiplier = {
      free: 1.0,
      light: 0.9,
      moderate: 0.7,
      heavy: 0.5,
      severe: 0.3
    };
    
    const incidents = [];
    if (Math.random() > 0.8) {
      const incidentTypes = ['accident', 'construction', 'road_closure', 'weather', 'event'] as const;
      const severities = ['minor', 'major', 'critical'] as const;
      
      incidents.push({
        type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: `Traffic incident on route segment ${i + 1}`,
        estimatedClearTime: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 2 * 60 * 60 * 1000) : undefined
      });
    }
    
    trafficSegments.push({
      segmentId: `segment-${i + 1}`,
      coordinates: segment,
      congestionLevel,
      averageSpeed: baseSpeed * speedMultiplier[congestionLevel],
      incidents,
      estimatedDelay: congestionLevel === 'severe' ? Math.random() * 15 + 5 : 
                     congestionLevel === 'heavy' ? Math.random() * 10 + 2 :
                     congestionLevel === 'moderate' ? Math.random() * 5 + 1 : 0,
      alternativeRoutes: Math.random() > 0.7 ? [
        {
          description: `Alternative route via parallel street`,
          additionalDistance: Math.random() * 2 + 0.5,
          timeSaving: Math.random() * 8 + 2
        }
      ] : [],
      lastUpdated: new Date()
    });
  }
  
  return trafficSegments;
};

// Sort medical facilities based on criteria
export const sortMedicalFacilities = (
  facilities: MedicalFacility[],
  options: CheckpointSortOptions
): MedicalFacility[] => {
  let filtered = [...facilities];
  
  // Apply filters
  if (options.filterBy.operationalOnly) {
    filtered = filtered.filter(f => f.operationalStatus === 'operational');
  }
  
  if (options.filterBy.available24_7) {
    filtered = filtered.filter(f => f.availability.available24_7);
  }
  
  if (options.filterBy.withinRadius > 0) {
    const radiusKm = milesToKm(options.filterBy.withinRadius);
    filtered = filtered.filter(f => f.distanceFromPatient <= radiusKm);
  }
  
  if (options.filterBy.facilityTypes.length > 0) {
    filtered = filtered.filter(f => options.filterBy.facilityTypes.includes(f.type));
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (options.sortBy) {
      case 'distance':
        return a.distanceFromPatient - b.distanceFromPatient;
      
      case 'status':
        const statusOrder = { operational: 0, limited: 1, emergency_only: 2, closed: 3 };
        return statusOrder[a.operationalStatus] - statusOrder[b.operationalStatus];
      
      case 'services':
        const aServiceCount = Object.values(a.services).filter(Boolean).length;
        const bServiceCount = Object.values(b.services).filter(Boolean).length;
        return bServiceCount - aServiceCount;
      
      case 'response_time':
        return a.responseTime.currentEstimate - b.responseTime.currentEstimate;
      
      default:
        return 0;
    }
  });
  
  return filtered;
};

// Create comprehensive checkpoint map
export const createComprehensiveCheckpointMap = (
  patientLocation: [number, number],
  patientAddress: string,
  hospital: Hospital,
  emergencyCheckpoints: EmergencyCheckpoint[],
  radiusMiles: number = 5
): ComprehensiveCheckpointMap => {
  const medicalFacilities = generateMedicalFacilities(patientLocation, hospital.coordinates, radiusMiles);
  const routeCoordinates = [patientLocation, hospital.coordinates]; // Simplified for demo
  const trafficData = generateTrafficData(routeCoordinates);
  
  const primaryRoute = {
    coordinates: routeCoordinates,
    distance: calculateGreatCircleDistance(patientLocation, hospital.coordinates),
    estimatedTime: Math.ceil(calculateGreatCircleDistance(patientLocation, hospital.coordinates) / 35 * 60), // 35 km/h average
    emergencyTime: Math.ceil(calculateGreatCircleDistance(patientLocation, hospital.coordinates) / 50 * 60) // 50 km/h emergency
  };
  
  return {
    patientLocation: {
      coordinates: patientLocation,
      address: patientAddress,
      timestamp: new Date()
    },
    hospitalDestination: {
      hospital,
      estimatedArrival: new Date(Date.now() + primaryRoute.emergencyTime * 60 * 1000)
    },
    primaryRoute,
    alternativeRoutes: [], // Would be populated with actual alternative routes
    emergencyCheckpoints,
    medicalFacilities,
    trafficData,
    lastUpdated: new Date(),
    nextUpdateTime: new Date(Date.now() + 5 * 60 * 1000) // Update every 5 minutes
  };
};

// Update checkpoint information (simulates real-time updates)
export const updateCheckpointInformation = (
  comprehensiveMap: ComprehensiveCheckpointMap
): ComprehensiveCheckpointMap => {
  const updatedMap = { ...comprehensiveMap };
  
  // Update medical facilities status
  updatedMap.medicalFacilities = updatedMap.medicalFacilities.map(facility => ({
    ...facility,
    responseTime: {
      ...facility.responseTime,
      currentEstimate: Math.max(1, facility.responseTime.currentEstimate + (Math.random() - 0.5) * 3)
    },
    staffing: {
      ...facility.staffing,
      currentCapacity: Math.max(0, Math.min(facility.staffing.maxCapacity, 
        facility.staffing.currentCapacity + Math.floor((Math.random() - 0.5) * 3)))
    },
    lastUpdated: new Date()
  }));
  
  // Update traffic data
  updatedMap.trafficData = generateTrafficData(updatedMap.primaryRoute.coordinates);
  
  updatedMap.lastUpdated = new Date();
  updatedMap.nextUpdateTime = new Date(Date.now() + 5 * 60 * 1000);
  
  console.log('🔄 Comprehensive checkpoint map updated with real-time data');
  return updatedMap;
};