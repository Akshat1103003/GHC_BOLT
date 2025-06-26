import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Target, AlertCircle, Loader2, Crosshair } from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useAppContext } from '../../contexts/AppContext';

interface LocationSelectorProps {
  onLocationChange: (location: [number, number], locationType: 'current' | 'selected', locationName?: string) => void;
  className?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationChange,
  className = '',
}) => {
  const { ambulanceLocation, isDetectingLocation, locationError, initialLocationSet } = useAppContext();
  const [locationType, setLocationType] = useState<'current' | 'selected'>('current');
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [localLocationError, setLocalLocationError] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);

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

  // Sync with app context ambulance location
  useEffect(() => {
    if (ambulanceLocation && initialLocationSet) {
      setCurrentLocation(ambulanceLocation);
    }
  }, [ambulanceLocation, initialLocationSet]);

  // Get current location when component mounts or when switching to current location
  useEffect(() => {
    if (locationType === 'current' && !currentLocation && !isDetectingLocation) {
      getCurrentLocation();
    }
  }, [locationType, isDetectingLocation]);

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
            setApiError(null);
          } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            setApiError('Places API access denied. Please check that Places API (New) is enabled in Google Cloud Console.');
            setSearchSuggestions([]);
            setShowSuggestions(false);
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
    setLocalLocationError(null);

    if (!navigator.geolocation) {
      setLocalLocationError('Geolocation is not supported by this browser');
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
        setLocalLocationError(null);
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
        setLocalLocationError(errorMessage);
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
    setLocalLocationError(null);

    try {
      const response = await geocoder.geocode({ placeId: placeId });
      
      if (response.results && response.results.length > 0) {
        const location = response.results[0].geometry.location;
        const coordinates: [number, number] = [location.lat(), location.lng()];
        setSelectedLocation(coordinates);
        setSelectedLocationName(description);
        setApiError(null);
      } else {
        setLocalLocationError('Location not found');
      }
    } catch (error: any) {
      console.error('Geocoding by place ID error:', error);
      
      if (error.code === 'GEOCODER_GEOCODE' && error.message && error.message.includes('REQUEST_DENIED')) {
        setLocalLocationError('Geocoding API access denied. Please check that Geocoding API is enabled.');
        setApiError('Geocoding API not properly configured. Please enable the Geocoding API in Google Cloud Console.');
      } else {
        setLocalLocationError('Failed to get location coordinates');
      }
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
    setLocalLocationError(null);
    setApiError(null);
    
    if (type === 'current' && !currentLocation && !isDetectingLocation) {
      getCurrentLocation();
    }
  };

  const getLocationDisplayText = () => {
    if (locationType === 'current') {
      if (isDetectingLocation || isGettingLocation) return 'Getting your location...';
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

  const getLocationStatus = () => {
    if (locationType === 'current') {
      if (isDetectingLocation) return { status: 'detecting', message: 'Detecting live location...', color: 'text-amber-600' };
      if (locationError) return { status: 'error', message: 'Location detection failed', color: 'text-red-600' };
      if (currentLocation) return { status: 'success', message: 'Live location active', color: 'text-green-600' };
      return { status: 'pending', message: 'Location required', color: 'text-gray-600' };
    } else {
      if (selectedLocation) return { status: 'success', message: 'Custom location set', color: 'text-green-600' };
      return { status: 'pending', message: 'Search for location', color: 'text-gray-600' };
    }
  };

  const status = getLocationStatus();

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <MapPin className="mr-2" size={20} />
        Emergency Location
        {isDetectingLocation && (
          <Crosshair className="ml-2 animate-spin text-amber-500" size={16} />
        )}
      </h3>

      {/* API Error Alert */}
      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center text-sm text-red-800">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Google Maps API Configuration Error</p>
              <p className="text-xs mt-1">{apiError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Location Detection Status */}
      {isDetectingLocation && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center text-sm text-amber-800">
            <Crosshair size={16} className="mr-2 flex-shrink-0 animate-spin" />
            <div>
              <p className="font-medium">Detecting Your Live Location</p>
              <p className="text-xs mt-1">Please allow location access for accurate emergency response</p>
            </div>
          </div>
        </div>
      )}

      {/* Location Error from App Context */}
      {locationError && locationType === 'current' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center text-sm text-red-800">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Location Detection Failed</p>
              <p className="text-xs mt-1">{locationError}</p>
            </div>
          </div>
        </div>
      )}

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
            disabled={isDetectingLocation}
          >
            <div className="flex items-center justify-center">
              {isDetectingLocation ? (
                <Crosshair size={16} className="mr-2 animate-spin" />
              ) : (
                <Navigation size={16} className="mr-2" />
              )}
              Live Location
            </div>
          </button>
          <button
            onClick={() => handleLocationTypeChange('selected')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              locationType === 'selected'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            disabled={!!apiError}
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
              disabled={isGettingLocation || isDetectingLocation}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {isGettingLocation || isDetectingLocation ? (
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
          
          <div className={`p-3 rounded-md ${
            status.status === 'success' ? 'bg-green-50 border border-green-200' :
            status.status === 'detecting' ? 'bg-amber-50 border border-amber-200' :
            status.status === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-gray-50'
          }`}>
            <p className={`text-sm font-medium ${status.color}`}>
              {getLocationDisplayText()}
            </p>
            {currentLocation && (
              <p className="text-xs text-gray-500 mt-1">
                Accuracy: GPS location {initialLocationSet ? '(Live)' : '(Manual)'}
              </p>
            )}
            {isDetectingLocation && (
              <p className="text-xs text-amber-600 mt-1 animate-pulse">
                🔍 Automatically detecting your location...
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
              disabled={!!apiError}
            />
            {isGeocoding && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={18} />
            )}
            
            {/* Search suggestions dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && !apiError && (
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
      {localLocationError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center text-sm text-red-800">
            <AlertCircle size={14} className="mr-2 flex-shrink-0" />
            <span>{localLocationError}</span>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className={`mt-4 p-3 rounded-md ${
        status.status === 'success' ? 'bg-green-50' :
        status.status === 'detecting' ? 'bg-amber-50' :
        status.status === 'error' ? 'bg-red-50' :
        'bg-blue-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              status.status === 'success' ? 'bg-green-500' :
              status.status === 'detecting' ? 'bg-amber-500 animate-pulse' :
              status.status === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`}></div>
            <span className={`text-sm font-medium ${status.color}`}>
              {status.message}
            </span>
          </div>
          <span className="text-xs text-blue-700">
            {locationType === 'current' ? 'Using GPS' : 'Using Search'}
          </span>
        </div>
        {apiError && (
          <div className="mt-2 text-xs text-red-600">
            Some features may be limited due to API configuration issues.
          </div>
        )}
        {isDetectingLocation && (
          <div className="mt-2 text-xs text-amber-600">
            Live location detection is in progress for accurate emergency response.
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;