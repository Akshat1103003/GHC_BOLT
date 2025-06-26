import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Shield, 
  Phone, 
  Heart, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Zap,
  Activity,
  Target,
  Filter,
  RefreshCw,
  Users,
  Building2,
  Ambulance,
  Search,
  ArrowUpDown
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  MedicalFacility,
  ComprehensiveCheckpointMap,
  CheckpointSortOptions
} from '../../types';
import { 
  createComprehensiveCheckpointMap,
  sortMedicalFacilities,
  updateCheckpointInformation
} from '../../utils/comprehensiveCheckpointService';

interface ComprehensiveCheckpointPanelProps {
  className?: string;
  maxFacilities?: number;
}

const ComprehensiveCheckpointPanel: React.FC<ComprehensiveCheckpointPanelProps> = ({
  className = '',
  maxFacilities = 20
}) => {
  const { 
    ambulanceLocation, 
    selectedHospital, 
    emergencyActive,
    initialLocationSet,
    checkpointRoute
  } = useAppContext();

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
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
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
      setLastUpdate(new Date());
      console.log('🗺️ Comprehensive checkpoint panel updated with', map.medicalFacilities.length, 'medical facilities');
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
      console.log('🔄 Auto-updated comprehensive checkpoint panel');
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(updateInterval);
  }, [comprehensiveMap, autoUpdateEnabled]);

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
    ? sortMedicalFacilities(comprehensiveMap.medicalFacilities, sortOptions).slice(0, maxFacilities)
    : [];

  // Get facility type icon
  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'emergency_station': return <Ambulance size={16} className="text-red-500" />;
      case 'medical_clinic': return <Building2 size={16} className="text-blue-500" />;
      case 'ambulance_station': return <Ambulance size={16} className="text-green-500" />;
      case 'first_aid_center': return <Heart size={16} className="text-pink-500" />;
      case 'temporary_camp': return <Shield size={16} className="text-purple-500" />;
      default: return <Building2 size={16} className="text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-50 border-green-200';
      case 'limited': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'emergency_only': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'closed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!initialLocationSet || !selectedHospital) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Target className="mx-auto mb-3 text-gray-400" size={24} />
          <p>Select a hospital to view comprehensive medical facilities</p>
          <p className="text-sm mt-1">All emergency response options within 5-mile radius will be displayed</p>
        </div>
      </div>
    );
  }

  if (!comprehensiveMap) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p>Loading comprehensive medical facilities...</p>
          <p className="text-sm mt-1">Scanning for emergency response options</p>
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
            <Shield className="mr-2" size={20} />
            Comprehensive Medical Facilities
            {emergencyActive && (
              <span className="ml-2 animate-pulse">
                <Zap className="text-red-500" size={16} />
              </span>
            )}
          </h2>
          
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
            >
              <RefreshCw size={12} className="mr-1" />
              Update
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortOptions.sortBy}
                  onChange={(e) => setSortOptions(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="distance">Distance from Patient</option>
                  <option value="status">Operational Status</option>
                  <option value="services">Available Services</option>
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
              
              <div className="space-y-2">
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
                  24/7 Available
                </label>
                
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

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600">Total Facilities</div>
            <div className="font-bold text-blue-600">{comprehensiveMap.medicalFacilities.length}</div>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600">Operational</div>
            <div className="font-bold text-green-600">
              {comprehensiveMap.medicalFacilities.filter(f => f.operationalStatus === 'operational').length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600">Avg Response</div>
            <div className="font-bold text-purple-600">
              {Math.round(comprehensiveMap.medicalFacilities.reduce((sum, f) => sum + f.responseTime.currentEstimate, 0) / comprehensiveMap.medicalFacilities.length)} min
            </div>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600">Last Update</div>
            <div className="font-bold text-orange-600">{lastUpdate.toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Patient Location Info */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
          <div className="flex items-center">
            <MapPin className="text-blue-600 mr-2" size={16} />
            <div>
              <p className="text-blue-800 font-medium text-sm">
                Patient Location: {comprehensiveMap.patientLocation.address}
              </p>
              <p className="text-blue-700 text-xs">
                Destination: {comprehensiveMap.hospitalDestination.hospital.name} • 
                ETA: {comprehensiveMap.hospitalDestination.estimatedArrival.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Facilities List */}
      <div className="max-h-96 overflow-y-auto">
        {sortedMedicalFacilities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <AlertTriangle className="mx-auto mb-3 text-gray-400" size={24} />
            <p>No medical facilities found matching your criteria.</p>
            <p className="text-sm mt-1">Try adjusting your filters or expanding the search radius.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedMedicalFacilities.map((facility, index) => {
              const isSelected = selectedFacilityId === facility.id;

              return (
                <div
                  key={facility.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFacilityId(isSelected ? null : facility.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Facility Header */}
                      <div className="flex items-center mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-bold mr-3">
                          {index + 1}
                        </span>
                        <div className="flex items-center">
                          {getFacilityIcon(facility.type)}
                          <div className="ml-2">
                            <h3 className="font-medium text-gray-900">{facility.name}</h3>
                            <p className="text-xs text-gray-500">{facility.type.replace('_', ' ').toUpperCase()}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="ml-2 text-blue-500 flex-shrink-0" size={16} />
                        )}
                      </div>

                      {/* Distance and Status */}
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                          <Navigation className="mr-1 text-blue-500" size={14} />
                          <span className="font-bold text-blue-600">
                            {facility.distanceFromPatient.toFixed(1)} km
                          </span>
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(facility.operationalStatus)}`}>
                          {facility.operationalStatus.toUpperCase()}
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(facility.responseTime.priority)}`}>
                          {facility.responseTime.priority.toUpperCase()} PRIORITY
                        </div>
                      </div>

                      {/* Response Time and Capacity */}
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                          <Clock className="mr-1 text-green-500" size={14} />
                          <span className="text-sm font-medium">
                            {facility.responseTime.currentEstimate} min response
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Users className="mr-1 text-purple-500" size={14} />
                          <span className="text-sm text-gray-600">
                            {facility.staffing.currentCapacity}/{facility.staffing.maxCapacity} capacity
                          </span>
                        </div>
                        
                        {facility.availability.available24_7 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            24/7
                          </span>
                        )}
                      </div>

                      {/* Services */}
                      <div className="flex items-center space-x-2 mb-2">
                        {facility.services.basicFirstAid && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">First Aid</span>
                        )}
                        {facility.services.advancedLifeSupport && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">ALS</span>
                        )}
                        {facility.services.trauma && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Trauma</span>
                        )}
                        {facility.services.cardiac && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Cardiac</span>
                        )}
                      </div>

                      {/* Detailed View */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Contact Information */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-800 mb-2">Contact Information</h4>
                              <div className="text-xs text-gray-600 space-y-1">
                                <p><strong>Address:</strong> {facility.address}</p>
                                <p><strong>Phone:</strong> {facility.phone}</p>
                                <p><strong>Status:</strong> {facility.availability.currentlyOpen ? 'Currently Open' : 'Closed'}</p>
                              </div>
                            </div>

                            {/* Staffing */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-800 mb-2">Current Staffing</h4>
                              <div className="text-xs text-gray-600 space-y-1">
                                <p><strong>Doctors:</strong> {facility.staffing.doctors}</p>
                                <p><strong>Nurses:</strong> {facility.staffing.nurses}</p>
                                <p><strong>Paramedics:</strong> {facility.staffing.paramedics}</p>
                                <p><strong>Technicians:</strong> {facility.staffing.technicians}</p>
                              </div>
                            </div>

                            {/* Equipment */}
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-medium text-gray-800 mb-2">Available Equipment</h4>
                              <div className="flex flex-wrap gap-1">
                                {facility.equipment.defibrillator && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Defibrillator</span>}
                                {facility.equipment.ventilator && <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded">Ventilator</span>}
                                {facility.equipment.oxygenSupply && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Oxygen</span>}
                                {facility.equipment.emergencyMedications && <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">Emergency Meds</span>}
                                {facility.equipment.ambulanceEquipment && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Ambulance Equipment</span>}
                                {facility.equipment.wheelchairAccess && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Wheelchair Access</span>}
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="md:col-span-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">
                                  Last Updated: {facility.lastUpdated.toLocaleTimeString()}
                                </span>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const url = `tel:${facility.phone}`;
                                      window.open(url);
                                    }}
                                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                                  >
                                    Call
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const url = `https://www.google.com/maps/dir/${comprehensiveMap.patientLocation.coordinates[0]},${comprehensiveMap.patientLocation.coordinates[1]}/${facility.coordinates[0]},${facility.coordinates[1]}`;
                                      window.open(url, '_blank');
                                    }}
                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                                  >
                                    Directions
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Indicators */}
                    <div className="flex flex-col items-end space-y-1 ml-4">
                      {facility.availability.available24_7 && (
                        <div className="flex items-center" title="24/7 Available">
                          <Clock className="text-green-500" size={14} />
                        </div>
                      )}
                      
                      {facility.availability.emergencyAccess && (
                        <div className="flex items-center" title="Emergency Access">
                          <Zap className="text-red-500" size={14} />
                        </div>
                      )}
                      
                      {facility.operationalStatus === 'operational' && (
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
        )}
      </div>

      {/* Footer Summary */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div>
            <span className="font-medium">Coverage:</span> {sortOptions.filterBy.withinRadius} mile radius • 
            <span className="font-medium ml-1">Facilities:</span> {sortedMedicalFacilities.length} shown • 
            <span className="font-medium ml-1">Operational:</span> {sortedMedicalFacilities.filter(f => f.operationalStatus === 'operational').length}
          </div>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            <span>Next update: {comprehensiveMap.nextUpdateTime.toLocaleTimeString()}</span>
          </div>
        </div>
        
        {emergencyActive && (
          <div className="mt-2 text-xs text-red-600 font-medium">
            🚨 Emergency Mode Active - All facilities notified and on standby
          </div>
        )}
        
        {autoUpdateEnabled && (
          <div className="mt-2 text-xs text-blue-600 font-medium">
            🔄 Auto-updating every 5 minutes for real-time accuracy
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveCheckpointPanel;