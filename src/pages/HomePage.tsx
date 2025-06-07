import React from 'react';
import { Link } from 'react-router-dom';
import { Ambulance, Guitar as Hospital, Map, Activity, ArrowRight, Shield, Clock, Users, Database, Wifi } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const HomePage: React.FC = () => {
  const { dataSource } = useAppContext();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Data Source Banner */}
      <div className={`mb-6 p-4 rounded-lg border ${
        dataSource === 'supabase' 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center justify-center">
          {dataSource === 'supabase' ? (
            <>
              <Database className="mr-2 text-green-600\" size={20} />
              <span className="text-green-800 font-medium">
                Connected to Live Database - Real-time synchronization active
              </span>
            </>
          ) : (
            <>
              <Wifi className="mr-2 text-yellow-600" size={20} />
              <span className="text-yellow-800 font-medium">
                Using Mock Data - Simulated real-time functionality
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section className="mb-12">
        <div className="relative bg-gradient-to-r from-red-600 to-red-800 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3656773/pexels-photo-3656773.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center opacity-20"></div>
          <div className="relative py-12 px-6 md:py-20 md:px-12 lg:px-16 flex flex-col items-center text-center text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              AI-Powered Emergency Response System
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mb-8">
              Creating green corridors for ambulances by intelligently communicating with traffic signals and hospitals
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/driver" className="bg-white text-red-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg shadow-md transition-colors flex items-center">
                <Ambulance className="mr-2" size={20} />
                Driver Dashboard
              </Link>
              <Link to="/hospital" className="bg-red-700 hover:bg-red-800 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-colors flex items-center">
                <Hospital className="mr-2" size={20} />
                Hospital Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Map className="h-10 w-10 text-blue-500" />,
              title: "Real-time Location Tracking",
              description: "Track ambulance location and calculate the optimal route to the hospital."
            },
            {
              icon: <Activity className="h-10 w-10 text-green-500" />,
              title: "Traffic Signal Communication",
              description: "Automatically notify traffic signals of approaching ambulances to create a green corridor."
            },
            {
              icon: <Hospital className="h-10 w-10 text-red-500" />,
              title: "Hospital Notification",
              description: "Alert hospitals about incoming patients so medical teams can prepare in advance."
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-12 bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">How It Works</h2>
        <div className="space-y-8">
          {[
            {
              icon: <Users className="h-8 w-8 text-blue-500" />,
              title: "1. Enter Destination Hospital",
              description: "The ambulance driver or paramedic selects the destination hospital based on patient needs."
            },
            {
              icon: <Map className="h-8 w-8 text-blue-500" />,
              title: "2. Optimal Route Generation",
              description: "The system calculates the fastest route considering current traffic conditions."
            },
            {
              icon: <Activity className="h-8 w-8 text-blue-500" />,
              title: "3. Traffic Signal Communication",
              description: "As the ambulance approaches, traffic signals receive notifications to clear the route."
            },
            {
              icon: <Hospital className="h-8 w-8 text-blue-500" />,
              title: "4. Hospital Preparation",
              description: "The destination hospital receives real-time updates on patient status and ETA."
            }
          ].map((step, index) => (
            <div key={index} className="flex">
              <div className="flex-shrink-0 flex items-start pt-1">
                <div className="h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center">
                  {step.icon}
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="mb-12">
        <div className="bg-blue-600 rounded-xl overflow-hidden">
          <div className="px-6 py-12 md:px-12 text-center md:text-left md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Ready to see it in action?</h2>
              <p className="text-blue-100">Try our interactive simulation to experience the system firsthand.</p>
            </div>
            <div className="mt-6 md:mt-0">
              <Link to="/simulation" className="inline-flex items-center bg-white text-blue-600 hover:bg-blue-50 font-medium py-3 px-6 rounded-lg shadow-md transition-colors">
                Try Simulation
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Benefits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Clock className="h-6 w-6 text-purple-500" />,
              title: "Reduced Response Time",
              description: "Get patients to hospitals faster with optimized routes and traffic management."
            },
            {
              icon: <Shield className="h-6 w-6 text-green-500" />,
              title: "Increased Survival Rate",
              description: "Every minute counts in emergencies. Faster arrivals save lives."
            },
            {
              icon: <Activity className="h-6 w-6 text-red-500" />,
              title: "Better Resource Planning",
              description: "Hospitals can prepare the right resources before patient arrival."
            },
            {
              icon: <Users className="h-6 w-6 text-blue-500" />,
              title: "Reduced Traffic Disruption",
              description: "Smart traffic management minimizes overall congestion."
            }
          ].map((benefit, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="inline-flex items-center justify-center p-2 bg-gray-50 rounded-lg mb-3">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;