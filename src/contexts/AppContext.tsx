import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Hospital, TrafficSignal, EmergencyStatus, Route } from '../types';
import { mockHospitals, mockTrafficSignals } from '../utils/mockData';

interface AppContextType {
  emergencyActive: boolean;
  toggleEmergency: () => void;
  selectedHospital: Hospital | null;
  selectHospital: (hospital: Hospital | null) => void;
  trafficSignals: TrafficSignal[];
  updateTrafficSignal: (id: string, status: EmergencyStatus) => void;
  currentRoute: Route | null;
  setCurrentRoute: (route: Route | null) => void;
  ambulanceLocation: [number, number];
  updateAmbulanceLocation: (location: [number, number]) => void;
  resetSystem: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>(mockTrafficSignals);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  // Starting position in Lower Manhattan
  const [ambulanceLocation, setAmbulanceLocation] = useState<[number, number]>([40.7128, -74.0060]);

  const toggleEmergency = () => {
    const newEmergencyState = !emergencyActive;
    setEmergencyActive(newEmergencyState);
    
    // Reset traffic signals when emergency is deactivated
    if (!newEmergencyState) {
      setTrafficSignals(
        trafficSignals.map(signal => ({
          ...signal,
          status: EmergencyStatus.INACTIVE
        }))
      );
    }
  };

  const selectHospital = (hospital: Hospital | null) => {
    setSelectedHospital(hospital);
    
    // Clear route when hospital is deselected
    if (!hospital) {
      setCurrentRoute(null);
    }
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

  const resetSystem = () => {
    // Reset ambulance to original position
    setAmbulanceLocation([40.7128, -74.0060]);
    
    // Reset all traffic signals to inactive
    setTrafficSignals(
      mockTrafficSignals.map(signal => ({
        ...signal,
        status: EmergencyStatus.INACTIVE
      }))
    );
    
    // Deactivate emergency mode
    setEmergencyActive(false);
    
    // Clear selected hospital and route
    setSelectedHospital(null);
    setCurrentRoute(null);
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
    resetSystem,
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