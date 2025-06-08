import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, CheckCircle, XCircle, Navigation, Clock, Globe, Loader2, Target } from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Hospital } from '../../types';
import { calculateDistance, calculateDuration } from '../../utils/mockData';
import { useAppContext } from '../../contexts/AppContext';

interface HospitalSelectProps {
  hospitals: Hospital[];
  currentLocation: [number, number];
  onSelect: (hospital: Hospital) => void;
  onSearchLocationChange?: (location: [number, number] | null) => void;
  className?: string;
}

const HospitalSelect: React.FC<HospitalSelectProps> = ({
  hospitals,
  currentLocation,
  onSelect,
  onSearchLocationChange,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [geocodedSearchLocation, setGeocodedSearchLocation] = useState<[number, number] | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { selectedHospital } = useAppContext();

  // Initialize Google Maps services
  const geocodingLibrary = useMapsLibrary('geocoding');
  const placesLibrary = useMapsLibrary('places');
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    if (geocodingLibrary) {
      setGeocoder(new geocodingLibrary.Geocoder());
    }
  }, [geocodingLibrary]);

  useEffect(() => {
    if (placesLibrary) {
      setAutocompleteService(new placesLibrary.AutocompleteService());
    }
  }, [placesLibrary]);

  // Get autocomplete suggestions
  useEffect(() => {
    if (!autocompleteService || !searchTerm.trim() || searchTerm.length < 3) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      autocompleteService.getPlacePredictions(
        {
          input: searchTerm,
          types: ['hospital', 'establishment', 'geocode'],
          componentRestrictions: { country: [] }, // Allow all countries
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSearchSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, autocompleteService]);

  // Geocode search term when it changes
  useEffect(() => {
    if (!geocoder || !searchTerm.trim()) {
      setGeocodedSearchLocation(null);
      setGeocodingError(null);
      if (onSearchLocationChange) {
        onSearchLocationChange(null);
      }
      return;
    }

    // Debounce geocoding requests
    const timeoutId = setTimeout(() => {
      performGeocoding(searchTerm.trim());
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, geocoder]);

  const performGeocoding = async (query: string) => {
    if (!geocoder) return;

    setIsGeocoding(true);
    setGeocodingError(null);

    try {
      const response = await geocoder.geocode({ address: query });
      
      if (response.results && response.results.length > 0) {
        const location = response.results[0].geometry.location;
        const coordinates: [number, number] = [location.lat(), location.lng()];
        setGeocodedSearchLocation(coordinates);
        if (onSearchLocationChange) {
          onSearchLocationChange(coordinates);
        }
      } else {
        setGeocodingError('Location not found');
        setGeocodedSearchLocation(null);
        if (onSearchLocationChange) {
          onSearchLocationChange(null);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingError('Failed to search location');
      setGeocodedSearchLocation(null);
      if (onSearchLocationChange) {
        onSearchLocationChange(null);
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSuggestionClick = (suggestion: google.maps.places.AutocompletePrediction) => {
    setSearchTerm(suggestion.description);
    setShowSuggestions(false);
    performGeocoding(suggestion.description);
  };

  // Filter hospitals based on search term and proximity to geocoded location
  const filteredHospitals = hospitals.filter((hospital) => {
    // Text-based filtering
    const matchesText = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.specialties.some((specialty) =>
        specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // If we have a geocoded location, also filter by proximity (within 200km for global search)
    if (geocodedSearchLocation && searchTerm.trim()) {
      const distanceToSearch = calculateDistance(geocodedSearchLocation, hospital.coordinates);
      return matchesText || distanceToSearch <= 200; // 200km radius for global search
    }

    return matchesText;
  });

  // Sort hospitals by distance (from search location if available, otherwise from current location)
  const referenceLocation = geocodedSearchLocation || currentLocation;
  const sortedHospitals = [...filteredHospitals].sort((a, b) => {
    const distanceA = calculateDistance(referenceLocation, a.coordinates);
    const distanceB = calculateDistance(referenceLocation, b.coordinates);
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
          Find Hospitals Worldwide
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by city, address, hospital name, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isGeocoding && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin\" size={18} />
          )}
          
          {/* Search suggestions dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center">
                    <MapPin size={14} className="text-gray-400 mr-2 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {suggestion.structured_formatting.main_text}
                      </div>
                      <div className="text-xs text-gray-500">
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Search status indicators */}
        {geocodedSearchLocation && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center text-sm text-green-800">
              <Target size={14} className="mr-1" />
              <span>Searching near: {geocodedSearchLocation[0].toFixed(4)}, {geocodedSearchLocation[1].toFixed(4)}</span>
            </div>
          </div>
        )}
        
        {geocodingError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center text-sm text-red-800">
              <XCircle size={14} className="mr-1" />
              <span>{geocodingError}</span>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          {geocodedSearchLocation 
            ? `Showing hospitals near searched location (${sortedHospitals.length} found within 200km)`
            : `Search by city, address, hospital name, or specialty (${sortedHospitals.length} hospitals)`
          }
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {sortedHospitals.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No hospitals found matching your search. Try a different location or search term.' : 'Start typing to search for hospitals worldwide.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedHospitals.map((hospital) => {
              const distance = calculateDistance(referenceLocation, hospital.coordinates);
              const duration = calculateDuration(referenceLocation, hospital.coordinates);
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
                        {isSelected && <CheckCircle className="ml-2 text-blue-500 flex-shrink-0\" size={16} />}
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
                      
                      {/* Distance indicator */}
                      <div className="mt-1 text-xs text-gray-400">
                        {geocodedSearchLocation ? 'From search' : 'From current'}
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
      
      {/* Footer with search info */}
      <div className="p-3 bg-gray-50 border-t flex-shrink-0">
        <p className="text-xs text-gray-600 text-center">
          🌍 {hospitals.length} Global Hospitals • 🔍 Google Maps Search • 🚨 Live Emergency Status
          {geocodedSearchLocation && (
            <span className="block mt-1 text-blue-600">
              📍 Searching within 200km radius of your location
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default HospitalSelect;