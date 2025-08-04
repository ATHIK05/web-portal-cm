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

const carouselImages = [
  '/images/kbn1.png', // Place your first image in public/images/kbn1.jpg
  '/images/kbn2.png', // Place your second image in public/images/kbn2.jpg
];

const ImageCarousel = () => {
  const [current, setCurrent] = useState(0);
  // Auto-advance every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const next = () => setCurrent((current + 1) % carouselImages.length);
  const prev = () => setCurrent((current - 1 + carouselImages.length) % carouselImages.length);
  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center h-full">
      <img src={carouselImages[current]} alt={`KBN ${current + 1}`} className="rounded-lg object-cover w-full h-64 mb-4" />
      <div className="flex justify-center space-x-2">
        <button onClick={prev} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">&#8592;</button>
        <button onClick={next} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">&#8594;</button>
      </div>
      <div className="flex justify-center mt-2 space-x-1">
        {carouselImages.map((_, idx) => (
          <span key={idx} className={`inline-block w-2 h-2 rounded-full ${idx === current ? 'bg-blue-600' : 'bg-gray-300'}`}></span>
        ))}
      </div>
    </div>
  );
};

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

  const TodaySchedule = () => (
    <div className="glass-card rounded-2xl p-6 animate-slide-in-up animate-delay-200">
      <h3 className="text-xl font-semibold gradient-text mb-6 flex items-center">
        <Calendar className="mr-2" size={20} />
        Today's Schedule
      </h3>
      {appointmentsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
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
      ) : todayAppointments.length > 0 ? (
        <div className="space-y-3">
          {todayAppointments.slice(0, 4).map((appointment, index) => (
            <div key={index} className="flex items-center justify-between p-4 glass-card rounded-xl table-row-glass transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
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
              <span className={`badge-glass px-3 py-1 text-xs rounded-full font-medium ${
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
                className="btn-primary-glass text-sm px-4 py-2"
              >
                View all {todayAppointments.length} appointments
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 glass-card rounded-xl">
          <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4 float-animation" />
          <p className="text-gray-500 mb-2">No appointments scheduled for today</p>
          {appointments.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Recent appointments:</p>
              <div className="space-y-2">
                {appointments.slice(0, 3).map((appointment, index) => (
                  <div key={index} className="text-xs text-gray-600 p-3 glass-card rounded-xl">
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
    <div className="space-y-8 animate-fade-in-scale">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold gradient-text animate-slide-in-up">Welcome back, Dr. {doctor?.name || 'Doctor'}</h2>
          <p className="text-gray-600 mt-1">Here's what's happening with your practice today</p>
        </div>
        <div className="flex items-center space-x-3 animate-slide-in-right">
          <div className={`flex items-center space-x-2 px-6 py-3 rounded-2xl glass-card ${
            doctor?.isCheckedIn ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              doctor?.isCheckedIn ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {doctor?.isCheckedIn ? 'Checked In' : 'Not Checked In'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          icon={Calendar}
          title="Today's Appointments"
          value={stats.todayAppointments}
          subtitle={`${stats.pendingAppointments} pending`}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Consultations"
          value={stats.completedConsultations}
          subtitle="Today"
          color="bg-gradient-to-br from-green-500 to-green-600"
          loading={statsLoading}
        />
        <StatCard
          icon={Users}
          title="Total Patients"
          value={stats.totalPatients}
          subtitle="Active records"
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          loading={statsLoading}
        />
        <StatCard
          icon={DollarSign}
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          subtitle="This month"
          color="bg-gradient-to-br from-teal-500 to-teal-600"
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TodaySchedule />
        <ImageCarousel />
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