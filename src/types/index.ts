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