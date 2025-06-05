import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import DriverDashboard from './pages/DriverDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import SimulationPage from './pages/SimulationPage';

function App() {
  return (
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
  );
}

export default App;