import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/firebaseService';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    totalPatients: 0,
    monthlyRevenue: 0,
    weeklyStats: [],
    monthlyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const appointments = await FirebaseService.getDoctorAppointments(user.uid);
      const patients = await FirebaseService.getDoctorPatients(user.uid);
      
      // Calculate statistics
      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
      const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;
      const noShowAppointments = appointments.filter(apt => apt.status === 'no-show').length;
      
      // Monthly revenue calculation
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
      });
      
      const monthlyRevenue = monthlyAppointments.length * 500; // Assuming ₹500 per consultation
      
      // Weekly stats for chart
      const weeklyStats = generateWeeklyStats(appointments);
      const monthlyStats = generateMonthlyStats(appointments);
      
      setStats({
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        totalPatients: patients.length,
        monthlyRevenue,
        weeklyStats,
        monthlyStats
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyStats = (appointments: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekStats = days.map(day => ({ day, appointments: 0, revenue: 0 }));
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    appointments.forEach(apt => {
      const aptDate = new Date(apt.date);
      if (aptDate >= oneWeekAgo) {
        const dayIndex = (aptDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        weekStats[dayIndex].appointments++;
        weekStats[dayIndex].revenue += 500;
      }
    });
    
    return weekStats;
  };

  const generateMonthlyStats = (appointments: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStats = months.map(month => ({ month, appointments: 0, revenue: 0 }));
    
    appointments.forEach(apt => {
      const aptDate = new Date(apt.date);
      const monthIndex = aptDate.getMonth();
      monthStats[monthIndex].appointments++;
      monthStats[monthIndex].revenue += 500;
    });
    
    return monthStats;
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp size={16} />
            <span className="text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );

  const ChartComponent = ({ data, type }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {type === 'week' ? 'Weekly' : 'Monthly'} Appointments
      </h3>
      <div className="space-y-3">
        {data.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {type === 'week' ? item.day : item.month}
            </span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(item.appointments / Math.max(...data.map((d: any) => d.appointments))) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-8">
                {item.appointments}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Track your practice performance and insights</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="w-20 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Calendar}
              title="Total Appointments"
              value={stats.totalAppointments}
              subtitle="All time"
              color="bg-blue-500"
              trend={12}
            />
            <StatCard
              icon={CheckCircle}
              title="Completed"
              value={stats.completedAppointments}
              subtitle={`${((stats.completedAppointments / stats.totalAppointments) * 100 || 0).toFixed(1)}% completion rate`}
              color="bg-green-500"
              trend={8}
            />
            <StatCard
              icon={Users}
              title="Total Patients"
              value={stats.totalPatients}
              subtitle="Unique patients"
              color="bg-purple-500"
              trend={15}
            />
            <StatCard
              icon={DollarSign}
              title="Monthly Revenue"
              value={`₹${stats.monthlyRevenue.toLocaleString()}`}
              subtitle="This month"
              color="bg-teal-500"
              trend={22}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartComponent 
              data={timeRange === 'week' ? stats.weeklyStats : stats.monthlyStats} 
              type={timeRange}
            />
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="font-medium text-green-900">Completed</span>
                  </div>
                  <span className="text-green-900 font-bold">{stats.completedAppointments}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <XCircle className="text-red-600" size={20} />
                    <span className="font-medium text-red-900">Cancelled</span>
                  </div>
                  <span className="text-red-900 font-bold">{stats.cancelledAppointments}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="text-yellow-600" size={20} />
                    <span className="font-medium text-yellow-900">No Show</span>
                  </div>
                  <span className="text-yellow-900 font-bold">{stats.noShowAppointments}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;