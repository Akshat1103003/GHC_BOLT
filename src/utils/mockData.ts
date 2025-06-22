import { Hospital } from '../types';

// Global hospitals from various cities and countries with actual coordinates
export const mockHospitals: Hospital[] = [
  // New York City, USA
  {
    id: 'h1',
    name: 'NewYork-Presbyterian Hospital',
    address: '525 E 68th St, New York, NY 10065, USA',
    coordinates: [40.7677, -73.9537],
    phone: '(212) 746-5454',
    specialties: ['Emergency', 'Trauma', 'Cardiology', 'Neurosurgery'],
    emergencyReady: true,
  },
  {
    id: 'h2',
    name: 'Mount Sinai Hospital',
    address: '1 Gustave L. Levy Pl, New York, NY 10029, USA',
    coordinates: [40.7903, -73.9509],
    phone: '(212) 241-6500',
    specialties: ['Emergency', 'Neurology', 'Pediatrics', 'Oncology'],
    emergencyReady: true,
  },

  // London, UK
  {
    id: 'h3',
    name: 'St. Bartholomew\'s Hospital',
    address: 'West Smithfield, London EC1A 7BE, UK',
    coordinates: [51.5174, -0.1006],
    phone: '+44 20 3465 5000',
    specialties: ['Emergency', 'Cardiology', 'Cancer Care', 'Surgery'],
    emergencyReady: true,
  },
  {
    id: 'h4',
    name: 'Guy\'s Hospital',
    address: 'Great Maze Pond, London SE1 9RT, UK',
    coordinates: [51.5043, -0.0865],
    phone: '+44 20 7188 7188',
    specialties: ['Emergency', 'Trauma', 'Transplant', 'Neurosurgery'],
    emergencyReady: true,
  },

  // Paris, France
  {
    id: 'h5',
    name: 'Hôpital de la Pitié-Salpêtrière',
    address: '47-83 Bd de l\'Hôpital, 75013 Paris, France',
    coordinates: [48.8387, 2.3601],
    phone: '+33 1 42 16 00 00',
    specialties: ['Emergency', 'Neurology', 'Cardiology', 'Internal Medicine'],
    emergencyReady: true,
  },
  {
    id: 'h6',
    name: 'Hôpital Saint-Louis',
    address: '1 Ave Claude Vellefaux, 75010 Paris, France',
    coordinates: [48.8718, 2.3661],
    phone: '+33 1 42 49 49 49',
    specialties: ['Emergency', 'Hematology', 'Dermatology', 'Oncology'],
    emergencyReady: false,
  },

  // Tokyo, Japan
  {
    id: 'h7',
    name: 'The University of Tokyo Hospital',
    address: '7-3-1 Hongo, Bunkyo City, Tokyo 113-8655, Japan',
    coordinates: [35.7122, 139.7619],
    phone: '+81 3-3815-5411',
    specialties: ['Emergency', 'Advanced Medicine', 'Research', 'Surgery'],
    emergencyReady: true,
  },
  {
    id: 'h8',
    name: 'St. Luke\'s International Hospital',
    address: '9-1 Akashi-cho, Chuo City, Tokyo 104-8560, Japan',
    coordinates: [35.6719, 139.7648],
    phone: '+81 3-3541-5151',
    specialties: ['Emergency', 'International Care', 'Cardiology', 'Pediatrics'],
    emergencyReady: true,
  },

  // Sydney, Australia
  {
    id: 'h9',
    name: 'Royal Prince Alfred Hospital',
    address: 'Missenden Rd, Camperdown NSW 2050, Australia',
    coordinates: [-33.8886, 151.1873],
    phone: '+61 2 9515 6111',
    specialties: ['Emergency', 'Trauma', 'Transplant', 'Burns Unit'],
    emergencyReady: true,
  },
  {
    id: 'h10',
    name: 'St Vincent\'s Hospital Sydney',
    address: '390 Victoria St, Darlinghurst NSW 2010, Australia',
    coordinates: [-33.8796, 151.2169],
    phone: '+61 2 8382 1111',
    specialties: ['Emergency', 'Cardiology', 'HIV/AIDS', 'Mental Health'],
    emergencyReady: false,
  },

  // Toronto, Canada
  {
    id: 'h11',
    name: 'Toronto General Hospital',
    address: '200 Elizabeth St, Toronto, ON M5G 2C4, Canada',
    coordinates: [43.6591, -79.3890],
    phone: '+1 416-340-4800',
    specialties: ['Emergency', 'Transplant', 'Cardiology', 'Critical Care'],
    emergencyReady: true,
  },
  {
    id: 'h12',
    name: 'The Hospital for Sick Children',
    address: '555 University Ave, Toronto, ON M5G 1X8, Canada',
    coordinates: [43.6568, -79.3914],
    phone: '+1 416-813-1500',
    specialties: ['Emergency', 'Pediatrics', 'Surgery', 'Research'],
    emergencyReady: true,
  },

  // Mumbai, India
  {
    id: 'h13',
    name: 'Tata Memorial Hospital',
    address: 'Dr E Borges Rd, Parel, Mumbai, Maharashtra 400012, India',
    coordinates: [19.0144, 72.8397],
    phone: '+91 22 2417 7000',
    specialties: ['Emergency', 'Oncology', 'Nuclear Medicine', 'Research'],
    emergencyReady: true,
  },
  {
    id: 'h14',
    name: 'King Edward Memorial Hospital',
    address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012, India',
    coordinates: [19.0176, 72.8414],
    phone: '+91 22 2410 7000',
    specialties: ['Emergency', 'General Medicine', 'Surgery', 'Pediatrics'],
    emergencyReady: false,
  },

  // São Paulo, Brazil
  {
    id: 'h15',
    name: 'Hospital das Clínicas',
    address: 'R. Dr. Ovídio Pires de Campos, 225 - Cerqueira César, São Paulo - SP, 05403-010, Brazil',
    coordinates: [-23.5558, -46.6708],
    phone: '+55 11 2661-0000',
    specialties: ['Emergency', 'Research', 'Transplant', 'Cardiology'],
    emergencyReady: true,
  },

  // Berlin, Germany
  {
    id: 'h16',
    name: 'Charité - Universitätsmedizin Berlin',
    address: 'Charitéplatz 1, 10117 Berlin, Germany',
    coordinates: [52.5251, 13.3765],
    phone: '+49 30 450 50',
    specialties: ['Emergency', 'Research', 'Neurology', 'Cardiology'],
    emergencyReady: true,
  },

  // Dubai, UAE
  {
    id: 'h17',
    name: 'Dubai Hospital',
    address: 'Oud Metha Rd - Dubai - United Arab Emirates',
    coordinates: [25.2285, 55.3273],
    phone: '+971 4-219-5000',
    specialties: ['Emergency', 'Trauma', 'Cardiology', 'International Care'],
    emergencyReady: true,
  },

  // Singapore
  {
    id: 'h18',
    name: 'Singapore General Hospital',
    address: 'Outram Rd, Singapore 169608',
    coordinates: [1.2793, 103.8347],
    phone: '+65 6222 3322',
    specialties: ['Emergency', 'Trauma', 'Transplant', 'Advanced Medicine'],
    emergencyReady: true,
  },
];

// Re-export utilities for backward compatibility
export { calculateDistance, calculateDuration } from './routeUtils';

// Get real-time traffic data (placeholder for future integration)
export const getRealTimeTrafficData = async (coordinates: [number, number][]): Promise<any> => {
  return {
    congestionLevel: Math.random() * 100,
    averageSpeed: 30 + Math.random() * 40,
    incidents: Math.random() > 0.8 ? ['accident', 'construction', 'road_closure'][Math.floor(Math.random() * 3)] : null,
    estimatedDelay: Math.random() * 5,
  };
};

// Get nearby points of interest
export const getNearbyPOIs = (
  center: [number, number],
  radius: number = 2
): { type: string; name: string; coordinates: [number, number] }[] => {
  const pois = [
    { type: 'fire_station', name: 'Fire Station Central', coordinates: [40.7505, -73.9934] as [number, number] },
    { type: 'fire_station', name: 'London Fire Brigade', coordinates: [51.5074, -0.1278] as [number, number] },
    { type: 'fire_station', name: 'Tokyo Fire Department', coordinates: [35.6762, 139.6503] as [number, number] },
    { type: 'police_station', name: 'Metropolitan Police', coordinates: [51.5155, -0.0922] as [number, number] },
    { type: 'police_station', name: 'Tokyo Metropolitan Police', coordinates: [35.6812, 139.7671] as [number, number] },
    { type: 'police_station', name: 'NYPD Precinct', coordinates: [40.7282, -73.9942] as [number, number] },
    { type: 'emergency_service', name: 'Emergency Management Center', coordinates: [40.7128, -74.0060] as [number, number] },
    { type: 'emergency_service', name: 'Emergency Response Unit', coordinates: [48.8566, 2.3522] as [number, number] },
  ];
  
  return pois.filter(poi => {
    const R = 6371;
    const dLat = (poi.coordinates[0] - center[0]) * Math.PI / 180;
    const dLon = (poi.coordinates[1] - center[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(center[0] * Math.PI / 180) * Math.cos(poi.coordinates[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance <= radius;
  });
};