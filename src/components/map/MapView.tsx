import React, { useEffect, useState, useCallback } from 'react';
import { Map, Marker, Polyline, InfoWindow } from '@vis.gl/react-google-maps';
import { Ambulance, Building2, MapPin, AlertTriangle, Navigation, Globe } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { EmergencyStatus } from '../../types';
import { getNearbyPOIs } from '../../utils/mockData';

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
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Update nearby POIs when ambulance location changes
  useEffect(() => {
    const pois = getNearbyPOIs(ambulanceLocation, 50); // 50km radius for global view
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
      
      // If ambulance is within 5km of traffic signal (increased for global view)
      if (distance <= 5.0) {
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

  // Get location name from coordinates
  const getLocationName = (coordinates: [number, number]) => {
    const [lat, lng] = coordinates;
    
    // NYC area
    if (lat >= 40.7 && lat <= 40.8 && lng >= -74.1 && lng <= -73.9) {
      return 'New York City, USA';
    }
    // London area
    if (lat >= 51.4 && lat <= 51.6 && lng >= -0.3 && lng <= 0.1) {
      return 'London, UK';
    }
    // Paris area
    if (lat >= 48.8 && lat <= 48.9 && lng >= 2.2 && lng <= 2.5) {
      return 'Paris, France';
    }
    // Tokyo area
    if (lat >= 35.6 && lat <= 35.8 && lng >= 139.6 && lng <= 139.8) {
      return 'Tokyo, Japan';
    }
    // Sydney area
    if (lat >= -33.9 && lat <= -33.8 && lng >= 151.1 && lng <= 151.3) {
      return 'Sydney, Australia';
    }
    // Toronto area
    if (lat >= 43.6 && lat <= 43.7 && lng >= -79.5 && lng <= -79.3) {
      return 'Toronto, Canada';
    }
    // Mumbai area
    if (lat >= 19.0 && lat <= 19.1 && lng >= 72.8 && lng <= 72.9) {
      return 'Mumbai, India';
    }
    // Berlin area
    if (lat >= 52.4 && lat <= 52.6 && lng >= 13.3 && lng <= 13.5) {
      return 'Berlin, Germany';
    }
    // Dubai area
    if (lat >= 25.1 && lat <= 25.3 && lng >= 55.2 && lng <= 55.4) {
      return 'Dubai, UAE';
    }
    // Singapore area
    if (lat >= 1.2 && lat <= 1.4 && lng >= 103.7 && lng <= 103.9) {
      return 'Singapore';
    }
    
    return 'Global Location';
  };

  // Get marker color based on type and status
  const getMarkerColor = (type: string, status?: EmergencyStatus, isAlerting?: boolean) => {
    if (type === 'ambulance') return '#DC2626'; // red-600
    if (type === 'hospital') return '#2563EB'; // blue-600
    if (type === 'traffic') {
      if (isAlerting) return '#DC2626'; // red-600
      switch (status) {
        case EmergencyStatus.APPROACHING: return '#F59E0B'; // amber-500
        case EmergencyStatus.ACTIVE: return '#10B981'; // green-500
        case EmergencyStatus.PASSED: return '#6B7280'; // gray-500
        default: return '#9CA3AF'; // gray-400
      }
    }
    if (type === 'poi') return '#6B7280'; // gray-500
    return '#9CA3AF';
  };

  // Handle map load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  // Update map view when emergency is active
  useEffect(() => {
    if (mapInstance && emergencyActive) {
      // For global view, use a wider zoom level
      const zoomLevel = selectedHospital ? 
        (calculateDistance(ambulanceLocation, selectedHospital.coordinates) > 100 ? 6 : 10) : 
        10;
      
      mapInstance.setCenter({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] });
      mapInstance.setZoom(Math.max(mapInstance.getZoom() || 10, zoomLevel));
    }
  }, [ambulanceLocation, mapInstance, emergencyActive, selectedHospital]);

  // Calculate initial zoom based on distance to selected hospital
  const getInitialZoom = () => {
    if (selectedHospital) {
      const distance = calculateDistance(ambulanceLocation, selectedHospital.coordinates);
      return distance > 100 ? 6 : 10;
    }
    return 10;
  };

  return (
    <div className={`rounded-lg overflow-hidden shadow-lg ${className}`}>
      {/* Alert Status Bar */}
      {alertingSignals.size > 0 && (
        <div className="bg-red-600 text-white p-2 text-center font-medium animate-pulse">
          🚨 EMERGENCY ALERT: {alertingSignals.size} Traffic Signal(s) Notified Globally
        </div>
      )}
      
      {/* Map Controls */}
      <div className="bg-gray-100 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Globe size={16} />
          <span>Global Emergency Response System</span>
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
      
      <Map
        style={{ height: '500px', width: '100%' }}
        defaultCenter={{ lat: ambulanceLocation[0], lng: ambulanceLocation[1] }}
        defaultZoom={getInitialZoom()}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onLoad={handleMapLoad}
      >
        {/* Ambulance marker */}
        <Marker
          position={{ lat: ambulanceLocation[0], lng: ambulanceLocation[1] }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: getMarkerColor('ambulance'),
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          }}
          onClick={() => setSelectedMarker('ambulance')}
        />
        
        {selectedMarker === 'ambulance' && (
          <InfoWindow
            position={{ lat: ambulanceLocation[0], lng: ambulanceLocation[1] }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="text-center p-2">
              <p className="font-bold text-red-600">🚑 Emergency Ambulance</p>
              <p className="text-sm text-gray-600">
                Location: {ambulanceLocation[0].toFixed(4)}, {ambulanceLocation[1].toFixed(4)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Current Area: {getLocationName(ambulanceLocation)}
              </p>
              {emergencyActive && <p className="text-red-600 font-bold mt-1">🚨 EMERGENCY ACTIVE</p>}
              {selectedHospital && (
                <p className="text-blue-600 text-sm mt-1">
                  → Destination: {selectedHospital.name}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
        
        {/* Selected hospital marker */}
        {selectedHospital && (
          <>
            <Marker
              position={{ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: getMarkerColor('hospital'),
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
              }}
              onClick={() => setSelectedMarker('hospital')}
            />
            
            {selectedMarker === 'hospital' && (
              <InfoWindow
                position={{ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
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
                  <p className="text-xs text-gray-400 mt-1">
                    {getLocationName(selectedHospital.coordinates)}
                  </p>
                </div>
              </InfoWindow>
            )}
          </>
        )}
        
        {/* Traffic signal markers */}
        {trafficSignals.map((signal) => (
          <React.Fragment key={signal.id}>
            <Marker
              position={{ lat: signal.coordinates[0], lng: signal.coordinates[1] }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: getMarkerColor('traffic', signal.status, alertingSignals.has(signal.id)),
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 1,
              }}
              onClick={() => setSelectedMarker(`traffic-${signal.id}`)}
            />
            
            {selectedMarker === `traffic-${signal.id}` && (
              <InfoWindow
                position={{ lat: signal.coordinates[0], lng: signal.coordinates[1] }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
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
                    {getLocationName(signal.coordinates)}
                  </p>
                </div>
              </InfoWindow>
            )}
          </React.Fragment>
        ))}
        
        {/* Nearby POIs */}
        {nearbyPOIs.map((poi, index) => (
          <React.Fragment key={`poi-${index}`}>
            <Marker
              position={{ lat: poi.coordinates[0], lng: poi.coordinates[1] }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: getMarkerColor('poi'),
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 1,
              }}
              onClick={() => setSelectedMarker(`poi-${index}`)}
            />
            
            {selectedMarker === `poi-${index}` && (
              <InfoWindow
                position={{ lat: poi.coordinates[0], lng: poi.coordinates[1] }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <p className="font-bold text-gray-800">{poi.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{poi.type.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Distance: {calculateDistance(ambulanceLocation, poi.coordinates).toFixed(1)}km
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getLocationName(poi.coordinates)}
                  </p>
                </div>
              </InfoWindow>
            )}
          </React.Fragment>
        ))}
        
        {/* Route polyline */}
        {currentRoute && (
          <Polyline
            path={currentRoute.waypoints.map(point => ({ lat: point[0], lng: point[1] }))}
            options={{
              strokeColor: emergencyActive ? '#DC2626' : '#3B82F6',
              strokeWeight: emergencyActive ? 6 : 4,
              strokeOpacity: 0.8,
            }}
          />
        )}
      </Map>
      
      {/* Global Location Info Panel */}
      <div className="bg-gray-50 p-3 border-t">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium text-gray-800">🌍 Global Emergency Response System</p>
            <p className="text-gray-600">
              Featuring hospitals and intersections from major cities worldwide
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {trafficSignals.length} Global Intersections • {nearbyPOIs.length} Emergency Services Nearby
            </p>
            {alertingSignals.size > 0 && (
              <div className="flex items-center justify-end mt-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                <span className="text-xs text-red-600 font-medium">
                  {alertingSignals.size} Signal(s) Active Globally
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