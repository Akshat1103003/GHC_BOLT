import React, { useState, useEffect } from 'react';
import { Ambulance, Clock, CheckCircle, Users, AlarmClock } from 'lucide-react';
import NotificationPanel from '../components/notifications/NotificationPanel';
import StatusCard from '../components/dashboard/StatusCard';
import { useAppContext } from '../contexts/AppContext';

const HospitalDashboard: React.FC = () => {
  const { hospitals, notifications, markNotificationAsRead, isLoading } = useAppContext();
  
  // In a real app, this would be determined by authentication
  const hospitalId = 'h1'; 
  const hospital = hospitals.find(h => h.id === hospitalId);
  
  const [preparationStatus, setPreparationStatus] = useState({
    status: 'info',
    message: 'No incoming ambulances',
    progress: 0,
  });
  
  const [incomingAmbulances, setIncomingAmbulances] = useState([
    {
      id: 'amb-123',
      patientCondition: 'Cardiac Arrest',
      eta: 8, // minutes
      distance: 3.2, // km
      priority: 'high',
    },
  ]);
  
  const [staffStatus, setStaffStatus] = useState([
    { role: 'Emergency Physician', status: 'available', name: 'Dr. Sarah Johnson' },
    { role: 'Trauma Nurse', status: 'available', name: 'Robert Chen' },
    { role: 'Anesthesiologist', status: 'busy', name: 'Dr. Michael Brown' },
    { role: 'Surgeon', status: 'on-call', name: 'Dr. Lisa Rodriguez' },
  ]);
  
  const [equipmentStatus, setEquipmentStatus] = useState([
    { name: 'Trauma Room 1', status: 'available' },
    { name: 'Cardiac Monitor', status: 'available' },
    { name: 'Ventilator', status: 'in-use' },
    { name: 'CT Scanner', status: 'available' },
  ]);

  // Filter notifications for this hospital
  const hospitalNotifications = notifications.filter(n => n.targetId === hospitalId);

  // Update preparation status based on incoming ambulances
  useEffect(() => {
    if (incomingAmbulances.length > 0) {
      const highPriorityAmbulances = incomingAmbulances.filter(a => a.priority === 'high');
      
      if (highPriorityAmbulances.length > 0) {
        // There's a high priority incoming ambulance
        setPreparationStatus({
          status: 'warning',
          message: 'High priority ambulance incoming',
          progress: 60,
        });
      } else {
        // Regular priority ambulances
        setPreparationStatus({
          status: 'info',
          message: `${incomingAmbulances.length} ambulance(s) incoming`,
          progress: 30,
        });
      }
    } else {
      // No incoming ambulances
      setPreparationStatus({
        status: 'info',
        message: 'No incoming ambulances',
        progress: 0,
      });
    }
  }, [incomingAmbulances]);

  // Update staff availability
  const toggleStaffStatus = (index: number) => {
    setStaffStatus(
      staffStatus.map((staff, i) => {
        if (i === index) {
          const newStatus = staff.status === 'available' ? 'busy' : 'available';
          return { ...staff, status: newStatus };
        }
        return staff;
      })
    );
  };

  // Update equipment status
  const toggleEquipmentStatus = (index: number) => {
    setEquipmentStatus(
      equipmentStatus.map((equipment, i) => {
        if (i === index) {
          const newStatus = equipment.status === 'available' ? 'in-use' : 'available';
          return { ...equipment, status: newStatus };
        }
        return equipment;
      })
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{hospital?.name} Dashboard</h1>
          <p className="text-gray-600">{hospital?.address}</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button 
            className={`px-4 py-2 rounded-md font-medium ${
              hospital?.emergencyReady 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            {hospital?.emergencyReady ? 'Emergency Ready' : 'Limited Capacity'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Status and Staff */}
        <div className="space-y-6">
          {/* Emergency Preparation Status */}
          <StatusCard
            title="Emergency Preparation Status"
            status={preparationStatus.status as any}
            message={preparationStatus.message}
            icon={<CheckCircle size={20} />}
            progress={preparationStatus.progress}
          />

          {/* Staff Status */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Users className="mr-2" size={18} />
                Staff Status
              </h2>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {staffStatus.map((staff, index) => (
                <li key={index} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{staff.role}</p>
                    <p className="text-sm text-gray-600">{staff.name}</p>
                  </div>
                  <button
                    onClick={() => toggleStaffStatus(index)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      staff.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : staff.status === 'busy'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {staff.status === 'available' ? 'Available' : 
                     staff.status === 'busy' ? 'Busy' : 'On Call'}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Equipment Status */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Equipment Status</h2>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {equipmentStatus.map((equipment, index) => (
                <li key={index} className="p-4 flex justify-between items-center">
                  <p className="font-medium text-gray-800">{equipment.name}</p>
                  <button
                    onClick={() => toggleEquipmentStatus(index)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      equipment.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {equipment.status === 'available' ? 'Available' : 'In Use'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Middle and right columns - Incoming Ambulances and Notifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incoming Ambulances */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Ambulance className="mr-2" size={18} />
                Incoming Ambulances
              </h2>
            </div>
            
            {incomingAmbulances.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Ambulance className="mx-auto mb-3 text-gray-400" size={24} />
                <p>No incoming ambulances at this time</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {incomingAmbulances.map((ambulance, index) => (
                  <div key={index} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          Ambulance #{ambulance.id}
                          {ambulance.priority === 'high' && (
                            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              High Priority
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-600 mt-1">{ambulance.patientCondition}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 flex items-center justify-end">
                          <Clock className="mr-1" size={20} />
                          {ambulance.eta} min
                        </div>
                        <p className="text-sm text-gray-500">{ambulance.distance.toFixed(1)} km away</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full bg-blue-600" 
                          style={{ width: `${100 - (ambulance.eta / 15) * 100}%` }}
                        ></div>
                      </div>
                      
                      {/* Preparation steps */}
                      <div className="mt-5 grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <div className="h-8 w-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center mx-auto">
                            <CheckCircle size={16} />
                          </div>
                          <p className="text-xs mt-1">Notified</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="h-8 w-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center mx-auto">
                            <CheckCircle size={16} />
                          </div>
                          <p className="text-xs mt-1">Room Prep</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
                            <AlarmClock size={16} />
                          </div>
                          <p className="text-xs mt-1">Team Assem.</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                            <CheckCircle size={16} />
                          </div>
                          <p className="text-xs mt-1">Ready</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationPanel
            notifications={hospitalNotifications}
            onMarkAsRead={markNotificationAsRead}
          />
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;