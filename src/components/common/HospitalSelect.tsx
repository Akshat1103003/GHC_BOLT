import React, { useState } from 'react';
import { Search, MapPin, Phone, CheckCircle, XCircle } from 'lucide-react';
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

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Select Destination Hospital</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, address, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {sortedHospitals.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No hospitals found matching your search.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedHospitals.map((hospital) => {
              const distance = calculateDistance(currentLocation, hospital.coordinates);
              const duration = calculateDuration(currentLocation, hospital.coordinates);
              const isSelected = selectedHospital?.id === hospital.id;

              return (
                <li
                  key={hospital.id}
                  className={`
                    p-4 transition-colors cursor-pointer
                    ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => onSelect(hospital)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 flex items-center">
                        {hospital.name}
                        {isSelected && <CheckCircle className="ml-2 text-blue-500\" size={16} />}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <MapPin size={14} className="mr-1" />
                        <span>{hospital.address}</span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Phone size={14} className="mr-1" />
                        <span>{hospital.phone}</span>
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

                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium text-gray-900">{distance.toFixed(1)} km</div>
                      <div className="text-sm text-gray-500">{Math.ceil(duration)} min</div>
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
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HospitalSelect;