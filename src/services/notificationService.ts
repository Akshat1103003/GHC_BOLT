import { Notification, EmergencyStatus, TrafficSignal, Hospital } from '../types';

// Simulate sending notifications to traffic signals
export const notifyTrafficSignal = async (
  trafficSignal: TrafficSignal,
  status: EmergencyStatus,
  estimatedTimeOfArrival: number // in seconds
): Promise<boolean> => {
  // In a real application, this would make an API call to the traffic signal system
  console.log(`Notifying traffic signal ${trafficSignal.id} at ${trafficSignal.intersection}`);
  console.log(`Status: ${status}, ETA: ${estimatedTimeOfArrival} seconds`);
  
  // Simulate a delay for the API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simulate success response
  return true;
};

// Simulate sending notifications to hospitals
export const notifyHospital = async (
  hospital: Hospital,
  patientInfo: {
    condition: string;
    eta: number; // in minutes
  }
): Promise<boolean> => {
  // In a real application, this would make an API call to the hospital system
  console.log(`Notifying hospital ${hospital.name}`);
  console.log(`Patient condition: ${patientInfo.condition}, ETA: ${patientInfo.eta} minutes`);
  
  // Simulate a delay for the API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simulate success response
  return true;
};

// Get notifications for a specific entity (hospital or traffic signal)
export const getNotifications = (entityId: string, entityType: 'hospital' | 'trafficSignal'): Notification[] => {
  // In a real application, this would fetch from an API or database
  
  // Mock notifications
  const mockNotifications: Notification[] = [
    {
      id: 'n1',
      type: 'hospital',
      targetId: 'h1',
      message: 'Ambulance #A-123 arriving in 8 minutes with cardiac patient',
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      read: false,
    },
    {
      id: 'n2',
      type: 'trafficSignal',
      targetId: 't3',
      message: 'Emergency vehicle approaching in 45 seconds',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: true,
    },
    {
      id: 'n3',
      type: 'hospital',
      targetId: 'h2',
      message: 'Ambulance #B-456 arriving in 12 minutes with trauma patient',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      read: true,
    },
    {
      id: 'n4',
      type: 'trafficSignal',
      targetId: 't1',
      message: 'Emergency vehicle has passed',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      read: true,
    },
  ];
  
  return mockNotifications.filter(
    notification => notification.targetId === entityId && notification.type === entityType
  );
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  // In a real application, this would update a database
  console.log(`Marking notification ${notificationId} as read`);
  
  // Simulate a delay for the API call
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Simulate success response
  return true;
};