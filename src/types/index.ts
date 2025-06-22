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