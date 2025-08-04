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
    <header className="header-glass shadow-xl animate-slide-in-up">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Patient Portal</h1>
          <p className="text-sm text-gray-600">Manage your health and appointments</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-3 text-gray-400 hover:text-gray-600 transition-all duration-300 hover:bg-white/10 rounded-xl transform hover:scale-110">
            <Bell size={20} />
          </button>
          
          <button className="p-3 text-gray-400 hover:text-gray-600 transition-all duration-300 hover:bg-white/10 rounded-xl transform hover:scale-110">
            <Settings size={20} />
          </button>
          
          <div className="flex items-center space-x-3 glass-card px-4 py-2 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg pulse-glow">
              <User size={20} className="text-white" />
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
            className="p-3 text-gray-400 hover:text-red-600 transition-all duration-300 hover:bg-red-50/10 rounded-xl transform hover:scale-110"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default PatientHeader;