import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

interface ResetButtonProps {
  className?: string;
  showLabel?: boolean;
}

const ResetButton: React.FC<ResetButtonProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { resetSystem } = useAppContext();

  const handleReset = () => {
    // Confirm before resetting
    const confirmed = window.confirm(
      'Are you sure you want to reset the system? This will:\n\n' +
      '• Reset ambulance to starting position\n' +
      '• Deactivate all traffic signals\n' +
      '• Turn off emergency mode\n' +
      '• Clear selected hospital and route'
    );
    
    if (confirmed) {
      resetSystem();
    }
  };

  return (
    <button
      onClick={handleReset}
      className={`
        flex items-center justify-center px-4 py-2 
        bg-gray-600 hover:bg-gray-700 text-white 
        rounded-lg shadow-md font-medium 
        transition-all duration-200 hover:shadow-lg
        ${className}
      `}
      title="Reset ambulance position and traffic signals"
    >
      <RotateCcw className={`${showLabel ? 'mr-2' : ''} h-5 w-5`} />
      {showLabel && <span>Reset System</span>}
    </button>
  );
};

export default ResetButton;