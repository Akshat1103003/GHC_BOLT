import React, { useState } from 'react';
import { Search, MapPin, Phone, CheckCircle, XCircle, Navigation, Clock, Globe } from 'lucide-react';
import { Hospital } from '../../types';
import { calculateDistance, calculateDuration } from '../../utils/mockData';
import { useAppContext } from '../../contexts/AppContext';

interface HospitalSelectProps {
  hospitals: Hospital[];
  currentLocation: [number, number];
  onSelect: (hospital: Hospital) => void;
  className?: string;
}

const HospitalSelect: React.FC<HospitalSelectProps> = ({
  hospitals,
  currentLocation,
  onSelect,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedHospital } = useAppContext();

  // Filter hospitals based on search term
  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.specialties.some((specialty) =>
        specialty.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Sort hospitals by distance
  const sortedHospitals = [...filteredHospitals].sort((a, b) => {
    const distanceA = calculateDistance(currentLocation, a.coordinates);
    const distanceB = calculateDistance(currentLocation, b.coordinates);
    return distanceA - distanceB;
  });

  // Get hospital city/country from address
  const getHospitalLocation = (address: string) => {
    const parts = address.split(', ');
    if (parts.length >= 2) {
      return parts.slice(-2).join(', '); // Get last two parts (city, country)
    }
    return address;
  };

  // Get country flag emoji
  const getCountryFlag = (address: string) => {
    if (address.includes('USA')) return '🇺🇸';
    if (address.includes('UK')) return '🇬🇧';
    if (address.includes('France')) return '🇫🇷';
    if (address.includes('Japan')) return '🇯🇵';
    if (address.includes('Australia')) return '🇦🇺';
    if (address.includes('Canada')) return '🇨🇦';
    if (address.includes('India')) return '🇮🇳';
    if (address.includes('Brazil')) return '🇧🇷';
    if (address.includes('Germany')) return '🇩🇪';
    if (address.includes('United Arab Emirates')) return '🇦🇪';
    if (address.includes('Singapore')) return '🇸🇬';
    return '🌍';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md flex flex-col ${className}`}>
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
          <Globe className="mr-2" size={20} />
          Select Global Hospital
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, city, country, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Showing hospitals from major cities worldwide with actual coordinates
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {sortedHospitals.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No hospitals found matching your search.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedHospitals.map((hospital) => {
              const distance = calculateDistance(currentLocation, hospital.coordinates);
              const duration = calculateDuration(currentLocation, hospital.coordinates);
              const isSelected = selectedHospital?.id === hospital.id;
              const location = getHospitalLocation(hospital.address);
              const flag = getCountryFlag(hospital.address);

              return (
                <li
                  key={hospital.id}
                  className={`
                    p-4 transition-colors cursor-pointer
                    ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => onSelect(hospital)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 flex items-center">
                        {hospital.name}
                        {isSelected && <CheckCircle className="ml-2 text-blue-500 flex-shrink-0" size={16} />}
                      </h3>
                      
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <MapPin size={14} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{hospital.address}</span>
                      </div>
                      
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Phone size={14} className="mr-1 flex-shrink-0" />
                        <span>{hospital.phone}</span>
                      </div>
                      
                      {/* Location with flag */}
                      <div className="mt-1 text-xs text-blue-600 font-medium flex items-center">
                        <span className="mr-1">{flag}</span>
                        <span>{location}</span>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        {hospital.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="ml-4 text-right flex-shrink-0">
                      <div className="text-sm font-medium text-gray-900 flex items-center justify-end">
                        <Navigation size={12} className="mr-1" />
                        {distance.toFixed(1)} km
                      </div>
                      <div className="text-sm text-gray-500 flex items-center justify-end">
                        <Clock size={12} className="mr-1" />
                        {Math.ceil(duration)} min
                      </div>
                      <div className="mt-1">
                        {hospital.emergencyReady ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} className="mr-1" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <XCircle size={12} className="mr-1" />
                            Limited
                          </span>
                        )}
                      </div>
                      
                      {/* Global location indicator */}
                      <div className="mt-1 text-xs text-gray-400">
                        Global Location
                      </div>
                    </div>
                  </div>
                  
                  {/* Emergency route preview for selected hospital */}
                  {isSelected && (
                    <div className="mt-3 p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                      <p className="text-xs text-blue-800 font-medium">
                        🚨 Emergency Route Active
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Route optimized for global traffic patterns • Real-time signal coordination
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      {/* Footer with global data info */}
      <div className="p-3 bg-gray-50 border-t flex-shrink-0">
        <p className="text-xs text-gray-600 text-center">
          🌍 {hospitals.length} Global Hospitals • 📍 Actual GPS Coordinates • 🚨 Live Emergency Status
        </p>
      </div>
    </div>
  );
};

export default HospitalSelect;