import React, { useEffect, useState, useCallback } from 'react';
import { Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { Ambulance, Building2, MapPin, Navigation, Globe, Search, Route as RouteIcon } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import RouteRenderer from './RouteRenderer';
import { calculateDistance } from '../../utils/routeUtils';
import { RouteInfo } from '../../types';

interface MapViewProps {
  searchLocation?: [number, number] | null;
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({ searchLocation, className = '' }) => {
  const { 
    ambulanceLocation, 
    selectedHospital, 
    currentRoute,
    emergencyActive
  } = useAppContext();

  // State management
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isRouteVisible, setIsRouteVisible] = useState(false);

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

  // Create simple, reliable marker icons
  const createMarkerIcon = useCallback((type: string) => {
    let svgContent = '';
    let size = 40;
    
    if (type === 'ambulance') {
      size = 48;
      const fillColor = emergencyActive ? '#DC2626' : '#EF4444';
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
      const fillColor = '#2563EB';
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
    } else if (type === 'search') {
      size = 40;
      const fillColor = '#10B981';
      svgContent = `
        <circle cx="20" cy="20" r="18" fill="white" stroke="${fillColor}" stroke-width="3"/>
        <circle cx="20" cy="20" r="12" fill="${fillColor}"/>
        <circle cx="16" cy="16" r="6" fill="none" stroke="white" stroke-width="2"/>
        <path d="20 20 26 26" stroke="white" stroke-width="2" stroke-linecap="round"/>
      `;
    }

    const svgString = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
        ${svgContent}
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`
    };
  }, [emergencyActive]);

  // Handle map load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    console.log('🗺️ Map loaded successfully');
  }, []);

  // Handle route creation
  const handleRouteCreated = useCallback((info: RouteInfo) => {
    setRouteInfo(info);
    setIsRouteVisible(true);
    
    console.log('✅ Route created successfully:', info);
    
    // Show notification
    showRouteNotification(info.distance, info.duration);
  }, []);

  // Handle route cleared
  const handleRouteCleared = useCallback(() => {
    setRouteInfo(null);
    setIsRouteVisible(false);
    console.log('🧹 Route cleared from MapView');
  }, []);

  // Show route creation notification
  const showRouteNotification = (distance: string, duration: string) => {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce
      ${emergencyActive ? 'bg-red-600' : 'bg-blue-600'} text-white p-4 rounded-lg shadow-lg border-2 border-white`;
    notificationDiv.innerHTML = `
      <div class="flex items-center">
        <div class="mr-3 text-2xl">${emergencyActive ? '🚨' : '🗺️'}</div>
        <div>
          <div class="font-bold text-lg">${emergencyActive ? 'Emergency Route ACTIVE!' : 'Route Path Created!'}</div>
          <div class="text-sm">${distance} • ${duration} ${emergencyActive ? '(Emergency Priority)' : ''}</div>
          <div class="text-xs mt-1 opacity-90">Route path is now visible on the map</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notificationDiv);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
      if (document.body.contains(notificationDiv)) {
        notificationDiv.style.transition = 'opacity 0.5s ease-out';
        notificationDiv.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(notificationDiv)) {
            document.body.removeChild(notificationDiv);
          }
        }, 500);
      }
    }, 4000);
  };

  // Update map view when emergency is active or search location changes
  useEffect(() => {
    if (mapInstance) {
      if (searchLocation) {
        mapInstance.setCenter({ lat: searchLocation[0], lng: searchLocation[1] });
        mapInstance.setZoom(10);
      } else if (emergencyActive && selectedHospital) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] });
        bounds.extend({ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] });
        mapInstance.fitBounds(bounds, { 
          padding: { top: 100, right: 100, bottom: 100, left: 100 }
        });
      } else {
        mapInstance.setCenter({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] });
        mapInstance.setZoom(10);
      }
    }
  }, [ambulanceLocation, mapInstance, emergencyActive, selectedHospital, searchLocation]);

  // Calculate initial zoom
  const getInitialZoom = () => {
    if (searchLocation) return 10;
    if (selectedHospital) {
      const distance = calculateDistance(ambulanceLocation, selectedHospital.coordinates);
      return distance > 100 ? 6 : 10;
    }
    return 10;
  };

  return (
    <div className={`rounded-lg overflow-hidden shadow-lg ${className}`}>
      {/* Map Controls */}
      <div className="bg-gray-100 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Globe size={16} />
          <span>Global Emergency Response System</span>
          {searchLocation && (
            <span className="text-green-600 font-medium">• Search Location Active</span>
          )}
          {selectedHospital && (
            <span className={`font-medium flex items-center ${
              isRouteVisible ? 'text-green-600' : 'text-amber-600'
            }`}>
              <RouteIcon size={14} className="mr-1" />
              • Route {isRouteVisible ? 'Visible' : 'Creating...'}
              {routeInfo && isRouteVisible && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {routeInfo.distance} • {routeInfo.duration}
                </span>
              )}
            </span>
          )}
          {emergencyActive && (
            <span className="text-red-600 font-medium animate-pulse">• EMERGENCY MODE</span>
          )}
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
          {searchLocation && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-1 flex items-center justify-center">
                <Search size={8} className="text-white" />
              </div>
              <span>Search Location</span>
            </div>
          )}
        </div>
      </div>
      
      <Map
        style={{ height: '500px', width: '100%' }}
        defaultCenter={{ lat: ambulanceLocation[0], lng: ambulanceLocation[1] }}
        defaultZoom={getInitialZoom()}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onLoad={handleMapLoad}
        options={{
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: true,
          rotateControl: true,
          fullscreenControl: true
        }}
      >
        {/* Route Renderer Component */}
        <RouteRenderer
          map={mapInstance}
          route={currentRoute}
          emergencyActive={emergencyActive}
          onRouteCreated={handleRouteCreated}
          onRouteCleared={handleRouteCleared}
        />

        {/* Search location marker */}
        {searchLocation && (
          <>
            <Marker
              position={{ lat: searchLocation[0], lng: searchLocation[1] }}
              icon={createMarkerIcon('search')}
              onClick={() => setSelectedMarker('search')}
              zIndex={950}
            />
            
            {selectedMarker === 'search' && (
              <InfoWindow
                position={{ lat: searchLocation[0], lng: searchLocation[1] }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="text-center p-2">
                  <div className="flex items-center justify-center mb-2">
                    <Search size={24} className="text-green-600" />
                    <p className="font-bold text-green-600 ml-2">Search Location</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Coordinates: {searchLocation[0].toFixed(4)}, {searchLocation[1].toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Area: {getLocationName(searchLocation)}
                  </p>
                </div>
              </InfoWindow>
            )}
          </>
        )}

        {/* Ambulance marker */}
        <Marker
          position={{ lat: ambulanceLocation[0], lng: ambulanceLocation[1] }}
          icon={createMarkerIcon('ambulance')}
          onClick={() => setSelectedMarker('ambulance')}
          zIndex={1000}
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
              {emergencyActive && <p className="text-red-600 font-bold mt-1 animate-pulse">🚨 EMERGENCY ACTIVE</p>}
              {selectedHospital && (
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <p className="text-blue-600 text-sm font-medium">
                    → Destination: {selectedHospital.name}
                  </p>
                  <p className="text-xs text-blue-500">
                    Distance: {calculateDistance(ambulanceLocation, selectedHospital.coordinates).toFixed(1)}km
                  </p>
                  {routeInfo && isRouteVisible && (
                    <p className="text-xs text-green-600 mt-1">
                      📍 Route: {routeInfo.distance} • {routeInfo.duration}
                    </p>
                  )}
                </div>
              )}
            </div>
          </InfoWindow>
        )}
        
        {/* Selected hospital marker */}
        {selectedHospital && (
          <>
            <Marker
              position={{ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] }}
              icon={createMarkerIcon('hospital')}
              onClick={() => setSelectedMarker('hospital')}
              zIndex={900}
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
                  <div className="mt-2 p-2 bg-green-50 rounded">
                    <p className="text-xs text-green-800 font-medium">
                      🚨 {emergencyActive ? 'Emergency Route Active' : 'Emergency Route Planned'}
                    </p>
                    <p className="text-xs text-green-600">
                      Distance: {calculateDistance(ambulanceLocation, selectedHospital.coordinates).toFixed(1)}km
                    </p>
                    {routeInfo && isRouteVisible && (
                      <p className="text-xs text-green-600">
                        Route: {routeInfo.distance} • {routeInfo.duration}
                      </p>
                    )}
                    {!isRouteVisible && selectedHospital && (
                      <p className="text-xs text-amber-600 font-medium mt-1 animate-pulse">
                        ⚠️ Creating route path...
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {getLocationName(selectedHospital.coordinates)}
                  </p>
                </div>
              </InfoWindow>
            )}
          </>
        )}
      </Map>
      
      {/* Status Panel */}
      <div className="bg-gray-50 p-3 border-t">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium text-gray-800">🌍 Global Emergency Response System</p>
            <p className="text-gray-600">
              {searchLocation 
                ? 'Showing hospitals near your searched location'
                : selectedHospital
                ? `${emergencyActive ? 'Emergency route active' : 'Route planned'} to ${selectedHospital.name}`
                : 'Featuring hospitals from major cities worldwide'
              }
            </p>
            {selectedHospital && isRouteVisible && (
              <p className="text-green-600 font-medium text-xs mt-1">
                ✅ Route path visible on map
              </p>
            )}
            {selectedHospital && !isRouteVisible && (
              <p className="text-amber-600 font-medium text-xs mt-1 animate-pulse">
                ⚠️ Creating route path visualization...
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              Global Emergency Services Network
            </p>
            {selectedHospital && routeInfo && isRouteVisible && (
              <div className="flex items-center justify-end mt-1">
                <div className={`w-2 h-2 rounded-full mr-1 ${emergencyActive ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
                <span className={`text-xs font-medium ${emergencyActive ? 'text-red-600' : 'text-blue-600'}`}>
                  Route: {routeInfo.distance} • {routeInfo.duration}
                  {emergencyActive && ' - ACTIVE'}
                </span>
              </div>
            )}
            {searchLocation && (
              <div className="flex items-center justify-end mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs text-green-600 font-medium">
                  Search Location Active
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