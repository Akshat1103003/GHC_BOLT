import React, { useEffect, useState, useCallback } from 'react';
import { Map, Marker, InfoWindow, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Ambulance, Building2, MapPin, Navigation, Globe, Search, Route } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

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
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);
  const [isRouteVisible, setIsRouteVisible] = useState(false);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);

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

  // Clear all existing routes
  const clearAllRoutes = () => {
    console.log('🧹 Clearing all routes...');
    
    if (routePolyline) {
      try {
        routePolyline.setMap(null);
        // Also clear shadow if it exists
        if ((routePolyline as any).shadowPolyline) {
          (routePolyline as any).shadowPolyline.setMap(null);
        }
        setRoutePolyline(null);
        console.log('✅ Route polyline cleared');
      } catch (error) {
        console.log('⚠️ Error clearing route polyline:', error);
      }
    }
    
    setRouteInfo(null);
    setIsRouteVisible(false);
    setIsCreatingRoute(false);
  };

  // Create a simple, reliable polyline route
  const createSimpleRoute = () => {
    if (!selectedHospital || !mapInstance) {
      console.log('❌ Missing dependencies for route creation');
      return;
    }

    console.log('🔄 Creating simple polyline route...');
    setIsCreatingRoute(true);

    // Clear existing routes first
    clearAllRoutes();

    try {
      const startPoint = { lat: ambulanceLocation[0], lng: ambulanceLocation[1] };
      const endPoint = { lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] };
      
      // Create intermediate waypoints for a curved path
      const midLat = (startPoint.lat + endPoint.lat) / 2;
      const midLng = (startPoint.lng + endPoint.lng) / 2;
      
      // Add a slight curve to make it look more realistic
      const curveOffset = 0.01; // Adjust this for more/less curve
      const curveLat = midLat + (Math.random() - 0.5) * curveOffset;
      const curveLng = midLng + (Math.random() - 0.5) * curveOffset;
      
      const path = [
        startPoint,
        { lat: curveLat, lng: curveLng },
        endPoint
      ];

      const routeColor = emergencyActive ? '#DC2626' : '#2563EB';
      const routeWeight = emergencyActive ? 8 : 6;

      // Create shadow polyline for better visibility
      const shadowPolyline = new google.maps.Polyline({
        path,
        strokeColor: '#000000',
        strokeWeight: routeWeight + 4,
        strokeOpacity: 0.3,
        zIndex: 999,
        map: mapInstance,
      });

      // Create main route polyline
      const mainPolyline = new google.maps.Polyline({
        path,
        strokeColor: routeColor,
        strokeWeight: routeWeight,
        strokeOpacity: 0.9,
        zIndex: 1000,
        map: mapInstance,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: '#FFFFFF',
            strokeWeight: 1,
            fillColor: routeColor,
            fillOpacity: 1,
          },
          offset: '0%',
          repeat: '20%'
        }]
      });

      setRoutePolyline(mainPolyline);

      // Store shadow for cleanup
      (mainPolyline as any).shadowPolyline = shadowPolyline;

      // Calculate distance and duration
      const distance = calculateDistance(ambulanceLocation, selectedHospital.coordinates);
      const duration = Math.ceil(distance / 0.5); // 30 km/h average
      
      setRouteInfo({
        distance: `${distance.toFixed(1)} km`,
        duration: `${duration} min`
      });

      // Fit map bounds to show the entire route
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(startPoint);
      bounds.extend(endPoint);
      mapInstance.fitBounds(bounds, { 
        padding: { top: 80, right: 80, bottom: 80, left: 80 }
      });

      setIsRouteVisible(true);
      setIsCreatingRoute(false);

      console.log('✅ Simple route created successfully');
      showRouteNotification(`${distance.toFixed(1)} km`, `${duration} min`);
      
    } catch (error) {
      console.error('❌ Failed to create simple route:', error);
      setIsRouteVisible(false);
      setIsCreatingRoute(false);
    }
  };

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

  // Create route when hospital is selected
  useEffect(() => {
    if (!selectedHospital || !mapInstance) {
      clearAllRoutes();
      return;
    }

    console.log('🗺️ Hospital selected, creating route...', {
      from: ambulanceLocation,
      to: selectedHospital.coordinates,
      emergencyActive
    });

    // Small delay to ensure map is ready
    setTimeout(() => {
      createSimpleRoute();
    }, 100);

  }, [selectedHospital, ambulanceLocation, mapInstance, emergencyActive]);

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

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      clearAllRoutes();
    };
  }, []);

  // Debug function for troubleshooting
  const debugRoute = () => {
    console.log('🐛 Route Debug Info:', {
      selectedHospital: !!selectedHospital,
      mapInstance: !!mapInstance,
      routePolyline: !!routePolyline,
      isRouteVisible,
      isCreatingRoute,
      routeInfo,
      ambulanceLocation,
      hospitalCoordinates: selectedHospital?.coordinates
    });
  };

  // Force recreate route for debugging
  const forceRecreateRoute = () => {
    console.log('🔄 Force recreating route...');
    clearAllRoutes();
    setTimeout(() => {
      if (selectedHospital && mapInstance) {
        createSimpleRoute();
      }
    }, 500);
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
              isCreatingRoute ? 'text-amber-600' : 
              isRouteVisible ? 'text-green-600' : 'text-red-600'
            }`}>
              <Route size={14} className="mr-1" />
              • Route {
                isCreatingRoute ? 'Creating...' :
                isRouteVisible ? 'Visible' : 'Failed'
              }
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

      {/* Debug Controls - Uncomment for troubleshooting */}
      {/* 
      <div className="p-2 bg-yellow-50 border border-yellow-200 flex gap-2">
        <button onClick={debugRoute} className="px-3 py-1 bg-blue-500 text-white rounded text-xs">
          Debug Route
        </button>
        <button onClick={forceRecreateRoute} className="px-3 py-1 bg-green-500 text-white rounded text-xs">
          Force Recreate
        </button>
        <span className="text-xs text-gray-600 flex items-center">
          Route Status: {isCreatingRoute ? 'Creating...' : isRouteVisible ? 'Visible' : 'None'}
        </span>
      </div>
      */}
      
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
                    {isCreatingRoute && (
                      <p className="text-xs text-amber-600 font-medium mt-1 animate-pulse">
                        ⚠️ Creating route path...
                      </p>
                    )}
                    {!isRouteVisible && !isCreatingRoute && selectedHospital && (
                      <p className="text-xs text-red-600 font-medium mt-1">
                        ❌ Route creation failed - check console
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
            {isCreatingRoute && (
              <p className="text-amber-600 font-medium text-xs mt-1 animate-pulse">
                ⚠️ Creating route path visualization...
              </p>
            )}
            {selectedHospital && isRouteVisible && (
              <p className="text-green-600 font-medium text-xs mt-1">
                ✅ Route path visible on map
              </p>
            )}
            {selectedHospital && !isRouteVisible && !isCreatingRoute && (
              <p className="text-red-600 font-medium text-xs mt-1">
                ❌ Route creation failed - please try selecting the hospital again
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