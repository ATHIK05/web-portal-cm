import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Activity,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats, useAppointments } from '../hooks/useFirebaseData';
import { FirebaseService } from '../services/firebaseService';
import { Link } from 'react-router-dom';
import { Video, Users as UsersIcon, MessageSquare } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { doctor, user } = useAuth();
  const { stats, loading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { appointments, loading: appointmentsLoading, refetch: refetchAppointments } = useAppointments();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<Map<string, any>>(new Map());
  const [videoConsultationEnabled, setVideoConsultationEnabled] = useState(false);
  const [waitingPatients, setWaitingPatients] = useState<any[]>([]);
  const [patientNames, setPatientNames] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    // Filter today's appointments from all appointments
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayAppts = appointments.filter(apt => {
      const aptDate = apt.date;
      return aptDate >= startOfDay && aptDate <= endOfDay;
    });
    
    setTodayAppointments(todayAppts);
  }, [appointments]);

  useEffect(() => {
    // Generate recent activity from appointments
    if (todayAppointments.length > 0) {
      const activity = todayAppointments.slice(0, 4).map(apt => ({
        patient: apt.patientName && apt.patientName !== 'Unknown Patient'
  ? apt.patientName
  : patientNames[apt.patientId] || 'Unknown Patient',
        action: apt.status === 'completed' ? 'Consultation completed' : 
                apt.status === 'scheduled' ? 'Appointment scheduled' : 'Status updated',
        time: new Date(apt.date).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: apt.status === 'completed' ? 'success' : 
                apt.status === 'scheduled' ? 'pending' : 'info'
      }));
      setRecentActivity(activity);
    }
  }, [todayAppointments]);

  // Fetch patient names for today's appointments and recent appointments
  useEffect(() => {
    const fetchNames = async () => {
      const ids = new Set<string>();
      todayAppointments.forEach(apt => {
        if (apt.patientId) ids.add(apt.patientId);
      });
      appointments.slice(0, 3).forEach(apt => {
        if (apt.patientId) ids.add(apt.patientId);
      });

      const names: { [id: string]: string } = {};
      await Promise.all(Array.from(ids).map(async id => {
        const patient = await FirebaseService.getPatientById(id);
        if (patient) {
          names[id] = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
        } else {
          names[id] = 'Unknown Patient';
        }
      }));
      setPatientNames(names);
    };

    if (todayAppointments.length > 0 || appointments.length > 0) {
      fetchNames();
    }
  }, [todayAppointments, appointments]);

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

  const RecentActivity = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      {appointmentsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center space-x-3 p-3">
              <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : recentActivity.length > 0 ? (
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-500' :
                activity.status === 'info' ? 'bg-blue-500' :
                activity.status === 'warning' ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.patient}</p>
                <p className="text-xs text-gray-600">{activity.action}</p>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
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
  );

  const TodaySchedule = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
      {appointmentsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : todayAppointments.length > 0 ? (
        <div className="space-y-3">
          {todayAppointments.slice(0, 4).map((appointment, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-gray-900">
                  {new Date(appointment.date).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {(appointment.patientName && appointment.patientName !== 'Unknown Patient')
                      ? appointment.patientName
                      : patientNames[appointment.patientId] || 'Unknown Patient'}
                  </p>
                  <p className="text-xs text-gray-600">{appointment.reason || appointment.type || 'Consultation'}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {appointment.status || 'scheduled'}
              </span>
            </div>
          ))}
          {todayAppointments.length > 4 && (
            <div className="text-center pt-2">
              <button 
                onClick={() => window.location.href = '/appointments'}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all {todayAppointments.length} appointments
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-2">No appointments scheduled for today</p>
          {appointments.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Recent appointments:</p>
              <div className="space-y-2">
                {appointments.slice(0, 3).map((appointment, index) => (
                  <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                    {(appointment.patientName && appointment.patientName !== 'Unknown Patient')
                      ? appointment.patientName
                      : patientNames[appointment.patientId] || 'Unknown Patient'} - {new Date(appointment.date).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, Dr. {doctor?.name || 'Doctor'}</h2>
          <p className="text-gray-600 mt-1">Here's what's happening with your practice today</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            doctor?.isCheckedIn ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              doctor?.isCheckedIn ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {doctor?.isCheckedIn ? 'Checked In' : 'Not Checked In'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Calendar}
          title="Today's Appointments"
          value={stats.todayAppointments}
          subtitle={`${stats.pendingAppointments} pending`}
          color="bg-blue-500"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Consultations"
          value={stats.completedConsultations}
          subtitle="Today"
          color="bg-green-500"
          loading={statsLoading}
        />
        <StatCard
          icon={Users}
          title="Total Patients"
          value={stats.totalPatients}
          subtitle="Active records"
          color="bg-purple-500"
          loading={statsLoading}
        />
        <StatCard
          icon={DollarSign}
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          subtitle="This month"
          color="bg-teal-500"
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodaySchedule />
        <RecentActivity />
      </div>

      {/* Video Consultation Section */}
      {videoConsultationEnabled && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Video Consultation Center</h3>
            <div className="flex space-x-2">
              <Link
                to="/waiting-room"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <UsersIcon size={16} />
                <span>Waiting Room ({waitingPatients.length})</span>
              </Link>
              <Link
                to="/video-consultation"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Video size={16} />
                <span>Start Consultation</span>
              </Link>
            </div>
          </div>
          
          {waitingPatients.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">Patients waiting for video consultation:</p>
              {waitingPatients.slice(0, 3).map((patient, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                      <UsersIcon size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-600">Waiting since {patient.waitingSince}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/chat/${patient.id}`}
                      className="p-2 text-blue-600 hover:text-blue-800 rounded"
                      title="Chat with patient"
                    >
                      <MessageSquare size={16} />
                    </Link>
                    <Link
                      to={`/video-consultation?patient=${patient.id}`}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Start Call
                    </Link>
                  </div>
                </div>
              ))}
              {waitingPatients.length > 3 && (
                <div className="text-center">
                  <Link
                    to="/waiting-room"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all {waitingPatients.length} waiting patients
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No patients waiting for video consultation</p>
              <p className="text-sm text-gray-400">Patients can join the waiting room when you're available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;