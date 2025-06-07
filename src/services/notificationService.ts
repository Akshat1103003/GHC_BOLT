import { TrafficSignal, Hospital, EmergencyStatus } from '../types';
import { createNotification } from './supabaseService';

// Simulate sending notifications to traffic signals
export const notifyTrafficSignal = async (
  trafficSignal: TrafficSignal,
  status: EmergencyStatus,
  estimatedTimeOfArrival: number // in seconds
): Promise<boolean> => {
  try {
    let message = '';
    
    switch (status) {
      case EmergencyStatus.APPROACHING:
        message = `Emergency vehicle approaching ${trafficSignal.intersection} in ${Math.ceil(estimatedTimeOfArrival / 60)} minutes`;
        break;
      case EmergencyStatus.ACTIVE:
        message = `Emergency vehicle passing through ${trafficSignal.intersection}`;
        break;
      case EmergencyStatus.PASSED:
        message = `Emergency vehicle has passed ${trafficSignal.intersection}`;
        break;
      default:
        message = `Traffic signal ${trafficSignal.intersection} status updated to ${status}`;
    }
    
    await createNotification({
      type: 'trafficSignal',
      target_id: trafficSignal.id,
      message,
    });
    
    console.log(`Notified traffic signal ${trafficSignal.id} at ${trafficSignal.intersection}`);
    console.log(`Status: ${status}, ETA: ${estimatedTimeOfArrival} seconds`);
    
    return true;
  } catch (error) {
    console.error('Error notifying traffic signal:', error);
    return false;
  }
};

// Simulate sending notifications to hospitals
export const notifyHospital = async (
  hospital: Hospital,
  patientInfo: {
    condition: string;
    eta: number; // in minutes
  }
): Promise<boolean> => {
  try {
    const message = `Ambulance incoming to ${hospital.name} - Patient: ${patientInfo.condition}, ETA: ${patientInfo.eta} minutes`;
    
    await createNotification({
      type: 'hospital',
      target_id: hospital.id,
      message,
    });
    
    console.log(`Notified hospital ${hospital.name}`);
    console.log(`Patient condition: ${patientInfo.condition}, ETA: ${patientInfo.eta} minutes`);
    
    return true;
  } catch (error) {
    console.error('Error notifying hospital:', error);
    return false;
  }
};

// Legacy functions for backward compatibility
export const getNotifications = async (entityId: string, entityType: 'hospital' | 'trafficSignal') => {
  const { getNotifications: getNotificationsFromDB } = await import('./supabaseService');
  return getNotificationsFromDB(entityId, entityType);
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { markNotificationAsRead: markAsRead } = await import('./supabaseService');
    await markAsRead(notificationId);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};