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

const PatientDashboard: React.FC = () => {
  const { patient, user } = usePatientAuth();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalDoctors: 0,
    unreadMessages: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
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
        const aptDate = new Date(apt.date);
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
          ? `Consultation completed with Dr. ${apt.doctorName}` 
          : `Appointment scheduled with Dr. ${apt.doctorName}`,
        time: new Date(apt.date).toLocaleDateString(),
        doctorName: apt.doctorName
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {loading ? (
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            )}
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {patient?.firstName || 'Patient'}
          </h2>
          <p className="text-gray-600 mt-1">Here's your health dashboard overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/patient/book-appointment"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
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
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Visits"
          value={stats.completedAppointments}
          subtitle="All time"
          color="bg-green-500"
          loading={loading}
        />
        <StatCard
          icon={Users}
          title="Available Doctors"
          value={stats.totalDoctors}
          subtitle="Online now"
          color="bg-purple-500"
          loading={loading}
        />
        <StatCard
          icon={MessageSquare}
          title="Messages"
          value={stats.unreadMessages}
          subtitle="Unread"
          color="bg-teal-500"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
            <Link to="/patient/appointments" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    <div>
                      <div className="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(appointment.date).toLocaleDateString()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {appointment.doctorName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {appointment.timeSlot} • {appointment.doctorSpecialty}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/patient/chat/${appointment.doctorId}`}
                      className="p-1 text-blue-600 hover:text-blue-800 rounded"
                      title="Message Doctor"
                    >
                      <MessageSquare size={16} />
                    </Link>
                    {appointment.type === 'online' && (
                      <Link
                        to={`/patient/video-consultation?doctor=${appointment.doctorId}`}
                        className="p-1 text-green-600 hover:text-green-800 rounded"
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
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No upcoming appointments</p>
              <Link
                to="/patient/book-appointment"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Book your first appointment
              </Link>
            </div>
          )}
        </div>

        {/* Available Doctors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Available Doctors</h3>
            <Link to="/patient/doctors" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : availableDoctors.length > 0 ? (
            <div className="space-y-3">
              {availableDoctors.map((doctor, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-blue-600" />
                      </div>
                      {doctor.isCheckedIn && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
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
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No doctors available right now</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="w-48 h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {activity.type === 'completed' ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <Calendar size={16} className="text-blue-600" />
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
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/patient/emergency"
          className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-900">Emergency</p>
              <p className="text-sm text-red-700">Book urgent consultation</p>
            </div>
          </div>
        </Link>

        <Link
          to="/patient/prescriptions"
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Prescriptions</p>
              <p className="text-sm text-blue-700">View your prescriptions</p>
            </div>
          </div>
        </Link>

        <Link
          to="/patient/waiting-room"
          className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Video size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">Waiting Room</p>
              <p className="text-sm text-green-700">Join video consultation</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default PatientDashboard;