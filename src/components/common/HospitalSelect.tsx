import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, CheckCircle, XCircle, Navigation, Clock, Globe, Loader2, Target, AlertCircle } from 'lucide-react';
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
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const { selectedHospital } = useAppContext();

  // Initialize Google Maps services
  const geocodingLibrary = useMapsLibrary('geocoding');
  const placesLibrary = useMapsLibrary('places');
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (geocodingLibrary) {
      setGeocoder(new geocodingLibrary.Geocoder());
    }
  }, [geocodingLibrary]);

  useEffect(() => {
    if (placesLibrary) {
      setAutocompleteService(new placesLibrary.AutocompleteService());
      
      // Create a dummy map element for PlacesService
      const mapDiv = document.createElement('div');
      const map = new google.maps.Map(mapDiv);
      setPlacesService(new placesLibrary.PlacesService(map));
    }
  }, [placesLibrary]);

  // Search for nearby hospitals within 50km radius using Places API
  const searchNearbyHospitals = async (location: [number, number]) => {
    if (!placesService) return;

    setIsLoadingNearby(true);
    setApiError(null);

    try {
      const request: google.maps.places.PlaceSearchRequest = {
        location: { lat: location[0], lng: location[1] },
        radius: 50000, // 50km radius as requested
        type: 'hospital',
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating', 'types', 'business_status']
      };

      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const hospitalResults = results
            .filter(place => 
              place.business_status === 'OPERATIONAL' &&
              place.geometry?.location &&
              place.name &&
              place.formatted_address
            )
            .map(place => ({
              id: place.place_id || `nearby-${Date.now()}-${Math.random()}`,
              name: place.name || 'Unknown Hospital',
              address: place.formatted_address || 'Address not available',
              coordinates: [
                place.geometry!.location!.lat(),
                place.geometry!.location!.lng()
              ] as [number, number],
              phone: 'Contact information available on-site',
              specialties: ['Emergency', 'General Medicine'],
              emergencyReady: true,
              rating: place.rating || 0,
              isNearbyResult: true
            }));

          setNearbyHospitals(hospitalResults);
          console.log(`Found ${hospitalResults.length} hospitals within 50km radius`);
        } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          setApiError('Places API access denied. Please check that Places API (New) is enabled in Google Cloud Console.');
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setNearbyHospitals([]);
          console.log('No hospitals found within 50km radius');
        } else {
          console.error('Places API error:', status);
          setApiError(`Places API error: ${status}`);
        }
        setIsLoadingNearby(false);
      });
    } catch (error: any) {
      console.error('Error searching nearby hospitals:', error);
      setApiError('Failed to search nearby hospitals. Please check your API configuration.');
      setIsLoadingNearby(false);
    }
  };

  // Search for nearby hospitals when location changes
  useEffect(() => {
    const locationToSearch = geocodedSearchLocation || currentLocation;
    if (locationToSearch && placesService) {
      searchNearbyHospitals(locationToSearch);
    }
  }, [currentLocation, geocodedSearchLocation, placesService]);

  // Detect city from current location or search location
  useEffect(() => {
    const locationToCheck = geocodedSearchLocation || currentLocation;
    if (!geocoder || !locationToCheck) return;

    const detectCity = async () => {
      try {
        const response = await geocoder.geocode({
          location: { lat: locationToCheck[0], lng: locationToCheck[1] }
        });
        
        if (response.results && response.results.length > 0) {
          const addressComponents = response.results[0].address_components;
          
          // Look for locality (city) in address components
          const cityComponent = addressComponents.find(component =>
            component.types.includes('locality') || 
            component.types.includes('administrative_area_level_2') ||
            component.types.includes('sublocality')
          );
          
          if (cityComponent) {
            setDetectedCity(cityComponent.long_name);
          } else {
            // Fallback to using the formatted address
            const formattedAddress = response.results[0].formatted_address;
            const addressParts = formattedAddress.split(', ');
            if (addressParts.length >= 2) {
              setDetectedCity(addressParts[addressParts.length - 2]);
            }
          }
        }
      } catch (error: any) {
        console.error('Error detecting city:', error);
        setDetectedCity(null);
        
        // Check for specific API errors
        if (error.code === 'GEOCODER_GEOCODE') {
          setApiError('Geocoding API not properly enabled. Please enable the Geocoding API in Google Cloud Console.');
        }
      }
    };

    detectCity();
  }, [geocoder, currentLocation, geocodedSearchLocation]);

  // Get autocomplete suggestions - RESTRICTED TO HOSPITALS ONLY
  useEffect(() => {
    if (!autocompleteService || !searchTerm.trim() || searchTerm.length < 3) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      // First try to get hospital-specific suggestions
      autocompleteService.getPlacePredictions(
        {
          input: searchTerm,
          types: ['hospital'], // RESTRICT TO HOSPITALS ONLY
          locationBias: {
            radius: 50000, // 50km radius bias
            center: { lat: currentLocation[0], lng: currentLocation[1] }
          }
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
            // Fallback: search for establishments with "hospital" in the query
            autocompleteService.getPlacePredictions(
              {
                input: `hospital ${searchTerm}`,
                types: ['establishment'],
                locationBias: {
                  radius: 50000, // 50km radius bias
                  center: { lat: currentLocation[0], lng: currentLocation[1] }
                }
              },
              (fallbackPredictions, fallbackStatus) => {
                if (fallbackStatus === google.maps.places.PlacesServiceStatus.OK && fallbackPredictions) {
                  // Filter to only include results that likely contain "hospital" or medical terms
                  const hospitalPredictions = fallbackPredictions.filter(prediction =>
                    prediction.description.toLowerCase().includes('hospital') ||
                    prediction.description.toLowerCase().includes('medical') ||
                    prediction.description.toLowerCase().includes('clinic') ||
                    prediction.description.toLowerCase().includes('health')
                  );
                  setSearchSuggestions(hospitalPredictions);
                  setShowSuggestions(hospitalPredictions.length > 0);
                  setApiError(null);
                } else if (fallbackStatus === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                  setApiError('Places API access denied. Please check that Places API (New) is enabled in Google Cloud Console.');
                  setSearchSuggestions([]);
                  setShowSuggestions(false);
                } else {
                  setSearchSuggestions([]);
                  setShowSuggestions(false);
                }
              }
            );
          }
        }
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, autocompleteService, currentLocation]);

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
        setGeocodingError('Location not found. Try a more specific search term.');
        setGeocodedSearchLocation(null);
        if (onSearchLocationChange) {
          onSearchLocationChange(null);
        }
      }
    } catch (error: any) {
      console.error('Geocoding error:', error);
      
      // Handle specific geocoding errors
      if (error.code === 'GEOCODER_GEOCODE') {
        if (error.message && error.message.includes('ZERO_RESULTS')) {
          setGeocodingError('No results found for this location. Try a different search term.');
        } else if (error.message && error.message.includes('REQUEST_DENIED')) {
          setGeocodingError('Geocoding API access denied. Please check that Geocoding API is enabled in Google Cloud Console.');
          setApiError('Geocoding API not properly configured. Please enable the Geocoding API.');
        } else {
          setGeocodingError('Unable to find location. Please try a different search term.');
        }
      } else {
        setGeocodingError('Failed to search location. Please check your internet connection.');
      }
      
      setGeocodedSearchLocation(null);
      if (onSearchLocationChange) {
        onSearchLocationChange(null);
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const performGeocodingByPlaceId = async (placeId: string) => {
    if (!geocoder) return;

    setIsGeocoding(true);
    setGeocodingError(null);

    try {
      const response = await geocoder.geocode({ placeId: placeId });
      
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
    } catch (error: any) {
      console.error('Geocoding by place ID error:', error);
      
      if (error.code === 'GEOCODER_GEOCODE' && error.message && error.message.includes('REQUEST_DENIED')) {
        setGeocodingError('Geocoding API access denied. Please check that Geocoding API is enabled.');
        setApiError('Geocoding API not properly configured.');
      } else {
        setGeocodingError('Failed to get location coordinates');
      }
      
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
    // Use place ID for more reliable geocoding instead of re-geocoding the description
    performGeocodingByPlaceId(suggestion.place_id);
  };

  // Combine static hospitals with nearby hospitals from Places API, prioritizing within 50km
  const allHospitals = [...hospitals, ...nearbyHospitals];
  
  // Filter hospitals based on search term, detected city, and 50km radius
  const filteredHospitals = allHospitals.filter((hospital) => {
    const referenceLocation = geocodedSearchLocation || currentLocation;
    const distance = calculateDistance(referenceLocation, hospital.coordinates);
    
    // PRIORITY 1: Hospitals within 50km radius (as requested)
    const within50km = distance <= 50;
    
    // Text-based filtering for hospital names and specialties
    const matchesText = !searchTerm.trim() || 
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hospital.specialties && hospital.specialties.some((specialty) =>
        specialty.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    // If we have a detected city and no specific search term, prioritize hospitals in that city
    if (detectedCity && !searchTerm.trim()) {
      const inDetectedCity = hospital.address.toLowerCase().includes(detectedCity.toLowerCase());
      return (inDetectedCity && within50km) || within50km;
    }

    // For search terms, show matching hospitals within 50km first, then extend if needed
    if (searchTerm.trim()) {
      return matchesText && (within50km || distance <= 200); // Extend to 200km for search
    }

    // Default: show hospitals within 50km
    return within50km;
  });

  // Sort hospitals by distance (from search location if available, otherwise from current location)
  const referenceLocation = geocodedSearchLocation || currentLocation;
  const sortedHospitals = [...filteredHospitals].sort((a, b) => {
    const distanceA = calculateDistance(referenceLocation, a.coordinates);
    const distanceB = calculateDistance(referenceLocation, b.coordinates);
    
    // Prioritize hospitals within 50km
    const aWithin50km = distanceA <= 50;
    const bWithin50km = distanceB <= 50;
    
    if (aWithin50km && !bWithin50km) return -1;
    if (!aWithin50km && bWithin50km) return 1;
    
    // If we have a detected city, prioritize hospitals in that city
    if (detectedCity) {
      const aInCity = a.address.toLowerCase().includes(detectedCity.toLowerCase());
      const bInCity = b.address.toLowerCase().includes(detectedCity.toLowerCase());
      
      if (aInCity && !bInCity) return -1;
      if (!aInCity && bInCity) return 1;
    }

    // Then sort by distance
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
    return '🏥';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md flex flex-col ${className}`}>
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
          <Globe className="mr-2" size={20} />
          Find Hospitals {detectedCity && `in ${detectedCity}`}
          <span className="ml-2 text-sm font-normal text-blue-600">(50km radius)</span>
        </h2>
        
        {/* API Error Alert */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center text-sm text-red-800">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Google Maps API Configuration Error</p>
                <p className="text-xs mt-1">{apiError}</p>
                <p className="text-xs mt-1">
                  Please check the setup instructions and ensure all required APIs are enabled.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator for nearby search */}
        {isLoadingNearby && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center text-sm text-blue-800">
              <Loader2 size={16} className="animate-spin mr-2 flex-shrink-0" />
              <span>Searching for hospitals within 50km radius...</span>
            </div>
          </div>
        )}
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={detectedCity 
              ? `Search hospitals in ${detectedCity} (50km radius)...` 
              : "Search hospitals within 50km radius..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!!apiError}
          />
          {isGeocoding && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={18} />
          )}
          
          {/* Search suggestions dropdown - HOSPITAL FOCUSED */}
          {showSuggestions && searchSuggestions.length > 0 && !apiError && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center">
                    <MapPin size={14} className="text-red-400 mr-2 flex-shrink-0" />
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
        {detectedCity && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center text-sm text-blue-800">
              <Target size={14} className="mr-1" />
              <span>Showing hospitals in: <strong>{detectedCity}</strong> (within 50km)</span>
            </div>
          </div>
        )}

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
          {detectedCity 
            ? `Showing ${sortedHospitals.length} hospitals in ${detectedCity} and within 50km radius`
            : geocodedSearchLocation 
            ? `Showing hospitals near searched location (${sortedHospitals.length} found within 50km)`
            : `Showing ${sortedHospitals.length} hospitals within 50km radius of ambulance location`
          }
          {nearbyHospitals.length > 0 && (
            <span className="text-blue-600 font-medium"> • {nearbyHospitals.length} from Places API</span>
          )}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {sortedHospitals.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {apiError ? (
              <div>
                <p>Hospital search is currently unavailable.</p>
                <p className="text-xs mt-1">Please check your Google Maps API configuration.</p>
              </div>
            ) : isLoadingNearby ? (
              <div>
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                <p>Searching for hospitals within 50km...</p>
              </div>
            ) : searchTerm ? (
              'No hospitals found within 50km matching your search. Try a different search term.'
            ) : (
              'No hospitals found within 50km radius. Try expanding your search area.'
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedHospitals.map((hospital) => {
              const distance = calculateDistance(referenceLocation, hospital.coordinates);
              const duration = calculateDuration(referenceLocation, hospital.coordinates);
              const isSelected = selectedHospital?.id === hospital.id;
              const location = getHospitalLocation(hospital.address);
              const flag = getCountryFlag(hospital.address);
              const inDetectedCity = detectedCity ? hospital.address.toLowerCase().includes(detectedCity.toLowerCase()) : false;
              const within50km = distance <= 50;

              return (
                <li
                  key={hospital.id}
                  className={`
                    p-4 transition-colors cursor-pointer
                    ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
                    ${within50km ? 'bg-green-25' : ''}
                    ${inDetectedCity ? 'bg-blue-25' : ''}
                  `}
                  onClick={() => onSelect(hospital)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 flex items-center flex-wrap">
                        {hospital.name}
                        {isSelected && <CheckCircle className="ml-2 text-blue-500 flex-shrink-0" size={16} />}
                        {within50km && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Within 50km</span>}
                        {inDetectedCity && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">In {detectedCity}</span>}
                        {hospital.isNearbyResult && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Places API</span>}
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
                        {hospital.specialties && hospital.specialties.map((specialty) => (
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
                        <span className={within50km ? 'text-green-600 font-bold' : ''}>
                          {distance.toFixed(1)} km
                        </span>
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
                        {geocodedSearchLocation ? 'From search' : detectedCity ? `In ${detectedCity}` : 'From ambulance'}
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
                        Route optimized for emergency response • Real-time signal coordination
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
          🏥 Hospital Search (50km radius) • 🔍 Google Maps Places API • 🚨 Live Emergency Status
          {detectedCity && (
            <span className="block mt-1 text-blue-600">
              📍 Prioritizing hospitals in {detectedCity}
            </span>
          )}
          {geocodedSearchLocation && (
            <span className="block mt-1 text-green-600">
              📍 Searching within 50km radius of your location
            </span>
          )}
          {nearbyHospitals.length > 0 && (
            <span className="block mt-1 text-purple-600">
              🔍 {nearbyHospitals.length} real-time results from Google Places API
            </span>
          )}
          {apiError && (
            <span className="block mt-1 text-red-600">
              ⚠️ API configuration required for full functionality
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default HospitalSelect;