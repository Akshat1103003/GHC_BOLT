import React, { useEffect, useRef } from 'react';

interface RouteData {
  waypoints: [number, number][];
  distance: string;
  duration: string;
}

interface RouteRendererProps {
  map: google.maps.Map | null;
  route: RouteData | null;
  emergencyActive: boolean;
  onRouteCreated: (info: { distance: string; duration: string }) => void;
  onRouteCleared: () => void;
}

const RouteRenderer: React.FC<RouteRendererProps> = ({
  map,
  route,
  emergencyActive,
  onRouteCreated,
  onRouteCleared
}) => {
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const previousRouteRef = useRef<RouteData | null>(null);

  useEffect(() => {
    if (!map) return;

    // Clear existing polyline if route is null or changed
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // If no route, clear and return
    if (!route || !route.waypoints || route.waypoints.length < 2) {
      if (previousRouteRef.current) {
        onRouteCleared();
        previousRouteRef.current = null;
      }
      return;
    }

    // Check if this is a new route
    const isNewRoute = !previousRouteRef.current || 
      JSON.stringify(previousRouteRef.current.waypoints) !== JSON.stringify(route.waypoints);

    if (isNewRoute) {
      console.log('🗺️ Creating new route with', route.waypoints.length, 'waypoints');
      
      // Convert waypoints to Google Maps LatLng objects
      const path = route.waypoints.map(([lat, lng]) => ({
        lat,
        lng
      }));

      // Create polyline with styling based on emergency status
      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: emergencyActive ? '#DC2626' : '#2563EB', // Red for emergency, blue for normal
        strokeOpacity: emergencyActive ? 0.9 : 0.8,
        strokeWeight: emergencyActive ? 6 : 4,
        zIndex: 100,
        icons: emergencyActive ? [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 4,
            strokeColor: '#DC2626',
            fillColor: '#FBBF24',
            fillOpacity: 1
          },
          offset: '0%',
          repeat: '15%'
        }] : [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: '#2563EB',
            fillColor: '#60A5FA',
            fillOpacity: 1
          },
          offset: '0%',
          repeat: '20%'
        }]
      });

      // Add polyline to map
      polyline.setMap(map);
      polylineRef.current = polyline;

      // Fit map bounds to show entire route
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      
      // Add some padding around the route
      map.fitBounds(bounds, {
        top: 80,
        right: 80,
        bottom: 120,
        left: 80
      });

      // Store current route and notify parent
      previousRouteRef.current = route;
      onRouteCreated({
        distance: route.distance,
        duration: route.duration
      });

      console.log('✅ Route created successfully:', route.distance, '•', route.duration);
    }

    // Update polyline color if emergency status changes but route is the same
    if (!isNewRoute && polylineRef.current) {
      const currentColor = emergencyActive ? '#DC2626' : '#2563EB';
      const currentWeight = emergencyActive ? 6 : 4;
      const currentOpacity = emergencyActive ? 0.9 : 0.8;
      
      polylineRef.current.setOptions({
        strokeColor: currentColor,
        strokeWeight: currentWeight,
        strokeOpacity: currentOpacity,
        icons: emergencyActive ? [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 4,
            strokeColor: '#DC2626',
            fillColor: '#FBBF24',
            fillOpacity: 1
          },
          offset: '0%',
          repeat: '15%'
        }] : [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: '#2563EB',
            fillColor: '#60A5FA',
            fillOpacity: 1
          },
          offset: '0%',
          repeat: '20%'
        }]
      });
    }

  }, [map, route, emergencyActive, onRouteCreated, onRouteCleared]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, []);

  // This component doesn't render anything directly - it just manages the polyline
  return null;
};

export default RouteRenderer;