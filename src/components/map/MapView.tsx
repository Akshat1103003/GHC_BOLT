import React, { useEffect, useState, useCallback } from 'react';
import { Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { Ambulance, Building2, MapPin, Navigation, Globe, Search, Route as RouteIcon, Loader2, Crosshair, AlertTriangle, Shield } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import RouteRenderer from './RouteRenderer';
import { calculateDistance } from '../../utils/routeUtils';
import { RouteInfo, CheckpointRoute, EmergencyCheckpoint } from '../../types';

interface MapViewProps {
  searchLocation?: [number, number] | null;
  checkpointRoute?: CheckpointRoute | null;
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({ searchLocation, checkpointRoute, className = '' }) => {
  const { 
    ambulanceLocation, 
    selectedHospital, 
    currentRoute,
    emergencyActive,
    isCreatingRoute,
    isDetectingLocation,
    locationError,
    initialLocationSet
  } = useAppContext();

  // State management
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isRouteVisible, setIsRouteVisible] = useState(false);
  const [mapDimensions, setMapDimensions] = useState({ width: '100%', height: '500px' });

  // Debug logging for coordinate verification
  useEffect(() => {
    console.log('🗺️ MapView Debug Information:');
    console.log('📍 Patient Location (Ambulance):', ambulanceLocation);
    console.log('🏥 Selected Hospital:', selectedHospital?.name, selectedHospital?.coordinates);
    console.log('🔍 Search Location:', searchLocation);
    console.log('🛡️ Checkpoint Route:', checkpointRoute ? `${checkpointRoute.checkpoints.length} checkpoints` : 'None');
    
    // Validate coordinates
    if (ambulanceLocation) {
      const [lat, lng] = ambulanceLocation;
      console.log('✅ Ambulance coordinates validation:');
      console.log(`   Latitude: ${lat} (valid: ${lat >= -90 && lat <= 90})`);
      console.log(`   Longitude: ${lng} (valid: ${lng >= -180 && lng <= 180})`);
    }
    
    if (selectedHospital?.coordinates) {
      const [lat, lng] = selectedHospital.coordinates;
      console.log('✅ Hospital coordinates validation:');
      console.log(`   Latitude: ${lat} (valid: ${lat >= -90 && lat <= 90})`);
      console.log(`   Longitude: ${lng} (valid: ${lng >= -180 && lng <= 180})`);
    }
  }, [ambulanceLocation, selectedHospital, searchLocation, checkpointRoute]);

  // Responsive map sizing
  useEffect(() => {
    const updateMapSize = () => {
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      
      // Calculate optimal map height based on screen size
      let mapHeight = '500px';
      
      if (screenHeight > 900) {
        mapHeight = '600px';
      } else if (screenHeight > 700) {
        mapHeight = '500px';
      } else if (screenHeight > 500) {
        mapHeight = '400px';
      } else {
        mapHeight = '350px';
      }
      
      // Adjust for mobile devices
      if (screenWidth < 768) {
        mapHeight = '400px';
      }
      
      setMapDimensions({ width: '100%', height: mapHeight });
    };

    updateMapSize();
    window.addEventListener('resize', updateMapSize);
    
    return () => window.removeEventListener('resize', updateMapSize);
  }, []);

  // Reset route visibility when route changes
  useEffect(() => {
    if (currentRoute) {
      setIsRouteVisible(false); // Reset visibility when new route is created
    } else {
      setIsRouteVisible(false);
      setRouteInfo(null);
    }
  }, [currentRoute]);

  // Get location name from coordinates
  const getLocationName = (coordinates: [number, number]) => {
    const [lat, lng] = coordinates;
    
    // Bhopal area (test coordinates)
    if (lat >= 23.2 && lat <= 23.3 && lng >= 77.3 && lng <= 77.5) {
      return 'Bhopal, Madhya Pradesh, India';
    }
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
    
    return 'Your Location';
  };

  // Create enhanced, reliable marker icons with better visibility
  const createMarkerIcon = useCallback((type: string, checkpointCode?: string) => {
    // Check if Google Maps API is loaded before using constructors
    if (!window.google?.maps?.Size || !window.google?.maps?.Point) {
      console.warn('⚠️ Google Maps API not fully loaded, using default markers');
      return null; // Return null to use default marker
    }

    let svgContent = '';
    let size = 40;
    
    if (type === 'ambulance') {
      size = 52; // Slightly larger for better visibility
      const fillColor = emergencyActive ? '#DC2626' : '#EF4444';
      const pulseColor = isDetectingLocation ? '#FBBF24' : fillColor;
      svgContent = `
        <circle cx="26" cy="26" r="24" fill="white" stroke="${fillColor}" stroke-width="4"/>
        <rect x="10" y="18" width="32" height="16" rx="2" fill="${fillColor}"/>
        <rect x="12" y="12" width="28" height="12" rx="1" fill="${fillColor}"/>
        <circle cx="16" cy="38" r="4" fill="white" stroke="${fillColor}" stroke-width="2"/>
        <circle cx="36" cy="38" r="4" fill="white" stroke="${fillColor}" stroke-width="2"/>
        <rect x="24" y="14" width="4" height="12" fill="white"/>
        <rect x="18" y="18" width="16" height="4" fill="white"/>
        ${emergencyActive ? '<circle cx="26" cy="8" r="4" fill="#FBBF24"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></circle>' : ''}
        ${isDetectingLocation ? '<circle cx="26" cy="8" r="6" fill="#FBBF24" opacity="0.7"><animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite"/></circle>' : ''}
      `;
    } else if (type === 'hospital') {
      size = 48; // Larger for better visibility
      const fillColor = '#2563EB';
      svgContent = `
        <circle cx="24" cy="24" r="22" fill="white" stroke="${fillColor}" stroke-width="4"/>
        <rect x="8" y="10" width="32" height="28" rx="2" fill="${fillColor}"/>
        <rect x="20" y="14" width="8" height="20" fill="white"/>
        <rect x="12" y="20" width="24" height="8" fill="white"/>
        <circle cx="14" cy="16" r="2" fill="white"/>
        <circle cx="34" cy="16" r="2" fill="white"/>
        <circle cx="14" cy="32" r="2" fill="white"/>
        <circle cx="34" cy="32" r="2" fill="white"/>
      `;
    } else if (type === 'search') {
      size = 44;
      const fillColor = '#10B981';
      svgContent = `
        <circle cx="22" cy="22" r="20" fill="white" stroke="${fillColor}" stroke-width="4"/>
        <circle cx="22" cy="22" r="14" fill="${fillColor}"/>
        <circle cx="18" cy="18" r="7" fill="none" stroke="white" stroke-width="3"/>
        <path d="23 23 29 29" stroke="white" stroke-width="3" stroke-linecap="round"/>
      `;
    } else if (type === 'checkpoint') {
      size = 36;
      const fillColor = '#F59E0B';
      const textColor = '#FFFFFF';
      const code = checkpointCode || 'CP';
      svgContent = `
        <circle cx="18" cy="18" r="16" fill="white" stroke="${fillColor}" stroke-width="3"/>
        <circle cx="18" cy="18" r="12" fill="${fillColor}"/>
        <text x="18" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="${textColor}">${code}</text>
      `;
    }

    const svgString = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          ${svgContent}
        </g>
      </svg>
    `;

    try {
      const icon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
        scaledSize: new window.google.maps.Size(size, size),
        anchor: new window.google.maps.Point(size / 2, size / 2)
      };
      console.log(`✅ Created ${type} marker icon successfully`);
      return icon;
    } catch (error) {
      console.error(`❌ Error creating ${type} marker icon:`, error);
      return null;
    }
  }, [emergencyActive, isDetectingLocation]);

  // Handle map load with improved error handling
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    console.log('🗺️ MapView: Map loaded successfully');
    console.log('🗺️ Map center will be set to:', ambulanceLocation);
    
    // Set initial map options for better performance
    map.setOptions({
      gestureHandling: 'greedy',
      clickableIcons: false,
      disableDoubleClickZoom: false,
      scrollwheel: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "transit",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });
  }, [ambulanceLocation]);

  // Handle route creation with enhanced feedback
  const handleRouteCreated = useCallback((info: RouteInfo) => {
    setRouteInfo(info);
    setIsRouteVisible(true);
    
    console.log('✅ MapView: Route created successfully:', info);
    
    // Show enhanced notification
    showRouteNotification(info.distance, info.duration);
  }, []);

  // Handle route cleared
  const handleRouteCleared = useCallback(() => {
    setRouteInfo(null);
    setIsRouteVisible(false);
    console.log('🧹 MapView: Route cleared');
  }, []);

  // Enhanced route creation notification
  const showRouteNotification = (distance: string, duration: string) => {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce
      ${emergencyActive ? 'bg-red-600' : 'bg-blue-600'} text-white p-4 rounded-lg shadow-xl border-2 border-white`;
    notificationDiv.innerHTML = `
      <div class="flex items-center">
        <div class="mr-3 text-3xl">${emergencyActive ? '🚨' : '🗺️'}</div>
        <div>
          <div class="font-bold text-lg">${emergencyActive ? 'Emergency Route ACTIVE!' : 'Route Path Created!'}</div>
          <div class="text-sm">${distance} • ${duration} ${emergencyActive ? '(Emergency Priority)' : ''}</div>
          <div class="text-xs mt-1 opacity-90">Route path is now visible on the map</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notificationDiv);
    
    // Enhanced removal with fade effect
    setTimeout(() => {
      if (document.body.contains(notificationDiv)) {
        notificationDiv.style.transition = 'all 0.5s ease-out';
        notificationDiv.style.opacity = '0';
        notificationDiv.style.transform = 'translate(-50%, -20px) scale(0.9)';
        setTimeout(() => {
          if (document.body.contains(notificationDiv)) {
            document.body.removeChild(notificationDiv);
          }
        }, 500);
      }
    }, 4000);
  };

  // Enhanced map view updates with better bounds calculation
  useEffect(() => {
    if (mapInstance && initialLocationSet) {
      console.log('🗺️ Updating map view with current locations');
      
      if (searchLocation) {
        console.log('🔍 Centering map on search location:', searchLocation);
        mapInstance.setCenter({ lat: searchLocation[0], lng: searchLocation[1] });
        mapInstance.setZoom(12);
      } else if (emergencyActive && selectedHospital) {
        console.log('🚨 Emergency active - fitting bounds for ambulance and hospital');
        // Create bounds that include both ambulance and hospital with proper padding
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] });
        bounds.extend({ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] });
        
        // Include checkpoints in bounds if available
        if (checkpointRoute && checkpointRoute.checkpoints.length > 0) {
          console.log('🛡️ Including checkpoints in map bounds');
          checkpointRoute.checkpoints.forEach(checkpoint => {
            bounds.extend({ lat: checkpoint.coordinates[0], lng: checkpoint.coordinates[1] });
          });
        }
        
        // Calculate distance to determine appropriate padding
        const distance = calculateDistance(ambulanceLocation, selectedHospital.coordinates);
        const padding = distance > 50 ? 150 : 100;
        
        mapInstance.fitBounds(bounds, { 
          padding: { top: padding, right: padding, bottom: padding, left: padding }
        });
      } else {
        console.log('📍 Centering map on ambulance location:', ambulanceLocation);
        mapInstance.setCenter({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] });
        mapInstance.setZoom(11);
      }
    }
  }, [ambulanceLocation, mapInstance, emergencyActive, selectedHospital, searchLocation, initialLocationSet, checkpointRoute]);

  // Calculate optimal initial zoom based on context
  const getInitialZoom = () => {
    if (searchLocation) return 12;
    if (selectedHospital) {
      const distance = calculateDistance(ambulanceLocation, selectedHospital.coordinates);
      if (distance > 100) return 6;
      if (distance > 50) return 8;
      if (distance > 20) return 10;
      return 12;
    }
    return 11;
  };

  // Determine current route status for display
  const getRouteStatus = () => {
    if (isCreatingRoute) {
      return { status: 'creating', message: 'Creating route path...', color: 'text-amber-600' };
    } else if (isRouteVisible && routeInfo) {
      return { status: 'visible', message: 'Route Active', color: 'text-green-600' };
    } else if (selectedHospital && !isRouteVisible) {
      return { status: 'pending', message: 'Route Pending', color: 'text-amber-600' };
    } else {
      return { status: 'none', message: 'No Route', color: 'text-gray-600' };
    }
  };

  const routeStatus = getRouteStatus();

  return (
    <div className={`rounded-lg overflow-hidden shadow-lg bg-white ${className}`}>
      {/* Enhanced Map Controls Header */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-3 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <Globe size={18} className="text-blue-600" />
            <span className="font-medium">Live Location Emergency Response System</span>
            
            {/* Location detection status */}
            {isDetectingLocation && (
              <span className="text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full text-xs flex items-center">
                <Crosshair size={12} className="mr-1 animate-spin" />
                Detecting Location...
              </span>
            )}
            
            {locationError && (
              <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full text-xs flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                Using Test Location
              </span>
            )}
            
            {initialLocationSet && !isDetectingLocation && !locationError && (
              <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full text-xs">
                📍 Live Location Active
              </span>
            )}
            
            {searchLocation && (
              <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full text-xs">
                • Search Active
              </span>
            )}
            {selectedHospital && (
              <span className={`font-medium flex items-center px-2 py-1 rounded-full text-xs ${
                routeStatus.status === 'creating' ? 'text-amber-600 bg-amber-50' :
                routeStatus.status === 'visible' ? 'text-green-600 bg-green-50' :
                'text-amber-600 bg-amber-50'
              }`}>
                {routeStatus.status === 'creating' && <Loader2 size={12} className="mr-1 animate-spin" />}
                <RouteIcon size={12} className="mr-1" />
                {routeStatus.message}
              </span>
            )}
            {checkpointRoute && (
              <span className="text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full text-xs flex items-center">
                <Shield size={12} className="mr-1" />
                {checkpointRoute.checkpoints.length} Checkpoints
              </span>
            )}
            {emergencyActive && (
              <span className="text-red-600 font-bold animate-pulse bg-red-50 px-2 py-1 rounded-full text-xs">
                🚨 EMERGENCY
              </span>
            )}
          </div>
          
          {/* Route Info Display */}
          {routeInfo && isRouteVisible && (
            <div className="flex items-center space-x-2 text-xs">
              <div className={`px-3 py-1 rounded-full font-medium ${
                emergencyActive ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                📍 {routeInfo.distance} • ⏱️ {routeInfo.duration}
                {emergencyActive && ' - PRIORITY'}
              </div>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-600 rounded-full mr-1 flex items-center justify-center">
              <Ambulance size={8} className="text-white" />
            </div>
            <span>Ambulance {isDetectingLocation ? '(Detecting...)' : '(Test Location: Bhopal)'}</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-1 flex items-center justify-center">
              <Building2 size={8} className="text-white" />
            </div>
            <span>Hospital</span>
          </div>
          {checkpointRoute && checkpointRoute.checkpoints.length > 0 && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded-full mr-1 flex items-center justify-center">
                <Shield size={6} className="text-white" />
              </div>
              <span>Emergency Checkpoints ({checkpointRoute.checkpoints.length})</span>
            </div>
          )}
          {searchLocation && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-1 flex items-center justify-center">
                <Search size={6} className="text-white" />
              </div>
              <span>Search Location</span>
            </div>
          )}
          {selectedHospital && (
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-1 ${
                routeStatus.status === 'creating' ? 'bg-amber-500 animate-pulse' :
                routeStatus.status === 'visible' ? 'bg-green-500' :
                'bg-amber-500'
              }`}></div>
              <span className={routeStatus.color}>
                {routeStatus.message}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Map Container */}
      <div className="relative" style={{ height: mapDimensions.height }}>
        <Map
          style={{ width: mapDimensions.width, height: mapDimensions.height }}
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
              },
              {
                featureType: "transit",
                elementType: "labels",
                stylers: [{ visibility: "simplified" }]
              }
            ],
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
            clickableIcons: false,
            backgroundColor: '#f8fafc'
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
                  options={{
                    pixelOffset: window.google?.maps?.Size ? new window.google.maps.Size(0, -10) : undefined
                  }}
                >
                  <div className="text-center p-3 max-w-xs">
                    <div className="flex items-center justify-center mb-3">
                      <Search size={24} className="text-green-600" />
                      <p className="font-bold text-green-600 ml-2">Search Location</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      📍 {searchLocation[0].toFixed(4)}, {searchLocation[1].toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      🌍 {getLocationName(searchLocation)}
                    </p>
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      Hospitals within 50km radius are prioritized in search results
                    </div>
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Emergency Checkpoint markers */}
          {checkpointRoute && checkpointRoute.checkpoints.map((checkpoint: EmergencyCheckpoint) => (
            <React.Fragment key={checkpoint.id}>
              <Marker
                position={{ lat: checkpoint.coordinates[0], lng: checkpoint.coordinates[1] }}
                icon={createMarkerIcon('checkpoint', checkpoint.code)}
                onClick={() => setSelectedMarker(`checkpoint-${checkpoint.id}`)}
                zIndex={800}
              />
              
              {selectedMarker === `checkpoint-${checkpoint.id}` && (
                <InfoWindow
                  position={{ lat: checkpoint.coordinates[0], lng: checkpoint.coordinates[1] }}
                  onCloseClick={() => setSelectedMarker(null)}
                  options={{
                    pixelOffset: window.google?.maps?.Size ? new window.google.maps.Size(0, -10) : undefined
                  }}
                >
                  <div className="p-3 max-w-sm">
                    <div className="flex items-center mb-3">
                      <Shield size={24} className="text-orange-600" />
                      <div className="ml-2">
                        <p className="font-bold text-orange-600 text-lg">Checkpoint {checkpoint.code}</p>
                        <p className="text-xs text-gray-500">{checkpoint.distanceFromStart.toFixed(1)}km from start</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">📍 {checkpoint.landmark}</p>
                    <p className="text-xs text-gray-500 mb-3">{checkpoint.streetIntersection}</p>
                    
                    <div className="mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        checkpoint.status === 'operational' ? 'bg-green-100 text-green-800' :
                        checkpoint.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {checkpoint.status === 'operational' ? '✅ Operational' :
                         checkpoint.status === 'maintenance' ? '🔧 Maintenance' :
                         '❌ Out of Service'}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Available Facilities:</p>
                      <div className="flex flex-wrap gap-1">
                        {checkpoint.facilities.firstAid && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">First Aid</span>
                        )}
                        {checkpoint.facilities.defibrillator && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">AED</span>
                        )}
                        {checkpoint.facilities.oxygenSupply && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Oxygen</span>
                        )}
                        {checkpoint.facilities.emergencyPhone && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Emergency Phone</span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${emergencyActive ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
                      <p className={`text-xs font-medium mb-1 ${emergencyActive ? 'text-red-800' : 'text-orange-800'}`}>
                        🚨 {emergencyActive ? 'Emergency Checkpoint ACTIVE' : 'Emergency Checkpoint Ready'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Safe stopping area with {checkpoint.safeStoppingArea.capacity} vehicle capacity
                      </p>
                      {emergencyActive && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          ⚡ All facilities on standby for immediate assistance
                        </p>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          ))}

          {/* Enhanced Ambulance marker */}
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
              options={{
                pixelOffset: window.google?.maps?.Size ? new window.google.maps.Size(0, -15) : undefined
              }}
            >
              <div className="text-center p-3 max-w-sm">
                <div className="flex items-center justify-center mb-3">
                  <Ambulance size={28} className="text-red-600" />
                  <p className="font-bold text-red-600 ml-2 text-lg">Emergency Ambulance</p>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <p>📍 {ambulanceLocation[0].toFixed(4)}, {ambulanceLocation[1].toFixed(4)}</p>
                  <p>🌍 {getLocationName(ambulanceLocation)}</p>
                  {isDetectingLocation && (
                    <p className="text-amber-600 font-medium animate-pulse">🔍 Detecting live location...</p>
                  )}
                  {locationError && (
                    <p className="text-red-600 text-xs">⚠️ {locationError}</p>
                  )}
                  {initialLocationSet && !isDetectingLocation && !locationError && (
                    <p className="text-green-600 font-medium">✅ Live location active</p>
                  )}
                </div>
                
                {emergencyActive && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                    <p className="text-red-600 font-bold animate-pulse">🚨 EMERGENCY ACTIVE</p>
                  </div>
                )}
                
                {selectedHospital && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-blue-600 text-sm font-medium mb-1">
                      🏥 → {selectedHospital.name}
                    </p>
                    <p className="text-xs text-blue-500 mb-2">
                      📏 {calculateDistance(ambulanceLocation, selectedHospital.coordinates).toFixed(1)}km away
                    </p>
                    {routeInfo && isRouteVisible && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        📍 Active Route: {routeInfo.distance} • {routeInfo.duration}
                        {emergencyActive && ' (Emergency Priority)'}
                      </div>
                    )}
                    {isCreatingRoute && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded flex items-center">
                        <Loader2 size={12} className="mr-1 animate-spin" />
                        Creating route path...
                      </div>
                    )}
                    {!isRouteVisible && !isCreatingRoute && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        ⚠️ Route pending...
                      </div>
                    )}
                  </div>
                )}
                
                {checkpointRoute && (
                  <div className="mt-3 bg-orange-50 border border-orange-200 rounded p-2">
                    <p className="text-orange-600 text-xs font-medium">
                      🛡️ {checkpointRoute.checkpoints.length} Emergency Checkpoints Active
                    </p>
                    <p className="text-orange-500 text-xs">
                      Covering {checkpointRoute.totalDistance.toFixed(1)}km route
                    </p>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
          
          {/* Enhanced Hospital marker */}
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
                  options={{
                    pixelOffset: window.google?.maps?.Size ? new window.google.maps.Size(0, -15) : undefined
                  }}
                >
                  <div className="p-3 max-w-sm">
                    <div className="flex items-center mb-3">
                      <Building2 size={28} className="text-blue-600" />
                      <div className="ml-2">
                        <p className="font-bold text-blue-600 text-lg">{selectedHospital.name}</p>
                        <p className="text-xs text-gray-500">{getLocationName(selectedHospital.coordinates)}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">📍 {selectedHospital.address}</p>
                    
                    <div className="mb-3">
                      {selectedHospital.emergencyReady ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Ready for emergency
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠️ Limited capacity
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Specialties:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedHospital.specialties.slice(0, 3).map((specialty, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {specialty}
                          </span>
                        ))}
                        {selectedHospital.specialties.length > 3 && (
                          <span className="text-xs text-gray-500">+{selectedHospital.specialties.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${emergencyActive ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                      <p className={`text-xs font-medium mb-1 ${emergencyActive ? 'text-red-800' : 'text-green-800'}`}>
                        🚨 {emergencyActive ? 'Emergency Route ACTIVE' : 'Emergency Route Planned'}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">
                        📏 Distance: {calculateDistance(ambulanceLocation, selectedHospital.coordinates).toFixed(1)}km
                      </p>
                      {routeInfo && isRouteVisible && (
                        <p className="text-xs text-green-600">
                          📍 Route: {routeInfo.distance} • {routeInfo.duration}
                        </p>
                      )}
                      {isCreatingRoute && (
                        <p className="text-xs text-amber-600 font-medium flex items-center">
                          <Loader2 size={12} className="mr-1 animate-spin" />
                          Creating route visualization...
                        </p>
                      )}
                      {!isRouteVisible && !isCreatingRoute && (
                        <p className="text-xs text-amber-600 font-medium">
                          ⚠️ Route pending...
                        </p>
                      )}
                      {checkpointRoute && (
                        <p className="text-xs text-orange-600 mt-1">
                          🛡️ {checkpointRoute.checkpoints.length} emergency checkpoints deployed
                        </p>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </>
          )}
        </Map>
        
        {/* Enhanced loading overlay for route creation */}
        {isCreatingRoute && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-lg p-4 flex items-center">
              <Loader2 className="animate-spin h-6 w-6 text-blue-600 mr-3" />
              <span className="text-sm font-medium text-gray-700">Creating route path...</span>
            </div>
          </div>
        )}

        {/* Location detection overlay */}
        {isDetectingLocation && (
          <div className="absolute top-4 left-4 bg-amber-100 border border-amber-300 rounded-lg p-3 shadow-lg">
            <div className="flex items-center text-amber-800">
              <Crosshair className="animate-spin h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Detecting your live location...</span>
            </div>
          </div>
        )}

        {/* Location error overlay */}
        {locationError && (
          <div className="absolute top-4 left-4 bg-red-100 border border-red-300 rounded-lg p-3 shadow-lg">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <div>
                <p className="text-sm font-medium">Using Test Location</p>
                <p className="text-xs">{locationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Coordinate Verification Overlay */}
        <div className="absolute bottom-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-3 shadow-lg">
          <div className="text-blue-800">
            <p className="text-xs font-medium">📍 Coordinate Verification</p>
            <p className="text-xs">Patient: {ambulanceLocation[0].toFixed(4)}, {ambulanceLocation[1].toFixed(4)}</p>
            {selectedHospital && (
              <p className="text-xs">Hospital: {selectedHospital.coordinates[0].toFixed(4)}, {selectedHospital.coordinates[1].toFixed(4)}</p>
            )}
            <p className="text-xs mt-1">✅ Both coordinates are valid and properly formatted</p>
          </div>
        </div>
      </div>
      
      {/* Enhanced Status Panel */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-gray-800 flex items-center">
              🌍 Live Location Emergency Response System
              {emergencyActive && <span className="ml-2 text-red-600 animate-pulse">• EMERGENCY MODE</span>}
              {isDetectingLocation && <span className="ml-2 text-amber-600 animate-pulse">• DETECTING LOCATION</span>}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {isDetectingLocation 
                ? 'Detecting your live location for accurate emergency response...'
                : locationError
                ? 'Using Bhopal test location for marker verification'
                : searchLocation 
                ? 'Showing hospitals near your searched location within 50km radius'
                : selectedHospital
                ? `${emergencyActive ? 'Emergency route active' : 'Route planned'} to ${selectedHospital.name}`
                : 'Test location active - Select Bansal Hospital to create route'
              }
              {checkpointRoute && (
                <span className="ml-2 text-orange-600 font-medium">
                  • {checkpointRoute.checkpoints.length} emergency checkpoints deployed
                </span>
              )}
            </p>
            
            {/* Status indicators */}
            <div className="flex flex-wrap gap-2 mt-2">
              {isDetectingLocation && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 animate-pulse">
                  <Crosshair size={12} className="mr-1 animate-spin" />
                  Detecting location...
                </span>
              )}
              {initialLocationSet && !isDetectingLocation && !locationError && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  📍 Live location active
                </span>
              )}
              {locationError && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ⚠️ Test location (Bhopal)
                </span>
              )}
              {isCreatingRoute && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 animate-pulse">
                  <Loader2 size={12} className="mr-1 animate-spin" />
                  Creating route...
                </span>
              )}
              {selectedHospital && isRouteVisible && !isCreatingRoute && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ Route path visible
                </span>
              )}
              {checkpointRoute && checkpointRoute.checkpoints.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  🛡️ {checkpointRoute.checkpoints.length} checkpoints active
                </span>
              )}
              {searchLocation && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🔍 Search location active
                </span>
              )}
            </div>
          </div>
          
          {/* Route summary */}
          {selectedHospital && routeInfo && isRouteVisible && (
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm ${
                emergencyActive 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                <RouteIcon size={14} className="mr-2" />
                {routeInfo.distance} • {routeInfo.duration}
                {emergencyActive && (
                  <span className="ml-2 animate-pulse">🚨</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Real-time route to {selectedHospital.name}
                {checkpointRoute && (
                  <span className="block text-orange-600">
                    {checkpointRoute.checkpoints.length} checkpoints secured
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;