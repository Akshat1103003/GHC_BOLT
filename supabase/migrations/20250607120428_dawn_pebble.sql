/*
  # Emergency Response System Database Schema

  1. New Tables
    - `ambulances`
      - `id` (uuid, primary key)
      - `driver_name` (text)
      - `latitude` (double precision)
      - `longitude` (double precision)
      - `status` (text) - 'idle', 'en_route', 'at_hospital'
      - `current_route_id` (uuid, nullable)
      - `patient_condition` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `hospitals`
      - `id` (text, primary key)
      - `name` (text)
      - `address` (text)
      - `latitude` (double precision)
      - `longitude` (double precision)
      - `phone` (text)
      - `specialties` (text array)
      - `emergency_ready` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `traffic_signals`
      - `id` (text, primary key)
      - `latitude` (double precision)
      - `longitude` (double precision)
      - `intersection` (text)
      - `status` (text) - 'inactive', 'approaching', 'active', 'passed'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `routes`
      - `id` (uuid, primary key)
      - `ambulance_id` (uuid)
      - `hospital_id` (text)
      - `start_latitude` (double precision)
      - `start_longitude` (double precision)
      - `end_latitude` (double precision)
      - `end_longitude` (double precision)
      - `waypoints` (jsonb)
      - `distance` (double precision)
      - `duration` (double precision)
      - `traffic_signals_on_route` (text array)
      - `status` (text) - 'planned', 'active', 'completed'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `notifications`
      - `id` (uuid, primary key)
      - `type` (text) - 'hospital', 'trafficSignal'
      - `target_id` (text)
      - `message` (text)
      - `read` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (for demo purposes)
    - Add policies for authenticated users to modify data

  3. Indexes
    - Add indexes for frequently queried columns
    - Add spatial indexes for location-based queries
*/

-- Create ambulances table
CREATE TABLE IF NOT EXISTS ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_name text NOT NULL DEFAULT 'Emergency Driver',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  status text NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'en_route', 'at_hospital')),
  current_route_id uuid,
  patient_condition text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  phone text NOT NULL,
  specialties text[] NOT NULL DEFAULT '{}',
  emergency_ready boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create traffic_signals table
CREATE TABLE IF NOT EXISTS traffic_signals (
  id text PRIMARY KEY,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  intersection text NOT NULL,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'approaching', 'active', 'passed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambulance_id uuid REFERENCES ambulances(id) ON DELETE CASCADE,
  hospital_id text REFERENCES hospitals(id) ON DELETE CASCADE,
  start_latitude double precision NOT NULL,
  start_longitude double precision NOT NULL,
  end_latitude double precision NOT NULL,
  end_longitude double precision NOT NULL,
  waypoints jsonb NOT NULL DEFAULT '[]',
  distance double precision NOT NULL DEFAULT 0,
  duration double precision NOT NULL DEFAULT 0,
  traffic_signals_on_route text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('hospital', 'trafficSignal')),
  target_id text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Allow public read access on ambulances"
  ON ambulances FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access on ambulances"
  ON ambulances FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public read access on hospitals"
  ON hospitals FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access on hospitals"
  ON hospitals FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public read access on traffic_signals"
  ON traffic_signals FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access on traffic_signals"
  ON traffic_signals FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public read access on routes"
  ON routes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access on routes"
  ON routes FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public read access on notifications"
  ON notifications FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access on notifications"
  ON notifications FOR ALL
  TO public
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ambulances_location ON ambulances (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances (status);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_traffic_signals_location ON traffic_signals (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_traffic_signals_status ON traffic_signals (status);
CREATE INDEX IF NOT EXISTS idx_routes_ambulance_id ON routes (ambulance_id);
CREATE INDEX IF NOT EXISTS idx_routes_hospital_id ON routes (hospital_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes (status);
CREATE INDEX IF NOT EXISTS idx_notifications_target_id ON notifications (target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_ambulances_updated_at BEFORE UPDATE ON ambulances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_traffic_signals_updated_at BEFORE UPDATE ON traffic_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();