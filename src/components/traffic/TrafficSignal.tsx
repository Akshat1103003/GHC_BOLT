import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { EmergencyStatus } from '../../types';

interface TrafficSignalProps {
  status: EmergencyStatus;
  intersection: string;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  className?: string;
}

const TrafficSignal: React.FC<TrafficSignalProps> = ({
  status,
  intersection,
  soundEnabled = true,
  onToggleSound,
  className = '',
}) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (status === EmergencyStatus.APPROACHING) {
      setIsFlashing(true);
      if (soundEnabled && audioRef.current) {
        audioRef.current.play();
      }
    } else {
      setIsFlashing(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [status, soundEnabled]);

  const getSignalColors = () => {
    switch (status) {
      case EmergencyStatus.ACTIVE:
        return {
          red: 'bg-gray-300',
          yellow: 'bg-gray-300',
          green: 'bg-green-500 animate-pulse',
        };
      case EmergencyStatus.APPROACHING:
        return {
          red: 'bg-red-500',
          yellow: 'bg-yellow-500 animate-pulse',
          green: 'bg-gray-300',
        };
      case EmergencyStatus.PASSED:
        return {
          red: 'bg-gray-300',
          yellow: 'bg-gray-300',
          green: 'bg-green-500',
        };
      default:
        return {
          red: 'bg-red-500',
          yellow: 'bg-gray-300',
          green: 'bg-gray-300',
        };
    }
  };

  const colors = getSignalColors();

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Audio element for emergency sound */}
      <audio
        ref={audioRef}
        src="https://www.soundjay.com/mechanical/sounds/emergency-alarm-loop-1.mp3"
        loop
      />

      {/* Signal header */}
      <div className="p-4 bg-gray-700 flex justify-between items-center">
        <h3 className="text-white font-medium">{intersection}</h3>
        <button
          onClick={onToggleSound}
          className="text-gray-300 hover:text-white transition-colors"
          title={soundEnabled ? 'Mute sound' : 'Enable sound'}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Traffic light */}
      <div className="p-6 flex flex-col items-center space-y-4">
        <div className="bg-gray-900 p-4 rounded-lg">
          {/* Red light */}
          <div className={`w-16 h-16 rounded-full ${colors.red} mb-3 shadow-inner`} />
          {/* Yellow light */}
          <div className={`w-16 h-16 rounded-full ${colors.yellow} mb-3 shadow-inner`} />
          {/* Green light */}
          <div className={`w-16 h-16 rounded-full ${colors.green} shadow-inner`} />
        </div>

        {/* Status indicator */}
        {status === EmergencyStatus.APPROACHING && (
          <div className={`bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium ${isFlashing ? 'animate-pulse' : ''}`}>
            Emergency Vehicle Approaching
          </div>
        )}
        
        {status === EmergencyStatus.ACTIVE && (
          <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            Emergency Vehicle Passing
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="p-4 bg-gray-700 text-center">
        <p className="text-sm text-gray-300">
          Status: <span className="font-medium text-white">{status}</span>
        </p>
      </div>
    </div>
  );
};

export default TrafficSignal;