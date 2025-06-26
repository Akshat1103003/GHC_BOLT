import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Shield, 
  Phone, 
  Heart, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Zap,
  Activity,
  Target,
  Compass
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  generateEmergencyCheckpoints, 
  getCheckpointStatistics, 
  findNearestCheckpoint,
  validateCheckpoint,
  exportCheckpointData
} from '../../utils/checkpointGenerator';
import { CheckpointRoute, EmergencyCheckpoint } from '../../types';

interface CheckpointDisplayProps {
  className?: string;
  showDetailedView?: boolean;
}

const CheckpointDisplay: React.FC<CheckpointDisplayProps> = ({
  className = '',
  showDetailedView = true
}) => {
  const { 
    ambulanceLocation, 
    selectedHospital, 
    emergencyActive,
    initialLocationSet,
    checkpointRoute,
    setCheckpointRoute
  } = useAppContext();

  const [nearestCheckpoint, setNearestCheckpoint] = useState<{ checkpoint: EmergencyCheckpoint; distance: number } | null>(null);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Generate checkpoints when hospital is selected
  useEffect(() => {
    if (selectedHospital && initialLocationSet) {
      const route = generateEmergencyCheckpoints(
        ambulanceLocation,
        selectedHospital.coordinates,
        selectedHospital
      );
      setCheckpointRoute(route);
      
      // Find nearest checkpoint to current location
      const nearest = findNearestCheckpoint(ambulanceLocation, route);
      setNearestCheckpoint(nearest);
      
      console.log(`🚨 Generated emergency checkpoint route with ${route.checkpoints.length} checkpoints using geodesic interpolation`);
    } else {
      setCheckpointRoute(null);
      setNearestCheckpoint(null);
    }
  }, [selectedHospital, ambulanceLocation, initialLocationSet, setCheckpointRoute]);

  // Update nearest checkpoint when ambulance moves
  useEffect(() => {
    if (checkpointRoute && emergencyActive) {
      const nearest = findNearestCheckpoint(ambulanceLocation, checkpointRoute);
      setNearestCheckpoint(nearest);
    }
  }, [ambulanceLocation, checkpointRoute, emergencyActive]);

  const handleExportData = () => {
    if (!checkpointRoute) return;
    
    const exportData = exportCheckpointData(checkpointRoute);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency-checkpoints-${checkpointRoute.routeId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFacilityIcon = (facility: string) => {
    switch (facility) {
      case 'firstAid': return <Heart size={14} className="text-red-500" />;
      case 'defibrillator': return <Zap size={14} className="text-blue-500" />;
      case 'oxygenSupply': return <Activity size={14} className="text-green-500" />;
      case 'emergencyPhone': return <Phone size={14} className="text-purple-500" />;
      default: return <CheckCircle size={14} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-50 border-green-200';
      case 'maintenance': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'out_of_service': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!initialLocationSet || !selectedHospital) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Target className="mx-auto mb-3 text-gray-400" size={24} />
          <p>Select a hospital to generate emergency checkpoints</p>
          <p className="text-sm mt-1">Checkpoints will be placed at 5km intervals using geodesic interpolation</p>
        </div>
      </div>
    );
  }

  if (!checkpointRoute) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p>Generating emergency checkpoints...</p>
          <p className="text-sm mt-1">Using geodesic interpolation for accurate positioning</p>
        </div>
      </div>
    );
  }

  const statistics = getCheckpointStatistics(checkpointRoute);

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Shield className="mr-2" size={20} />
            Emergency Checkpoints
            {emergencyActive && (
              <span className="ml-2 animate-pulse">
                <Zap className="text-red-500" size={16} />
              </span>
            )}
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                console.log('🔍 Validation button clicked. Current state:', showValidation);
                setShowValidation(!showValidation);
                console.log('🔍 Validation state toggled to:', !showValidation);
              }}
              className={`text-xs px-3 py-1 rounded-full hover:opacity-80 transition-opacity ${
                showValidation 
                  ? 'bg-blue-200 text-blue-900 border border-blue-300' 
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {showValidation ? 'Hide' : 'Show'} Validation
            </button>
            
            <button
              onClick={handleExportData}
              className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 flex items-center"
            >
              <Download size={12} className="mr-1" />
              Export
            </button>
          </div>
        </div>

        {/* Route Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600">Total Distance</div>
            <div className="font-bold text-blue-600">{checkpointRoute.totalDistance.toFixed(1)} km</div>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600">Checkpoints</div>
            <div className="font-bold text-green-600">{statistics.total}</div>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600">Avg Spacing</div>
            <div className="font-bold text-purple-600">{statistics.averageSpacing.toFixed(1)} km</div>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600">Operational</div>
            <div className="font-bold text-orange-600">{statistics.operational}/{statistics.total}</div>
          </div>
        </div>

        {/* Geodesic Interpolation Indicator */}
        <div className="mb-3 p-2 bg-blue-100 border border-blue-200 rounded-lg">
          <div className="flex items-center text-sm text-blue-800">
            <Compass size={14} className="mr-2" />
            <span className="font-medium">Geodesic Interpolation Active</span>
            <span className="ml-2 text-xs">- Checkpoints positioned using great-circle calculations for maximum accuracy</span>
          </div>
        </div>

        {/* Validation Status Indicator */}
        {showValidation && (
          <div className="mb-3 p-2 bg-blue-100 border border-blue-200 rounded-lg">
            <div className="flex items-center text-sm text-blue-800">
              <AlertTriangle size={14} className="mr-2" />
              <span className="font-medium">Validation Mode Active</span>
              <span className="ml-2 text-xs">- Issues will be displayed for each checkpoint</span>
            </div>
          </div>
        )}

        {/* Nearest Checkpoint Alert */}
        {nearestCheckpoint && emergencyActive && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-3">
            <div className="flex items-center">
              <Navigation className="text-red-600 mr-2" size={16} />
              <div>
                <p className="text-red-800 font-medium text-sm">
                  Nearest Checkpoint: {nearestCheckpoint.checkpoint.code}
                </p>
                <p className="text-red-700 text-xs">
                  {nearestCheckpoint.distance.toFixed(1)}km away • {nearestCheckpoint.checkpoint.landmark}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkpoint List */}
      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {checkpointRoute.checkpoints.map((checkpoint, index) => {
            const isSelected = selectedCheckpointId === checkpoint.id;
            const isNearest = nearestCheckpoint?.checkpoint.id === checkpoint.id;
            const validation = showValidation ? validateCheckpoint(checkpoint) : null;

            return (
              <div
                key={checkpoint.id}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 
                  isNearest && emergencyActive ? 'bg-red-50 border-l-4 border-red-500' :
                  'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCheckpointId(isSelected ? null : checkpoint.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Checkpoint Header */}
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${
                        isNearest && emergencyActive ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {checkpoint.code}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900">{checkpoint.landmark}</h3>
                        <p className="text-xs text-gray-500">{checkpoint.streetIntersection}</p>
                      </div>
                      {isNearest && emergencyActive && (
                        <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full animate-pulse">
                          NEAREST
                        </span>
                      )}
                    </div>

                    {/* Distance and Status */}
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center">
                        <Compass className="mr-1 text-blue-500" size={14} />
                        <span className="text-sm font-medium">{checkpoint.distanceFromStart.toFixed(1)} km</span>
                      </div>
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(checkpoint.status)}`}>
                        {checkpoint.status.toUpperCase()}
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin className="mr-1 text-gray-500" size={14} />
                        <span className="text-xs text-gray-600">
                          {checkpoint.coordinates[0].toFixed(4)}, {checkpoint.coordinates[1].toFixed(4)}
                        </span>
                      </div>
                    </div>

                    {/* Key Facilities */}
                    <div className="flex items-center space-x-3 mb-2">
                      {checkpoint.facilities.firstAid && (
                        <div className="flex items-center" title="First Aid">
                          {getFacilityIcon('firstAid')}
                          <span className="text-xs ml-1">First Aid</span>
                        </div>
                      )}
                      {checkpoint.facilities.defibrillator && (
                        <div className="flex items-center" title="Defibrillator">
                          {getFacilityIcon('defibrillator')}
                          <span className="text-xs ml-1">AED</span>
                        </div>
                      )}
                      {checkpoint.facilities.oxygenSupply && (
                        <div className="flex items-center" title="Oxygen Supply">
                          {getFacilityIcon('oxygenSupply')}
                          <span className="text-xs ml-1">O2</span>
                        </div>
                      )}
                      {checkpoint.facilities.emergencyPhone && (
                        <div className="flex items-center" title="Emergency Phone">
                          {getFacilityIcon('emergencyPhone')}
                          <span className="text-xs ml-1">Phone</span>
                        </div>
                      )}
                    </div>

                    {/* Validation Issues */}
                    {showValidation && validation && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                        <div className="flex items-center mb-1">
                          <AlertTriangle size={14} className="text-amber-600 mr-1" />
                          <span className="text-xs font-medium text-amber-800">
                            {validation.isValid ? 'Checkpoint Valid' : 'Issues Found'}
                          </span>
                        </div>
                        {!validation.isValid && validation.issues.map((issue, idx) => (
                          <p key={idx} className="text-xs text-amber-700">• {issue}</p>
                        ))}
                        {validation.isValid && (
                          <p className="text-xs text-green-700">✅ All systems operational</p>
                        )}
                        {validation.recommendations.length > 0 && (
                          <div className="mt-1">
                            <p className="text-xs font-medium text-blue-800">Recommendations:</p>
                            {validation.recommendations.map((rec, idx) => (
                              <p key={idx} className="text-xs text-blue-700">• {rec}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Detailed View */}
                    {isSelected && showDetailedView && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Safe Stopping Area */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-800 mb-2">Safe Stopping Area</h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p><strong>Type:</strong> {checkpoint.safeStoppingArea.type.replace('_', ' ')}</p>
                              <p><strong>Description:</strong> {checkpoint.safeStoppingArea.description}</p>
                              <p><strong>Capacity:</strong> {checkpoint.safeStoppingArea.capacity} vehicles</p>
                            </div>
                          </div>

                          {/* Visibility & Access */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-800 mb-2">Visibility & Access</h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p><strong>Road Visibility:</strong> {checkpoint.visibility.roadVisibility}</p>
                              <p><strong>24/7 Available:</strong> {checkpoint.accessibility.available24_7 ? 'Yes' : 'No'}</p>
                              <p><strong>Emergency Access:</strong> {checkpoint.accessibility.emergencyVehicleAccess ? 'Yes' : 'No'}</p>
                            </div>
                          </div>

                          {/* Emergency Services */}
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-medium text-gray-800 mb-2">Nearby Emergency Services</h4>
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div>
                                <p className="font-medium text-blue-600">Hospital</p>
                                <p>{checkpoint.emergencyServices.nearestHospital}</p>
                                <p>{checkpoint.emergencyServices.distanceToHospital.toFixed(1)}km</p>
                              </div>
                              <div>
                                <p className="font-medium text-red-600">Fire Station</p>
                                <p>{checkpoint.emergencyServices.nearestFireStation}</p>
                                <p>{checkpoint.emergencyServices.distanceToFireStation.toFixed(1)}km</p>
                              </div>
                              <div>
                                <p className="font-medium text-purple-600">Police</p>
                                <p>{checkpoint.emergencyServices.nearestPoliceStation}</p>
                                <p>{checkpoint.emergencyServices.distanceToPoliceStation.toFixed(1)}km</p>
                              </div>
                            </div>
                          </div>

                          {/* Last Inspection */}
                          <div className="md:col-span-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">
                                Last Inspected: {checkpoint.lastInspected.toLocaleDateString()}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const url = `https://www.google.com/maps?q=${checkpoint.coordinates[0]},${checkpoint.coordinates[1]}`;
                                  window.open(url, '_blank');
                                }}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                View on Map
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Indicators */}
                  <div className="flex flex-col items-end space-y-1 ml-4">
                    {checkpoint.visibility.emergencyBeacon && (
                      <div className="flex items-center" title="Emergency Beacon Active">
                        <Eye className="text-green-500" size={14} />
                      </div>
                    )}
                    
                    {checkpoint.accessibility.available24_7 && (
                      <div className="flex items-center" title="24/7 Available">
                        <Clock className="text-blue-500" size={14} />
                      </div>
                    )}
                    
                    {checkpoint.status === 'operational' && (
                      <div className="flex items-center" title="Operational">
                        <CheckCircle className="text-green-500" size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div>
            <span className="font-medium">Route Coverage:</span> {checkpointRoute.totalDistance.toFixed(1)}km • 
            <span className="font-medium ml-1">Checkpoints:</span> {statistics.total} • 
            <span className="font-medium ml-1">Operational:</span> {statistics.operational}
          </div>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            <span>Generated: {checkpointRoute.createdAt.toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="mt-1 text-xs text-blue-600">
          🎯 Geodesic interpolation ensures accurate 5km spacing along great-circle path
        </div>
        
        {emergencyActive && (
          <div className="mt-2 text-xs text-red-600 font-medium">
            🚨 Emergency Mode Active - All checkpoints are on standby for immediate assistance
          </div>
        )}
        
        {showValidation && (
          <div className="mt-2 text-xs text-blue-600 font-medium">
            🔍 Validation Mode: Displaying checkpoint status and recommendations
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckpointDisplay;