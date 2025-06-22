import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Hospital, Route, Notification } from '../types';
import { mockHospitals } from '../utils/mockData';
import { createRoute } from '../utils/routeUtils';

// Check if Supabase is available
const isSupabaseAvailable = () => {
  return import.meta.env.VITE_SUPABASE_URL && 
         import.meta.env.VITE_SUPABASE_ANON_KEY && 
         import.meta.env.VITE_DATA_SOURCE !== 'mock';
};

interface AppContextType {
  emergencyActive: boolean;
  toggleEmergency: () => void;
  selectedHospital: Hospital | null;
  selectHospital: (hospital: Hospital | null) => void;
  currentRoute: Route | null;
  setCurrentRoute: (route: Route | null) => void;
  ambulanceLocation: [number, number];
  updateAmbulanceLocation: (location: [number, number]) => void;
  resetSystem: () => void;
  hospitals: Hospital[];
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  isLoading: boolean;
  dataSource: 'supabase' | 'mock';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState<[number, number]>([40.7128, -74.0060]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('mock');

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        if (isSupabaseAvailable()) {
          // Try to load from Supabase
          try {
            const { 
              getAmbulance,
              getHospitals,
              getNotifications,
              subscribeToAmbulances,
              subscribeToNotifications
            } = await import('../services/supabaseService');
            
            // Load hospitals
            const hospitalsData = await getHospitals();
            setHospitals(hospitalsData);
            
            // Load ambulance location
            const ambulanceData = await getAmbulance();
            if (ambulanceData) {
              setAmbulanceLocation([ambulanceData.latitude, ambulanceData.longitude]);
            }
            
            // Load notifications
            const notificationsData = await getNotifications();
            setNotifications(notificationsData);
            
            setDataSource('supabase');
            
            // Set up real-time subscriptions
            const ambulanceSubscription = subscribeToAmbulances((payload) => {
              if (payload.eventType === 'UPDATE' && payload.new) {
                setAmbulanceLocation([payload.new.latitude, payload.new.longitude]);
              }
            });

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

            // Cleanup function for subscriptions
            return () => {
              ambulanceSubscription.unsubscribe();
              notificationSubscription.unsubscribe();
            };
            
          } catch (supabaseError) {
            console.warn('Supabase connection failed, falling back to mock data:', supabaseError);
            loadMockData();
          }
        } else {
          // Use mock data
          loadMockData();
        }
        
      } catch (error) {
        console.error('Error loading initial data:', error);
        loadMockData();
      } finally {
        setIsLoading(false);
      }
    };
    
    const loadMockData = () => {
      setHospitals(mockHospitals);
      setNotifications([]);
      setDataSource('mock');
    };
    
    loadInitialData();
  }, []);

  const toggleEmergency = () => {
    const newEmergencyState = !emergencyActive;
    setEmergencyActive(newEmergencyState);
    console.log('🚨 Emergency mode:', newEmergencyState ? 'ACTIVATED' : 'DEACTIVATED');
  };

  const selectHospital = (hospital: Hospital | null) => {
    console.log('🏥 AppContext: Selecting hospital:', hospital?.name || 'None');
    setSelectedHospital(hospital);
    
    if (hospital) {
      // Automatically create route when hospital is selected
      try {
        const route = createRoute(ambulanceLocation, hospital);
        setCurrentRoute(route);
        console.log('🗺️ AppContext: Route created automatically:', {
          distance: route.distance.toFixed(1) + 'km',
          duration: Math.ceil(route.duration) + 'min',
          waypoints: route.waypoints.length
        });
      } catch (error) {
        console.error('❌ AppContext: Failed to create route:', error);
        setCurrentRoute(null);
      }
    } else {
      // Clear route when hospital is deselected
      setCurrentRoute(null);
      console.log('🗺️ AppContext: Route cleared');
    }
  };

  const updateAmbulanceLocation = async (location: [number, number]) => {
    console.log('🚑 AppContext: Updating ambulance location:', location);
    
    if (dataSource === 'supabase') {
      try {
        const { updateAmbulanceLocation: updateAmbulanceLocationDB } = await import('../services/supabaseService');
        await updateAmbulanceLocationDB('550e8400-e29b-41d4-a716-446655440000', location[0], location[1]);
        // The real-time subscription will handle updating the local state
      } catch (error) {
        console.error('Error updating ambulance location:', error);
        // Fallback to local state update
        setAmbulanceLocation(location);
      }
    } else {
      setAmbulanceLocation(location);
    }

    // Update route if hospital is selected
    if (selectedHospital) {
      try {
        const route = createRoute(location, selectedHospital);
        setCurrentRoute(route);
        console.log('🗺️ AppContext: Route updated for new ambulance location');
      } catch (error) {
        console.error('❌ AppContext: Failed to update route:', error);
      }
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (dataSource === 'supabase') {
      try {
        const { markNotificationAsRead: markAsRead } = await import('../services/supabaseService');
        await markAsRead(id);
        // The real-time subscription will handle updating the local state
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // Fallback to local update
        markNotificationAsReadLocal(id);
      }
    } else {
      markNotificationAsReadLocal(id);
    }
  };

  const markNotificationAsReadLocal = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const resetSystem = async () => {
    try {
      console.log('🔄 AppContext: Resetting system...');
      
      // Reset ambulance to original position
      await updateAmbulanceLocation([40.7128, -74.0060]);
      
      // Deactivate emergency mode
      setEmergencyActive(false);
      
      // Clear selected hospital and route
      setSelectedHospital(null);
      setCurrentRoute(null);
      
      console.log('✅ System reset completed');
    } catch (error) {
      console.error('Error resetting system:', error);
    }
  };

  const value = {
    emergencyActive,
    toggleEmergency,
    selectedHospital,
    selectHospital,
    currentRoute,
    setCurrentRoute,
    ambulanceLocation,
    updateAmbulanceLocation,
    resetSystem,
    hospitals,
    notifications,
    markNotificationAsRead,
    isLoading,
    dataSource,
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