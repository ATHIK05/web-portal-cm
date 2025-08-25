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

const Dashboard: React.FC = () => {
  const { doctor, user } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [patientNames, setPatientNames] = useState<{ [id: string]: string }>({});

  useEffect(() => {
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
    const fetchNames = async () => {
      const ids = new Set<string>();
      todayAppointments.forEach(apt => {
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

    if (todayAppointments.length > 0) {
      fetchNames();
    }
  }, [todayAppointments]);

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
            Welcome back, Dr. {doctor?.name || 'Doctor'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Here's what's happening with your practice today</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            doctor?.isCheckedIn 
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
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
          color="bg-blue-600"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Consultations"
          value={stats.completedConsultations}
          subtitle="Today"
          color="bg-green-600"
          loading={statsLoading}
        />
        <StatCard
          icon={Users}
          title="Total Patients"
          value={stats.totalPatients}
          subtitle="Active records"
          color="bg-purple-600"
          loading={statsLoading}
        />
        <StatCard
          icon={DollarSign}
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          subtitle="This month"
          color="bg-teal-600"
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="mr-2" size={20} />
            Today's Schedule
          </h3>
          {appointmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
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
          ) : todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.slice(0, 4).map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                      {new Date(appointment.date).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {(appointment.patientName && appointment.patientName !== 'Unknown Patient')
                          ? appointment.patientName
                          : patientNames[appointment.patientId] || 'Unknown Patient'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{appointment.reason || appointment.type || 'Consultation'}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    appointment.status === 'completed' ? 'badge-success' : 
                    appointment.status === 'scheduled' ? 'badge-warning' :
                    'badge-info'
                  }`}>
                    {appointment.status || 'scheduled'}
                  </span>
                </div>
              ))}
              {todayAppointments.length > 4 && (
                <div className="text-center pt-2">
                  <Link 
                    to="/appointments"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    View all {todayAppointments.length} appointments
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No appointments scheduled for today</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="mr-2" size={20} />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              to="/checkin"
              className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Clock className="text-blue-600 dark:text-blue-400" size={20} />
                <span className="font-medium text-blue-900 dark:text-blue-300">Check In/Out</span>
              </div>
            </Link>
            
            <Link
              to="/patients"
              className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="text-green-600 dark:text-green-400" size={20} />
                <span className="font-medium text-green-900 dark:text-green-300">View Patients</span>
              </div>
            </Link>
            
            <Link
              to="/consultations"
              className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="text-purple-600 dark:text-purple-400" size={20} />
                <span className="font-medium text-purple-900 dark:text-purple-300">New Consultation</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;