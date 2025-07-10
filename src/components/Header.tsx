import React from 'react';
import { User, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { doctor, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Portal</h1>
          <p className="text-sm text-gray-600">Manage your practice efficiently</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell size={20} />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings size={20} />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              {doctor?.photo ? (
                <img 
                  src={doctor.photo} 
                  alt="Doctor" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User size={18} className="text-white" />
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{doctor?.name || 'Doctor'}</p>
              <p className="text-gray-600">{doctor?.specializations?.[0] || 'Specialist'}</p>
            </div>
          </div>
          
          <button 
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;