import React, { useEffect, useState, useCallback } from 'react';
import { Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { 
  Ambulance, 
  Building2, 
  MapPin, 
  Navigation, 
  Globe, 
  Search, 
  Route as RouteIcon, 
  Loader2, 
  Crosshair, 
  AlertTriangle, 
  Shield,
  Heart,
  Phone,
  Clock,
  Users,
  Activity,
  Zap,
  Filter,
  RefreshCw,
  Target
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import RouteRenderer from './RouteRenderer';
import { calculateDistance } from '../../utils/routeUtils';
import { 
  RouteInfo, 
  CheckpointRoute, 
  EmergencyCheckpoint, 
  MedicalFacility,
  ComprehensiveCheckpointMap,
  CheckpointSortOptions,
  TrafficData
} from '../../types';
import { 
  createComprehensiveCheckpointMap,
  sortMedicalFacilities,
  updateCheckpointInformation
} from '../../utils/comprehensiveCheckpointService';

interface ComprehensiveMapViewProps {
  searchLocation?: [number, number] | null;
  checkpointRoute?: CheckpointRoute | null;
  className?: string;
}

const ComprehensiveMapView: React.FC<ComprehensiveMapViewProps> = ({ 
  searchLocation, 
  checkpointRoute, 
  className = '' 
}) => {
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
  const [comprehensiveMap, setComprehensiveMap] = useState<ComprehensiveCheckpointMap | null>(null);
  const [sortOptions, setSortOptions] = useState<CheckpointSortOptions>({
    sortBy: 'distance',
    filterBy: {
      operationalOnly: true,
      available24_7: false,
      withinRadius: 5,
      facilityTypes: [],
      minimumServices: []
    }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);

  // Generate comprehensive map when hospital is selected
  useEffect(() => {
    if (selectedHospital && initialLocationSet && checkpointRoute) {
      const patientAddress = `${ambulanceLocation[0].toFixed(4)}, ${ambulanceLocation[1].toFixed(4)}`;
      const map = createComprehensiveCheckpointMap(
        ambulanceLocation,
        patientAddress,
        selectedHospital,
        checkpointRoute.checkpoints,
        sortOptions.filterBy.withinRadius
      );
      setComprehensiveMap(map);
      console.log('🗺️ Comprehensive checkpoint map created with', map.medicalFacilities.length, 'medical facilities');
    } else {
      setComprehensiveMap(null);
    }
  }, [selectedHospital, ambulanceLocation, initialLocationSet, checkpointRoute, sortOptions.filterBy.withinRadius]);

  // Auto-update every 5 minutes
  useEffect(() => {
    if (!autoUpdateEnabled || !comprehensiveMap) return;

    const updateInterval = setInterval(() => {
      const updatedMap = updateCheckpointInformation(comprehensiveMap);
      setComprehensiveMap(updatedMap);
      setLastUpdate(new Date());
      console.log('🔄 Auto-updated comprehensive map data');
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(updateInterval);
  }, [comprehensiveMap, autoUpdateEnabled]);

  // Create enhanced marker icons
  const createMarkerIcon = useCallback((type: string, subtype?: string, status?: string) => {
    if (!window.google?.maps?.Size || !window.google?.maps?.Point) {
      return null;
    }

    let svgContent = '';
    let size = 40;
    let fillColor = '#2563EB';
    
    switch (type) {
      case 'ambulance':
        size = 52;
        fillColor = emergencyActive ? '#DC2626' : '#EF4444';
        svgContent = `
          <circle cx="26" cy="26" r="24" fill="white" stroke="${fillColor}" stroke-width="4"/>
          <rect x="10" y="18" width="32" height="16" rx="2" fill="${fillColor}"/>
          <rect x="12" y="12" width="28" height="12" rx="1" fill="${fillColor}"/>
          <circle cx="16" cy="38" r="4" fill="white" stroke="${fillColor}" stroke-width="2"/>
          <circle cx="36" cy="38" r="4" fill="white" stroke="${fillColor}" stroke-width="2"/>
          <rect x="24" y="14" width="4" height="12" fill="white"/>
          <rect x="18" y="18" width="16" height="4" fill="white"/>
          ${emergencyActive ? '<circle cx="26" cy="8" r="4" fill="#FBBF24"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></circle>' : ''}
        `;
        break;

      case 'hospital':
        size = 48;
        fillColor = '#2563EB';
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
        break;

      case 'checkpoint':
        size = 36;
        fillColor = '#F59E0B';
        svgContent = `
          <circle cx="18" cy="18" r="16" fill="white" stroke="${fillColor}" stroke-width="3"/>
          <circle cx="18" cy="18" r="12" fill="${fillColor}"/>
          <text x="18" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="white">${subtype || 'CP'}</text>
        `;
        break;

      case 'medical_facility':
        size = 32;
        const statusColors = {
          operational: '#10B981',
          limited: '#F59E0B',
          closed: '#EF4444',
          emergency_only: '#8B5CF6'
        };
        fillColor = statusColors[status as keyof typeof statusColors] || '#10B981';
        
        const facilityIcons = {
          emergency_station: '🚑',
          medical_clinic: '🏥',
          ambulance_station: '🚐',
          first_aid_center: '🩹',
          temporary_camp: '⛺'
        };
        const icon = facilityIcons[subtype as keyof typeof facilityIcons] || '🏥';
        
        svgContent = `
          <circle cx="16" cy="16" r="14" fill="white" stroke="${fillColor}" stroke-width="3"/>
          <circle cx="16" cy="16" r="10" fill="${fillColor}"/>
          <text x="16" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="10">${icon}</text>
        `;
        break;

      case 'search':
        size = 44;
        fillColor = '#10B981';
        svgContent = `
          <circle cx="22" cy="22" r="20" fill="white" stroke="${fillColor}" stroke-width="4"/>
          <circle cx="22" cy="22" r="14" fill="${fillColor}"/>
          <circle cx="18" cy="18" r="7" fill="none" stroke="white" stroke-width="3"/>
          <path d="23 23 29 29" stroke="white" stroke-width="3" stroke-linecap="round"/>
        `;
        break;
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

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size / 2)
    };
  }, [emergencyActive]);

  // Handle map load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    console.log('🗺️ Comprehensive map loaded successfully');
  }, []);

  // Handle route creation
  const handleRouteCreated = useCallback((info: RouteInfo) => {
    setRouteInfo(info);
    setIsRouteVisible(true);
    console.log('✅ Route created successfully:', info);
  }, []);

  // Handle route cleared
  const handleRouteCleared = useCallback(() => {
    setRouteInfo(null);
    setIsRouteVisible(false);
    console.log('🧹 Route cleared');
  }, []);

  // Manual update function
  const handleManualUpdate = () => {
    if (comprehensiveMap) {
      const updatedMap = updateCheckpointInformation(comprehensiveMap);
      setComprehensiveMap(updatedMap);
      setLastUpdate(new Date());
      console.log('🔄 Manual update completed');
    }
  };

  // Get sorted medical facilities
  const sortedMedicalFacilities = comprehensiveMap 
    ? sortMedicalFacilities(comprehensiveMap.medicalFacilities, sortOptions)
    : [];

  // Update map bounds to include all markers
  useEffect(() => {
    if (mapInstance && comprehensiveMap && initialLocationSet) {
      const bounds = new google.maps.LatLngBounds();
      
      // Include ambulance location
      bounds.extend({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] });
      
      // Include hospital
      if (selectedHospital) {
        bounds.extend({ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] });
      }
      
      // Include checkpoints
      if (checkpointRoute) {
        checkpointRoute.checkpoints.forEach(checkpoint => {
          bounds.extend({ lat: checkpoint.coordinates[0], lng: checkpoint.coordinates[1] });
        });
      }
      
      // Include medical facilities within view
      sortedMedicalFacilities.slice(0, 20).forEach(facility => {
        bounds.extend({ lat: facility.coordinates[0], lng: facility.coordinates[1] });
      });
      
      mapInstance.fitBounds(bounds, { 
        padding: { top: 100, right: 100, bottom: 100, left: 100 }
      });
    }
  }, [mapInstance, comprehensiveMap, ambulanceLocation, selectedHospital, checkpointRoute, sortedMedicalFacilities, initialLocationSet]);

  if (!initialLocationSet) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Target className="mx-auto mb-3 text-gray-400" size={24} />
          <p>Waiting for location detection...</p>
          <p className="text-sm mt-1">Comprehensive map will load once your location is detected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden shadow-lg bg-white ${className}`}>
      {/* Enhanced Map Controls Header */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-3 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <Globe size={18} className="text-blue-600" />
            <span className="font-medium">Comprehensive Emergency Response Map</span>
            
            {comprehensiveMap && (
              <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full text-xs">
                {comprehensiveMap.medicalFacilities.length} Medical Facilities
              </span>
            )}
            
            {checkpointRoute && (
              <span className="text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full text-xs flex items-center">
                <Shield size={12} className="mr-1" />
                {checkpointRoute.checkpoints.length} Checkpoints
              </span>
            )}
          </div>
          
          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`text-xs px-3 py-1 rounded-full hover:opacity-80 transition-opacity ${
                showFilters 
                  ? 'bg-blue-200 text-blue-900 border border-blue-300' 
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              <Filter size={12} className="mr-1 inline" />
              Filters
            </button>
            
            <button
              onClick={handleManualUpdate}
              className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 flex items-center"
              disabled={!comprehensiveMap}
            >
              <RefreshCw size={12} className="mr-1" />
              Update
            </button>
            
            <div className="text-xs text-gray-500">
              Last: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortOptions.sortBy}
                  onChange={(e) => setSortOptions(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="distance">Distance</option>
                  <option value="status">Status</option>
                  <option value="services">Services</option>
                  <option value="response_time">Response Time</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Radius (miles)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={sortOptions.filterBy.withinRadius}
                  onChange={(e) => setSortOptions(prev => ({ 
                    ...prev, 
                    filterBy: { ...prev.filterBy, withinRadius: parseInt(e.target.value) || 5 }
                  }))}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={sortOptions.filterBy.operationalOnly}
                    onChange={(e) => setSortOptions(prev => ({ 
                      ...prev, 
                      filterBy: { ...prev.filterBy, operationalOnly: e.target.checked }
                    }))}
                    className="mr-1"
                  />
                  Operational Only
                </label>
                
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={sortOptions.filterBy.available24_7}
                    onChange={(e) => setSortOptions(prev => ({ 
                      ...prev, 
                      filterBy: { ...prev.filterBy, available24_7: e.target.checked }
                    }))}
                    className="mr-1"
                  />
                  24/7 Only
                </label>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={autoUpdateEnabled}
                    onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                    className="mr-1"
                  />
                  Auto-update (5min)
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Map Container */}
      <div className="relative" style={{ height: '600px' }}>
        <Map
          style={{ width: '100%', height: '600px' }}
          defaultCenter={{ lat: ambulanceLocation[0], lng: ambulanceLocation[1] }}
          defaultZoom={11}
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
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
            clickableIcons: false,
            backgroundColor: '#f8fafc'
          }}
        >
          {/* Route Renderer */}
          <RouteRenderer
            map={mapInstance}
            route={currentRoute}
            emergencyActive={emergencyActive}
            onRouteCreated={handleRouteCreated}
            onRouteCleared={handleRouteCleared}
          />

          {/* Search location marker */}
          {searchLocation && (
            <Marker
              position={{ lat: searchLocation[0], lng: searchLocation[1] }}
              icon={createMarkerIcon('search')}
              onClick={() => setSelectedMarker('search')}
              zIndex={950}
            />
          )}

          {/* Ambulance marker */}
          <Marker
            position={{ lat: ambulanceLocation[0], lng: ambulanceLocation[1] }}
            icon={createMarkerIcon('ambulance')}
            onClick={() => setSelectedMarker('ambulance')}
            zIndex={1000}
          />

          {/* Hospital marker */}
          {selectedHospital && (
            <Marker
              position={{ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] }}
              icon={createMarkerIcon('hospital')}
              onClick={() => setSelectedMarker('hospital')}
              zIndex={900}
            />
          )}

          {/* Emergency Checkpoint markers */}
          {checkpointRoute && checkpointRoute.checkpoints.map((checkpoint: EmergencyCheckpoint) => (
            <Marker
              key={checkpoint.id}
              position={{ lat: checkpoint.coordinates[0], lng: checkpoint.coordinates[1] }}
              icon={createMarkerIcon('checkpoint', checkpoint.code)}
              onClick={() => setSelectedMarker(`checkpoint-${checkpoint.id}`)}
              zIndex={800}
            />
          ))}

          {/* Medical Facility markers */}
          {sortedMedicalFacilities.slice(0, 50).map((facility: MedicalFacility) => (
            <Marker
              key={facility.id}
              position={{ lat: facility.coordinates[0], lng: facility.coordinates[1] }}
              icon={createMarkerIcon('medical_facility', facility.type, facility.operationalStatus)}
              onClick={() => setSelectedMarker(`facility-${facility.id}`)}
              zIndex={700}
            />
          ))}

          {/* Info Windows */}
          {selectedMarker && selectedMarker.startsWith('facility-') && (
            (() => {
              const facilityId = selectedMarker.replace('facility-', '');
              const facility = sortedMedicalFacilities.find(f => f.id === facilityId);
              if (!facility) return null;

              return (
                <InfoWindow
                  position={{ lat: facility.coordinates[0], lng: facility.coordinates[1] }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-3 max-w-sm">
                    <div className="flex items-center mb-3">
                      <div className="mr-2 text-2xl">
                        {facility.type === 'emergency_station' ? '🚑' :
                         facility.type === 'medical_clinic' ? '🏥' :
                         facility.type === 'ambulance_station' ? '🚐' :
                         facility.type === 'first_aid_center' ? '🩹' :
                         '⛺'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{facility.name}</p>
                        <p className="text-xs text-gray-500">{facility.type.replace('_', ' ').toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${
                          facility.operationalStatus === 'operational' ? 'text-green-600' :
                          facility.operationalStatus === 'limited' ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {facility.operationalStatus.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Distance:</span>
                        <span className="font-medium">{facility.distanceFromPatient.toFixed(1)} km</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Response Time:</span>
                        <span className="font-medium">{facility.responseTime.currentEstimate} min</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Capacity:</span>
                        <span className="font-medium">
                          {facility.staffing.currentCapacity}/{facility.staffing.maxCapacity}
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <p className="font-medium mb-1">Available Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {facility.services.basicFirstAid && <span className="bg-green-100 text-green-800 px-1 rounded">First Aid</span>}
                          {facility.services.advancedLifeSupport && <span className="bg-blue-100 text-blue-800 px-1 rounded">ALS</span>}
                          {facility.services.trauma && <span className="bg-red-100 text-red-800 px-1 rounded">Trauma</span>}
                          {facility.services.cardiac && <span className="bg-purple-100 text-purple-800 px-1 rounded">Cardiac</span>}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="font-medium mb-1">Equipment:</p>
                        <div className="flex flex-wrap gap-1">
                          {facility.equipment.defibrillator && <span className="bg-yellow-100 text-yellow-800 px-1 rounded">AED</span>}
                          {facility.equipment.oxygenSupply && <span className="bg-cyan-100 text-cyan-800 px-1 rounded">O2</span>}
                          {facility.equipment.emergencyMedications && <span className="bg-pink-100 text-pink-800 px-1 rounded">Meds</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              );
            })()
          )}
        </Map>
        
        {/* Loading overlay */}
        {isCreatingRoute && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-lg p-4 flex items-center">
              <Loader2 className="animate-spin h-6 w-6 text-blue-600 mr-3" />
              <span className="text-sm font-medium text-gray-700">Loading comprehensive map...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Panel */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-gray-800 flex items-center">
              🗺️ Comprehensive Emergency Response Map
              {emergencyActive && <span className="ml-2 text-red-600 animate-pulse">• EMERGENCY MODE</span>}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {comprehensiveMap 
                ? `Displaying ${comprehensiveMap.medicalFacilities.length} medical facilities within ${sortOptions.filterBy.withinRadius} mile radius`
                : 'Select a hospital to view comprehensive emergency response options'
              }
            </p>
            
            {/* Status indicators */}
            <div className="flex flex-wrap gap-2 mt-2">
              {comprehensiveMap && (
                <>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🏥 {comprehensiveMap.medicalFacilities.filter(f => f.operationalStatus === 'operational').length} Operational
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🚑 {comprehensiveMap.medicalFacilities.filter(f => f.type === 'emergency_station').length} Emergency Stations
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    🚐 {comprehensiveMap.medicalFacilities.filter(f => f.type === 'ambulance_station').length} Ambulance Stations
                  </span>
                  {autoUpdateEnabled && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
                      🔄 Auto-updating every 5 minutes
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Summary Stats */}
          {comprehensiveMap && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                Next Update: {comprehensiveMap.nextUpdateTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-500">
                Traffic data updated: {comprehensiveMap.trafficData.length} segments
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveMapView;