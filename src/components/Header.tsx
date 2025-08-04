import React from 'react';
import { User, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { doctor, signOut } = useAuth();

  return (
    <header className="header-glass shadow-xl animate-slide-in-up">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Doctor Portal</h1>
          <p className="text-sm text-gray-600">Manage your practice efficiently</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-3 text-gray-400 hover:text-gray-600 transition-all duration-300 hover:bg-white/10 rounded-xl transform hover:scale-110">
            <Bell size={20} />
          </button>
          
          <button className="p-3 text-gray-400 hover:text-gray-600 transition-all duration-300 hover:bg-white/10 rounded-xl transform hover:scale-110">
            <Settings size={20} />
          </button>
          
          <div className="flex items-center space-x-3 glass-card px-4 py-2 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg pulse-glow">
              {doctor?.photo ? (
                <img 
                  src={doctor.photo} 
                  alt="Doctor" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{doctor?.name || 'Doctor'}</p>
              <p className="text-gray-600">{doctor?.specializations?.[0] || 'Specialist'}</p>
            </div>
          </div>
          
          <button 
            onClick={signOut}
            className="p-3 text-gray-400 hover:text-red-600 transition-all duration-300 hover:bg-red-50/10 rounded-xl transform hover:scale-110"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;