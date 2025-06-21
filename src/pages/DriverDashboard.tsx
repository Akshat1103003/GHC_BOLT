import React, { useState, useEffect } from 'react';
import { Clock, User, MapPin, Guitar as Hospital } from 'lucide-react';
import MapView from '../components/map/MapView';
import EmergencyToggle from '../components/common/EmergencyToggle';
import HospitalSelect from '../components/common/HospitalSelect';
import LocationSelector from '../components/common/LocationSelector';
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
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ambulance Driver Dashboard</h1>
          <p className="text-gray-600">Manage emergency routes and monitor hospital coordination</p>
        </div>
        
        {/* Reset Button in Header */}
        <div className="mt-4 md:mt-0">
          <ResetButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Left column - Controls with separate scrolling */}
        <div className="lg:col-span-1 h-full overflow-y-auto space-y-6 pr-2">
          {/* Emergency toggle */}
          <EmergencyToggle className="mb-6" />

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
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{emergencyLocationType} Location</span>
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
            </div>
          </div>

          {/* Hospital selection with search and confirmation */}
          <HospitalSelect
            hospitals={hospitals}
            currentLocation={emergencyLocation}
            onSelect={handleHospitalSelect}
            onConfirm={handleHospitalConfirm}
            onSearchLocationChange={setSearchLocationForMap}
          />
        </div>

        {/* Right columns - Map and status centered */}
        <div className="lg:col-span-2 h-full flex flex-col space-y-6">
          {/* Status cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
            <StatusCard
              title="Route Status"
              status={routeStatus.status as any}
              message={routeStatus.message}
              details={routeStatus.details}
              icon={<Clock size={20} />}
              progress={currentRoute ? (emergencyActive ? 75 : 50) : 0}
            />

            <StatusCard
              title="Hospital Status"
              status={selectedHospital?.emergencyReady ? 'success' : 'warning'}
              message={selectedHospital ? (selectedHospital.emergencyReady ? 'Ready for emergency' : 'Limited capacity') : 'No hospital selected'}
              details={selectedHospital ? `${selectedHospital.name} - ${selectedHospital.address}` : 'Please select a destination hospital'}
              icon={<Hospital size={20} />}
            />
          </div>

          {/* Map view with search location - centered and prominent */}
          <div className="flex-grow min-h-0">
            <MapView 
              className="h-full" 
              searchLocation={searchLocationForMap}
            />
          </div>

          {/* Notifications */}
          <div className="flex-shrink-0 max-h-64 overflow-hidden">
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