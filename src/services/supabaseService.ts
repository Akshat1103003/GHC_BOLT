import { supabase } from '../lib/supabase';
import { Hospital, TrafficSignal, EmergencyStatus, Route, Notification } from '../types';

// Use a proper UUID for the default ambulance ID
const DEFAULT_AMBULANCE_ID = '550e8400-e29b-41d4-a716-446655440000';

// Ambulance operations
export const getAmbulance = async (id: string = DEFAULT_AMBULANCE_ID) => {
  const { data, error } = await supabase
    .from('ambulances')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching ambulance:', error);
    return null;
  }
  
  return data;
};

export const updateAmbulanceLocation = async (
  id: string = DEFAULT_AMBULANCE_ID,
  latitude: number,
  longitude: number,
  status?: 'idle' | 'en_route' | 'at_hospital'
) => {
  const updateData: any = { latitude, longitude };
  if (status) updateData.status = status;
  
  const { data, error } = await supabase
    .from('ambulances')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating ambulance location:', error);
    return null;
  }
  
  return data;
};

// Hospital operations
export const getHospitals = async (): Promise<Hospital[]> => {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching hospitals:', error);
    return [];
  }
  
  return data.map(hospital => ({
    id: hospital.id,
    name: hospital.name,
    address: hospital.address,
    coordinates: [hospital.latitude, hospital.longitude] as [number, number],
    phone: hospital.phone,
    specialties: hospital.specialties,
    emergencyReady: hospital.emergency_ready,
  }));
};

export const getHospital = async (id: string): Promise<Hospital | null> => {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching hospital:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    address: data.address,
    coordinates: [data.latitude, data.longitude] as [number, number],
    phone: data.phone,
    specialties: data.specialties,
    emergencyReady: data.emergency_ready,
  };
};

// Traffic signal operations
export const getTrafficSignals = async (): Promise<TrafficSignal[]> => {
  const { data, error } = await supabase
    .from('traffic_signals')
    .select('*')
    .order('intersection');
  
  if (error) {
    console.error('Error fetching traffic signals:', error);
    return [];
  }
  
  return data.map(signal => ({
    id: signal.id,
    coordinates: [signal.latitude, signal.longitude] as [number, number],
    intersection: signal.intersection,
    status: signal.status as EmergencyStatus,
  }));
};

export const updateTrafficSignalStatus = async (
  id: string,
  status: EmergencyStatus
) => {
  const { data, error } = await supabase
    .from('traffic_signals')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating traffic signal status:', error);
    return null;
  }
  
  return data;
};

// Route operations
export const createRoute = async (route: {
  ambulance_id: string;
  hospital_id: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  waypoints: [number, number][];
  distance: number;
  duration: number;
  traffic_signals_on_route: string[];
}) => {
  const { data, error } = await supabase
    .from('routes')
    .insert({
      ...route,
      waypoints: route.waypoints,
      status: 'planned'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating route:', error);
    return null;
  }
  
  return data;
};

export const updateRouteStatus = async (
  id: string,
  status: 'planned' | 'active' | 'completed'
) => {
  const { data, error } = await supabase
    .from('routes')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating route status:', error);
    return null;
  }
  
  return data;
};

// Notification operations
export const getNotifications = async (
  targetId?: string,
  type?: 'hospital' | 'trafficSignal'
): Promise<Notification[]> => {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (targetId) {
    query = query.eq('target_id', targetId);
  }
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  
  return data.map(notification => ({
    id: notification.id,
    type: notification.type as 'hospital' | 'trafficSignal',
    targetId: notification.target_id,
    message: notification.message,
    timestamp: new Date(notification.created_at),
    read: notification.read,
  }));
};

export const createNotification = async (notification: {
  type: 'hospital' | 'trafficSignal';
  target_id: string;
  message: string;
}) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }
  
  return data;
};

export const markNotificationAsRead = async (id: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }
  
  return data;
};

// Real-time subscriptions
export const subscribeToAmbulances = (callback: (payload: any) => void) => {
  return supabase
    .channel('ambulances')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'ambulances' },
      callback
    )
    .subscribe();
};

export const subscribeToTrafficSignals = (callback: (payload: any) => void) => {
  return supabase
    .channel('traffic_signals')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'traffic_signals' },
      callback
    )
    .subscribe();
};

export const subscribeToNotifications = (callback: (payload: any) => void) => {
  return supabase
    .channel('notifications')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'notifications' },
      callback
    )
    .subscribe();
};

export const subscribeToRoutes = (callback: (payload: any) => void) => {
  return supabase
    .channel('routes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'routes' },
      callback
    )
    .subscribe();
};