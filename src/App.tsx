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

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Google Maps API Key Required</h1>
          <p className="text-gray-600 mb-4">
            Please add your Google Maps API key to the .env file:
          </p>
          <code className="bg-gray-100 px-4 py-2 rounded text-sm">
            VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
          </code>
          <p className="text-sm text-gray-500 mt-4">
            Get your API key from the{' '}
            <a 
              href="https://console.cloud.google.com/google/maps-apis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
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