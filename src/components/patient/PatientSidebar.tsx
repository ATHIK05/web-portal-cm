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
  Pill
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
    { icon: User, label: 'My Profile', path: '/patient/profile' },
    { icon: Settings, label: 'Settings', path: '/patient/settings' },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">MediCare Patient</span>
        </div>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-green-50 text-green-700 border-r-2 border-green-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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