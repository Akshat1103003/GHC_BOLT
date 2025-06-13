import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AppProvider } from './contexts/AppContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import DriverDashboard from './pages/DriverDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import SimulationPage from './pages/SimulationPage';

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if API key exists and is not placeholder
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      setIsLoading(false);
      return;
    }

    // Simple validation - just check if key exists and looks valid
    if (apiKey.length < 20) {
      setApiError('Invalid API key format. Please check your Google Maps API key.');
      setIsLoading(false);
      return;
    }

    // Let the APIProvider handle the actual API key validation
    setIsLoading(false);
  }, [apiKey]);

  const handleGoogleMapsError = (error: any) => {
    console.error('Google Maps API Provider Error:', error);
    setApiError('Google Maps API failed to initialize. Please check your API key and enabled APIs.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {apiError ? 'Google Maps API Error' : 'Google Maps API Key Required'}
          </h1>
          
          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Details</h2>
              <p className="text-red-800 text-sm">{apiError}</p>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Quick Setup for Localhost Development</h2>
            
            <div className="text-left space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Step 1: Get Your API Key</h3>
                <p className="text-blue-800 text-sm mb-2">
                  Go to the Google Cloud Console and create an API key:
                </p>
                <a 
                  href="https://console.cloud.google.com/google/maps-apis" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Open Google Cloud Console
                </a>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                <h3 className="font-semibold text-red-900 mb-2">Step 2: Enable Billing (REQUIRED)</h3>
                <p className="text-red-800 text-sm mb-2">
                  <strong>Critical:</strong> Google Maps API requires billing to be enabled, even for development.
                </p>
                <ul className="text-red-800 text-sm list-disc list-inside space-y-1 mb-3">
                  <li>Go to <strong>Billing</strong> in the Google Cloud Console</li>
                  <li>Link a billing account to your project</li>
                  <li>Google provides $200 free credits monthly for Maps API</li>
                  <li>Development usage typically stays within free tier</li>
                </ul>
                <a 
                  href="https://console.cloud.google.com/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Set Up Billing
                </a>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Step 3: Enable Required APIs</h3>
                <p className="text-green-800 text-sm mb-3">
                  <strong>CRITICAL:</strong> You must enable these specific APIs for the application to work:
                </p>
                <div className="space-y-2 mb-3">
                  <div className="bg-white p-2 rounded border">
                    <p className="font-medium text-green-900">Maps JavaScript API</p>
                    <a 
                      href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      Enable Maps JavaScript API →
                    </a>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <p className="font-medium text-green-900">Places API (New)</p>
                    <a 
                      href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      Enable Places API (New) →
                    </a>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <p className="font-medium text-green-900">Geocoding API</p>
                    <a 
                      href="https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      Enable Geocoding API →
                    </a>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <p className="font-medium text-green-900">Directions API</p>
                    <a 
                      href="https://console.cloud.google.com/apis/library/directions-backend.googleapis.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      Enable Directions API →
                    </a>
                  </div>
                </div>
                <div className="bg-green-100 p-2 rounded">
                  <p className="text-xs text-green-800">
                    <strong>Quick Enable All:</strong> Go to APIs & Services → Library, search for each API above and click "Enable"
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">Step 4: Configure for Localhost</h3>
                <p className="text-yellow-800 text-sm mb-2">
                  For development, you can either:
                </p>
                <ul className="text-yellow-800 text-sm list-disc list-inside space-y-1">
                  <li>Leave the API key unrestricted (easiest for development)</li>
                  <li>Or restrict to HTTP referrers: <code className="bg-yellow-200 px-1 rounded">http://localhost:*</code></li>
                </ul>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Step 5: Add to .env File</h3>
                <p className="text-purple-800 text-sm mb-2">
                  Update your .env file with your API key:
                </p>
                <code className="block bg-gray-800 text-green-400 p-3 rounded text-sm font-mono">
                  VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
                </code>
                <p className="text-purple-800 text-xs mt-2">
                  <strong>Note:</strong> Restart your development server after updating the .env file
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-amber-900 mb-2">⚠️ Common Error Fix</h3>
            <div className="text-amber-800 text-sm space-y-2">
              <p>If you see "legacy API" errors, make sure you've enabled:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Places API (New)</strong> - NOT the old Places API</li>
                <li><strong>Geocoding API</strong> - For address search</li>
                <li><strong>Directions API</strong> - For route calculation</li>
                <li><strong>Maps JavaScript API</strong> - For map display</li>
              </ul>
              <p className="font-medium">All four APIs must be enabled for the app to work!</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Important Notes</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Billing is required even for free tier usage</li>
              <li>• Google provides $200 monthly credit for Maps API</li>
              <li>• Development usage typically costs $0</li>
              <li>• You can set up billing alerts to monitor usage</li>
              <li>• Enable all 4 APIs listed above to avoid errors</li>
              <li>• Restart your dev server after updating .env file</li>
            </ul>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>No domain required!</strong> You can use localhost for development.
            </p>
            <p>
              The Google Maps API works perfectly with local development environments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider 
      apiKey={apiKey}
      onLoad={() => console.log('Google Maps API loaded successfully')}
      onError={handleGoogleMapsError}
    >
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="driver" element={<DriverDashboard />} />
              <Route path="hospital" element={<HospitalDashboard />} />
              <Route path="simulation" element={<SimulationPage />} />
            </Route>
          </Routes>
        </Router>
      </AppProvider>
    </APIProvider>
  );
}

export default App;