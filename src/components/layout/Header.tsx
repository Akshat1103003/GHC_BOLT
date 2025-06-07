import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ambulance, Guitar as Hospital, Home } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { emergencyActive } = useAppContext();

  return (
    <header className={`sticky top-0 z-50 ${emergencyActive ? 'bg-red-600' : 'bg-white'} shadow-md transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Ambulance className={`h-8 w-8 ${emergencyActive ? 'text-white' : 'text-red-600'} ${emergencyActive ? 'animate-pulse' : ''}`} />
            <span className={`text-xl font-bold ${emergencyActive ? 'text-white' : 'text-gray-900'}`}>
              TrafficSense
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <NavLink to="/" icon={<Home size={18} />} label="Home" active={location.pathname === '/'} emergencyMode={emergencyActive} />
            <NavLink to="/driver" icon={<Ambulance size={18} />} label="Driver" active={location.pathname === '/driver'} emergencyMode={emergencyActive} />
            <NavLink to="/hospital" icon={<Hospital size={18} />} label="Hospital" active={location.pathname === '/hospital'} emergencyMode={emergencyActive} />
          </nav>

          {emergencyActive && (
            <div className="flex items-center">
              <span className="hidden md:inline-block text-white font-medium mr-2">EMERGENCY ACTIVE</span>
              <span className="inline-flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            </div>
          )}

          {/* Mobile nav */}
          <div className="md:hidden flex items-center space-x-4">
            {emergencyActive && (
              <span className="inline-flex h-3 w-3 relative mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            )}
            <Link to="/" className={`p-2 rounded-full ${location.pathname === '/' ? 'bg-gray-100' : ''} ${emergencyActive ? 'text-white' : 'text-gray-700'}`}>
              <Home size={20} />
            </Link>
            <Link to="/driver" className={`p-2 rounded-full ${location.pathname === '/driver' ? 'bg-gray-100' : ''} ${emergencyActive ? 'text-white' : 'text-gray-700'}`}>
              <Ambulance size={20} />
            </Link>
            <Link to="/hospital" className={`p-2 rounded-full ${location.pathname === '/hospital' ? 'bg-gray-100' : ''} ${emergencyActive ? 'text-white' : 'text-gray-700'}`}>
              <Hospital size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  emergencyMode: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, active, emergencyMode }) => {
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
        active 
          ? emergencyMode ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700' 
          : emergencyMode ? 'text-white hover:bg-red-700' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="mr-2">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export default Header;