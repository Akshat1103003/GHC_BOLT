/*
  # Seed Initial Data for Emergency Response System

  1. Data Insertion
    - Insert sample hospitals with their locations and specialties
    - Insert traffic signals at key intersections
    - Insert sample ambulance with proper UUID

  2. Data Safety
    - Uses ON CONFLICT to handle existing data safely
    - Updates existing records with new data if needed
*/

-- Insert hospitals
INSERT INTO hospitals (id, name, address, latitude, longitude, phone, specialties, emergency_ready) VALUES
('h1', 'City General Hospital', '123 Main St, City Center', 40.7589, -73.9851, '(555) 123-4567', ARRAY['Emergency', 'Trauma', 'Cardiology'], true),
('h2', 'Memorial Medical Center', '456 Park Ave, Downtown', 40.7282, -73.9942, '(555) 987-6543', ARRAY['Emergency', 'Neurology', 'Pediatrics'], true),
('h3', 'University Hospital', '789 College Blvd, Uptown', 40.7831, -73.9712, '(555) 246-8135', ARRAY['Emergency', 'Oncology', 'Surgery'], false),
('h4', 'Riverside Health Center', '321 River Rd, Eastside', 40.7505, -73.9934, '(555) 369-7412', ARRAY['Emergency', 'Orthopedics', 'Geriatrics'], true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  phone = EXCLUDED.phone,
  specialties = EXCLUDED.specialties,
  emergency_ready = EXCLUDED.emergency_ready,
  updated_at = now();

-- Insert traffic signals
INSERT INTO traffic_signals (id, latitude, longitude, intersection, status) VALUES
('t1', 40.7200, -74.0050, 'Main St & 1st Ave', 'inactive'),
('t2', 40.7350, -73.9900, 'Park Ave & 5th St', 'inactive'),
('t3', 40.7450, -73.9850, 'Broadway & 10th St', 'inactive'),
('t4', 40.7520, -73.9880, 'Liberty Ave & Madison St', 'inactive'),
('t5', 40.7600, -73.9820, 'Central Ave & Washington Blvd', 'inactive'),
('t6', 40.7300, -73.9950, 'Queens Blvd & 3rd Ave', 'inactive'),
('t7', 40.7400, -73.9750, 'Lexington Ave & 42nd St', 'inactive'),
('t8', 40.7250, -73.9980, 'Houston St & Broadway', 'inactive')
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  intersection = EXCLUDED.intersection,
  status = EXCLUDED.status,
  updated_at = now();

-- Insert sample ambulance with proper UUID
INSERT INTO ambulances (id, driver_name, latitude, longitude, status, patient_condition) VALUES
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Emergency Driver', 40.7128, -74.0060, 'idle', null)
ON CONFLICT (id) DO UPDATE SET
  driver_name = EXCLUDED.driver_name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  status = EXCLUDED.status,
  patient_condition = EXCLUDED.patient_condition,
  updated_at = now();