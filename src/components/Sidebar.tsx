import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  BarChart3, 
  Clock,
  User,
  Download
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Clock, label: 'Check-In', path: '/checkin' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: FileText, label: 'Consultations', path: '/consultations' },
    { icon: Download, label: 'Reports', path: '/reports' },
    { icon: Users, label: 'Waiting Room', path: '/waiting-room' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="w-64 sidebar-glass shadow-2xl animate-slide-in-right">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg pulse-glow">
            <User size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">MediCare</span>
        </div>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-700 border-r-4 border-blue-500 shadow-lg backdrop-blur-sm'
                      : 'text-gray-700 hover:bg-white/10 hover:text-gray-900 hover:shadow-md'
                  }`
                }
              >
                <item.icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;