import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import MapView from '../components/map/MapView';
import HospitalSelect from '../components/common/HospitalSelect';
import StatusCard from '../components/dashboard/StatusCard';
import TrafficSignal from '../components/traffic/TrafficSignal';
import { useAppContext } from '../contexts/AppContext';
import { mockHospitals, calculateRoute } from '../utils/mockData';
import { simulateAmbulanceMovement, simulateHospitalPreparation } from '../services/simulationService';
import { EmergencyStatus } from '../types';

const SimulationPage: React.FC = () => {
  const {
    ambulanceLocation,
    updateAmbulanceLocation,
    selectedHospital,
    selectHospital,
    trafficSignals,
    updateTrafficSignal,
    toggleEmergency,
    emergencyActive,
    setCurrentRoute,
  } = useAppContext();

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulation, setSimulation] = useState<any>(null);
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [hospitalStatus, setHospitalStatus] = useState('Waiting for notification');
  const [hospitalPreparationProgress, setHospitalPreparationProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Simulation steps description
  const simulationSteps = [
    'Select a hospital and start the simulation',
    'Ambulance begins journey, emergency mode activated',
    'Traffic signals notified as ambulance approaches',
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
    
    // Update app context
    selectHospital(hospital);
    
    // Reset traffic signals
    trafficSignals.forEach(signal => {
      updateTrafficSignal(signal.id, EmergencyStatus.INACTIVE);
    });
    
    // Calculate route
    const route = calculateRoute(ambulanceLocation, hospital.id);
    setCurrentRoute(route);
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
        setSimulationProgress(20);
        
        // Activate emergency mode if not already active
        if (!emergencyActive) {
          toggleEmergency();
        }
      }
      
      // Calculate route
      const route = calculateRoute(ambulanceLocation, selectedHospital.id);
      
      // Start ambulance movement simulation
      const sim = simulateAmbulanceMovement(
        route,
        trafficSignals,
        (location) => {
          updateAmbulanceLocation(location);
        },
        (id, status) => {
          updateTrafficSignal(id, status);
          
          // If the first traffic signal is approaching, advance to step 2
          if (status === EmergencyStatus.APPROACHING && simulationStep < 2) {
            setSimulationStep(2);
            setSimulationProgress(40);
          }
          
          // If any traffic signal is active, advance to step 3 if not already there
          if (status === EmergencyStatus.ACTIVE && simulationStep < 3) {
            setSimulationStep(3);
            setSimulationProgress(60);
            
            // Start hospital preparation simulation
            simulateHospitalPreparation(
              selectedHospital.id,
              'Critical',
              route.duration / 2, // Half of the route duration
              (status, progress) => {
                setHospitalStatus(status);
                setHospitalPreparationProgress(progress);
              }
            );
          }
        },
        () => {
          // Simulation complete
          setSimulationStep(5);
          setSimulationProgress(100);
          setIsSimulationRunning(false);
          setSimulation(null);
          
          // Set hospital as fully prepared
          setHospitalStatus('Ready for patient arrival');
          setHospitalPreparationProgress(100);
          
          // Deactivate emergency mode after a delay
          setTimeout(() => {
            if (emergencyActive) {
              toggleEmergency();
            }
          }, 2000);
        }
      );
      
      setSimulation(sim);
    }
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
    
    // Reset traffic signals
    trafficSignals.forEach(signal => {
      updateTrafficSignal(signal.id, EmergencyStatus.INACTIVE);
    });
    
    // Deactivate emergency mode if active
    if (emergencyActive) {
      toggleEmergency();
    }
    
    // Reset ambulance to original position
    updateAmbulanceLocation([40.7128, -74.006]);
    
    // Clear selected hospital
    selectHospital(null);
    setCurrentRoute(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Interactive Simulation</h1>
        <p className="text-gray-600">Experience the emergency response system in action</p>
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
                      <Pause className="mr-2\" size={18} />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2" size={18} />
                      {simulationStep === 0 || simulationStep === 5 ? 'Start' : 'Resume'}
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
                  max="2"
                  step="0.5"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
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
          
          {/* Traffic Signal Preview */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Traffic Signal Preview</h2>
            <TrafficSignal
              status={trafficSignals[0]?.status || EmergencyStatus.INACTIVE}
              intersection={trafficSignals[0]?.intersection || 'Main St & 1st Ave'}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
            />
          </div>

          {/* Hospital selection */}
          <HospitalSelect
            hospitals={mockHospitals}
            currentLocation={ambulanceLocation}
            onSelect={handleHospitalSelect}
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
          {/* Map view */}
          <MapView />
          
          {/* Traffic Signals Grid */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Traffic Signal Network</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trafficSignals.map((signal) => (
                <TrafficSignal
                  key={signal.id}
                  status={signal.status}
                  intersection={signal.intersection}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled(!soundEnabled)}
                />
              ))}
            </div>
          </div>
          
          {/* Simulation explanation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">How This Simulation Works</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                This interactive simulation demonstrates how our emergency response system creates green corridors for ambulances by communicating with traffic signals and hospitals in real-time.
              </p>
              
              <ol className="list-decimal list-inside space-y-2 text-gray-600 pl-4">
                <li>Select a destination hospital from the list on the left</li>
                <li>Press the Start button to begin the simulation</li>
                <li>Watch as the ambulance travels along the optimal route</li>
                <li>Traffic signals will change status as the ambulance approaches</li>
                <li>The hospital will prepare for the patient's arrival</li>
                <li>Monitor real-time updates in the status cards</li>
              </ol>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> In a real implementation, this system would communicate with actual traffic infrastructure and hospital systems using IoT devices and secure APIs.
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