import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Hospital, TrafficSignal, EmergencyStatus, Route, Notification } from '../types';
import { 
  getAmbulance,
  updateAmbulanceLocation as updateAmbulanceLocationDB,
  getHospitals,
  getTrafficSignals,
  updateTrafficSignalStatus,
  getNotifications,
  subscribeToAmbulances,
  subscribeToTrafficSignals,
  subscribeToNotifications,
  subscribeToRoutes
} from '../services/supabaseService';

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
  hospitals: Hospital[];
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState<[number, number]>([40.7128, -74.0060]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from Supabase
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load hospitals
        const hospitalsData = await getHospitals();
        setHospitals(hospitalsData);
        
        // Load traffic signals
        const trafficSignalsData = await getTrafficSignals();
        setTrafficSignals(trafficSignalsData);
        
        // Load ambulance location
        const ambulanceData = await getAmbulance();
        if (ambulanceData) {
          setAmbulanceLocation([ambulanceData.latitude, ambulanceData.longitude]);
        }
        
        // Load notifications
        const notificationsData = await getNotifications();
        setNotifications(notificationsData);
        
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to ambulance updates
    const ambulanceSubscription = subscribeToAmbulances((payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        setAmbulanceLocation([payload.new.latitude, payload.new.longitude]);
      }
    });

    // Subscribe to traffic signal updates
    const trafficSignalSubscription = subscribeToTrafficSignals((payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        setTrafficSignals(prev => 
          prev.map(signal => 
            signal.id === payload.new.id 
              ? {
                  ...signal,
                  status: payload.new.status as EmergencyStatus
                }
              : signal
          )
        );
      }
    });

    // Subscribe to notification updates
    const notificationSubscription = subscribeToNotifications((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newNotification: Notification = {
          id: payload.new.id,
          type: payload.new.type,
          targetId: payload.new.target_id,
          message: payload.new.message,
          timestamp: new Date(payload.new.created_at),
          read: payload.new.read,
        };
        setNotifications(prev => [newNotification, ...prev]);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === payload.new.id
              ? { ...notification, read: payload.new.read }
              : notification
          )
        );
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      ambulanceSubscription.unsubscribe();
      trafficSignalSubscription.unsubscribe();
      notificationSubscription.unsubscribe();
    };
  }, []);

  const toggleEmergency = () => {
    const newEmergencyState = !emergencyActive;
    setEmergencyActive(newEmergencyState);
    
    // Reset traffic signals when emergency is deactivated
    if (!newEmergencyState) {
      trafficSignals.forEach(signal => {
        updateTrafficSignal(signal.id, EmergencyStatus.INACTIVE);
      });
    }
  };

  const selectHospital = (hospital: Hospital | null) => {
    setSelectedHospital(hospital);
    
    // Clear route when hospital is deselected
    if (!hospital) {
      setCurrentRoute(null);
    }
  };

  const updateTrafficSignal = async (id: string, status: EmergencyStatus) => {
    try {
      await updateTrafficSignalStatus(id, status);
      // The real-time subscription will handle updating the local state
    } catch (error) {
      console.error('Error updating traffic signal:', error);
    }
  };

  const updateAmbulanceLocation = async (location: [number, number]) => {
    try {
      await updateAmbulanceLocationDB('a1', location[0], location[1]);
      // The real-time subscription will handle updating the local state
    } catch (error) {
      console.error('Error updating ambulance location:', error);
      // Fallback to local state update if database update fails
      setAmbulanceLocation(location);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const { markNotificationAsRead: markAsRead } = await import('../services/supabaseService');
      await markAsRead(id);
      // The real-time subscription will handle updating the local state
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const resetSystem = async () => {
    try {
      // Reset ambulance to original position
      await updateAmbulanceLocation([40.7128, -74.0060]);
      
      // Reset all traffic signals to inactive
      for (const signal of trafficSignals) {
        await updateTrafficSignal(signal.id, EmergencyStatus.INACTIVE);
      }
      
      // Deactivate emergency mode
      setEmergencyActive(false);
      
      // Clear selected hospital and route
      setSelectedHospital(null);
      setCurrentRoute(null);
    } catch (error) {
      console.error('Error resetting system:', error);
    }
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
    hospitals,
    notifications,
    markNotificationAsRead,
    isLoading,
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