import { Hospital, Notification } from '../types';

// Check if Supabase is available
const isSupabaseAvailable = () => {
  return import.meta.env.VITE_SUPABASE_URL && 
         import.meta.env.VITE_SUPABASE_ANON_KEY && 
         import.meta.env.VITE_DATA_SOURCE !== 'mock';
};

// Mock notification storage for when Supabase is not available
let mockNotifications: Notification[] = [];

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
    
    if (isSupabaseAvailable()) {
      const { createNotification } = await import('./supabaseService');
      await createNotification({
        type: 'hospital',
        target_id: hospital.id,
        message,
      });
    } else {
      // Store in mock notifications
      const notification: Notification = {
        id: `n-${Date.now()}-${Math.random()}`,
        type: 'hospital',
        targetId: hospital.id,
        message,
        timestamp: new Date(),
        read: false,
      };
      mockNotifications.unshift(notification);
    }
    
    console.log(`Notified hospital ${hospital.name}`);
    console.log(`Patient condition: ${patientInfo.condition}, ETA: ${patientInfo.eta} minutes`);
    
    return true;
  } catch (error) {
    console.error('Error notifying hospital:', error);
    return false;
  }
};

// Get notifications for a specific entity
export const getNotifications = async (entityId: string, entityType: 'hospital'): Promise<Notification[]> => {
  if (isSupabaseAvailable()) {
    try {
      const { getNotifications: getNotificationsFromDB } = await import('./supabaseService');
      return getNotificationsFromDB(entityId, entityType);
    } catch (error) {
      console.error('Error fetching notifications from Supabase:', error);
    }
  }
  
  // Return mock notifications
  return mockNotifications.filter(
    notification => notification.targetId === entityId && notification.type === entityType
  );
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  if (isSupabaseAvailable()) {
    try {
      const { markNotificationAsRead: markAsRead } = await import('./supabaseService');
      await markAsRead(notificationId);
      return true;
    } catch (error) {
      console.error('Error marking notification as read in Supabase:', error);
    }
  }
  
  // Update mock notifications
  mockNotifications = mockNotifications.map(notification =>
    notification.id === notificationId ? { ...notification, read: true } : notification
  );
  
  return true;
};

// Get all notifications (for mock mode)
export const getAllNotifications = (): Notification[] => {
  return mockNotifications;
};

// Clear all notifications (for testing)
export const clearAllNotifications = () => {
  mockNotifications = [];
};