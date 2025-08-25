import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Activity,
  MessageSquare,
  Video,
  FileText,
  AlertCircle,
  CheckCircle,
  Users,
  Phone
} from 'lucide-react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { PatientFirebaseService } from '../../services/patientFirebaseService';
import { Link } from 'react-router-dom';
import { Appointment } from '../../types';

const PatientDashboard: React.FC = () => {
  const { patient, user } = usePatientAuth();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalDoctors: 0,
    unreadMessages: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ type: string; message: string; time: string; doctorName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const appointments = await PatientFirebaseService.getPatientAppointments(user.uid);
      const upcoming = appointments.filter(apt => {
        const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
        return aptDate > new Date() && apt.status === 'scheduled';
      });
      const completed = appointments.filter(apt => apt.status === 'completed');
      
      setUpcomingAppointments(upcoming.slice(0, 4));
      
      const doctors = await PatientFirebaseService.getAvailableDoctors();
      setAvailableDoctors(doctors.slice(0, 3));
      
      const activity = appointments.slice(0, 4).map(apt => ({
        type: apt.status === 'completed' ? 'completed' : 'scheduled',
        message: apt.status === 'completed' 
          ? `Consultation completed with Dr. ${apt.doctorName || 'Unknown Doctor'}` 
          : `Appointment scheduled with Dr. ${apt.doctorName || 'Unknown Doctor'}`,
        time: new Date(apt.date).toLocaleDateString(),
        doctorName: apt.doctorName || 'Unknown Doctor',
      }));
      
      setRecentActivity(activity);
      
      setStats({
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        totalDoctors: doctors.length,
        unreadMessages: 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, loading }: any) => (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          )}
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {patient?.firstName || 'Patient'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Here's your health dashboard overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/patient/book-appointment"
            className="btn-success flex items-center space-x-2"
          >
            <Calendar size={16} />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Calendar}
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          subtitle="Next 30 days"
          color="bg-blue-600"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Visits"
          value={stats.completedAppointments}
          subtitle="All time"
          color="bg-green-600"
          loading={loading}
        />
        <StatCard
          icon={Users}
          title="Available Doctors"
          value={stats.totalDoctors}
          subtitle="Online now"
          color="bg-purple-600"
          loading={loading}
        />
        <StatCard
          icon={MessageSquare}
          title="Messages"
          value={stats.unreadMessages}
          subtitle="Unread"
          color="bg-teal-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Calendar className="mr-2" size={20} />
              Upcoming Appointments
            </h3>
            <Link to="/patient/appointments" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div>
                      <div className="w-24 h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                      <div className="w-20 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-lg">
                      {new Date(appointment.date).toLocaleDateString()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Dr. {appointment.doctorName || 'Unknown Doctor'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {appointment.timeSlot} • {appointment.doctorSpecialty || 'Unknown Specialty'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/patient/messages`}
                      className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Message Doctor"
                    >
                      <MessageSquare size={16} />
                    </Link>
                    {appointment.type === 'online' && (
                      <Link
                        to={`/patient/waiting-room`}
                        className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Join Video Call"
                      >
                        <Video size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No upcoming appointments</p>
              <Link
                to="/patient/book-appointment"
                className="btn-primary text-sm"
              >
                Book your first appointment
              </Link>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Users className="mr-2" size={20} />
              Available Doctors
            </h3>
            <Link to="/patient/doctors" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                    <div>
                      <div className="w-24 h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                      <div className="w-20 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : availableDoctors.length > 0 ? (
            <div className="space-y-3">
              {availableDoctors.map((doctor, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      {doctor.isCheckedIn && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Dr. {doctor.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {doctor.specializations?.[0] || 'General'} • {doctor.experience || 0} years
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{doctor.phone || 'Contact via portal'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/patient/book-appointment?doctor=${doctor.id}`}
                      className="btn-success text-xs px-3 py-1"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No doctors available right now</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/patient/emergency"
          className="card p-6 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <AlertCircle size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-red-900 dark:text-red-400">Emergency</p>
              <p className="text-sm text-red-700 dark:text-red-500">Book urgent consultation</p>
            </div>
          </div>
        </Link>

        <Link
          to="/patient/prescriptions"
          className="card p-6 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-blue-900 dark:text-blue-400">Prescriptions</p>
              <p className="text-sm text-blue-700 dark:text-blue-500">View your prescriptions</p>
            </div>
          </div>
        </Link>

        <Link
          to="/patient/waiting-room"
          className="card p-6 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Video size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-green-900 dark:text-green-400">Waiting Room</p>
              <p className="text-sm text-green-700 dark:text-green-500">Join video consultation</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default PatientDashboard;