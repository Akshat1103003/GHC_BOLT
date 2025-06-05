import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Ambulance, Guitar as HospitalIcon, MapPin } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { EmergencyStatus } from '../../types';

import 'leaflet/dist/leaflet.css';

// Fix for leaflet marker icons
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface MapViewProps {
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({ className = '' }) => {
  const { 
    ambulanceLocation, 
    selectedHospital, 
    currentRoute,
    trafficSignals,
    emergencyActive
  } = useAppContext();

  // Move the Leaflet icon fix inside the component
  useEffect(() => {
    // @ts-ignore - TS doesn't know about this property
    delete L.Icon.Default.prototype._getIconUrl;

    // @ts-ignore - TS doesn't know about this property
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  // Create custom icons
  const ambulanceIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWFtYnVsYW5jZSI+PHJlY3QgeCIzIiB5IjQ4IiB3aWR0aD0iMTYiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9IiNDRjIwMjAiLz48cGF0aCBkPSJNOSA4aC40YTIgMiAwIDAgMSAyIDJ2MmMwIDEuMS45IDIgMiAyaDIiIHN0cm9rZT0iI0NGMjAyMCIvPjxwYXRoIGQ9Ik05IDE2di0yYTIgMiAwIDAgMC0yLTJIN2EyIDIgMCAwIDAtMiAydjJhMiAyIDAgMCAwIDIgMmgxMGEyIDIgMCAwIDAgMi0ydi0yYTIgMiAwIDAgMC0yLTJoLTIiIGZpbGw9IiNDRjIwMjAiLz48Y2lyY2xlIGN4PSI3IiBjeT0iMTYuMyIgcj0iMS4zIi8+PGNpcmNsZSBjeD0iMTciIGN5PSIxNi4zIiByPSIxLjMiLz48cGF0aCBkPSJNMy4yIDEwIDE5IDEwIi8+PC9zdmc+',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const hospitalIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWhvc3BpdGFsIj48cGF0aCBkPSJNOCAxMGgydi00aDR2NGgydjhoLTh6IiBmaWxsPSIjMzg3MEIyIi8+PHBhdGggZD0iTTEyIDJhOCA4IDAgMCAxIDggOGMwIDguMDQtOCAxMi0xMiAxMlMyIDkuOTYgMiAxMGE4IDggMCAwIDEgOC04eiIgc3Ryb2tlPSIjMzg3MEIyIi8+PC9zdmc+',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // Create traffic signal icons based on status
  const getTrafficSignalIcon = (status: EmergencyStatus) => {
    let color = '#9CA3AF'; // gray-400 for inactive
    
    switch (status) {
      case EmergencyStatus.APPROACHING:
        color = '#F59E0B'; // amber-500
        break;
      case EmergencyStatus.ACTIVE:
        color = '#10B981'; // green-500
        break;
      case EmergencyStatus.PASSED:
        color = '#6B7280'; // gray-500
        break;
      default:
        color = '#9CA3AF'; // gray-400
    }
    
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiR7Y29sb3J9IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdHJhZmZpYy1jb25lIj48cG9seWdvbiBwb2ludHM9IjEyLDIgMjIsMjEgMiwyMSIgZmlsbD0iJHtjb2xvcn0iLz48L3N2Zz4=`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  // MapUpdater component to keep the map centered on the ambulance
  const MapUpdater: React.FC = () => {
    const map = useMap();
    
    useEffect(() => {
      map.setView(ambulanceLocation, map.getZoom());
    }, [ambulanceLocation, map]);
    
    return null;
  };

  return (
    <div className={`rounded-lg overflow-hidden shadow-lg ${className}`}>
      <MapContainer
        center={ambulanceLocation}
        zoom={14}
        style={{ height: '500px', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Ambulance marker */}
        <Marker position={ambulanceLocation} icon={ambulanceIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-bold">Ambulance</p>
              <p className="text-sm text-gray-600">
                Current location: {ambulanceLocation[0].toFixed(4)}, {ambulanceLocation[1].toFixed(4)}
              </p>
              {emergencyActive && <p className="text-red-600 font-bold mt-1">EMERGENCY ACTIVE</p>}
            </div>
          </Popup>
        </Marker>
        
        {/* Selected hospital marker */}
        {selectedHospital && (
          <Marker position={selectedHospital.coordinates} icon={hospitalIcon}>
            <Popup>
              <div>
                <p className="font-bold">{selectedHospital.name}</p>
                <p className="text-sm text-gray-600">{selectedHospital.address}</p>
                <p className="text-sm">
                  {selectedHospital.emergencyReady ? (
                    <span className="text-green-600">Ready for emergency</span>
                  ) : (
                    <span className="text-yellow-600">Limited emergency capacity</span>
                  )}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Traffic signal markers */}
        {trafficSignals.map((signal) => (
          <Marker 
            key={signal.id} 
            position={signal.coordinates} 
            icon={getTrafficSignalIcon(signal.status)}
          >
            <Popup>
              <div>
                <p className="font-bold">Traffic Signal</p>
                <p className="text-sm">{signal.intersection}</p>
                <p className="text-sm mt-1">
                  Status: {' '}
                  <span className={`font-semibold ${
                    signal.status === EmergencyStatus.ACTIVE ? 'text-green-600' :
                    signal.status === EmergencyStatus.APPROACHING ? 'text-amber-600' :
                    signal.status === EmergencyStatus.PASSED ? 'text-gray-600' :
                    'text-gray-400'
                  }`}>
                    {signal.status}
                  </span>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Route polyline */}
        {currentRoute && (
          <Polyline
            positions={currentRoute.waypoints}
            color={emergencyActive ? '#DC2626' : '#3B82F6'}
            weight={4}
            dashArray={emergencyActive ? '' : '5, 10'}
          />
        )}
        
        <MapUpdater />
      </MapContainer>
    </div>
  );
};

export default MapView;