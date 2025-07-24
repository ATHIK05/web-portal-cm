import React from 'react';
import { User, Bell, Settings, LogOut } from 'lucide-react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { useNavigate } from 'react-router-dom';

const PatientHeader: React.FC = () => {
  const { patient, signOut } = usePatientAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/patient/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
          <p className="text-sm text-gray-600">Manage your health and appointments</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell size={20} />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings size={20} />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {patient?.firstName ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
              </p>
              <p className="text-gray-600">Patient ID: {patient?.id?.substring(0, 8)}...</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default PatientHeader;