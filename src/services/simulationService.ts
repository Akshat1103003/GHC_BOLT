import { Route, TrafficSignal, EmergencyStatus } from '../types';
import { notifyTrafficSignal, notifyHospital } from './notificationService';
import { updateAmbulanceLocation, updateTrafficSignalStatus } from './supabaseService';

// Use a proper UUID for the default ambulance ID
const DEFAULT_AMBULANCE_ID = '550e8400-e29b-41d4-a716-446655440000';

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

// Simulates the ambulance moving along a route with enhanced traffic signal detection and configurable speed
export const simulateAmbulanceMovement = (
  route: Route,
  trafficSignals: TrafficSignal[],
  onLocationUpdate: (location: [number, number]) => void,
  onTrafficSignalUpdate: (id: string, status: EmergencyStatus) => void,
  onComplete: () => void,
  speedFactor: number = 1 // Speed multiplier (1 = normal, 2 = 2x faster, 0.5 = half speed)
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
  
  console.log(`🚑 Starting ambulance simulation with ${speedFactor}x speed`);
  console.log(`📍 Route: ${waypoints.length} waypoints, ${route.distance.toFixed(1)}km total`);
  
  // Process waypoints one by one with realistic timing
  const processNextWaypoint = async () => {
    if (!isRunning) return;
    
    currentWaypointIndex++;
    
    if (currentWaypointIndex >= waypoints.length) {
      // Route completed - reset all traffic signals
      console.log('🏥 Ambulance arrived at destination');
      for (const signal of trafficSignals) {
        await updateTrafficSignalStatus(signal.id, EmergencyStatus.PASSED);
        onTrafficSignalUpdate(signal.id, EmergencyStatus.PASSED);
      }
      onComplete();
      return;
    }
    
    const currentPosition = waypoints[currentWaypointIndex];
    onLocationUpdate(currentPosition);
    
    console.log(`🚑 Ambulance moved to waypoint ${currentWaypointIndex}/${waypoints.length - 1}: [${currentPosition[0].toFixed(4)}, ${currentPosition[1].toFixed(4)}]`);
    
    // Update ambulance location in database
    try {
      await updateAmbulanceLocation(DEFAULT_AMBULANCE_ID, currentPosition[0], currentPosition[1], 'en_route');
    } catch (error) {
      console.error('Error updating ambulance location in database:', error);
    }
    
    // Enhanced traffic signal detection and status updates
    for (const signal of trafficSignals) {
      const distance = calculateDistance(currentPosition, signal.coordinates);
      const signalState = signalStates.get(signal.id)!;
      
      // Update signal status based on distance and previous state
      let newStatus = signalState.status;
      
      if (distance <= 0.1) {
        // Ambulance is at the traffic signal (within 100m)
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
        
        console.log(`🚦 Traffic signal ${signal.intersection}: ${newStatus.toUpperCase()} (${distance.toFixed(1)}km away)`);
        
        // Update in database
        try {
          await updateTrafficSignalStatus(signal.id, newStatus);
        } catch (error) {
          console.error('Error updating traffic signal in database:', error);
        }
        
        // Notify traffic signal system
        if (newStatus === EmergencyStatus.APPROACHING) {
          await notifyTrafficSignal(signal, newStatus, Math.floor(distance * 60)); // ETA in seconds
        } else if (newStatus === EmergencyStatus.ACTIVE) {
          await notifyTrafficSignal(signal, newStatus, 0);
        } else if (newStatus === EmergencyStatus.PASSED) {
          await notifyTrafficSignal(signal, newStatus, 0);
        }
      }
      
      // Update last known distance
      signalState.lastDistance = distance;
    }
    
    // Calculate time to next waypoint with configurable speed
    const nextWaypoint = waypoints[currentWaypointIndex + 1];
    if (nextWaypoint) {
      const distance = calculateDistance(currentPosition, nextWaypoint);
      // Base timing: Emergency vehicles travel at roughly 30-35 km/h average in city
      // Timing between waypoints: 2.0-5.0 seconds base, adjusted by speedFactor
      const baseTimeToNextWaypoint = Math.max(2000, Math.min(5000, distance * 2500)); // Between 2.0-5.0 seconds
      const adjustedTime = baseTimeToNextWaypoint / speedFactor; // Apply speed factor
      
      console.log(`⏱️ Next waypoint in ${(adjustedTime / 1000).toFixed(1)}s (${speedFactor}x speed)`);
      
      setTimeout(processNextWaypoint, adjustedTime);
    } else {
      // Final waypoint reached
      console.log('🏥 Ambulance reached final destination');
      try {
        await updateAmbulanceLocation(DEFAULT_AMBULANCE_ID, currentPosition[0], currentPosition[1], 'at_hospital');
      } catch (error) {
        console.error('Error updating ambulance status to at_hospital:', error);
      }
      onComplete();
    }
  };
  
  // Start the simulation after a small delay
  setTimeout(processNextWaypoint, 1000);
  
  // Return a function to cancel the simulation
  return {
    cancel: () => {
      isRunning = false;
      console.log('🛑 Ambulance movement simulation cancelled');
    }
  };
};

// Simulates the hospital preparing for the ambulance arrival
export const simulateHospitalPreparation = async (
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
  
  console.log(`🏥 Starting hospital preparation simulation for ${hospitalId}`);
  console.log(`⏱️ ETA: ${eta} minutes, Patient condition: ${patientCondition}`);
  
  // Notify hospital initially
  try {
    await notifyHospital(
      { id: hospitalId } as any,
      { condition: patientCondition, eta }
    );
  } catch (error) {
    console.error('Error notifying hospital:', error);
  }
  
  // Update status at intervals
  const stepInterval = (eta * 60 * 1000) / totalSteps; // Divide ETA into equal steps
  
  const updateStep = () => {
    if (!isRunning) return;
    
    currentStep++;
    const progress = Math.min(100, (currentStep / totalSteps) * 100);
    
    const statusMessage = currentStep <= totalSteps ? statusMessages[currentStep - 1] : statusMessages[statusMessages.length - 1];
    onStatusUpdate(statusMessage, progress);
    
    console.log(`🏥 Hospital preparation: ${statusMessage} (${progress.toFixed(0)}%)`);
    
    if (currentStep < totalSteps) {
      setTimeout(updateStep, stepInterval);
    } else {
      console.log('🏥 Hospital preparation complete - ready for patient arrival');
    }
  };
  
  // Start the preparation process
  setTimeout(updateStep, stepInterval);
  
  // Return a function to cancel the simulation
  return {
    cancel: () => {
      isRunning = false;
      console.log('🛑 Hospital preparation simulation cancelled');
    }
  };
};