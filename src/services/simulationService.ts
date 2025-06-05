import { Route, TrafficSignal, EmergencyStatus } from '../types';
import { notifyTrafficSignal, notifyHospital } from './notificationService';
import { calculateDistance } from '../utils/mockData';

// Simulates the ambulance moving along a route
export const simulateAmbulanceMovement = (
  route: Route,
  trafficSignals: TrafficSignal[],
  onLocationUpdate: (location: [number, number]) => void,
  onTrafficSignalUpdate: (id: string, status: EmergencyStatus) => void,
  onComplete: () => void
) => {
  const waypoints = [...route.waypoints];
  let currentWaypointIndex = 0;
  
  // The traffic signals on this route
  const relevantTrafficSignals = trafficSignals.filter(signal => 
    route.trafficSignalsOnRoute.includes(signal.id)
  );
  
  // Set initial position to first waypoint
  onLocationUpdate(waypoints[0]);
  
  // Process waypoints one by one with realistic timing
  const processNextWaypoint = () => {
    currentWaypointIndex++;
    
    if (currentWaypointIndex >= waypoints.length) {
      // Route completed
      onComplete();
      return;
    }
    
    const currentPosition = waypoints[currentWaypointIndex];
    onLocationUpdate(currentPosition);
    
    // Check for nearby traffic signals to notify
    relevantTrafficSignals.forEach(signal => {
      const distance = calculateDistance(currentPosition, signal.coordinates);
      
      // If we're approaching a traffic signal (within 0.5 km)
      if (distance < 0.5) {
        onTrafficSignalUpdate(signal.id, EmergencyStatus.APPROACHING);
        notifyTrafficSignal(signal, EmergencyStatus.APPROACHING, Math.floor(distance * 60)); // ETA in seconds
      } 
      // If we're at a traffic signal
      else if (distance < 0.1) {
        onTrafficSignalUpdate(signal.id, EmergencyStatus.ACTIVE);
        notifyTrafficSignal(signal, EmergencyStatus.ACTIVE, 0);
      }
      // If we've passed a traffic signal (check previous position)
      else if (
        currentWaypointIndex > 0 && 
        calculateDistance(waypoints[currentWaypointIndex - 1], signal.coordinates) < 0.2
      ) {
        onTrafficSignalUpdate(signal.id, EmergencyStatus.PASSED);
        notifyTrafficSignal(signal, EmergencyStatus.PASSED, 0);
      }
    });
    
    // Calculate time to next waypoint (roughly based on distance)
    const nextWaypoint = waypoints[currentWaypointIndex + 1];
    if (nextWaypoint) {
      const distance = calculateDistance(currentPosition, nextWaypoint);
      const timeToNextWaypoint = Math.max(1000, Math.min(3000, distance * 1000)); // Between 1-3 seconds
      
      setTimeout(processNextWaypoint, timeToNextWaypoint);
    } else {
      // Final waypoint reached
      onComplete();
    }
  };
  
  // Start the simulation
  setTimeout(processNextWaypoint, 1500); // Start after a small delay
  
  // Return a function to cancel the simulation if needed
  return {
    cancel: () => {
      // This would clear any timers or state in a more complex implementation
      console.log('Simulation cancelled');
    }
  };
};

// Simulates the hospital preparing for the ambulance arrival
export const simulateHospitalPreparation = (
  hospitalId: string,
  patientCondition: string,
  eta: number, // in minutes
  onStatusUpdate: (status: string, progress: number) => void
) => {
  const totalSteps = 5;
  let currentStep = 0;
  
  const statusMessages = [
    'Notification received',
    'Emergency room being prepared',
    'Medical team assembled',
    'Equipment readied',
    'Ready for patient arrival'
  ];
  
  // Notify hospital initially
  notifyHospital(
    { id: hospitalId } as any, // We only need the ID here
    { condition: patientCondition, eta }
  );
  
  // Update status at intervals
  const interval = setInterval(() => {
    currentStep++;
    const progress = (currentStep / totalSteps) * 100;
    
    onStatusUpdate(
      currentStep < totalSteps ? statusMessages[currentStep] : statusMessages[statusMessages.length - 1],
      progress
    );
    
    if (currentStep >= totalSteps) {
      clearInterval(interval);
    }
  }, eta * 60 * 1000 / totalSteps); // Divide the ETA into equal steps
  
  // Return a function to cancel the simulation if needed
  return {
    cancel: () => {
      clearInterval(interval);
      console.log('Hospital preparation simulation cancelled');
    }
  };
};