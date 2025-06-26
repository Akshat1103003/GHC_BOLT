import React, { useMemo } from 'react';
import { Navigation, Clock, MapPin, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { calculateDistance, calculateDuration } from '../../utils/routeUtils';

interface SimpleDistanceCalculatorProps {
  className?: string;
  maxHospitals?: number;
}

interface HospitalWithDistance {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  phone: string;
  specialties: string[];
  emergencyReady: boolean;
  distance: number;
  duration: number;
  emergencyDuration: number;
}

const SimpleDistanceCalculator: React.FC<SimpleDistanceCalculatorProps> = ({
  className = '',
  maxHospitals = 5
}) => {
  const { 
    ambulanceLocation, 
    hospitals, 
    selectedHospital, 
    emergencyActive,
    initialLocationSet,
    selectHospital
  } = useAppContext();

  // Calculate distances for all hospitals
  const hospitalsWithDistances = useMemo(() => {
    if (!initialLocationSet || hospitals.length === 0) return [];
    
    const hospitalsWithDist: HospitalWithDistance[] = hospitals.map(hospital => {
      const distance = calculateDistance(ambulanceLocation, hospital.coordinates);
      const duration = calculateDuration(ambulanceLocation, hospital.coordinates);
      const emergencyDuration = duration * 0.7; // 30% faster in emergency mode
      
      return {
        ...hospital,
        distance,
        duration,
        emergencyDuration
      };
    });

    // Sort by distance (closest first)
    return hospitalsWithDist
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxHospitals);
  }, [ambulanceLocation, hospitals, initialLocationSet, maxHospitals]);

  // Format distance
  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.ceil(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.ceil(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  // Get priority based on distance and emergency readiness
  const getPriority = (hospital: HospitalWithDistance): 'HIGH' | 'MEDIUM' | 'LOW' => {
    if (hospital.distance <= 5 && hospital.emergencyReady) return 'HIGH';
    if (hospital.distance <= 15 && hospital.emergencyReady) return 'MEDIUM';
    return 'LOW';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-green-600 bg-green-50 border-green-200';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Navigation className="mr-2" size={20} />
          Distance Calculator
          {emergencyActive && (
            <span className="ml-2 text-red-600 animate-pulse text-sm font-bold">EMERGENCY</span>
          )}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Distances from your live location to nearby hospitals
        </p>
      </div>

      {/* Hospital List */}
      <div className="max-h-96 overflow-y-auto">
        {hospitalsWithDistances.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <AlertCircle className="mx-auto mb-3 text-gray-400" size={24} />
            <p>No hospitals found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {hospitalsWithDistances.map((hospital, index) => {
              const priority = getPriority(hospital);
              const priorityColor = getPriorityColor(priority);
              const isSelected = selectedHospital?.id === hospital.id;
              const currentDuration = emergencyActive ? hospital.emergencyDuration : hospital.duration;

              return (
                <div
                  key={hospital.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => selectHospital(hospital)}
                >
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

                      {/* Distance and Time */}
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                          <Navigation className="mr-1 text-red-500" size={14} />
                          <span className="font-bold text-red-600">
                            {formatDistance(hospital.distance)}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="mr-1 text-blue-500" size={14} />
                          <span className="text-sm font-medium">
                            {formatDuration(currentDuration)}
                            {emergencyActive && (
                              <span className="ml-1 text-red-600 text-xs">EMERGENCY</span>
                            )}
                          </span>
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColor}`}>
                          {priority}
                        </div>
                      </div>

                      {/* Hospital Status and Address */}
                      <div className="space-y-1">
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
                        </div>
                        
                        <p className="text-xs text-gray-500 truncate">
                          {hospital.address}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-col items-end space-y-1 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `https://www.google.com/maps/dir/${ambulanceLocation[0]},${ambulanceLocation[1]}/${hospital.coordinates[0]},${hospital.coordinates[1]}`;
                          window.open(url, '_blank');
                        }}
                        className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                        title="Get directions"
                      >
                        Directions
                      </button>
                      
                      {emergencyActive && isSelected && (
                        <div className="flex items-center">
                          <span className="text-xs text-red-600 font-bold animate-pulse">LIVE</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Emergency Mode Comparison */}
                  {isSelected && emergencyActive && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Normal time:</span>
                          <span className="ml-1 font-medium">{formatDuration(hospital.duration)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Emergency time:</span>
                          <span className="ml-1 font-medium text-red-600">{formatDuration(hospital.emergencyDuration)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-green-600">
                        Time saved: {formatDuration(hospital.duration - hospital.emergencyDuration)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center">
            <MapPin size={12} className="mr-1" />
            <span>From: {ambulanceLocation[0].toFixed(4)}, {ambulanceLocation[1].toFixed(4)}</span>
          </div>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        {selectedHospital && (
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Selected: {selectedHospital.name} • {formatDistance(calculateDistance(ambulanceLocation, selectedHospital.coordinates))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDistanceCalculator;