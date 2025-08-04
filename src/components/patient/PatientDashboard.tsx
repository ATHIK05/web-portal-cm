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
      // Fetch patient appointments
      const appointments = await PatientFirebaseService.getPatientAppointments(user.uid);
      const upcoming = appointments.filter(apt => {
        const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
        return aptDate > new Date() && apt.status === 'scheduled';
      });
      const completed = appointments.filter(apt => apt.status === 'completed');
      
      setUpcomingAppointments(upcoming.slice(0, 4));
      
      // Fetch available doctors
      const doctors = await PatientFirebaseService.getAvailableDoctors();
      setAvailableDoctors(doctors.slice(0, 3));
      
      // Generate recent activity
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
        unreadMessages: 0 // TODO: Implement message counting
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, loading }: any) => (
    <div className="glass-card rounded-2xl p-6 card-hover animate-fade-in-scale float-animation">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} shadow-xl pulse-glow`}>
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {loading ? (
              <div className="w-16 h-6 glass-card rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold gradient-text">{value}</p>
            )}
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-scale">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            <span className="gradient-text animate-slide-in-up">Welcome back, {patient?.firstName || 'Patient'}</span>
          </h2>
          <p className="text-gray-600 mt-1">Here's your health dashboard overview</p>
        </div>
        <div className="flex items-center space-x-3 animate-slide-in-right">
          <Link
            to="/patient/book-appointment"
            className="btn-success-glass px-6 py-3 flex items-center space-x-2 shadow-xl"
          >
            <Calendar size={16} />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          icon={Calendar}
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          subtitle="Next 30 days"
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Visits"
          value={stats.completedAppointments}
          subtitle="All time"
          color="bg-gradient-to-br from-green-500 to-green-600"
          loading={loading}
        />
        <StatCard
          icon={Users}
          title="Available Doctors"
          value={stats.totalDoctors}
          subtitle="Online now"
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          loading={loading}
        />
        <StatCard
          icon={MessageSquare}
          title="Messages"
          value={stats.unreadMessages}
          subtitle="Unread"
          color="bg-gradient-to-br from-teal-500 to-teal-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="glass-card rounded-2xl p-6 animate-slide-in-up animate-delay-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold gradient-text flex items-center">
              <Calendar className="mr-2" size={20} />
              Upcoming Appointments
            </h3>
            <Link to="/patient/appointments" className="btn-primary-glass text-sm px-4 py-2">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 glass-card rounded-xl animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-4 glass-card rounded"></div>
                    <div>
                      <div className="w-24 h-4 glass-card rounded mb-1"></div>
                      <div className="w-20 h-3 glass-card rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 glass-card rounded-full"></div>
                </div>
              ))}
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-4 glass-card rounded-xl table-row-glass transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                      {new Date(appointment.date).toLocaleDateString()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {appointment.doctorName || 'Unknown Doctor'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {appointment.timeSlot} • {appointment.doctorSpecialty || 'Unknown Specialty'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/patient/chat/${appointment.doctorId}`}
                      className="p-2 text-blue-600 hover:text-blue-800 rounded-xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-110"
                      title="Message Doctor"
                    >
                      <MessageSquare size={16} />
                    </Link>
                    {appointment.type === 'online' && (
                      <Link
                        to={`/patient/video-consultation?doctor=${appointment.doctorId}`}
                        className="p-2 text-green-600 hover:text-green-800 rounded-xl hover:bg-green-50 transition-all duration-300 transform hover:scale-110"
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
            <div className="text-center py-8 glass-card rounded-xl">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4 float-animation" />
              <p className="text-gray-500 mb-2">No upcoming appointments</p>
              <Link
                to="/patient/book-appointment"
                className="btn-primary-glass text-sm px-4 py-2"
              >
                Book your first appointment
              </Link>
            </div>
          )}
        </div>

        {/* Available Doctors */}
        <div className="glass-card rounded-2xl p-6 animate-slide-in-up animate-delay-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold gradient-text flex items-center">
              <Users className="mr-2" size={20} />
              Available Doctors
            </h3>
            <Link to="/patient/doctors" className="btn-primary-glass text-sm px-4 py-2">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 glass-card rounded-xl animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 glass-card rounded-full"></div>
                    <div>
                      <div className="w-24 h-4 glass-card rounded mb-1"></div>
                      <div className="w-20 h-3 glass-card rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 glass-card rounded"></div>
                </div>
              ))}
            </div>
          ) : availableDoctors.length > 0 ? (
            <div className="space-y-3">
              {availableDoctors.map((doctor, index) => (
                <div key={index} className="flex items-center justify-between p-4 glass-card rounded-xl table-row-glass transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg pulse-glow">
                        <User size={18} className="text-white" />
                      </div>
                      {doctor.isCheckedIn && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dr. {doctor.name}</p>
                      <p className="text-xs text-gray-600">
                        {doctor.specializations?.[0]} • {doctor.experience} years
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/patient/book-appointment?doctor=${doctor.id}`}
                      className="btn-success-glass px-4 py-2 text-xs"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 glass-card rounded-xl">
              <Users className="mx-auto h-16 w-16 text-gray-400 mb-4 float-animation" />
              <p className="text-gray-500">No doctors available right now</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-2xl p-6 animate-slide-in-up animate-delay-400">
        <h3 className="text-xl font-semibold gradient-text mb-6 flex items-center">
          <Activity className="mr-2" size={20} />
          Recent Activity
        </h3>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3 p-4 glass-card rounded-xl animate-pulse">
                <div className="w-8 h-8 glass-card rounded-full"></div>
                <div className="flex-1">
                  <div className="w-48 h-4 glass-card rounded mb-1"></div>
                  <div className="w-24 h-3 glass-card rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 glass-card rounded-xl table-row-glass transform hover:scale-105 transition-all duration-300">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                  activity.type === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {activity.type === 'completed' ? (
                    <CheckCircle size={18} className="text-green-600" />
                  ) : (
                    <Calendar size={18} className="text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 glass-card rounded-xl">
            <Activity className="mx-auto h-16 w-16 text-gray-400 mb-4 float-animation" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-up animate-delay-500">
        <Link
          to="/patient/emergency"
          className="glass-card rounded-2xl p-6 hover:bg-red-50/20 transition-all duration-300 transform hover:scale-105 card-hover"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl pulse-glow">
              <AlertCircle size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-red-900">Emergency</p>
              <p className="text-sm text-red-700">Book urgent consultation</p>
            </div>
          </div>
        </Link>

        <Link
          to="/patient/prescriptions"
          className="glass-card rounded-2xl p-6 hover:bg-blue-50/20 transition-all duration-300 transform hover:scale-105 card-hover"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl pulse-glow">
              <FileText size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-blue-900">Prescriptions</p>
              <p className="text-sm text-blue-700">View your prescriptions</p>
            </div>
          </div>
        </Link>

        <Link
          to="/patient/waiting-room"
          className="glass-card rounded-2xl p-6 hover:bg-green-50/20 transition-all duration-300 transform hover:scale-105 card-hover"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl pulse-glow">
              <Video size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-green-900">Waiting Room</p>
              <p className="text-sm text-green-700">Join video consultation</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default PatientDashboard;