import React, { useEffect, useState } from 'react';
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
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [shadowPolyline, setShadowPolyline] = useState<google.maps.Polyline | null>(null);

  // Clear existing route
  const clearRoute = () => {
    if (polyline) {
      polyline.setMap(null);
      setPolyline(null);
    }
    if (shadowPolyline) {
      shadowPolyline.setMap(null);
      setShadowPolyline(null);
    }
    if (onRouteCleared) {
      onRouteCleared();
    }
  };

  // Create route polyline
  const createRoute = () => {
    if (!map || !route) return;

    console.log('🗺️ Creating route polyline...');

    // Clear existing route first
    clearRoute();

    try {
      const path = route.waypoints.map(point => ({
        lat: point[0],
        lng: point[1]
      }));

      const routeColor = emergencyActive ? '#DC2626' : '#2563EB';
      const routeWeight = emergencyActive ? 10 : 8;

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
        strokeOpacity: 0.9,
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
          repeat: '15%'
        }]
      });

      setShadowPolyline(shadow);
      setPolyline(main);

      // Fit map to show route
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, { 
        padding: { top: 80, right: 80, bottom: 80, left: 80 }
      });

      // Notify parent component
      if (onRouteCreated) {
        onRouteCreated({
          distance: `${route.distance.toFixed(1)} km`,
          duration: `${Math.ceil(route.duration)} min`
        });
      }

      console.log('✅ Route polyline created successfully');

    } catch (error) {
      console.error('❌ Failed to create route polyline:', error);
    }
  };

  // Effect to handle route changes
  useEffect(() => {
    if (route && map) {
      createRoute();
    } else {
      clearRoute();
    }
  }, [route, map, emergencyActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRoute();
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default RouteRenderer;