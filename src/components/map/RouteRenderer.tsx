import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Route, RouteInfo } from '../../types';

interface RouteRendererProps {
  map: google.maps.Map | null;
  route: Route | null;
  emergencyActive: boolean;
  onRouteCreated?: (routeInfo: RouteInfo) => void;
  onRouteCleared?: () => void;
}

const RouteRenderer: React.FC<RouteRendererProps> = ({
  map,
  route,
  emergencyActive,
  onRouteCreated,
  onRouteCleared,
}) => {
  // Google Maps services
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  
  // Fallback polyline for when Directions API fails
  const [fallbackPolyline, setFallbackPolyline] = useState<google.maps.Polyline | null>(null);
  const [shadowPolyline, setShadowPolyline] = useState<google.maps.Polyline | null>(null);
  
  const currentRouteRef = useRef<Route | null>(null);
  const isCreatingRouteRef = useRef(false);

  // Initialize Google Maps services
  useEffect(() => {
    if (routesLibrary && map && window.google?.maps) {
      try {
        const service = new window.google.maps.DirectionsService();
        const renderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true, // We handle markers in MapView
          preserveViewport: false,
          polylineOptions: {
            strokeColor: emergencyActive ? '#DC2626' : '#2563EB',
            strokeWeight: emergencyActive ? 12 : 10,
            strokeOpacity: 1.0,
            zIndex: 1000,
          }
        });
        
        renderer.setMap(map);
        setDirectionsService(service);
        setDirectionsRenderer(renderer);
        
        console.log('🗺️ Google Maps Directions services initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Google Maps services:', error);
      }
    }
  }, [routesLibrary, map]);

  // Update renderer styling when emergency status changes
  useEffect(() => {
    if (directionsRenderer && window.google?.maps) {
      const routeColor = emergencyActive ? '#DC2626' : '#2563EB';
      const routeWeight = emergencyActive ? 12 : 10;
      
      try {
        directionsRenderer.setOptions({
          polylineOptions: {
            strokeColor: routeColor,
            strokeWeight: routeWeight,
            strokeOpacity: 1.0,
            zIndex: 1000,
            icons: emergencyActive ? [
              {
                icon: {
                  path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 4,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2,
                  fillColor: routeColor,
                  fillOpacity: 1,
                },
                offset: '0%',
                repeat: '10%'
              }
            ] : [
              {
                icon: {
                  path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 1,
                  fillColor: routeColor,
                  fillOpacity: 0.8,
                },
                offset: '0%',
                repeat: '15%'
              }
            ]
          }
        });
        console.log('🎨 Updated route styling for emergency mode:', emergencyActive);
      } catch (error) {
        console.error('❌ Failed to update route styling:', error);
      }
    }
  }, [directionsRenderer, emergencyActive]);

  // Clear all routes
  const clearAllRoutes = useCallback(() => {
    try {
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] } as any);
      }
      if (fallbackPolyline) {
        fallbackPolyline.setMap(null);
        setFallbackPolyline(null);
      }
      if (shadowPolyline) {
        shadowPolyline.setMap(null);
        setShadowPolyline(null);
      }
      if (onRouteCleared) {
        onRouteCleared();
      }
      console.log('🧹 All routes cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing routes:', error);
    }
  }, [directionsRenderer, fallbackPolyline, shadowPolyline, onRouteCleared]);

  // Create route using Google Directions API
  const createGoogleDirectionsRoute = useCallback(async (): Promise<boolean> => {
    if (!directionsService || !directionsRenderer || !route || !map || !window.google?.maps) {
      console.warn('⚠️ Missing dependencies for Google Directions API');
      return false;
    }

    console.log('🔄 Requesting Google Directions route...');

    const request: google.maps.DirectionsRequest = {
      origin: { lat: route.startLocation[0], lng: route.startLocation[1] },
      destination: { lat: route.endLocation[0], lng: route.endLocation[1] },
      travelMode: window.google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false,
      optimizeWaypoints: true,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: window.google.maps.TrafficModel.BEST_GUESS
      }
    };

    return new Promise<boolean>((resolve) => {
      directionsService.route(request, (result, status) => {
        try {
          if (status === window.google.maps.DirectionsStatus.OK && result && result.routes.length > 0) {
            console.log('✅ Google Directions route created successfully');
            
            directionsRenderer.setDirections(result);
            
            // Extract route information
            const apiRoute = result.routes[0];
            const leg = apiRoute.legs[0];
            
            // Fit map to show entire route with proper bounds
            if (apiRoute.bounds) {
              map.fitBounds(apiRoute.bounds, { 
                padding: { top: 100, right: 100, bottom: 100, left: 100 }
              });
            } else {
              // Fallback bounds calculation
              const bounds = new window.google.maps.LatLngBounds();
              bounds.extend(request.origin as google.maps.LatLngLiteral);
              bounds.extend(request.destination as google.maps.LatLngLiteral);
              map.fitBounds(bounds, { 
                padding: { top: 100, right: 100, bottom: 100, left: 100 }
              });
            }
            
            // Notify parent component with real API data
            if (onRouteCreated && leg.distance && leg.duration) {
              onRouteCreated({
                distance: leg.distance.text,
                duration: leg.duration.text
              });
            }
            
            console.log('✅ Route visualization complete via Google Directions API:', {
              distance: leg.distance?.text,
              duration: leg.duration?.text,
              emergencyActive
            });

            resolve(true);
          } else {
            console.error('❌ Google Directions request failed. Status:', status);
            if (status === window.google.maps.DirectionsStatus.REQUEST_DENIED) {
              console.error('❌ Directions API access denied. Check API key and enabled services.');
            } else if (status === window.google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
              console.error('❌ Directions API quota exceeded.');
            } else if (status === window.google.maps.DirectionsStatus.ZERO_RESULTS) {
              console.error('❌ No route found between the specified locations.');
            }
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Error processing Directions API response:', error);
          resolve(false);
        }
      });
    });
  }, [directionsService, directionsRenderer, route, map, onRouteCreated, emergencyActive]);

  // Create fallback polyline route
  const createFallbackRoute = useCallback(() => {
    if (!route || !map || !window.google?.maps) {
      console.warn('⚠️ Missing dependencies for fallback route');
      return;
    }

    console.log('🔄 Creating fallback polyline route...');

    try {
      // Clear existing routes first
      clearAllRoutes();

      // Use the waypoints from the route
      const path = route.waypoints.map(point => ({
        lat: point[0],
        lng: point[1]
      }));

      if (path.length < 2) {
        console.error('❌ Insufficient waypoints for route creation');
        return;
      }

      const routeColor = emergencyActive ? '#DC2626' : '#2563EB';
      const routeWeight = emergencyActive ? 12 : 10;

      // Create shadow polyline for better visibility
      const shadow = new window.google.maps.Polyline({
        path,
        strokeColor: '#000000',
        strokeWeight: routeWeight + 4,
        strokeOpacity: 0.3,
        zIndex: 999,
        map,
      });

      // Create main route polyline
      const main = new window.google.maps.Polyline({
        path,
        strokeColor: routeColor,
        strokeWeight: routeWeight,
        strokeOpacity: 1.0,
        zIndex: 1000,
        map,
        icons: [{
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: emergencyActive ? 4 : 3,
            strokeColor: '#FFFFFF',
            strokeWeight: emergencyActive ? 2 : 1,
            fillColor: routeColor,
            fillOpacity: 1,
          },
          offset: '0%',
          repeat: emergencyActive ? '10%' : '15%'
        }]
      });

      setShadowPolyline(shadow);
      setFallbackPolyline(main);

      // Fit map to show route
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, { 
        padding: { top: 80, right: 80, bottom: 80, left: 80 }
      });

      // Notify parent component with estimated values
      if (onRouteCreated) {
        onRouteCreated({
          distance: `${route.distance.toFixed(1)} km (estimated)`,
          duration: `${Math.ceil(route.duration)} min (estimated)`
        });
      }

      console.log('✅ Fallback polyline route created successfully');

    } catch (error) {
      console.error('❌ Failed to create fallback route:', error);
    }
  }, [route, map, emergencyActive, clearAllRoutes, onRouteCreated]);

  // Main route creation logic
  const createRoute = useCallback(async () => {
    if (!route || !map) {
      clearAllRoutes();
      currentRouteRef.current = null;
      return;
    }

    // Prevent concurrent route creation
    if (isCreatingRouteRef.current) {
      console.log('🔄 Route creation already in progress, skipping...');
      return;
    }

    // Check if this is the same route to avoid unnecessary recreation
    const prevRoute = currentRouteRef.current;
    if (prevRoute && 
        prevRoute.id === route.id &&
        prevRoute.startLocation[0] === route.startLocation[0] &&
        prevRoute.startLocation[1] === route.startLocation[1] &&
        prevRoute.endLocation[0] === route.endLocation[0] &&
        prevRoute.endLocation[1] === route.endLocation[1]) {
      console.log('🔄 Route unchanged, skipping recreation');
      return;
    }

    isCreatingRouteRef.current = true;

    console.log('🗺️ Creating new route...', {
      routeId: route.id,
      from: route.startLocation,
      to: route.endLocation,
      waypoints: route.waypoints.length,
      emergencyActive
    });

    try {
      // Try Google Directions API first
      let success = false;
      if (directionsService && directionsRenderer) {
        success = await createGoogleDirectionsRoute();
      }

      // Fallback to custom polyline if Directions API fails
      if (!success) {
        console.log('🔄 Google Directions API failed, using fallback polyline route...');
        createFallbackRoute();
      }

      // Store current route reference
      currentRouteRef.current = route;

    } catch (error) {
      console.error('❌ Error in route creation:', error);
      // Try fallback route as last resort
      createFallbackRoute();
    } finally {
      isCreatingRouteRef.current = false;
    }
  }, [route, map, directionsService, directionsRenderer, createGoogleDirectionsRoute, createFallbackRoute, clearAllRoutes, emergencyActive]);

  // Effect to handle route changes
  useEffect(() => {
    if (route && map && routesLibrary) {
      createRoute();
    } else if (!route) {
      clearAllRoutes();
      currentRouteRef.current = null;
    }
  }, [route, map, routesLibrary, createRoute, clearAllRoutes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllRoutes();
      currentRouteRef.current = null;
      isCreatingRouteRef.current = false;
    };
  }, [clearAllRoutes]);

  return null; // This component doesn't render anything visible
};

export default RouteRenderer;