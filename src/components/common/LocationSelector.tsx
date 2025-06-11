import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Target, AlertCircle, Loader2 } from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface LocationSelectorProps {
  onLocationChange: (location: [number, number], locationType: 'current' | 'selected', locationName?: string) => void;
  className?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationChange,
  className = '',
}) => {
  const [locationType, setLocationType] = useState<'current' | 'selected'>('current');
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');

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

  // Get current location when component mounts or when switching to current location
  useEffect(() => {
    if (locationType === 'current' && !currentLocation) {
      getCurrentLocation();
    }
  }, [locationType]);

  // Get autocomplete suggestions
  useEffect(() => {
    if (!autocompleteService || !searchTerm.trim() || searchTerm.length < 3 || locationType !== 'selected') {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      autocompleteService.getPlacePredictions(
        {
          input: searchTerm,
          types: ['geocode', 'establishment'],
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
  }, [searchTerm, autocompleteService, locationType]);

  // Notify parent when location changes
  useEffect(() => {
    if (locationType === 'current' && currentLocation) {
      onLocationChange(currentLocation, 'current', 'Current Location');
    } else if (locationType === 'selected' && selectedLocation) {
      onLocationChange(selectedLocation, 'selected', selectedLocationName || 'Selected Location');
    }
  }, [locationType, currentLocation, selectedLocation, selectedLocationName, onLocationChange]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setCurrentLocation(location);
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const performGeocodingByPlaceId = async (placeId: string, description: string) => {
    if (!geocoder) return;

    setIsGeocoding(true);
    setLocationError(null);

    try {
      const response = await geocoder.geocode({ placeId: placeId });
      
      if (response.results && response.results.length > 0) {
        const location = response.results[0].geometry.location;
        const coordinates: [number, number] = [location.lat(), location.lng()];
        setSelectedLocation(coordinates);
        setSelectedLocationName(description);
      } else {
        setLocationError('Location not found');
      }
    } catch (error) {
      console.error('Geocoding by place ID error:', error);
      setLocationError('Failed to get location coordinates');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSuggestionClick = (suggestion: google.maps.places.AutocompletePrediction) => {
    setSearchTerm(suggestion.description);
    setShowSuggestions(false);
    performGeocodingByPlaceId(suggestion.place_id, suggestion.description);
  };

  const handleLocationTypeChange = (type: 'current' | 'selected') => {
    setLocationType(type);
    setLocationError(null);
    
    if (type === 'current' && !currentLocation) {
      getCurrentLocation();
    }
  };

  const getLocationDisplayText = () => {
    if (locationType === 'current') {
      if (isGettingLocation) return 'Getting your location...';
      if (currentLocation) {
        return `${currentLocation[0].toFixed(4)}, ${currentLocation[1].toFixed(4)}`;
      }
      return 'Location not available';
    } else {
      if (selectedLocation) {
        return selectedLocationName || `${selectedLocation[0].toFixed(4)}, ${selectedLocation[1].toFixed(4)}`;
      }
      return 'No location selected';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <MapPin className="mr-2" size={20} />
        Emergency Location
      </h3>

      {/* Location Type Toggle */}
      <div className="mb-4">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => handleLocationTypeChange('current')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              locationType === 'current'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center">
              <Navigation size={16} className="mr-2" />
              Current Location
            </div>
          </button>
          <button
            onClick={() => handleLocationTypeChange('selected')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              locationType === 'selected'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center">
              <Search size={16} className="mr-2" />
              Select Location
            </div>
          </button>
        </div>
      </div>

      {/* Current Location Section */}
      {locationType === 'current' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Your current location:</span>
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {isGettingLocation ? (
                <div className="flex items-center">
                  <Loader2 size={14} className="animate-spin mr-1" />
                  Getting...
                </div>
              ) : (
                <div className="flex items-center">
                  <Target size={14} className="mr-1" />
                  Refresh
                </div>
              )}
            </button>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-900">
              {getLocationDisplayText()}
            </p>
            {currentLocation && (
              <p className="text-xs text-gray-500 mt-1">
                Accuracy: GPS location
              </p>
            )}
          </div>
        </div>
      )}

      {/* Select Location Section */}
      {locationType === 'selected' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search for an address, landmark, or place..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isGeocoding && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={18} />
            )}
            
            {/* Search suggestions dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto mt-1">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.place_id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
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

          {selectedLocation && (
            <div className="p-3 bg-green-50 rounded-md border border-green-200">
              <p className="text-sm font-medium text-green-900">
                📍 {selectedLocationName}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Coordinates: {selectedLocation[0].toFixed(4)}, {selectedLocation[1].toFixed(4)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {locationError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center text-sm text-red-800">
            <AlertCircle size={14} className="mr-2 flex-shrink-0" />
            <span>{locationError}</span>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              (locationType === 'current' && currentLocation) || (locationType === 'selected' && selectedLocation)
                ? 'bg-green-500'
                : 'bg-gray-400'
            }`}></div>
            <span className="text-sm font-medium text-blue-900">
              {(locationType === 'current' && currentLocation) || (locationType === 'selected' && selectedLocation)
                ? 'Location Ready'
                : 'Location Required'
              }
            </span>
          </div>
          <span className="text-xs text-blue-700">
            {locationType === 'current' ? 'Using GPS' : 'Using Search'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;