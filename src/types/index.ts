// Common types for the application

export interface Hospital {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [latitude, longitude]
  phone: string;
  specialties: string[];
  emergencyReady: boolean;
  isSearchResult?: boolean;
  isNearbyResult?: boolean;
}

export interface Route {
  id: string;
  startLocation: [number, number];
  endLocation: [number, number];
  waypoints: [number, number][];
  distance: number; // in kilometers
  duration: number; // in minutes
}

export interface RouteInfo {
  distance: string;
  duration: string;
  steps?: Array<{
    instruction: string;
    distance: string;
    duration: string;
  }>;
}

export interface Notification {
  id: string;
  type: 'hospital' | 'trafficSignal';
  targetId: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  role: 'driver' | 'hospital' | 'admin';
  organization: string;
}

export interface EmergencyCheckpoint {
  id: string;
  code: string; // CP1, CP2, etc.
  coordinates: [number, number];
  distanceFromStart: number; // in kilometers
  landmark: string;
  streetIntersection: string;
  safeStoppingArea: {
    type: 'parking_lot' | 'emergency_bay' | 'hospital_entrance' | 'fire_station' | 'police_station';
    description: string;
    capacity: number; // number of vehicles
  };
  facilities: {
    firstAid: boolean;
    defibrillator: boolean;
    oxygenSupply: boolean;
    emergencyPhone: boolean;
    restroom: boolean;
    shelter: boolean;
  };
  visibility: {
    roadVisibility: 'excellent' | 'good' | 'fair';
    signage: boolean;
    lighting: boolean;
    emergencyBeacon: boolean;
  };
  accessibility: {
    available24_7: boolean;
    wheelchairAccessible: boolean;
    emergencyVehicleAccess: boolean;
  };
  emergencyServices: {
    nearestHospital: string;
    distanceToHospital: number;
    nearestFireStation: string;
    distanceToFireStation: number;
    nearestPoliceStation: string;
    distanceToPoliceStation: number;
  };
  lastInspected: Date;
  status: 'operational' | 'maintenance' | 'out_of_service';
}

export interface CheckpointRoute {
  routeId: string;
  patientLocation: [number, number];
  hospitalLocation: [number, number];
  totalDistance: number;
  checkpoints: EmergencyCheckpoint[];
  createdAt: Date;
  estimatedTravelTime: number;
  emergencyTravelTime: number;
}

// New comprehensive checkpoint types
export interface MedicalFacility {
  id: string;
  name: string;
  type: 'emergency_station' | 'medical_clinic' | 'ambulance_station' | 'first_aid_center' | 'temporary_camp';
  coordinates: [number, number];
  address: string;
  phone: string;
  operationalStatus: 'operational' | 'limited' | 'closed' | 'emergency_only';
  availability: {
    available24_7: boolean;
    currentlyOpen: boolean;
    nextOpenTime?: Date;
    emergencyAccess: boolean;
  };
  services: {
    basicFirstAid: boolean;
    advancedLifeSupport: boolean;
    trauma: boolean;
    cardiac: boolean;
    pediatric: boolean;
    psychiatric: boolean;
    pharmacy: boolean;
    laboratory: boolean;
    imaging: boolean;
    surgery: boolean;
  };
  equipment: {
    defibrillator: boolean;
    ventilator: boolean;
    oxygenSupply: boolean;
    emergencyMedications: boolean;
    ambulanceEquipment: boolean;
    wheelchairAccess: boolean;
  };
  staffing: {
    doctors: number;
    nurses: number;
    paramedics: number;
    technicians: number;
    currentCapacity: number;
    maxCapacity: number;
  };
  responseTime: {
    averageMinutes: number;
    currentEstimate: number;
    priority: 'high' | 'medium' | 'low';
  };
  distanceFromPatient: number;
  distanceFromRoute: number;
  lastUpdated: Date;
}

export interface TrafficData {
  segmentId: string;
  coordinates: [number, number][];
  congestionLevel: 'free' | 'light' | 'moderate' | 'heavy' | 'severe';
  averageSpeed: number; // km/h
  incidents: Array<{
    type: 'accident' | 'construction' | 'road_closure' | 'weather' | 'event';
    severity: 'minor' | 'major' | 'critical';
    description: string;
    estimatedClearTime?: Date;
  }>;
  estimatedDelay: number; // minutes
  alternativeRoutes: Array<{
    description: string;
    additionalDistance: number;
    timeSaving: number;
  }>;
  lastUpdated: Date;
}

export interface ComprehensiveCheckpointMap {
  patientLocation: {
    coordinates: [number, number];
    address: string;
    timestamp: Date;
  };
  hospitalDestination: {
    hospital: Hospital;
    estimatedArrival: Date;
  };
  primaryRoute: {
    coordinates: [number, number][];
    distance: number;
    estimatedTime: number;
    emergencyTime: number;
  };
  alternativeRoutes: Array<{
    id: string;
    coordinates: [number, number][];
    distance: number;
    estimatedTime: number;
    advantages: string[];
    disadvantages: string[];
  }>;
  emergencyCheckpoints: EmergencyCheckpoint[];
  medicalFacilities: MedicalFacility[];
  trafficData: TrafficData[];
  lastUpdated: Date;
  nextUpdateTime: Date;
}

export interface CheckpointSortOptions {
  sortBy: 'distance' | 'status' | 'services' | 'response_time';
  filterBy: {
    operationalOnly: boolean;
    available24_7: boolean;
    withinRadius: number; // miles
    facilityTypes: string[];
    minimumServices: string[];
  };
}