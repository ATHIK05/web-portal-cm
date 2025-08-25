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
  Download,
  Stethoscope
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
    <aside className="w-64 sidebar">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Stethoscope size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">MediCare</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Doctor Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
              >
                <item.icon size={18} />
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