import React, { useState, useEffect } from 'react';
import { Clock, User, MapPin, Guitar as Hospital, Crosshair, AlertTriangle } from 'lucide-react';
import MapView from '../components/map/MapView';
import EmergencyToggle from '../components/common/EmergencyToggle';
import HospitalSelect from '../components/common/HospitalSelect';
import LocationSelector from '../components/common/LocationSelector';
import LiveLocationButton from '../components/common/LiveLocationButton';
import ResetButton from '../components/common/ResetButton';
import StatusCard from '../components/dashboard/StatusCard';
import NotificationPanel from '../components/notifications/NotificationPanel';
import { useAppContext } from '../contexts/AppContext';

const DriverDashboard: React.FC = () => {
  const {
    emergencyActive,
    toggleEmergency,
    ambulanceLocation,
    updateAmbulanceLocation,
    selectedHospital,
    selectHospital,
    currentRoute,
    hospitals,
    notifications,
    markNotificationAsRead,
    isLoading,
    isDetectingLocation,
    locationError,
    initialLocationSet,
  } = useAppContext();

  const [patientInfo, setPatientInfo] = useState({
    condition: 'Stable',
    age: 42,
    gender: 'Male',
  });

  const [routeStatus, setRouteStatus] = useState({
    status: 'inactive',
    message: 'No active route',
    details: 'Select a hospital to create a route',
  });

  const [searchLocationForMap, setSearchLocationForMap] = useState<[number, number] | null>(null);
  const [emergencyLocation, setEmergencyLocation] = useState<[number, number]>(ambulanceLocation);
  const [emergencyLocationType, setEmergencyLocationType] = useState<'current' | 'selected'>('current');
  const [emergencyLocationName, setEmergencyLocationName] = useState<string>('Current Location');

  // Update route status when route changes
  useEffect(() => {
    if (currentRoute && selectedHospital) {
      setRouteStatus({
        status: emergencyActive ? 'warning' : 'info',
        message: `Route to ${selectedHospital.name} ${emergencyActive ? 'active' : 'planned'}`,
        details: `${currentRoute.distance.toFixed(1)} km - Estimated ${Math.ceil(currentRoute.duration)} minutes`,
      });
    } else if (selectedHospital) {
      setRouteStatus({
        status: 'info',
        message: `Hospital selected: ${selectedHospital.name}`,
        details: 'Route is being calculated...',
      });
    } else {
      setRouteStatus({
        status: 'inactive',
        message: 'No active route',
        details: 'Select a hospital to create a route',
      });
    }
  }, [currentRoute, selectedHospital, emergencyActive]);

  // Sync emergency location with ambulance location
  useEffect(() => {
    if (ambulanceLocation && initialLocationSet) {
      setEmergencyLocation(ambulanceLocation);
    }
  }, [ambulanceLocation, initialLocationSet]);

  // Handle emergency location change
  const handleEmergencyLocationChange = (
    location: [number, number], 
    locationType: 'current' | 'selected',
    locationName?: string
  ) => {
    setEmergencyLocation(location);
    setEmergencyLocationType(locationType);
    setEmergencyLocationName(locationName || 'Emergency Location');
    
    // Update ambulance location to the emergency location
    updateAmbulanceLocation(location);
  };

  // Handle hospital selection
  const handleHospitalSelect = (hospital: any) => {
    console.log('🏥 DriverDashboard: Hospital selected:', hospital.name);
    selectHospital(hospital);
  };

  // Handle hospital confirmation and start emergency route
  const handleHospitalConfirm = async (hospital: any) => {
    try {
      console.log('🚨 DriverDashboard: Confirming hospital route to:', hospital.name);
      
      // Activate emergency mode if not already active
      if (!emergencyActive) {
        toggleEmergency();
      }

      // Hospital selection and route creation is handled automatically by AppContext
      console.log(`✅ Emergency route confirmed to ${hospital.name}`);
    } catch (error) {
      console.error('Error confirming hospital route:', error);
      throw error;
    }
  };

  // Get location status for display
  const getLocationStatus = () => {
    if (isDetectingLocation) {
      return { status: 'warning', message: 'Detecting live location...', icon: <Crosshair className="animate-spin" size={20} /> };
    } else if (locationError) {
      return { status: 'error', message: 'Location detection failed', icon: <AlertTriangle size={20} /> };
    } else if (initialLocationSet) {
      return { status: 'success', message: 'Live location active', icon: <MapPin size={20} /> };
    } else {
      return { status: 'warning', message: 'Location required', icon: <MapPin size={20} /> };
    }
  };

  const locationStatus = getLocationStatus();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              Ambulance Driver Dashboard
              {isDetectingLocation && (
                <Crosshair className="ml-2 animate-spin text-amber-500" size={24} />
              )}
            </h1>
            <p className="text-gray-600">
              {isDetectingLocation 
                ? 'Detecting your live location for accurate emergency response...'
                : locationError
                ? 'Using default location - Live location detection failed'
                : 'Manage emergency routes and monitor hospital coordination'
              }
            </p>
          </div>
          
          {/* Reset Button in Header */}
          <div className="mt-4 md:mt-0">
            <ResetButton />
          </div>
        </div>

        {/* Live Location Detection Banner */}
        {isDetectingLocation && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <Crosshair className="animate-spin h-6 w-6 text-amber-600 mr-3" />
              <div>
                <h3 className="text-amber-800 font-medium">Detecting Your Live Location</h3>
                <p className="text-amber-700 text-sm">
                  Please allow location access for accurate emergency response. This ensures the ambulance position is correctly tracked.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location Error Banner */}
        {locationError && !isDetectingLocation && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-red-800 font-medium">Location Detection Failed</h3>
                <p className="text-red-700 text-sm">
                  {locationError} Using default location (New York). You can manually set a location using the location selector below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left column - Controls */}
          <div className="xl:col-span-1 space-y-6">
            {/* Live Location Control - NEW */}
            <LiveLocationButton />

            {/* Emergency toggle */}
            <EmergencyToggle />

            {/* Emergency Location Selector */}
            <LocationSelector
              onLocationChange={handleEmergencyLocationChange}
            />

            {/* Patient information */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <User className="mr-2" size={18} />
                Patient Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Condition:</span>
                  <span className="font-medium">{patientInfo.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium">{patientInfo.age}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium">{patientInfo.gender}</span>
                </div>
                <div className="pt-2">
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition-colors">
                    Update Patient Info
                  </button>
                </div>
              </div>
            </div>

            {/* Current ambulance location */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <MapPin className="mr-2" size={18} />
                Ambulance Location
                {isDetectingLocation && (
                  <Crosshair className="ml-2 animate-spin text-amber-500" size={16} />
                )}
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize flex items-center">
                    {emergencyLocationType} Location
                    {isDetectingLocation && (
                      <span className="ml-2 text-amber-600 text-xs animate-pulse">(Detecting...)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-sm">{emergencyLocationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-medium">{ambulanceLocation[0].toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-medium">{ambulanceLocation[1].toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                </div>
                
                {/* Location status indicator */}
                <div className={`mt-3 p-2 rounded-md ${
                  locationStatus.status === 'success' ? 'bg-green-50 border border-green-200' :
                  locationStatus.status === 'warning' ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    {locationStatus.icon}
                    <span className={`ml-2 text-sm font-medium ${
                      locationStatus.status === 'success' ? 'text-green-800' :
                      locationStatus.status === 'warning' ? 'text-amber-800' :
                      'text-red-800'
                    }`}>
                      {locationStatus.message}
                    </span>
                  </div>
                  {locationError && (
                    <p className="text-xs text-red-600 mt-1">{locationError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Middle column - Map */}
          <div className="xl:col-span-2">
            <div className="space-y-6">
              {/* Status cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatusCard
                  title="Location Status"
                  status={locationStatus.status as any}
                  message={locationStatus.message}
                  details={isDetectingLocation 
                    ? 'GPS location detection in progress...' 
                    : locationError 
                    ? 'Using default location as fallback'
                    : 'Live GPS location is active'
                  }
                  icon={locationStatus.icon}
                  progress={isDetectingLocation ? 50 : initialLocationSet ? 100 : 0}
                />

                <StatusCard
                  title="Route Status"
                  status={routeStatus.status as any}
                  message={routeStatus.message}
                  details={routeStatus.details}
                  icon={<Clock size={20} />}
                  progress={currentRoute ? (emergencyActive ? 75 : 50) : 0}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatusCard
                  title="Hospital Status"
                  status={selectedHospital?.emergencyReady ? 'success' : 'warning'}
                  message={selectedHospital ? (selectedHospital.emergencyReady ? 'Ready for emergency' : 'Limited capacity') : 'No hospital selected'}
                  details={selectedHospital ? `${selectedHospital.name} - ${selectedHospital.address}` : 'Please select a destination hospital'}
                  icon={<Hospital size={20} />}
                />
              </div>

              {/* Enhanced Map view */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <MapView 
                  searchLocation={searchLocationForMap}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Right column - Hospital selection and notifications */}
          <div className="xl:col-span-1 space-y-6">
            {/* Hospital selection with search and confirmation */}
            <HospitalSelect
              hospitals={hospitals}
              currentLocation={emergencyLocation}
              onSelect={handleHospitalSelect}
              onConfirm={handleHospitalConfirm}
              onSearchLocationChange={setSearchLocationForMap}
            />

            {/* Notifications */}
            <NotificationPanel
              notifications={notifications}
              onMarkAsRead={markNotificationAsRead}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;