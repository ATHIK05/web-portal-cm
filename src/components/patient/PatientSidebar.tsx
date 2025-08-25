import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  Clock,
  User,
  CreditCard,
  MessageSquare,
  Video,
  AlertCircle,
  Pill,
  Heart
} from 'lucide-react';

const PatientSidebar: React.FC = () => {
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/patient/dashboard' },
    { icon: Calendar, label: 'My Appointments', path: '/patient/appointments' },
    { icon: Calendar, label: 'Book Appointment', path: '/patient/book-appointment' },
    { icon: Users, label: 'Find Doctors', path: '/patient/doctors' },
    { icon: Pill, label: 'Prescriptions', path: '/patient/prescriptions' },
    { icon: CreditCard, label: 'Bills & Payments', path: '/patient/bills' },
    { icon: MessageSquare, label: 'Messages', path: '/patient/messages' },
    { icon: Video, label: 'Waiting Room', path: '/patient/waiting-room' },
    { icon: AlertCircle, label: 'Emergency', path: '/patient/emergency' },
    { icon: Settings, label: 'Settings', path: '/patient/settings' },
  ];

  return (
    <aside className="w-64 sidebar">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Heart size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">MediCare</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Patient Portal</p>
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
                      ? 'bg-green-50 text-green-700 border-r-4 border-green-600 dark:bg-green-900/20 dark:text-green-400'
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

export default PatientSidebar;