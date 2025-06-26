import React, { useState } from 'react';
import { Crosshair, MapPin, RefreshCw, Settings, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

interface LiveLocationButtonProps {
  className?: string;
  showSettings?: boolean;
}

const LiveLocationButton: React.FC<LiveLocationButtonProps> = ({ 
  className = '', 
  showSettings = true 
}) => {
  const { 
    ambulanceLocation, 
    updateAmbulanceLocation, 
    isDetectingLocation, 
    locationError, 
    initialLocationSet 
  } = useAppContext();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAccuracySettings, setShowAccuracySettings] = useState(false);
  const [accuracySettings, setAccuracySettings] = useState({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000
  });

  // Refresh live location with custom accuracy settings
  const refreshLiveLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsRefreshing(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        
        console.log('🔄 Live location refreshed:', newLocation);
        updateAmbulanceLocation(newLocation);
        setIsRefreshing(false);
        
        // Show success notification
        showNotification('✅ Location Updated!', `New coordinates: ${newLocation[0].toFixed(4)}, ${newLocation[1].toFixed(4)}`, 'success');
      },
      (error) => {
        console.error('❌ Failed to refresh location:', error);
        setIsRefreshing(false);
        
        let errorMessage = 'Unable to refresh your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Try adjusting accuracy settings.';
            break;
        }
        
        showNotification('⚠️ Location Refresh Failed', errorMessage, 'error');
      },
      {
        enableHighAccuracy: accuracySettings.enableHighAccuracy,
        timeout: accuracySettings.timeout,
        maximumAge: accuracySettings.maximumAge
      }
    );
  };

  // Show notification
  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `fixed top-4 right-4 z-50 animate-bounce
      ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'} 
      text-white p-4 rounded-lg shadow-xl border-2 border-white max-w-sm`;
    notificationDiv.innerHTML = `
      <div class="flex items-center">
        <div class="mr-3 text-2xl">${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</div>
        <div>
          <div class="font-bold text-sm">${title}</div>
          <div class="text-xs mt-1">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notificationDiv);
    
    setTimeout(() => {
      if (document.body.contains(notificationDiv)) {
        notificationDiv.style.transition = 'all 0.5s ease-out';
        notificationDiv.style.opacity = '0';
        notificationDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(notificationDiv)) {
            document.body.removeChild(notificationDiv);
          }
        }, 500);
      }
    }, 4000);
  };

  // Get current status
  const getStatus = () => {
    if (isDetectingLocation || isRefreshing) {
      return { 
        icon: <Crosshair className="animate-spin" size={20} />, 
        text: isDetectingLocation ? 'Detecting...' : 'Refreshing...', 
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200'
      };
    } else if (locationError) {
      return { 
        icon: <AlertCircle size={20} />, 
        text: 'Location Failed', 
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200'
      };
    } else if (initialLocationSet) {
      return { 
        icon: <CheckCircle size={20} />, 
        text: 'Live Location Active', 
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200'
      };
    } else {
      return { 
        icon: <MapPin size={20} />, 
        text: 'Location Required', 
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200'
      };
    }
  };

  const status = getStatus();

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Target className="mr-2" size={20} />
          Live Location Control
        </h3>
        {showSettings && (
          <button
            onClick={() => setShowAccuracySettings(!showAccuracySettings)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            title="Location Accuracy Settings"
          >
            <Settings size={18} />
          </button>
        )}
      </div>

      {/* Status Display */}
      <div className={`p-3 rounded-md border mb-4 ${status.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {status.icon}
            <span className={`ml-2 font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            GPS Accuracy: {accuracySettings.enableHighAccuracy ? 'High' : 'Standard'}
          </div>
        </div>
        
        {/* Location Coordinates */}
        <div className="mt-2 text-sm text-gray-600">
          <p>📍 {ambulanceLocation[0].toFixed(6)}, {ambulanceLocation[1].toFixed(6)}</p>
          {locationError && (
            <p className="text-red-600 text-xs mt-1">⚠️ {locationError}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={refreshLiveLocation}
          disabled={isDetectingLocation || isRefreshing}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            isDetectingLocation || isRefreshing
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : initialLocationSet
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {isRefreshing ? (
            <>
              <Crosshair className="mr-2 h-5 w-5 animate-spin" />
              Refreshing Location...
            </>
          ) : isDetectingLocation ? (
            <>
              <Crosshair className="mr-2 h-5 w-5 animate-spin" />
              Detecting Location...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-5 w-5" />
              {initialLocationSet ? 'Refresh Live Location' : 'Get Live Location'}
            </>
          )}
        </button>

        {/* Direct Map Link */}
        <button
          onClick={() => {
            const url = `https://www.google.com/maps?q=${ambulanceLocation[0]},${ambulanceLocation[1]}`;
            window.open(url, '_blank');
          }}
          className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
        >
          <MapPin className="mr-2 h-4 w-4" />
          Open in Google Maps
        </button>
      </div>

      {/* Accuracy Settings Panel */}
      {showAccuracySettings && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <Settings className="mr-2" size={16} />
            Location Accuracy Settings
          </h4>
          
          <div className="space-y-3">
            {/* High Accuracy Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">High Accuracy GPS</label>
              <button
                onClick={() => setAccuracySettings(prev => ({ ...prev, enableHighAccuracy: !prev.enableHighAccuracy }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  accuracySettings.enableHighAccuracy ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  accuracySettings.enableHighAccuracy ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Timeout Setting */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Timeout: {accuracySettings.timeout / 1000}s
              </label>
              <input
                type="range"
                min="5000"
                max="30000"
                step="5000"
                value={accuracySettings.timeout}
                onChange={(e) => setAccuracySettings(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5s</span>
                <span>15s</span>
                <span>30s</span>
              </div>
            </div>

            {/* Cache Age Setting */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Cache Age: {accuracySettings.maximumAge / 60000}min
              </label>
              <input
                type="range"
                min="0"
                max="600000"
                step="60000"
                value={accuracySettings.maximumAge}
                onChange={(e) => setAccuracySettings(prev => ({ ...prev, maximumAge: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0min</span>
                <span>5min</span>
                <span>10min</span>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
            <strong>High Accuracy:</strong> Uses GPS for precise location but may take longer and use more battery.
            <br />
            <strong>Timeout:</strong> How long to wait for location detection.
            <br />
            <strong>Cache Age:</strong> How long to use previously detected location.
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${ambulanceLocation[0]}, ${ambulanceLocation[1]}`);
              showNotification('📋 Copied!', 'Coordinates copied to clipboard', 'info');
            }}
            className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded"
          >
            Copy Coordinates
          </button>
          <button
            onClick={() => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${ambulanceLocation[0]},${ambulanceLocation[1]}`;
              window.open(url, '_blank');
            }}
            className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded"
          >
            Get Directions
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveLocationButton;