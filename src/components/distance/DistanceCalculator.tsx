import React, { useState, useEffect, useMemo } from 'react';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  Target, 
  Compass, 
  Activity,
  AlertCircle,
  CheckCircle,
  Timer,
  Route,
  Zap
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  calculateAllHospitalDistances, 
  HospitalDistance, 
  getDistanceCategory,
  calculateETA,
  formatDistance,
  DistanceTracker
} from '../../utils/distanceCalculator';

interface DistanceCalculatorProps {
  className?: string;
  showDetailedView?: boolean;
  maxHospitals?: number;
}

const DistanceCalculator: React.FC<DistanceCalculatorProps> = ({
  className = '',
  showDetailedView = true,
  maxHospitals = 5
}) => {
  const { 
    ambulanceLocation, 
    hospitals, 
    selectedHospital, 
    emergencyActive,
    initialLocationSet 
  } = useAppContext();

  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');
  const [sortBy, setSortBy] = useState<'distance' | 'time' | 'priority'>('priority');
  const [showOnlyReady, setShowOnlyReady] = useState(false);
  const [distanceTracker] = useState(() => new DistanceTracker());
  const [trackingData, setTrackingData] = useState({
    distanceTraveled: 0,
    totalDistance: 0,
    averageSpeed: 0
  });

  // Calculate distances for all hospitals
  const hospitalDistances = useMemo(() => {
    if (!initialLocationSet || hospitals.length === 0) return [];
    
    let filteredHospitals = hospitals;
    if (showOnlyReady) {
      filteredHospitals = hospitals.filter(h => h.emergencyReady);
    }
    
    const distances = calculateAllHospitalDistances(ambulanceLocation, filteredHospitals, emergencyActive);
    
    // Sort based on selected criteria
    return distances.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.straightLineDistance - b.straightLineDistance;
        case 'time':
          return (emergencyActive ? a.emergencyDuration : a.duration) - (emergencyActive ? b.emergencyDuration : b.duration);
        case 'priority':
        default:
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return a.straightLineDistance - b.straightLineDistance;
      }
    }).slice(0, maxHospitals);
  }, [ambulanceLocation, hospitals, emergencyActive, initialLocationSet, showOnlyReady, sortBy, maxHospitals]);

  // Track ambulance movement
  useEffect(() => {
    if (initialLocationSet && emergencyActive) {
      const data = distanceTracker.update(ambulanceLocation);
      setTrackingData(data);
    }
  }, [ambulanceLocation, initialLocationSet, emergencyActive, distanceTracker]);

  // Reset tracking when emergency mode changes
  useEffect(() => {
    if (emergencyActive) {
      distanceTracker.start(ambulanceLocation);
    } else {
      distanceTracker.reset();
      setTrackingData({ distanceTraveled: 0, totalDistance: 0, averageSpeed: 0 });
    }
  }, [emergencyActive, distanceTracker, ambulanceLocation]);

  // Get priority color
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  // Get distance category color
  const getDistanceCategoryColor = (distance: number) => {
    const category = getDistanceCategory(distance);
    switch (category) {
      case 'very-close': return 'text-green-600';
      case 'close': return 'text-blue-600';
      case 'medium': return 'text-amber-600';
      case 'far': return 'text-orange-600';
      case 'very-far': return 'text-red-600';
    }
  };

  if (!initialLocationSet) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Target className="mx-auto mb-3 text-gray-400" size={24} />
          <p>Waiting for location detection...</p>
          <p className="text-sm mt-1">Distance calculations will appear once your location is detected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Navigation className="mr-2" size={20} />
            Distance Calculator
            {emergencyActive && (
              <span className="ml-2 animate-pulse">
                <Zap className="text-red-500" size={16} />
              </span>
            )}
          </h2>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value as 'km' | 'mi')}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="km">Kilometers</option>
              <option value="mi">Miles</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'distance' | 'time' | 'priority')}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="priority">Priority</option>
              <option value="distance">Distance</option>
              <option value="time">Time</option>
            </select>
          </div>
        </div>

        {/* Emergency Tracking Stats */}
        {emergencyActive && trackingData.totalDistance > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-xs text-gray-600">Distance Traveled</div>
              <div className="font-bold text-blue-600">
                {formatDistance(trackingData.totalDistance, distanceUnit)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-xs text-gray-600">Average Speed</div>
              <div className="font-bold text-green-600">
                {trackingData.averageSpeed.toFixed(1)} km/h
              </div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-xs text-gray-600">Mode</div>
              <div className="font-bold text-red-600 animate-pulse">EMERGENCY</div>
            </div>
          </div>
        )}

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showOnlyReady"
              checked={showOnlyReady}
              onChange={(e) => setShowOnlyReady(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="showOnlyReady" className="text-sm text-gray-700">
              Emergency ready only
            </label>
          </div>
          
          <div className="text-xs text-gray-500">
            Showing {hospitalDistances.length} of {hospitals.length} hospitals
          </div>
        </div>
      </div>

      {/* Hospital Distance List */}
      <div className="max-h-96 overflow-y-auto">
        {hospitalDistances.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <AlertCircle className="mx-auto mb-3 text-gray-400" size={24} />
            <p>No hospitals found matching your criteria.</p>
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {hospitalDistances.map((hospitalDistance, index) => (
              <HospitalDistanceCard
                key={hospitalDistance.hospital.id}
                hospitalDistance={hospitalDistance}
                index={index}
                distanceUnit={distanceUnit}
                emergencyActive={emergencyActive}
                isSelected={selectedHospital?.id === hospitalDistance.hospital.id}
                showDetailedView={showDetailedView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center">
            <MapPin size={12} className="mr-1" />
            <span>Live location: {ambulanceLocation[0].toFixed(4)}, {ambulanceLocation[1].toFixed(4)}</span>
          </div>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Hospital Distance Card Component
interface HospitalDistanceCardProps {
  hospitalDistance: HospitalDistance;
  index: number;
  distanceUnit: 'km' | 'mi';
  emergencyActive: boolean;
  isSelected: boolean;
  showDetailedView: boolean;
}

const HospitalDistanceCard: React.FC<HospitalDistanceCardProps> = ({
  hospitalDistance,
  index,
  distanceUnit,
  emergencyActive,
  isSelected,
  showDetailedView
}) => {
  const { hospital, straightLineDistance, duration, emergencyDuration, direction, priority, travelTime } = hospitalDistance;
  
  const priorityColor = getPriorityColor(priority);
  const distanceColor = getDistanceCategoryColor(straightLineDistance);
  const currentDuration = emergencyActive ? emergencyDuration : duration;
  const eta = calculateETA(currentDuration);

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getDistanceCategoryColor = (distance: number) => {
    const category = getDistanceCategory(distance);
    switch (category) {
      case 'very-close': return 'text-green-600';
      case 'close': return 'text-blue-600';
      case 'medium': return 'text-amber-600';
      case 'far': return 'text-orange-600';
      case 'very-far': return 'text-red-600';
    }
  };

  return (
    <div className={`p-4 transition-colors ${
      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Hospital Name and Rank */}
          <div className="flex items-center mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-bold rounded-full mr-2">
              {index + 1}
            </span>
            <h3 className="font-medium text-gray-900 truncate">
              {hospital.name}
            </h3>
            {isSelected && (
              <CheckCircle className="ml-2 text-blue-500 flex-shrink-0" size={16} />
            )}
          </div>

          {/* Distance and Direction */}
          <div className="flex items-center space-x-4 mb-2">
            <div className="flex items-center">
              <Navigation className={`mr-1 ${distanceColor}`} size={14} />
              <span className={`font-bold ${distanceColor}`}>
                {formatDistance(straightLineDistance, distanceUnit)}
              </span>
            </div>
            
            <div className="flex items-center">
              <Compass className="mr-1 text-gray-500" size={14} />
              <span className="text-sm text-gray-600">{direction}</span>
            </div>
            
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColor}`}>
              {priority.toUpperCase()}
            </div>
          </div>

          {/* Time Information */}
          <div className="flex items-center space-x-4 mb-2">
            <div className="flex items-center">
              <Clock className="mr-1 text-blue-500" size={14} />
              <span className="text-sm font-medium">
                {emergencyActive ? travelTime.emergency : travelTime.normal}
                {emergencyActive && (
                  <span className="ml-1 text-red-600 font-bold">EMERGENCY</span>
                )}
              </span>
            </div>
            
            <div className="flex items-center">
              <Timer className="mr-1 text-green-500" size={14} />
              <span className="text-sm text-gray-600">ETA: {eta}</span>
            </div>
          </div>

          {/* Hospital Status */}
          <div className="flex items-center space-x-2">
            {hospital.emergencyReady ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle size={12} className="mr-1" />
                Emergency Ready
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <AlertCircle size={12} className="mr-1" />
                Limited Capacity
              </span>
            )}
            
            {showDetailedView && (
              <span className="text-xs text-gray-500">
                {hospital.specialties.slice(0, 2).join(', ')}
                {hospital.specialties.length > 2 && ` +${hospital.specialties.length - 2}`}
              </span>
            )}
          </div>

          {/* Detailed View */}
          {showDetailedView && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Straight line:</span>
                  <span className="ml-1 font-medium">{formatDistance(straightLineDistance, distanceUnit)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Est. road:</span>
                  <span className="ml-1 font-medium">{formatDistance(hospitalDistance.estimatedRoadDistance, distanceUnit)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Normal time:</span>
                  <span className="ml-1 font-medium">{travelTime.normal}</span>
                </div>
                <div>
                  <span className="text-gray-500">Emergency time:</span>
                  <span className="ml-1 font-medium text-red-600">{travelTime.emergency}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col items-end space-y-1 ml-4">
          <button
            onClick={() => {
              const url = `https://www.google.com/maps/dir/${hospitalDistance.hospital.coordinates[0]},${hospitalDistance.hospital.coordinates[1]}`;
              window.open(url, '_blank');
            }}
            className="text-blue-600 hover:text-blue-700 text-xs"
            title="Get directions"
          >
            <Route size={16} />
          </button>
          
          {emergencyActive && (
            <div className="flex items-center">
              <Activity className="text-red-500 animate-pulse" size={12} />
              <span className="text-xs text-red-600 ml-1 font-bold">LIVE</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistanceCalculator;