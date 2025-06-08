import React from 'react';

// Custom SVG icon components for map markers
export const AmbulanceIcon = ({ size = 24, color = '#DC2626' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="10" width="20" height="8" rx="2" fill={color} stroke="white" strokeWidth="1"/>
    <rect x="4" y="6" width="12" height="6" rx="1" fill={color} stroke="white" strokeWidth="1"/>
    <circle cx="7" cy="18" r="2" fill="white" stroke={color} strokeWidth="1"/>
    <circle cx="17" cy="18" r="2" fill="white" stroke={color} strokeWidth="1"/>
    <path d="M8 8h2v2H8V8zm4 0h2v2h-2V8z" fill="white"/>
    <path d="M11 3l1 2h2l-1 2h-2l-1-2z" fill="white"/>
  </svg>
);

export const HospitalIcon = ({ size = 24, color = '#2563EB' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" fill={color} stroke="white" strokeWidth="1"/>
    <rect x="10" y="7" width="4" height="10" fill="white"/>
    <rect x="7" y="10" width="10" height="4" fill="white"/>
    <circle cx="6" cy="8" r="1" fill="white"/>
    <circle cx="18" cy="8" r="1" fill="white"/>
    <circle cx="6" cy="16" r="1" fill="white"/>
    <circle cx="18" cy="16" r="1" fill="white"/>
  </svg>
);

export const TrafficSignalIcon = ({ size = 24, color = '#F59E0B', status = 'inactive' }: { 
  size?: number; 
  color?: string; 
  status?: string;
}) => {
  const getSignalColor = () => {
    switch (status) {
      case 'active': return '#10B981'; // green
      case 'approaching': return '#F59E0B'; // amber
      case 'passed': return '#6B7280'; // gray
      default: return '#EF4444'; // red
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="2" width="8" height="18" rx="2" fill="#374151" stroke="white" strokeWidth="1"/>
      <circle cx="12" cy="6" r="2" fill={status === 'passed' ? '#EF4444' : '#6B7280'}/>
      <circle cx="12" cy="10" r="2" fill={status === 'approaching' ? '#F59E0B' : '#6B7280'}/>
      <circle cx="12" cy="14" r="2" fill={status === 'active' ? '#10B981' : '#6B7280'}/>
      <rect x="11" y="18" width="2" height="4" fill="#374151"/>
      {status === 'approaching' && (
        <circle cx="12" cy="10" r="3" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.6">
          <animate attributeName="r" values="2;4;2" dur="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  );
};

export const POIIcon = ({ size = 20, color = '#6B7280', type = 'default' }: { 
  size?: number; 
  color?: string; 
  type?: string;
}) => {
  const getIcon = () => {
    switch (type) {
      case 'fire_station':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="16" height="12" rx="2" fill="#DC2626" stroke="white" strokeWidth="1"/>
            <polygon points="12,2 6,8 18,8" fill="#DC2626" stroke="white" strokeWidth="1"/>
            <rect x="10" y="12" width="4" height="6" fill="white"/>
            <circle cx="8" cy="14" r="1" fill="white"/>
            <circle cx="16" cy="14" r="1" fill="white"/>
          </svg>
        );
      case 'police_station':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="16" height="12" rx="2" fill="#1D4ED8" stroke="white" strokeWidth="1"/>
            <polygon points="12,2 6,8 18,8" fill="#1D4ED8" stroke="white" strokeWidth="1"/>
            <rect x="10" y="12" width="4" height="6" fill="white"/>
            <circle cx="12" cy="5" r="1" fill="white"/>
          </svg>
        );
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill={color} stroke="white" strokeWidth="1"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        );
    }
  };

  return getIcon();
};

// Helper function to create custom marker icons
export const createCustomMarkerIcon = (
  iconComponent: React.ReactElement,
  size: number = 32
): string => {
  // Create a temporary div to render the React component
  const div = document.createElement('div');
  div.style.width = `${size}px`;
  div.style.height = `${size}px`;
  
  // Convert React component to HTML string
  const iconHtml = React.createElement('div', {
    style: {
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
      borderRadius: '50%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      border: '2px solid white'
    }
  }, iconComponent);
  
  // Create SVG data URL
  const svgString = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">
          ${iconComponent}
        </div>
      </foreignObject>
    </svg>
  `;
  
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
};