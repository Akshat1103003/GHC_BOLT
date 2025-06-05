import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Hospital, TrafficSignal, EmergencyStatus, Route } from '../types';
import { mockHospitals, mockTrafficSignals } from '../utils/mockData';

interface AppContextType {
  emergencyActive: boolean;
  toggleEmergency: () => void;
  selectedHospital: Hospital | null;
  selectHospital: (hospital: Hospital) => void;
  trafficSignals: TrafficSignal[];
  updateTrafficSignal: (id: string, status: EmergencyStatus) => void;
  currentRoute: Route | null;
  setCurrentRoute: (route: Route) => void;
  ambulanceLocation: [number, number];
  updateAmbulanceLocation: (location: [number, number]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>(mockTrafficSignals);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState<[number, number]>([40.7128, -74.006]); // Default NYC

  const toggleEmergency = () => {
    setEmergencyActive(!emergencyActive);
  };

  const selectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
  };

  const updateTrafficSignal = (id: string, status: EmergencyStatus) => {
    setTrafficSignals(
      trafficSignals.map((signal) =>
        signal.id === id ? { ...signal, status } : signal
      )
    );
  };

  const updateAmbulanceLocation = (location: [number, number]) => {
    setAmbulanceLocation(location);
  };

  const value = {
    emergencyActive,
    toggleEmergency,
    selectedHospital,
    selectHospital,
    trafficSignals,
    updateTrafficSignal,
    currentRoute,
    setCurrentRoute,
    ambulanceLocation,
    updateAmbulanceLocation,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};