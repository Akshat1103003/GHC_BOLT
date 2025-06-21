// Key fixes for route visibility issues in MapView.tsx

// 1. LIBRARY LOADING FIX - Add proper error handling and fallback
useEffect(() => {
  if (routesLibrary && window.google && window.google.maps) {
    console.log('🗺️ Routes library loaded, initializing DirectionsService...');
    try {
      setDirectionsService(new google.maps.DirectionsService());
      
      const renderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: false,
        polylineOptions: {
          strokeColor: emergencyActive ? '#DC2626' : '#3B82F6',
          strokeWeight: emergencyActive ? 12 : 8,
          strokeOpacity: 1.0,
          zIndex: 1000,
        },
        panel: null
      });
      
      setDirectionsRenderer(renderer);
      console.log('✅ DirectionsService and DirectionsRenderer initialized');
    } catch (error) {
      console.error('❌ Failed to initialize DirectionsService:', error);
      // Force fallback to custom polyline
      setDirectionsService(null);
      setDirectionsRenderer(null);
    }
  } else {
    console.log('⚠️ Routes library not available, will use custom polyline fallback');
  }
}, [routesLibrary, emergencyActive]);

// 2. IMPROVED ROUTE CREATION WITH BETTER ERROR HANDLING
const createGoogleDirectionsRoute = () => {
  if (!directionsService || !directionsRenderer || !selectedHospital || !mapInstance || !routesLibrary) {
    console.log('❌ Missing dependencies for Google Directions:', {
      directionsService: !!directionsService,
      directionsRenderer: !!directionsRenderer,
      selectedHospital: !!selectedHospital,
      mapInstance: !!mapInstance,
      routesLibrary: !!routesLibrary
    });
    createCustomPolylineRoute();
    return;
  }

  const request: google.maps.DirectionsRequest = {
    origin: { lat: ambulanceLocation[0], lng: ambulanceLocation[1] },
    destination: { lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] },
    travelMode: google.maps.TravelMode.DRIVING,
    avoidHighways: false,
    avoidTolls: false,
    optimizeWaypoints: true,
  };

  console.log('🔄 Requesting Google Directions route...', request);

  directionsService.route(request, (result, status) => {
    console.log('📍 Directions API response:', { status, result });
    
    if (status === google.maps.DirectionsStatus.OK && result) {
      console.log('✅ Google Directions route created successfully');
      
      // Clear any existing custom polylines first
      if (routePolyline) {
        routePolyline.setMap(null);
        setRoutePolyline(null);
      }
      
      // Update renderer styling
      const routeColor = emergencyActive ? '#DC2626' : '#3B82F6';
      const routeWeight = emergencyActive ? 14 : 10;
      
      directionsRenderer.setOptions({
        polylineOptions: {
          strokeColor: routeColor,
          strokeWeight: routeWeight,
          strokeOpacity: 1.0,
          zIndex: 1000,
        }
      });
      
      directionsRenderer.setDirections(result);
      
      // Extract and set route information
      const route = result.routes[0];
      const leg = route.legs[0];
      setRouteInfo({
        distance: leg.distance?.text || 'Unknown',
        duration: leg.duration?.text || 'Unknown'
      });
      
      setIsRouteVisible(true);
      
      // Fit bounds to show the entire route
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] });
      bounds.extend({ lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] });
      mapInstance.fitBounds(bounds, { padding: 100 });
      
      console.log('✅ Google Directions route displayed');
      showRouteNotification(leg.distance?.text || 'Unknown', leg.duration?.text || 'Unknown');
      
    } else {
      console.error('❌ Google Directions request failed:', status);
      console.log('🔄 Falling back to custom polyline route...');
      createCustomPolylineRoute();
    }
  });
};

// 3. ENHANCED CUSTOM POLYLINE WITH BETTER VISIBILITY
const createCustomPolylineRoute = () => {
  if (!selectedHospital || !mapInstance) {
    console.log('❌ Missing dependencies for custom polyline route');
    return;
  }

  console.log('🔄 Creating custom polyline route...');

  // Clear existing routes
  clearAllRoutes();

  const startPoint = { lat: ambulanceLocation[0], lng: ambulanceLocation[1] };
  const endPoint = { lat: selectedHospital.coordinates[0], lng: selectedHospital.coordinates[1] };
  
  // Create a simple direct path first, then add curve
  const path = [startPoint, endPoint];
  const routeColor = emergencyActive ? '#DC2626' : '#3B82F6';
  const routeWeight = emergencyActive ? 14 : 10;

  try {
    // Create main route polyline
    const newPolyline = new google.maps.Polyline({
      path,
      strokeColor: routeColor,
      strokeWeight: routeWeight,
      strokeOpacity: 1.0,
      zIndex: 1000,
      map: mapInstance,
    });

    // Add shadow for better visibility
    const shadowPolyline = new google.maps.Polyline({
      path,
      strokeColor: '#000000',
      strokeWeight: routeWeight + 4,
      strokeOpacity: 0.3,
      zIndex: 999,
      map: mapInstance,
    });

    setRoutePolyline(newPolyline);

    // Calculate distance and duration
    const distance = calculateDistance(ambulanceLocation, selectedHospital.coordinates);
    const duration = Math.ceil(distance / 0.5); // 30 km/h average
    
    setRouteInfo({
      distance: `${distance.toFixed(1)} km`,
      duration: `${duration} min`
    });

    // Fit map bounds
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(startPoint);
    bounds.extend(endPoint);
    mapInstance.fitBounds(bounds, { padding: 100 });

    setIsRouteVisible(true);

    console.log('✅ Custom polyline route created successfully');
    showRouteNotification(`${distance.toFixed(1)} km`, `${duration} min`);

    // Store shadow for cleanup
    (newPolyline as any).shadowPolyline = shadowPolyline;
    
  } catch (error) {
    console.error('❌ Failed to create custom polyline route:', error);
    setIsRouteVisible(false);
  }
};

// 4. IMPROVED CLEAR ROUTES FUNCTION
const clearAllRoutes = () => {
  console.log('🧹 Clearing all routes...');
  
  // Clear Google Directions
  if (directionsRenderer) {
    try {
      directionsRenderer.setDirections({ routes: [] } as any);
      console.log('✅ Google Directions cleared');
    } catch (error) {
      console.log('⚠️ Error clearing Google Directions:', error);
    }
  }
  
  // Clear custom polylines
  if (routePolyline) {
    try {
      routePolyline.setMap(null);
      // Also clear shadow if it exists
      if ((routePolyline as any).shadowPolyline) {
        (routePolyline as any).shadowPolyline.setMap(null);
      }
      setRoutePolyline(null);
      console.log('✅ Custom polyline cleared');
    } catch (error) {
      console.log('⚠️ Error clearing custom polyline:', error);
    }
  }
  
  setRouteInfo(null);
  setIsRouteVisible(false);
};

// 5. FORCE ROUTE RECREATION FUNCTION (for debugging)
const forceRecreateRoute = () => {
  console.log('🔄 Force recreating route...');
  clearAllRoutes();
  
  setTimeout(() => {
    if (selectedHospital && mapInstance) {
      console.log('🔄 Attempting route recreation after cleanup...');
      if (directionsService && directionsRenderer && routesLibrary) {
        createGoogleDirectionsRoute();
      } else {
        createCustomPolylineRoute();
      }
    }
  }, 500);
};

// 6. DEBUGGING HELPER - Add this to your component for troubleshooting
const debugRouteState = () => {
  console.log('🐛 Route Debug State:', {
    selectedHospital: !!selectedHospital,
    mapInstance: !!mapInstance,
    directionsService: !!directionsService,
    directionsRenderer: !!directionsRenderer,
    routesLibrary: !!routesLibrary,
    routePolyline: !!routePolyline,
    isRouteVisible,
    routeInfo,
    ambulanceLocation,
    hospitalCoordinates: selectedHospital?.coordinates,
    emergencyActive
  });
};

// 7. ALTERNATIVE LIBRARY LOADING APPROACH
// If useMapsLibrary('routes') is not working, try this approach:
useEffect(() => {
  const initializeDirectionsAfterDelay = () => {
    setTimeout(() => {
      if (window.google && window.google.maps && window.google.maps.DirectionsService) {
        console.log('🗺️ Initializing DirectionsService via fallback method...');
        try {
          setDirectionsService(new google.maps.DirectionsService());
          const renderer = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            preserveViewport: false,
            polylineOptions: {
              strokeColor: emergencyActive ? '#DC2626' : '#3B82F6',
              strokeWeight: emergencyActive ? 12 : 8,
              strokeOpacity: 1.0,
              zIndex: 1000,
            }
          });
          setDirectionsRenderer(renderer);
          console.log('✅ DirectionsService initialized via fallback');
        } catch (error) {
          console.error('❌ Fallback DirectionsService initialization failed:', error);
        }
      } else {
        console.log('⚠️ Google Maps DirectionsService not available');
      }
    }, 2000); // 2 second delay to ensure maps is fully loaded
  };

  if (!routesLibrary) {
    initializeDirectionsAfterDelay();
  }
}, [routesLibrary, emergencyActive]);

// USAGE: Add these debugging buttons to your component temporarily
/*
<div className="p-2 bg-yellow-50 border border-yellow-200">
  <button onClick={debugRouteState} className="mr-2 px-3 py-1 bg-blue-500 text-white rounded text-xs">
    Debug Route State
  </button>
  <button onClick={forceRecreateRoute} className="px-3 py-1 bg-green-500 text-white rounded text-xs">
    Force Recreate Route
  </button>
</div>
*/