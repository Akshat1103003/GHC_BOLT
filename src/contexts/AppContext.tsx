import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Hospital, Route, Notification, CheckpointRoute } from '../types';
import { mockHospitals } from '../utils/mockData';

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
  isCreatingRoute: boolean;
  isDetectingLocation: boolean;
  locationError: string | null;
  initialLocationSet: boolean;
  checkpointRoute: CheckpointRoute | null;
  setCheckpointRoute: (route: CheckpointRoute | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState<[number, number]>([40.7128, -74.0060]); // Default fallback
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('mock');
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  const [checkpointRoute, setCheckpointRoute] = useState<CheckpointRoute | null>(null);

  // Detect user's live location on app startup
  useEffect(() => {
    const detectLiveLocation = () => {
      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocation is not supported by this browser');
        setLocationError('Geolocation not supported');
        setInitialLocationSet(true);
        return;
      }

      setIsDetectingLocation(true);
      setLocationError(null);

      console.log('📍 Detecting user\'s live location...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const liveLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          
          console.log('✅ Live location detected:', liveLocation);
          setAmbulanceLocation(liveLocation);
          setIsDetectingLocation(false);
          setLocationError(null);
          setInitialLocationSet(true);

          // Update in database if using Supabase
          if (dataSource === 'supabase') {
            updateAmbulanceLocationInDB(liveLocation);
          }
        },
        (error) => {
          console.warn('⚠️ Failed to get live location:', error.message);
          
          let errorMessage = 'Unable to detect your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Using default location.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Using default location.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Using default location.';
              break;
          }
          
          setLocationError(errorMessage);
          setIsDetectingLocation(false);
          setInitialLocationSet(true);
          
          // Keep default location (New York) as fallback
          console.log('📍 Using default location (New York) as fallback');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // 15 seconds timeout
          maximumAge: 300000 // 5 minutes cache
        }
      );
    };

    // Detect location immediately on app start
    detectLiveLocation();
  }, []);

  // Helper function to update ambulance location in database
  const updateAmbulanceLocationInDB = async (location: [number, number]) => {
    if (dataSource === 'supabase') {
      try {
        const { updateAmbulanceLocation: updateAmbulanceLocationDB } = await import('../services/supabaseService');
        await updateAmbulanceLocationDB('550e8400-e29b-41d4-a716-446655440000', location[0], location[1]);
        console.log('📍 Location updated in database:', location);
      } catch (error) {
        console.error('❌ Error updating ambulance location in database:', error);
      }
    }
  };

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
            
            // Load ambulance location (but don't override live location if already detected)
            if (!initialLocationSet) {
              const ambulanceData = await getAmbulance();
              if (ambulanceData) {
                setAmbulanceLocation([ambulanceData.latitude, ambulanceData.longitude]);
                console.log('📍 Loaded ambulance location from database:', [ambulanceData.latitude, ambulanceData.longitude]);
              }
            }
            
            // Load notifications
            const notificationsData = await getNotifications();
            setNotifications(notificationsData);
            
            setDataSource('supabase');
            
            // Set up real-time subscriptions
            const ambulanceSubscription = subscribeToAmbulances((payload) => {
              if (payload.eventType === 'UPDATE' && payload.new) {
                // Only update if it's not the initial location detection
                if (initialLocationSet) {
                  setAmbulanceLocation([payload.new.latitude, payload.new.longitude]);
                  console.log('📍 Real-time ambulance location update:', [payload.new.latitude, payload.new.longitude]);
                }
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
  }, [initialLocationSet]);

  const toggleEmergency = () => {
    const newEmergencyState = !emergencyActive;
    setEmergencyActive(newEmergencyState);
    console.log('🚨 Emergency mode:', newEmergencyState ? 'ACTIVATED' : 'DEACTIVATED');
  };

  const selectHospital = (hospital: Hospital | null) => {
    console.log('🏥 AppContext: Selecting hospital:', hospital?.name || 'None');
    setSelectedHospital(hospital);
    
    if (hospital) {
      console.log('🏥 Hospital selected, checkpoints will be generated automatically');
    } else {
      // Clear route when hospital is deselected
      setCurrentRoute(null);
      setIsCreatingRoute(false);
      setCheckpointRoute(null);
      console.log('🗺️ AppContext: Route and checkpoints cleared');
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

    // Checkpoints will be regenerated automatically when ambulance location changes
    console.log('🗺️ AppContext: Checkpoints will be regenerated for new location');
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
      
      // Reset ambulance to live location if available, otherwise use default
      const resetLocation: [number, number] = initialLocationSet ? ambulanceLocation : [40.7128, -74.006];
      await updateAmbulanceLocation(resetLocation);
      
      // Deactivate emergency mode
      setEmergencyActive(false);
      
      // Clear selected hospital, route, and checkpoints
      setSelectedHospital(null);
      setCurrentRoute(null);
      setIsCreatingRoute(false);
      setCheckpointRoute(null);
      
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
    isCreatingRoute,
    isDetectingLocation,
    locationError,
    initialLocationSet,
    checkpointRoute,
    setCheckpointRoute,
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