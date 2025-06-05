// Common types for the application

export enum EmergencyStatus {
  INACTIVE = 'inactive',
  APPROACHING = 'approaching',
  ACTIVE = 'active',
  PASSED = 'passed',
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [latitude, longitude]
  phone: string;
  specialties: string[];
  emergencyReady: boolean;
}

export interface TrafficSignal {
  id: string;
  coordinates: [number, number]; // [latitude, longitude]
  intersection: string;
  status: EmergencyStatus;
}

export interface Route {
  id: string;
  startLocation: [number, number];
  endLocation: [number, number];
  waypoints: [number, number][];
  distance: number; // in kilometers
  duration: number; // in minutes
  trafficSignalsOnRoute: string[]; // IDs of traffic signals on this route
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