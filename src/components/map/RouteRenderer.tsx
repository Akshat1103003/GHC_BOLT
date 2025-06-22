import React, { useEffect, useState, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Route } from '../../types';

interface RouteRendererProps {
  map: google.maps.Map | null;
  route: Route | null;
  emergencyActive: boolean;
  onRouteCreated?: (routeInfo: { distance: string; duration: string }) => void;
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

  // Initialize Google Maps services
  useEffect(() => {
    if (routesLibrary && map) {
      const service = new google.maps.DirectionsService();
      const renderer = new google.maps.DirectionsRenderer({
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
      
      console.log('🗺️ Google Maps Directions services initialized');
    }
  }, [routesLibrary, map, emergencyActive]);

  // Update renderer styling when emergency status changes
  useEffect(() => {
    if (directionsRenderer) {
      const routeColor = emergencyActive ? '#DC2626' : '#2563EB';
      const routeWeight = emergencyActive ? 12 : 10;
      
      directionsRenderer.setOptions({
        polylineOptions: {
          strokeColor: routeColor,
          strokeWeight: routeWeight,
          strokeOpacity: 1.0,
          zIndex: 1000,
          icons: emergencyActive ? [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
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
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
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
    }
  }, [directionsRenderer, emergencyActive]);

  // Clear all routes
  const clearAllRoutes = () => {
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
  };

  // Create route using Google Directions API
  const createGoogleDirectionsRoute = async () => {
    if (!directionsService || !directionsRenderer || !route || !map) return false;

    console.log('🔄 Requesting Google Directions route...');

    const request: google.maps.DirectionsRequest = {
      origin: { lat: route.startLocation[0], lng: route.startLocation[1] },
      destination: { lat: route.endLocation[0], lng: route.endLocation[1] },
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false,
      optimizeWaypoints: true,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      }
    };

    return new Promise<boolean>((resolve) => {
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          console.log('✅ Google Directions route created successfully');
          
          directionsRenderer.setDirections(result);
          
          // Extract route information
          const route = result.routes[0];
          const leg = route.legs[0];
          
          // Fit map to show entire route
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(request.origin as google.maps.LatLng);
          bounds.extend(request.destination as google.maps.LatLng);
          map.fitBounds(bounds, { 
            padding: { top: 100, right: 100, bottom: 100, left: 100 }
          });
          
          // Notify parent component
          if (onRouteCreated) {
            onRouteCreated({
              distance: leg.distance?.text || 'Unknown',
              duration: leg.duration?.text || 'Unknown'
            });
          }
          
          console.log('✅ Route visualization complete:', {
            distance: leg.distance?.text,
            duration: leg.duration?.text,
            emergencyActive
          });

          resolve(true);
        } else {
          console.error('❌ Google Directions request failed:', status);
          resolve(false);
        }
      });
    });
  };

  // Create fallback polyline route
  const createFallbackRoute = () => {
    if (!route || !map) return;

    console.log('🔄 Creating fallback polyline route...');

    // Clear existing routes
    clearAllRoutes();

    try {
      // Use the waypoints from the route
      const path = route.waypoints.map(point => ({
        lat: point[0],
        lng: point[1]
      }));

      const routeColor = emergencyActive ? '#DC2626' : '#2563EB';
      const routeWeight = emergencyActive ? 12 : 10;

      // Create shadow polyline for better visibility
      const shadow = new google.maps.Polyline({
        path,
        strokeColor: '#000000',
        strokeWeight: routeWeight + 4,
        strokeOpacity: 0.3,
        zIndex: 999,
        map,
      });

      // Create main route polyline
      const main = new google.maps.Polyline({
        path,
        strokeColor: routeColor,
        strokeWeight: routeWeight,
        strokeOpacity: 1.0,
        zIndex: 1000,
        map,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 4,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            fillColor: routeColor,
            fillOpacity: 1,
          },
          offset: '0%',
          repeat: '12%'
        }]
      });

      setShadowPolyline(shadow);
      setFallbackPolyline(main);

      // Fit map to show route
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, { 
        padding: { top: 80, right: 80, bottom: 80, left: 80 }
      });

      // Notify parent component with estimated values
      if (onRouteCreated) {
        onRouteCreated({
          distance: `${route.distance.toFixed(1)} km`,
          duration: `${Math.ceil(route.duration)} min`
        });
      }

      console.log('✅ Fallback polyline route created successfully');

    } catch (error) {
      console.error('❌ Failed to create fallback route:', error);
    }
  };

  // Main route creation logic
  const createRoute = async () => {
    if (!route || !map) {
      clearAllRoutes();
      return;
    }

    // Check if this is the same route to avoid unnecessary recreation
    if (currentRouteRef.current && 
        currentRouteRef.current.id === route.id &&
        currentRouteRef.current.startLocation[0] === route.startLocation[0] &&
        currentRouteRef.current.startLocation[1] === route.startLocation[1] &&
        currentRouteRef.current.endLocation[0] === route.endLocation[0] &&
        currentRouteRef.current.endLocation[1] === route.endLocation[1]) {
      console.log('🔄 Route unchanged, skipping recreation');
      return;
    }

    console.log('🗺️ Creating new route...', {
      from: route.startLocation,
      to: route.endLocation,
      emergencyActive
    });

    // Try Google Directions API first
    let success = false;
    if (directionsService && directionsRenderer) {
      success = await createGoogleDirectionsRoute();
    }

    // Fallback to custom polyline if Directions API fails
    if (!success) {
      console.log('🔄 Falling back to custom polyline route...');
      createFallbackRoute();
    }

    // Store current route reference
    currentRouteRef.current = route;
  };

  // Effect to handle route changes
  useEffect(() => {
    if (route) {
      createRoute();
    } else {
      clearAllRoutes();
      currentRouteRef.current = null;
    }
  }, [route, directionsService, directionsRenderer, map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllRoutes();
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default RouteRenderer;