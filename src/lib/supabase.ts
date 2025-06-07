import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      ambulances: {
        Row: {
          id: string;
          driver_name: string;
          latitude: number;
          longitude: number;
          status: 'idle' | 'en_route' | 'at_hospital';
          current_route_id: string | null;
          patient_condition: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_name?: string;
          latitude: number;
          longitude: number;
          status?: 'idle' | 'en_route' | 'at_hospital';
          current_route_id?: string | null;
          patient_condition?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_name?: string;
          latitude?: number;
          longitude?: number;
          status?: 'idle' | 'en_route' | 'at_hospital';
          current_route_id?: string | null;
          patient_condition?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      hospitals: {
        Row: {
          id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          phone: string;
          specialties: string[];
          emergency_ready: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          phone: string;
          specialties?: string[];
          emergency_ready?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          phone?: string;
          specialties?: string[];
          emergency_ready?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      traffic_signals: {
        Row: {
          id: string;
          latitude: number;
          longitude: number;
          intersection: string;
          status: 'inactive' | 'approaching' | 'active' | 'passed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          latitude: number;
          longitude: number;
          intersection: string;
          status?: 'inactive' | 'approaching' | 'active' | 'passed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          latitude?: number;
          longitude?: number;
          intersection?: string;
          status?: 'inactive' | 'approaching' | 'active' | 'passed';
          created_at?: string;
          updated_at?: string;
        };
      };
      routes: {
        Row: {
          id: string;
          ambulance_id: string;
          hospital_id: string;
          start_latitude: number;
          start_longitude: number;
          end_latitude: number;
          end_longitude: number;
          waypoints: any;
          distance: number;
          duration: number;
          traffic_signals_on_route: string[];
          status: 'planned' | 'active' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ambulance_id: string;
          hospital_id: string;
          start_latitude: number;
          start_longitude: number;
          end_latitude: number;
          end_longitude: number;
          waypoints?: any;
          distance?: number;
          duration?: number;
          traffic_signals_on_route?: string[];
          status?: 'planned' | 'active' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ambulance_id?: string;
          hospital_id?: string;
          start_latitude?: number;
          start_longitude?: number;
          end_latitude?: number;
          end_longitude?: number;
          waypoints?: any;
          distance?: number;
          duration?: number;
          traffic_signals_on_route?: string[];
          status?: 'planned' | 'active' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          type: 'hospital' | 'trafficSignal';
          target_id: string;
          message: string;
          read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'hospital' | 'trafficSignal';
          target_id: string;
          message: string;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'hospital' | 'trafficSignal';
          target_id?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}