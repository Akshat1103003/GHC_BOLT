import React, { useEffect, useState, useCallback } from 'react';
import { Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { Ambulance, Building2, MapPin, AlertTriangle, Navigation, Globe } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { EmergencyStatus } from '../../types';

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
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

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

  // Create SVG-based marker icons that are more reliable
  const createSVGMarkerIcon = (type: string, status?: EmergencyStatus, isAlerting?: boolean) => {
    let svgContent = '';
    let size = 40;
    let fillColor = '#FFFFFF';
    let strokeColor = '#374151';
    
    if (type === 'ambulance') {
      size = 48;
      fillColor = emergencyActive ? '#DC2626' : '#EF4444';
      svgContent = `
        <circle cx="24" cy="24" r="22" fill="white" stroke="${fillColor}" stroke-width="3"/>
        <rect x="8" y="16" width="32" height="16" rx="2" fill="${fillColor}"/>
        <rect x="10" y="10" width="28" height="12" rx="1" fill="${fillColor}"/>
        <circle cx="14" cy="36" r="3" fill="white" stroke="${fillColor}" stroke-width="2"/>
        <circle cx="34" cy="36" r="3" fill="white" stroke="${fillColor}" stroke-width="2"/>
        <rect x="22" y="12" width="4" height="12" fill="white"/>
        <rect x="16" y="16" width="16" height="4" fill="white"/>
        ${emergencyActive ? '<circle cx="24" cy="8" r="3" fill="#FBBF24"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></circle>' : ''}
      `;
    } else if (type === 'hospital') {
      size = 44;
      fillColor = '#2563EB';
      svgContent = `
        <circle cx="22" cy="22" r="20" fill="white" stroke="${fillColor}" stroke-width="3"/>
        <rect x="6" y="8" width="32" height="28" rx="2" fill="${fillColor}"/>
        <rect x="18" y="12" width="8" height="20" fill="white"/>
        <rect x="10" y="18" width="24" height="8" fill="white"/>
        <circle cx="12" cy="14" r="1.5" fill="white"/>
        <circle cx="32" cy="14" r="1.5" fill="white"/>
        <circle cx="12" cy="30" r="1.5" fill="white"/>
        <circle cx="32" cy="30" r="1.5" fill="white"/>
      `;
    } else if (type === 'traffic') {
      size = 36;
      fillColor = '#374151';
      const redLight = status === EmergencyStatus.INACTIVE || isAlerting ? '#EF4444' : '#6B7280';
      const yellowLight = status === EmergencyStatus.APPROACHING || isAlerting ? '#F59E0B' : '#6B7280';
      const greenLight = status === EmergencyStatus.ACTIVE ? '#10B981' : '#6B7280';
      
      svgContent = `
        <circle cx="18" cy="18" r="16" fill="white" stroke="${fillColor}" stroke-width="2"/>
        <rect x="12" y="4" width="12" height="28" rx="3" fill="${fillColor}"/>
        <circle cx="18" cy="10" r="3" fill="${redLight}"/>
        <circle cx="18" cy="18" r="3" fill="${yellowLight}"/>
        <circle cx="18" cy="26" r="3" fill="${greenLight}"/>
        <rect x="17" y="30" width="2" height="6" fill="${fillColor}"/>
        ${isAlerting ? '<circle cx="18" cy="18" r="18" fill="none" stroke="#F59E0B" stroke-width="2" opacity="0.6"><animate attributeName="r" values="16;20;16" dur="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/></circle>' : ''}
      `;
    }

    const svgString = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
        ${svgContent}
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
      size: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size / 2, size / 2),
      scaledSize: new google.maps.Size(size, size)
    };
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

  // Custom Polyline component using Google Maps API directly
  const RoutePolyline = ({ path, strokeColor, strokeWeight, strokeOpacity }: {
    path: { lat: number; lng: number }[];
    strokeColor: string;
    strokeWeight: number;
    strokeOpacity: number;
  }) => {
    useEffect(() => {
      if (!mapInstance || !path.length) return;

      const polyline = new google.maps.Polyline({
        path,
        strokeColor,
        strokeWeight,
        strokeOpacity,
      });

      polyline.setMap(mapInstance);

      return () => {
        polyline.setMap(null);
      };
    }, [mapInstance, path, strokeColor, strokeWeight, strokeOpacity]);

    return null;
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
            <div className="w-4 h-4 bg-red-600 rounded-full mr-1 flex items-center justify-center">
              <Ambulance size={10} className="text-white" />
            </div>
            <span>Ambulance</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-1 flex items-center justify-center">
              <Building2 size={10} className="text-white" />
            </div>
            <span>Hospitals</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-amber-500 rounded-full mr-1 flex items-center justify-center">
              <AlertTriangle size={8} className="text-white" />
            </div>
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
        {/* Ambulance marker with enhanced visibility */}
        <Marker
          position={{ lat: ambulanceLocation[0], lng: ambulanceLocation[1] }}
          icon={createSVGMarkerIcon('ambulance')}
          onClick={() => setSelectedMarker('ambulance')}
          zIndex={1000} // Ensure ambulance is always on top
        />
        
        {selectedMarker === 'ambulance' && (
          <InfoWindow
            position={{ lat: ambulanceLocation[0], lng: ambulanceLocation[1] }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-2">
                <Ambulance size={24} className="text-red-600" />
                <p className="font-bold text-red-600 ml-2">Emergency Ambulance</p>
              </div>
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
        
        {/* Selected hospital marker with enhanced visibility */}
        {selectedHospital && (
          <>
            <Marker
              position={{ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] }}
              icon={createSVGMarkerIcon('hospital')}
              onClick={() => setSelectedMarker('hospital')}
              zIndex={900} // High priority for hospital
            />
            
            {selectedMarker === 'hospital' && (
              <InfoWindow
                position={{ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <div className="flex items-center mb-2">
                    <Building2 size={24} className="text-blue-600" />
                    <p className="font-bold text-blue-600 ml-2">{selectedHospital.name}</p>
                  </div>
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
        
        {/* Traffic signal markers with enhanced visibility */}
        {trafficSignals.map((signal) => (
          <React.Fragment key={signal.id}>
            <Marker
              position={{ lat: signal.coordinates[0], lng: signal.coordinates[1] }}
              icon={createSVGMarkerIcon('traffic', signal.status, alertingSignals.has(signal.id))}
              onClick={() => setSelectedMarker(`traffic-${signal.id}`)}
              zIndex={800} // Lower priority than ambulance and hospital
            />
            
            {selectedMarker === `traffic-${signal.id}` && (
              <InfoWindow
                position={{ lat: signal.coordinates[0], lng: signal.coordinates[1] }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <div className="flex items-center mb-2">
                    <AlertTriangle size={24} className="text-amber-500" />
                    <p className="font-bold ml-2">Traffic Signal</p>
                  </div>
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
        
        {/* Route polyline using custom component */}
        {currentRoute && (
          <RoutePolyline
            path={currentRoute.waypoints.map(point => ({ lat: point[0], lng: point[1] }))}
            strokeColor={emergencyActive ? '#DC2626' : '#3B82F6'}
            strokeWeight={emergencyActive ? 6 : 4}
            strokeOpacity={0.8}
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
              {trafficSignals.length} Global Intersections • Emergency Services Network
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