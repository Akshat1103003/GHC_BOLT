import React from 'react';
import { Navigation, Clock, MapPin, Zap, Target } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { calculateHospitalDistance, formatDistance, calculateETA } from '../../utils/distanceCalculator';

interface DistanceDisplayProps {
  className?: string;
  compact?: boolean;
}

const DistanceDisplay: React.FC<DistanceDisplayProps> = ({
  className = '',
  compact = false
}) => {
  const { 
    ambulanceLocation, 
    selectedHospital, 
    emergencyActive,
    initialLocationSet 
  } = useAppContext();

  if (!initialLocationSet || !selectedHospital) {
    return null;
  }

  const distanceData = calculateHospitalDistance(ambulanceLocation, selectedHospital, emergencyActive);
  const currentDuration = emergencyActive ? distanceData.emergencyDuration : distanceData.duration;
  const eta = calculateETA(currentDuration);

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-3 ${className}`}>
        <div className="flex items-center">
          <Navigation className="text-blue-500 mr-1" size={16} />
          <span className="font-medium text-blue-600">
            {distanceData.distanceFormatted.km}
          </span>
        </div>
        
        <div className="flex items-center">
          <Clock className="text-green-500 mr-1" size={16} />
          <span className="font-medium text-green-600">
            {emergencyActive ? distanceData.travelTime.emergency : distanceData.travelTime.normal}
          </span>
          {emergencyActive && (
            <Zap className="ml-1 text-red-500 animate-pulse" size={14} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Target className="mr-2" size={20} />
          Distance to {selectedHospital.name}
        </h3>
        
        {emergencyActive && (
          <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full">
            <Zap className="mr-1 animate-pulse" size={16} />
            <span className="text-sm font-bold">EMERGENCY</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Distance */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <Navigation className="text-blue-500 mr-2" size={18} />
            <span className="text-sm font-medium text-blue-700">Distance</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {distanceData.distanceFormatted.km}
          </div>
          <div className="text-xs text-blue-500">
            {distanceData.distanceFormatted.miles} • {distanceData.direction}
          </div>
        </div>

        {/* Travel Time */}
        <div className={`rounded-lg p-3 ${emergencyActive ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex items-center mb-2">
            <Clock className={`mr-2 ${emergencyActive ? 'text-red-500' : 'text-green-500'}`} size={18} />
            <span className={`text-sm font-medium ${emergencyActive ? 'text-red-700' : 'text-green-700'}`}>
              Travel Time
            </span>
          </div>
          <div className={`text-2xl font-bold ${emergencyActive ? 'text-red-600' : 'text-green-600'}`}>
            {emergencyActive ? distanceData.travelTime.emergency : distanceData.travelTime.normal}
          </div>
          <div className={`text-xs ${emergencyActive ? 'text-red-500' : 'text-green-500'}`}>
            ETA: {eta} {emergencyActive && '(Priority)'}
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Straight line distance:</span>
          <span className="font-medium">{formatDistance(distanceData.straightLineDistance)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Estimated road distance:</span>
          <span className="font-medium">{formatDistance(distanceData.estimatedRoadDistance)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Direction:</span>
          <span className="font-medium">{distanceData.direction} ({distanceData.bearing.toFixed(0)}°)</span>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-600">Priority level:</span>
          <span className={`font-medium px-2 py-1 rounded-full text-xs ${
            distanceData.priority === 'high' ? 'bg-green-100 text-green-800' :
            distanceData.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            {distanceData.priority.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Comparison */}
      {emergencyActive && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Emergency vs Normal Mode</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-amber-700">Normal time:</span>
              <span className="ml-1 font-medium">{distanceData.travelTime.normal}</span>
            </div>
            <div>
              <span className="text-amber-700">Emergency time:</span>
              <span className="ml-1 font-medium text-red-600">{distanceData.travelTime.emergency}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700">
            Time saved: {Math.ceil(distanceData.duration - distanceData.emergencyDuration)} minutes
          </div>
        </div>
      )}

      {/* Current Location */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center text-xs text-gray-500">
          <MapPin size={12} className="mr-1" />
          <span>From: {ambulanceLocation[0].toFixed(4)}, {ambulanceLocation[1].toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
};

export default DistanceDisplay;