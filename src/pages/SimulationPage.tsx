import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
import MapView from '../components/map/MapView';
import HospitalSelect from '../components/common/HospitalSelect';
import ResetButton from '../components/common/ResetButton';
import StatusCard from '../components/dashboard/StatusCard';
import { useAppContext } from '../contexts/AppContext';

const SimulationPage: React.FC = () => {
  const {
    ambulanceLocation,
    updateAmbulanceLocation,
    selectedHospital,
    selectHospital,
    toggleEmergency,
    emergencyActive,
    currentRoute,
    hospitals,
    isLoading,
  } = useAppContext();

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulation, setSimulation] = useState<any>(null);
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [hospitalStatus, setHospitalStatus] = useState('Waiting for notification');
  const [hospitalPreparationProgress, setHospitalPreparationProgress] = useState(0);
  const [searchLocationForMap, setSearchLocationForMap] = useState<[number, number] | null>(null);

  // Simulation steps description
  const simulationSteps = [
    'Select a hospital and start the simulation',
    'Ambulance begins journey, emergency mode activated',
    'Hospital prepares for patient arrival',
    'Ambulance arrives at hospital',
    'Simulation complete',
  ];

  // Handle hospital selection
  const handleHospitalSelect = (hospital: any) => {
    // Reset any previous simulation
    if (simulation) {
      simulation.cancel();
      setSimulation(null);
    }
    
    // Reset states
    setSimulationStep(0);
    setSimulationProgress(0);
    setIsSimulationRunning(false);
    setHospitalStatus('Waiting for notification');
    setHospitalPreparationProgress(0);
    
    // Update app context - route will be created automatically
    selectHospital(hospital);
    console.log('🏥 SimulationPage: Hospital selected:', hospital.name);
  };

  // Handle search location change from HospitalSelect
  const handleSearchLocationChange = (location: [number, number] | null) => {
    setSearchLocationForMap(location);
  };

  // Start or pause simulation
  const toggleSimulation = () => {
    if (isSimulationRunning) {
      // Pause simulation
      setIsSimulationRunning(false);
      if (simulation) {
        simulation.cancel();
        setSimulation(null);
      }
    } else {
      // Start simulation
      if (!selectedHospital) {
        alert('Please select a hospital first');
        return;
      }
      
      setIsSimulationRunning(true);
      
      // If we're at step 0, advance to step 1
      if (simulationStep === 0) {
        setSimulationStep(1);
        setSimulationProgress(25);
        
        // Activate emergency mode if not already active
        if (!emergencyActive) {
          toggleEmergency();
        }
      }
      
      // Start simple simulation
      const sim = startSimpleSimulation();
      setSimulation(sim);
    }
  };

  // Simple simulation without complex movement
  const startSimpleSimulation = () => {
    let currentStep = simulationStep;
    let isRunning = true;
    
    const updateSimulation = () => {
      if (!isRunning) return;
      
      currentStep++;
      setSimulationStep(currentStep);
      setSimulationProgress(currentStep * 25);
      
      if (currentStep === 2) {
        setHospitalStatus('Hospital notified - preparing for arrival');
        setHospitalPreparationProgress(50);
      } else if (currentStep === 3) {
        setHospitalStatus('Hospital ready for patient arrival');
        setHospitalPreparationProgress(100);
      } else if (currentStep >= 4) {
        setIsSimulationRunning(false);
        setSimulation(null);
        setHospitalStatus('Patient arrived - simulation complete');
        
        // Deactivate emergency mode after a delay
        setTimeout(() => {
          if (emergencyActive) {
            toggleEmergency();
          }
        }, 2000);
        return;
      }
      
      // Continue simulation
      setTimeout(updateSimulation, 3000 / simulationSpeed);
    };
    
    // Start the simulation
    setTimeout(updateSimulation, 1000);
    
    return {
      cancel: () => {
        isRunning = false;
        console.log('🛑 Simulation cancelled');
      }
    };
  };

  // Reset simulation
  const resetSimulation = () => {
    // Cancel any running simulation
    if (simulation) {
      simulation.cancel();
      setSimulation(null);
    }
    
    // Reset states
    setSimulationStep(0);
    setSimulationProgress(0);
    setIsSimulationRunning(false);
    setHospitalStatus('Waiting for notification');
    setHospitalPreparationProgress(0);
    
    // Deactivate emergency mode if active
    if (emergencyActive) {
      toggleEmergency();
    }
    
    // Reset ambulance to original position
    updateAmbulanceLocation([40.7128, -74.006]);
    
    // Clear selected hospital
    selectHospital(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactive Simulation</h1>
          <p className="text-gray-600">Experience the emergency response system in action</p>
        </div>
        
        {/* Reset Button in Header */}
        <div className="mt-4 md:mt-0">
          <ResetButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Simulation controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Simulation Controls</h2>
            
            <div className="space-y-6">
              {/* Status */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Current step:</p>
                <p className="font-medium text-gray-900">{simulationSteps[simulationStep]}</p>
                
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-blue-600 transition-all duration-500" 
                    style={{ width: `${simulationProgress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={toggleSimulation}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md font-medium ${
                    isSimulationRunning
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {isSimulationRunning ? (
                    <>
                      <Pause className="mr-2" size={18} />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2" size={18} />
                      {simulationStep === 0 || simulationStep >= 4 ? 'Start' : 'Resume'}
                    </>
                  )}
                </button>
                
                <button
                  onClick={resetSimulation}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md font-medium"
                >
                  <RotateCcw className="mr-2" size={18} />
                  Reset
                </button>
              </div>
              
              {/* Simulation speed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Simulation Speed: {simulationSpeed}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.5"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x (Slow)</span>
                  <span>1x (Normal)</span>
                  <span>2x (Fast)</span>
                  <span>3x (Very Fast)</span>
                </div>
              </div>
              
              {/* Emergency status */}
              <div className={`p-3 rounded-md ${emergencyActive ? 'bg-red-100' : 'bg-gray-100'}`}>
                <div className="flex items-center">
                  <AlertCircle className={`${emergencyActive ? 'text-red-500' : 'text-gray-400'} ${emergencyActive ? 'animate-pulse' : ''}`} size={20} />
                  <span className={`ml-2 font-medium ${emergencyActive ? 'text-red-800' : 'text-gray-600'}`}>
                    {emergencyActive ? 'Emergency Mode Active' : 'Emergency Mode Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hospital selection with search */}
          <HospitalSelect
            hospitals={hospitals}
            currentLocation={ambulanceLocation}
            onSelect={handleHospitalSelect}
            onSearchLocationChange={handleSearchLocationChange}
          />
          
          {/* Hospital preparation status */}
          <StatusCard
            title="Hospital Preparation"
            status={hospitalPreparationProgress > 0 ? (hospitalPreparationProgress >= 100 ? 'success' : 'info') : 'warning'}
            message={hospitalStatus}
            progress={hospitalPreparationProgress}
          />
        </div>

        {/* Right column - Map and visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map view with search location */}
          <MapView searchLocation={searchLocationForMap} />
          
          {/* Simulation explanation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">How This Simulation Works</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                This interactive simulation demonstrates how our emergency response system creates routes for ambulances and coordinates with hospitals in real-time.
              </p>
              
              <ol className="list-decimal list-inside space-y-2 text-gray-600 pl-4">
                <li>Search for a location or select a destination hospital from the list</li>
                <li>Press the Start button to begin the simulation</li>
                <li>Adjust the simulation speed using the slider (0.5x to 3x speed)</li>
                <li>Watch as the ambulance route is displayed on the map</li>
                <li>The hospital will prepare for the patient's arrival</li>
                <li>Monitor real-time updates in the status cards</li>
              </ol>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Route Visualization:</strong> The system automatically creates and displays route paths on the map when you select a hospital. Routes are optimized for emergency vehicles with realistic waypoints and timing.
                </p>
              </div>
              
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Real-time Data:</strong> This system can integrate with live databases. All changes are synchronized across connected clients in real-time when using Supabase backend.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPage;