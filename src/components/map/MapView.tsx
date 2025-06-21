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

  // Load Google Maps geometry library
  const geometryLibrary = useMapsLibrary('geometry');

  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);
  const [isRouteVisible, setIsRouteVisible] = useState(false);
  const [googleMapsSizeConstructor, setGoogleMapsSizeConstructor] = useState<typeof google.maps.Size | null>(null);
  const [googleMapsPointConstructor, setGoogleMapsPointConstructor] = useState<typeof google.maps.Point | null>(null);

  // Initialize Google Maps constructors when geometry library is loaded
  useEffect(() => {
    if (geometryLibrary && window.google && window.google.maps) {
      setGoogleMapsSizeConstructor(() => window.google.maps.Size);
      setGoogleMapsPointConstructor(() => window.google.maps.Point);
    }
  }, [geometryLibrary]);

  // Initialize Google Maps services
  useEffect(() => {
    if (window.google && window.google.maps) {
      setDirectionsService(new google.maps.DirectionsService());
      
      // Create directions renderer with enhanced styling
      const renderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll use our custom markers
        preserveViewport: false,
        polylineOptions: {
          strokeColor: emergencyActive ? '#DC2626' : '#3B82F6',
          strokeWeight: emergencyActive ? 12 : 8,
          strokeOpacity: 1.0,
          zIndex: 1000, // High z-index to ensure visibility
        },
        panel: null
      });
      
      setDirectionsRenderer(renderer);
    }
  }, [emergencyActive]);

  // Set up directions renderer when map is loaded
  useEffect(() => {
    if (mapInstance && directionsRenderer) {
      directionsRenderer.setMap(mapInstance);
      console.log('🗺️ Directions renderer attached to map');
    }
  }, [mapInstance, directionsRenderer]);

  // Create and display route when hospital is selected
  useEffect(() => {
    if (!selectedHospital || !mapInstance) {
      // Clear existing route
      clearAllRoutes();
      setIsRouteVisible(false);
      return;
    }

    console.log('🗺️ Creating route from ambulance to hospital...', {
      from: ambulanceLocation,
      to: selectedHospital.coordinates,
      emergencyActive
    });

    // Try Google Directions API first, then fallback to custom polyline
    if (directionsService && directionsRenderer) {
      createGoogleDirectionsRoute();
    } else {
      createCustomPolylineRoute();
    }
  }, [selectedHospital, ambulanceLocation, directionsService, directionsRenderer, mapInstance, emergencyActive]);

  // Clear all route visualizations
  const clearAllRoutes = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] } as any);
    }
    if (routePolyline) {
      routePolyline.setMap(null);
      setRoutePolyline(null);
    }
    setRouteInfo(null);
    setIsRouteVisible(false);
  };

  // Create route using Google Directions API
  const createGoogleDirectionsRoute = () => {
    if (!directionsService || !directionsRenderer || !selectedHospital || !mapInstance) return;

    const request: google.maps.DirectionsRequest = {
      origin: { lat: ambulanceLocation[0], lng: ambulanceLocation[1] },
      destination: { lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] },
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false,
      optimizeWaypoints: true,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      }
    };

    console.log('🔄 Requesting Google Directions route...');

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        console.log('✅ Google Directions route created successfully');
        
        // Update renderer with enhanced styling
        const routeColor = emergencyActive ? '#DC2626' : '#3B82F6';
        const routeWeight = emergencyActive ? 14 : 10;
        
        directionsRenderer.setOptions({
          polylineOptions: {
            strokeColor: routeColor,
            strokeWeight: routeWeight,
            strokeOpacity: 1.0,
            zIndex: 1000,
            icons: emergencyActive ? [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 4,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2,
                  fillColor: routeColor,
                  fillOpacity: 1,
                },
                offset: '0%',
                repeat: '10%'
              }
            ] : [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 1,
                  fillColor: routeColor,
                  fillOpacity: 0.8,
                },
                offset: '0%',
                repeat: '15%'
              }
            ]
          }
        });
        
        directionsRenderer.setDirections(result);
        
        // Extract route information
        const route = result.routes[0];
        const leg = route.legs[0];
        setRouteInfo({
          distance: leg.distance?.text || 'Unknown',
          duration: leg.duration?.text || 'Unknown'
        });
        
        // Fit map to show entire route with padding
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] });
        bounds.extend({ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] });
        
        mapInstance.fitBounds(bounds, { 
          padding: { top: 100, right: 100, bottom: 100, left: 100 }
        });
        
        setIsRouteVisible(true);
        
        console.log('✅ Route visualization complete:', {
          distance: leg.distance?.text,
          duration: leg.duration?.text,
          emergencyActive,
          waypoints: route.overview_path.length
        });

        // Show route creation notification
        showRouteNotification(leg.distance?.text || 'Unknown', leg.duration?.text || 'Unknown');
        
      } else {
        console.error('❌ Google Directions request failed:', status);
        console.log('🔄 Falling back to custom polyline route...');
        createCustomPolylineRoute();
      }
    });
  };

  // Create custom polyline route as fallback
  const createCustomPolylineRoute = () => {
    if (!selectedHospital || !mapInstance) return;

    console.log('🔄 Creating custom polyline route...');

    // Clear existing routes
    clearAllRoutes();

    // Create enhanced route with multiple waypoints for realistic path
    const startPoint = { lat: ambulanceLocation[0], lng: ambulanceLocation[1] };
    const endPoint = { lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] };
    
    // Create intermediate waypoints for a more realistic route
    const waypoints = [];
    const numWaypoints = 5; // More waypoints for smoother curve
    
    for (let i = 1; i <= numWaypoints; i++) {
      const ratio = i / (numWaypoints + 1);
      const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * ratio;
      const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * ratio;
      
      // Add slight curve to make route look more realistic
      const curveOffset = Math.sin(ratio * Math.PI) * 0.003; // Slightly larger offset
      const perpendicularOffset = Math.cos(ratio * Math.PI * 2) * 0.001; // Add some variation
      
      waypoints.push({ 
        lat: lat + curveOffset, 
        lng: lng + curveOffset + perpendicularOffset 
      });
    }

    const path = [startPoint, ...waypoints, endPoint];
    const routeColor = emergencyActive ? '#DC2626' : '#3B82F6';
    const routeWeight = emergencyActive ? 14 : 10;

    // Create main route polyline
    const newPolyline = new google.maps.Polyline({
      path,
      strokeColor: routeColor,
      strokeWeight: routeWeight,
      strokeOpacity: 1.0,
      zIndex: 1000,
      icons: emergencyActive ? [
        {
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 4,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            fillColor: routeColor,
            fillOpacity: 1,
          },
          offset: '0%',
          repeat: '8%'
        }
      ] : [
        {
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: '#FFFFFF',
            strokeWeight: 1,
            fillColor: routeColor,
            fillOpacity: 0.8,
          },
          offset: '0%',
          repeat: '12%'
        }
      ],
      map: mapInstance,
    });

    // Add a subtle shadow/outline for better visibility
    const shadowPolyline = new google.maps.Polyline({
      path,
      strokeColor: '#000000',
      strokeWeight: routeWeight + 4,
      strokeOpacity: 0.3,
      zIndex: 999,
      map: mapInstance,
    });

    setRoutePolyline(newPolyline);

    // Calculate approximate distance and duration
    const distance = calculateDistance(ambulanceLocation, selectedHospital.coordinates);
    const duration = Math.ceil(distance / 0.5); // Rough estimate: 30 km/h average
    
    setRouteInfo({
      distance: `${distance.toFixed(1)} km`,
      duration: `${duration} min`
    });

    // Fit map to show route with padding
    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    mapInstance.fitBounds(bounds, { 
      padding: { top: 100, right: 100, bottom: 100, left: 100 }
    });

    setIsRouteVisible(true);

    console.log('✅ Custom polyline route created successfully');
    showRouteNotification(`${distance.toFixed(1)} km`, `${duration} min`);

    // Store shadow polyline for cleanup
    (newPolyline as any).shadowPolyline = shadowPolyline;
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
    
    // Remove notification after 5 seconds with fade out
    setTimeout(() => {
      if (document.body.contains(notificationDiv)) {
        notificationDiv.style.animation = 'fadeOut 0.5s ease-out';
        notificationDiv.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(notificationDiv)) {
            document.body.removeChild(notificationDiv);
          }
        }, 500);
      }
    }, 5000);
  };

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
  const createSVGMarkerIcon = useCallback((type: string) => {
    // Return basic fallback if Google Maps constructors aren't loaded yet
    if (!googleMapsSizeConstructor || !googleMapsPointConstructor) {
      let svgContent = '';
      let size = 40;
      let fillColor = '#FFFFFF';
      
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
      } else if (type === 'search') {
        size = 40;
        fillColor = '#10B981';
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
    }

    let svgContent = '';
    let size = 40;
    let fillColor = '#FFFFFF';
    
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
    } else if (type === 'search') {
      size = 40;
      fillColor = '#10B981';
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
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
      size: new googleMapsSizeConstructor(size, size),
      anchor: new googleMapsPointConstructor(size / 2, size / 2),
      scaledSize: new googleMapsSizeConstructor(size, size)
    };
  }, [googleMapsSizeConstructor, googleMapsPointConstructor, emergencyActive]);

  // Handle map load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    console.log('🗺️ Map loaded successfully');
  }, []);

  // Update map view when emergency is active or search location changes
  useEffect(() => {
    if (mapInstance) {
      if (searchLocation) {
        // Center on search location
        mapInstance.setCenter({ lat: searchLocation[0], lng: searchLocation[1] });
        mapInstance.setZoom(10);
      } else if (emergencyActive && selectedHospital) {
        // For emergency mode, fit bounds to show both ambulance and hospital
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] });
        bounds.extend({ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] });
        mapInstance.fitBounds(bounds, { 
          padding: { top: 100, right: 100, bottom: 100, left: 100 }
        });
      } else {
        // Default view centered on ambulance
        mapInstance.setCenter({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] });
        mapInstance.setZoom(10);
      }
    }
  }, [ambulanceLocation, mapInstance, emergencyActive, selectedHospital, searchLocation]);

  // Calculate initial zoom based on distance to selected hospital or search location
  const getInitialZoom = () => {
    if (searchLocation) return 10;
    if (selectedHospital) {
      const distance = calculateDistance(ambulanceLocation, selectedHospital.coordinates);
      return distance > 100 ? 6 : 10;
    }
    return 10;
  };

  // Cleanup polylines when component unmounts
  useEffect(() => {
    return () => {
      clearAllRoutes();
    };
  }, []);

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
            <span className={`font-medium flex items-center ${isRouteVisible ? 'text-green-600' : 'text-amber-600'}`}>
              <Route size={14} className="mr-1" />
              • Route {isRouteVisible ? 'Visible' : 'Pending'}
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
          {selectedHospital && (
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-1 ${isRouteVisible ? 'bg-green-500' : 'bg-amber-500'} ${isRouteVisible ? '' : 'animate-pulse'}`}></div>
              <span className={isRouteVisible ? 'text-green-600' : 'text-amber-600'}>
                Route {isRouteVisible ? 'Active' : 'Creating...'}
              </span>
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
        {/* Search location marker */}
        {searchLocation && (
          <>
            <Marker
              position={{ lat: searchLocation[0], lng: searchLocation[1] }}
              icon={createSVGMarkerIcon('search')}
              onClick={() => setSelectedMarker('search')}
              zIndex={950} // High priority for search location
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
                  <p className="text-xs text-blue-600 mt-1">
                    Hospitals within 50km radius are prioritized
                  </p>
                </div>
              </InfoWindow>
            )}
          </>
        )}

        {/* Ambulance marker with enhanced visibility and movement tracking */}
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
              {emergencyActive && <p className="text-red-600 font-bold mt-1 animate-pulse">🚨 EMERGENCY ACTIVE</p>}
              {selectedHospital && (
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <p className="text-blue-600 text-sm font-medium">
                    → Destination: {selectedHospital.name}
                  </p>
                  <p className="text-xs text-blue-500">
                    Distance: {calculateDistance(ambulanceLocation, selectedHospital.coordinates).toFixed(1)}km
                  </p>
                  {emergencyActive && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      🚨 En route - Emergency mode active
                    </p>
                  )}
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
                    {emergencyActive && (
                      <p className="text-xs text-red-600 font-medium mt-1">
                        🚑 Ambulance en route - ETA updating in real-time
                      </p>
                    )}
                    {!isRouteVisible && selectedHospital && (
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        ⚠️ Route path being created...
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
      
      {/* Global Location Info Panel */}
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
            {selectedHospital && !isRouteVisible && (
              <p className="text-amber-600 font-medium text-xs mt-1 animate-pulse">
                ⚠️ Creating route path visualization...
              </p>
            )}
            {selectedHospital && isRouteVisible && (
              <p className="text-green-600 font-medium text-xs mt-1">
                ✅ Route path visible on map
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