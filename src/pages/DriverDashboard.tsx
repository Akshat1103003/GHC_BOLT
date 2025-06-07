import React, { useState, useEffect } from 'react';
import { Clock, User, MapPin, Guitar as Hospital } from 'lucide-react';
import MapView from '../components/map/MapView';
import EmergencyToggle from '../components/common/EmergencyToggle';
import HospitalSelect from '../components/common/HospitalSelect';
import ResetButton from '../components/common/ResetButton';
import StatusCard from '../components/dashboard/StatusCard';
import NotificationPanel from '../components/notifications/NotificationPanel';
import { useAppContext } from '../contexts/AppContext';
import { calculateRoute } from '../utils/mockData';
import { simulateAmbulanceMovement } from '../services/simulationService';

const DriverDashboard: React.FC = () => {
  const {
    emergencyActive,
    ambulanceLocation,
    updateAmbulanceLocation,
    selectedHospital,
    selectHospital,
    trafficSignals,
    updateTrafficSignal,
    setCurrentRoute,
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

  const [simulation, setSimulation] = useState<any>(null);
  const [routeStatus, setRouteStatus] = useState({
    status: 'inactive',
    message: 'No active route',
    details: 'Select a hospital to create a route',
  });

  // Handle hospital selection
  const handleHospitalSelect = (hospital: any) => {
    selectHospital(hospital);
    
    // Calculate and set the route
    const route = calculateRoute(ambulanceLocation, hospital.id);
    setCurrentRoute(route);
    
    // Update route status
    setRouteStatus({
      status: 'info',
      message: `Route to ${hospital.name} created`,
      details: `${route.distance.toFixed(1)} km - Estimated ${Math.ceil(route.duration)} minutes`,
    });
    
    // Start simulation if emergency is active
    if (emergencyActive && simulation === null) {
      startSimulation(route);
    }
  };

  // Start the ambulance movement simulation
  const startSimulation = (route: any) => {
    const sim = simulateAmbulanceMovement(
      route,
      trafficSignals,
      (location) => {
        updateAmbulanceLocation(location);
      },
      (id, status) => {
        updateTrafficSignal(id, status);
      },
      () => {
        // Simulation complete
        setRouteStatus({
          status: 'success',
          message: 'Arrived at destination',
          details: 'Patient transfer in progress',
        });
        setSimulation(null);
      }
    );
    
    setSimulation(sim);
    
    setRouteStatus({
      status: 'warning',
      message: 'En route to hospital',
      details: `Emergency active - ${route.distance.toFixed(1)} km remaining`,
    });
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
          <p className="text-gray-600">Manage emergency routes and monitor traffic signals</p>
        </div>
        
        {/* Reset Button in Header */}
        <div className="mt-4 md:mt-0">
          <ResetButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Emergency toggle */}
          <EmergencyToggle className="mb-6" />

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

          {/* Current location */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <MapPin className="mr-2" size={18} />
              Current Location
            </h2>
            <div className="space-y-2">
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

          {/* Hospital selection */}
          <HospitalSelect
            hospitals={hospitals}
            currentLocation={ambulanceLocation}
            onSelect={handleHospitalSelect}
          />
        </div>

        {/* Middle and right columns - Map and status with separate scrolling */}
        <div className="lg:col-span-2 h-screen overflow-y-auto space-y-6 pr-2">
          {/* Status cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusCard
              title="Route Status"
              status={routeStatus.status as any}
              message={routeStatus.message}
              details={routeStatus.details}
              icon={<Clock size={20} />}
              progress={selectedHospital ? (emergencyActive ? 60 : 30) : 0}
            />

            <StatusCard
              title="Hospital Status"
              status={selectedHospital?.emergencyReady ? 'success' : 'warning'}
              message={selectedHospital ? (selectedHospital.emergencyReady ? 'Ready for emergency' : 'Limited capacity') : 'No hospital selected'}
              details={selectedHospital ? `${selectedHospital.name} - ${selectedHospital.address}` : 'Please select a destination hospital'}
              icon={<Hospital size={20} />}
            />
          </div>

          {/* Map view */}
          <MapView />

          {/* Notifications */}
          <NotificationPanel
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
          />
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;