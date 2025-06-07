import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Ambulance, Building2, MapPin, AlertTriangle, Navigation } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { EmergencyStatus } from '../../types';
import { getNearbyPOIs } from '../../utils/mockData';

import 'leaflet/dist/leaflet.css';

// Fix for leaflet marker icons
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface MapViewProps {
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({ className = '' }) => {
  const { 
    ambulanceLocation, 
    selectedHospital, 
    currentRoute,
    trafficSignals,
    emergencyActive
  } = useAppContext();

  const [alertingSignals, setAlertingSignals] = useState<Set<string>>(new Set());
  const [nearbyPOIs, setNearbyPOIs] = useState<any[]>([]);

  // Move the Leaflet icon fix inside the component
  useEffect(() => {
    // @ts-ignore - TS doesn't know about this property
    delete L.Icon.Default.prototype._getIconUrl;

    // @ts-ignore - TS doesn't know about this property
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  // Update nearby POIs when ambulance location changes
  useEffect(() => {
    const pois = getNearbyPOIs(ambulanceLocation, 3); // 3km radius
    setNearbyPOIs(pois);
  }, [ambulanceLocation]);

  // Monitor ambulance proximity to traffic signals
  useEffect(() => {
    if (!emergencyActive) {
      setAlertingSignals(new Set());
      return;
    }

    const newAlertingSignals = new Set<string>();
    
    trafficSignals.forEach(signal => {
      const distance = calculateDistance(ambulanceLocation, signal.coordinates);
      
      // If ambulance is within 2km of traffic signal
      if (distance <= 2.0) {
        newAlertingSignals.add(signal.id);
        
        // Show alert notification
        if (!alertingSignals.has(signal.id)) {
          showTrafficAlert(signal.intersection, distance);
        }
      }
    });
    
    setAlertingSignals(newAlertingSignals);
  }, [ambulanceLocation, trafficSignals, emergencyActive]);

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

  // Show traffic alert notification
  const showTrafficAlert = (intersection: string, distance: number) => {
    // Create a visual alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 animate-pulse';
    alertDiv.innerHTML = `
      <div class="flex items-center">
        <div class="mr-2">🚨</div>
        <div>
          <div class="font-bold">EMERGENCY ALERT</div>
          <div class="text-sm">Ambulance approaching ${intersection}</div>
          <div class="text-xs">Distance: ${distance.toFixed(1)}km</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Play alert sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(() => {}); // Ignore errors if audio can't play
    
    // Remove alert after 5 seconds
    setTimeout(() => {
      if (document.body.contains(alertDiv)) {
        document.body.removeChild(alertDiv);
      }
    }, 5000);
  };

  // Create custom icons
  const ambulanceIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 10H6"/>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/>
        <path d="M8 8v4"/>
        <path d="M9 18h6"/>
        <circle cx="6.5" cy="18.5" r="2.5"/>
        <circle cx="16.5" cy="18.5" r="2.5"/>
        <rect x="6" y="6" width="4" height="4" fill="#DC2626"/>
        <path d="M8 4v4" stroke="white" stroke-width="1"/>
        <path d="M6 6h4" stroke="white" stroke-width="1"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const hospitalIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 6v4"/>
        <path d="M14 14h-4"/>
        <path d="M14 18h-4"/>
        <path d="M14 10h-4"/>
        <path d="M2 22h20"/>
        <path d="M2 6h20v16H2z"/>
        <path d="M6 2h12v4H6z"/>
        <rect x="9" y="8" width="6" height="6" fill="#2563EB"/>
        <path d="M12 6v4" stroke="white" stroke-width="1"/>
        <path d="M10 8h4" stroke="white" stroke-width="1"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // Create POI icons
  const getPOIIcon = (type: string) => {
    let color = '#6B7280';
    let symbol = 'S';
    
    switch (type) {
      case 'fire_station':
        color = '#EF4444';
        symbol = 'F';
        break;
      case 'police_station':
        color = '#3B82F6';
        symbol = 'P';
        break;
      case 'emergency_service':
        color = '#F59E0B';
        symbol = 'E';
        break;
    }
    
    return new Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <text x="12" y="16" text-anchor="middle" font-size="12" fill="white">${symbol}</text>
        </svg>
      `),
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  // Create traffic signal icons based on status and alert state
  const getTrafficSignalIcon = (signalId: string, status: EmergencyStatus) => {
    const isAlerting = alertingSignals.has(signalId);
    let color = '#9CA3AF'; // gray-400 for inactive
    
    if (isAlerting) {
      color = '#DC2626'; // red-600 for alerting
    } else {
      switch (status) {
        case EmergencyStatus.APPROACHING:
          color = '#F59E0B'; // amber-500
          break;
        case EmergencyStatus.ACTIVE:
          color = '#10B981'; // green-500
          break;
        case EmergencyStatus.PASSED:
          color = '#6B7280'; // gray-500
          break;
        default:
          color = '#9CA3AF'; // gray-400
      }
    }
    
    return new Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="2" width="6" height="20" rx="2" fill="${color}"/>
          <circle cx="12" cy="6" r="1.5" fill="white"/>
          <circle cx="12" cy="12" r="1.5" fill="white"/>
          <circle cx="12" cy="18" r="1.5" fill="white"/>
          ${isAlerting ? '<circle cx="12" cy="12" r="8" fill="none" stroke="#DC2626" stroke-width="1" opacity="0.3" stroke-dasharray="2,2"/>' : ''}
        </svg>
      `),
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  // MapUpdater component to keep the map centered on the ambulance
  const MapUpdater: React.FC = () => {
    const map = useMap();
    
    useEffect(() => {
      if (emergencyActive) {
        map.setView(ambulanceLocation, Math.max(map.getZoom(), 13));
      }
    }, [ambulanceLocation, map, emergencyActive]);
    
    return null;
  };

  return (
    <div className={`rounded-lg overflow-hidden shadow-lg ${className}`}>
      {/* Alert Status Bar */}
      {alertingSignals.size > 0 && (
        <div className="bg-red-600 text-white p-2 text-center font-medium animate-pulse">
          🚨 EMERGENCY ALERT: {alertingSignals.size} Traffic Signal(s) Notified
        </div>
      )}
      
      {/* Map Controls */}
      <div className="bg-gray-100 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Navigation size={16} />
          <span>Real NYC Locations</span>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-600 rounded-full mr-1"></div>
            <span>Ambulance</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-600 rounded-full mr-1"></div>
            <span>Hospitals</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full mr-1"></div>
            <span>Traffic Signals</span>
          </div>
        </div>
      </div>
      
      <MapContainer
        center={ambulanceLocation}
        zoom={14}
        style={{ height: '500px', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Ambulance marker */}
        <Marker position={ambulanceLocation} icon={ambulanceIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-bold text-red-600">🚑 Emergency Ambulance</p>
              <p className="text-sm text-gray-600">
                Location: {ambulanceLocation[0].toFixed(4)}, {ambulanceLocation[1].toFixed(4)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Current Area: {ambulanceLocation[0] > 40.75 ? 'Upper Manhattan' : 
                             ambulanceLocation[0] > 40.73 ? 'Midtown Manhattan' : 'Lower Manhattan'}
              </p>
              {emergencyActive && <p className="text-red-600 font-bold mt-1">🚨 EMERGENCY ACTIVE</p>}
              {selectedHospital && (
                <p className="text-blue-600 text-sm mt-1">
                  → Destination: {selectedHospital.name}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
        
        {/* Selected hospital marker */}
        {selectedHospital && (
          <Marker position={selectedHospital.coordinates} icon={hospitalIcon}>
            <Popup>
              <div>
                <p className="font-bold text-blue-600">🏥 {selectedHospital.name}</p>
                <p className="text-sm text-gray-600">{selectedHospital.address}</p>
                <p className="text-sm mt-1">
                  {selectedHospital.emergencyReady ? (
                    <span className="text-green-600">✅ Ready for emergency</span>
                  ) : (
                    <span className="text-yellow-600">⚠️ Limited emergency capacity</span>
                  )}
                </p>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Specialties:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedHospital.specialties.map((specialty, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs px-1 rounded">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Distance: {calculateDistance(ambulanceLocation, selectedHospital.coordinates).toFixed(1)}km
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Traffic signal markers */}
        {trafficSignals.map((signal) => (
          <Marker 
            key={signal.id} 
            position={signal.coordinates} 
            icon={getTrafficSignalIcon(signal.id, signal.status)}
          >
            <Popup>
              <div>
                <p className="font-bold">🚦 Traffic Signal</p>
                <p className="text-sm">{signal.intersection}</p>
                <p className="text-sm mt-1">
                  Status: {' '}
                  <span className={`font-semibold ${
                    signal.status === EmergencyStatus.ACTIVE ? 'text-green-600' :
                    signal.status === EmergencyStatus.APPROACHING ? 'text-amber-600' :
                    signal.status === EmergencyStatus.PASSED ? 'text-gray-600' :
                    'text-gray-400'
                  }`}>
                    {signal.status.toUpperCase()}
                  </span>
                </p>
                {alertingSignals.has(signal.id) && (
                  <p className="text-red-600 font-bold mt-1 animate-pulse">
                    🚨 AMBULANCE APPROACHING
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Distance from ambulance: {calculateDistance(ambulanceLocation, signal.coordinates).toFixed(1)}km
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Real NYC intersection
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Nearby POIs */}
        {nearbyPOIs.map((poi, index) => (
          <Marker 
            key={`poi-${index}`} 
            position={poi.coordinates} 
            icon={getPOIIcon(poi.type)}
          >
            <Popup>
              <div>
                <p className="font-bold text-gray-800">{poi.name}</p>
                <p className="text-sm text-gray-600 capitalize">{poi.type.replace('_', ' ')}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Distance: {calculateDistance(ambulanceLocation, poi.coordinates).toFixed(1)}km
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Route polyline */}
        {currentRoute && (
          <Polyline
            positions={currentRoute.waypoints}
            color={emergencyActive ? '#DC2626' : '#3B82F6'}
            weight={emergencyActive ? 6 : 4}
            dashArray={emergencyActive ? '' : '5, 10'}
            opacity={0.8}
          />
        )}
        
        <MapUpdater />
      </MapContainer>
      
      {/* Real Location Info Panel */}
      <div className="bg-gray-50 p-3 border-t">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium text-gray-800">🗽 Real NYC Emergency Response System</p>
            <p className="text-gray-600">
              Featuring actual hospital and intersection coordinates in Manhattan
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {trafficSignals.length} Real Intersections • {nearbyPOIs.length} Emergency Services Nearby
            </p>
            {alertingSignals.size > 0 && (
              <div className="flex items-center justify-end mt-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                <span className="text-xs text-red-600 font-medium">
                  {alertingSignals.size} Signal(s) Active
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;