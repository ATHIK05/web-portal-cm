import React from 'react';
import { User, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { doctor, signOut } = useAuth();

  return (
    <header className="header">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Portal</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your practice efficiently</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Bell size={20} />
          </button>
          
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Settings size={20} />
          </button>
          
          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              {doctor?.photo ? (
                <img 
                  src={doctor.photo} 
                  alt="Doctor" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User size={16} className="text-white" />
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">{doctor?.name || 'Doctor'}</p>
              <p className="text-gray-600 dark:text-gray-400">{doctor?.specializations?.[0] || 'Specialist'}</p>
            </div>
          </div>
          
          <button 
            onClick={signOut}
            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;