import React from 'react';
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

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Google Maps API Key Required</h1>
          
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
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Step 2: Enable Maps JavaScript API</h3>
                <p className="text-green-800 text-sm">
                  In the Google Cloud Console, make sure to enable the "Maps JavaScript API" for your project.
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">Step 3: Configure for Localhost</h3>
                <p className="text-yellow-800 text-sm mb-2">
                  For development, you can either:
                </p>
                <ul className="text-yellow-800 text-sm list-disc list-inside space-y-1">
                  <li>Leave the API key unrestricted (easiest for development)</li>
                  <li>Or restrict to HTTP referrers: <code className="bg-yellow-200 px-1 rounded">http://localhost:*</code></li>
                </ul>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Step 4: Add to .env File</h3>
                <p className="text-purple-800 text-sm mb-2">
                  Update your .env file with your API key:
                </p>
                <code className="block bg-gray-800 text-green-400 p-3 rounded text-sm font-mono">
                  VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
                </code>
              </div>
            </div>
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
    <APIProvider apiKey={apiKey}>
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