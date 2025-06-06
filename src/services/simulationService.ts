import { Route, TrafficSignal, EmergencyStatus } from '../types';
import { notifyTrafficSignal, notifyHospital } from './notificationService';

// Calculate distance between two points (Haversine formula)
const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2[0] - point1[0]) * Math.PI / 180;
  const dLon = (point2[1] - point1[1]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Simulates the ambulance moving along a route with enhanced traffic signal detection
export const simulateAmbulanceMovement = (
  route: Route,
  trafficSignals: TrafficSignal[],
  onLocationUpdate: (location: [number, number]) => void,
  onTrafficSignalUpdate: (id: string, status: EmergencyStatus) => void,
  onComplete: () => void
) => {
  const waypoints = [...route.waypoints];
  let currentWaypointIndex = 0;
  let isRunning = true;
  
  // Enhanced traffic signal tracking
  const signalStates = new Map<string, { 
    status: EmergencyStatus, 
    lastDistance: number,
    notified: boolean 
  }>();
  
  // Initialize signal states
  trafficSignals.forEach(signal => {
    signalStates.set(signal.id, {
      status: EmergencyStatus.INACTIVE,
      lastDistance: Infinity,
      notified: false
    });
  });
  
  // Set initial position to first waypoint
  onLocationUpdate(waypoints[0]);
  
  // Process waypoints one by one with realistic timing
  const processNextWaypoint = () => {
    if (!isRunning) return;
    
    currentWaypointIndex++;
    
    if (currentWaypointIndex >= waypoints.length) {
      // Route completed - reset all traffic signals
      trafficSignals.forEach(signal => {
        onTrafficSignalUpdate(signal.id, EmergencyStatus.PASSED);
      });
      onComplete();
      return;
    }
    
    const currentPosition = waypoints[currentWaypointIndex];
    onLocationUpdate(currentPosition);
    
    // Enhanced traffic signal detection and status updates
    trafficSignals.forEach(signal => {
      const distance = calculateDistance(currentPosition, signal.coordinates);
      const signalState = signalStates.get(signal.id)!;
      
      // Update signal status based on distance and previous state
      let newStatus = signalState.status;
      
      if (distance <= 0.1) {
        // Ambulance is at the traffic signal
        newStatus = EmergencyStatus.ACTIVE;
      } else if (distance <= 0.5 && signalState.lastDistance > distance) {
        // Ambulance is approaching (within 500m and getting closer)
        newStatus = EmergencyStatus.APPROACHING;
      } else if (distance <= 2.0 && signalState.lastDistance > distance) {
        // Ambulance is within 2km range and approaching
        if (signalState.status === EmergencyStatus.INACTIVE) {
          newStatus = EmergencyStatus.APPROACHING;
        }
      } else if (distance > 0.5 && signalState.lastDistance < distance && signalState.status !== EmergencyStatus.INACTIVE) {
        // Ambulance is moving away from the signal
        newStatus = EmergencyStatus.PASSED;
      }
      
      // Update signal state if changed
      if (newStatus !== signalState.status) {
        signalState.status = newStatus;
        onTrafficSignalUpdate(signal.id, newStatus);
        
        // Notify traffic signal system
        if (newStatus === EmergencyStatus.APPROACHING) {
          notifyTrafficSignal(signal, newStatus, Math.floor(distance * 60)); // ETA in seconds
        } else if (newStatus === EmergencyStatus.ACTIVE) {
          notifyTrafficSignal(signal, newStatus, 0);
        } else if (newStatus === EmergencyStatus.PASSED) {
          notifyTrafficSignal(signal, newStatus, 0);
        }
      }
      
      // Update last known distance
      signalState.lastDistance = distance;
    });
    
    // Calculate time to next waypoint (based on distance and emergency speed)
    const nextWaypoint = waypoints[currentWaypointIndex + 1];
    if (nextWaypoint) {
      const distance = calculateDistance(currentPosition, nextWaypoint);
      // Emergency vehicles travel faster - roughly 60 km/h average in city
      const timeToNextWaypoint = Math.max(800, Math.min(2500, distance * 1000)); // Between 0.8-2.5 seconds
      
      setTimeout(processNextWaypoint, timeToNextWaypoint);
    } else {
      // Final waypoint reached
      onComplete();
    }
  };
  
  // Start the simulation after a small delay
  setTimeout(processNextWaypoint, 1000);
  
  // Return a function to cancel the simulation
  return {
    cancel: () => {
      isRunning = false;
      console.log('Ambulance movement simulation cancelled');
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
  let isRunning = true;
  
  const statusMessages = [
    'Emergency notification received',
    'Trauma team being assembled',
    'Emergency room being prepared',
    'Medical equipment being readied',
    'Ready for patient arrival'
  ];
  
  // Notify hospital initially
  notifyHospital(
    { id: hospitalId } as any,
    { condition: patientCondition, eta }
  );
  
  // Update status at intervals
  const stepInterval = (eta * 60 * 1000) / totalSteps; // Divide ETA into equal steps
  
  const updateStep = () => {
    if (!isRunning) return;
    
    currentStep++;
    const progress = Math.min(100, (currentStep / totalSteps) * 100);
    
    onStatusUpdate(
      currentStep <= totalSteps ? statusMessages[currentStep - 1] : statusMessages[statusMessages.length - 1],
      progress
    );
    
    if (currentStep < totalSteps) {
      setTimeout(updateStep, stepInterval);
    }
  };
  
  // Start the preparation process
  setTimeout(updateStep, stepInterval);
  
  // Return a function to cancel the simulation
  return {
    cancel: () => {
      isRunning = false;
      console.log('Hospital preparation simulation cancelled');
    }
  };
};