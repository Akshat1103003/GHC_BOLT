/*
  # Create default ambulance record

  1. New Records
    - Insert a default ambulance with UUID '550e8400-e29b-41d4-a716-446655440000'
    - Set initial location and status for the ambulance

  2. Purpose
    - Ensures the application has a valid ambulance record to work with
    - Prevents UUID errors when the application tries to fetch ambulance data
*/

INSERT INTO ambulances (
  id,
  driver_name,
  latitude,
  longitude,
  status,
  patient_condition
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Emergency Driver',
  40.7128,
  -74.0060,
  'idle',
  NULL
) ON CONFLICT (id) DO NOTHING;