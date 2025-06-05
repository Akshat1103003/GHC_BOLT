import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

interface EmergencyToggleProps {
  className?: string;
}

const EmergencyToggle: React.FC<EmergencyToggleProps> = ({ className = '' }) => {
  const { emergencyActive, toggleEmergency } = useAppContext();

  return (
    <div className={`${className}`}>
      <button
        onClick={toggleEmergency}
        className={`
          relative flex items-center justify-center w-full 
          px-6 py-3 rounded-lg shadow-md font-medium 
          transition-all duration-300
          ${emergencyActive 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-red-600 hover:bg-red-700 text-white'}
        `}
      >
        <AlertCircle className={`mr-2 h-5 w-5 ${emergencyActive ? '' : 'animate-pulse'}`} />
        <span className="text-lg">
          {emergencyActive ? 'Deactivate Emergency' : 'Activate Emergency'}
        </span>
        
        {!emergencyActive && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        )}
      </button>

      <div className="mt-3 text-center text-sm">
        {emergencyActive ? (
          <p className="text-green-700">Emergency mode is active. Traffic signals are being notified.</p>
        ) : (
          <p className="text-gray-600">Activate emergency mode to notify traffic signals and hospitals.</p>
        )}
      </div>
    </div>
  );
};

export default EmergencyToggle;