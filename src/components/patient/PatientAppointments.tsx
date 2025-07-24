import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  MessageSquare,
  Video,
  Loader,
  Eye,
  Phone
} from 'lucide-react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { PatientFirebaseService } from '../../services/patientFirebaseService';
import { Link } from 'react-router-dom';

const PatientAppointments: React.FC = () => {
  const { user } = usePatientAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      setAppointmentsLoading(true);
      try {
        const appointmentsData = await PatientFirebaseService.getPatientAppointments(user.uid);
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setMessage('Error loading appointments data');
      } finally {
        setAppointmentsLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    
    const matchesDate = !filterDate || 
                       new Date(appointment.date).toDateString() === new Date(filterDate).toDateString();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleCancelAppointment = async (appointmentId: string) => {
    setLoading(true);
    setMessage('');

    try {
      const success = await PatientFirebaseService.cancelAppointment(appointmentId);
      
      if (success) {
        setMessage('Appointment cancelled successfully');
        // Refresh appointments
        const appointmentsData = await PatientFirebaseService.getPatientAppointments(user!.uid);
        setAppointments(appointmentsData);
      } else {
        setMessage('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setMessage('An error occurred while cancelling appointment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'scheduled':
        return <Clock size={16} className="text-blue-600" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-600" />;
      case 'no-show':
        return <AlertCircle size={16} className="text-yellow-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const AppointmentDetailsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Appointment Details</h3>
          <button
            onClick={() => setShowDetailsModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <p className="text-gray-900">Dr. {selectedAppointment.doctorName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <p className="text-gray-900">{selectedAppointment.doctorSpecialty}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <p className="text-gray-900">
                  {new Date(selectedAppointment.date).toLocaleDateString()} at{' '}
                  {selectedAppointment.timeSlot}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-gray-900">{selectedAppointment.type || 'Physical'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedAppointment.status)}
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                  {selectedAppointment.status || 'scheduled'}
                </span>
              </div>
            </div>

            {selectedAppointment.reason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <p className="text-gray-900">{selectedAppointment.reason}</p>
              </div>
            )}

            {selectedAppointment.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-gray-900">{selectedAppointment.notes}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
              <div className="flex space-x-2">
                <Link
                  to={`/patient/chat/${selectedAppointment.doctorId}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Message Doctor
                </Link>
                
                {selectedAppointment.type === 'online' && selectedAppointment.status === 'scheduled' && (
                  <Link
                    to={`/patient/video-consultation?doctor=${selectedAppointment.doctorId}`}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Join Video Call
                  </Link>
                )}
                
                {selectedAppointment.status === 'scheduled' && (
                  <button
                    onClick={() => {
                      handleCancelAppointment(selectedAppointment.id);
                      setShowDetailsModal(false);
                    }}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Appointments</h2>
          <p className="text-gray-600 mt-1">View and manage your appointments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/patient/book-appointment"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Calendar size={16} />
            <span>Book New</span>
          </Link>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>
              
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {appointmentsLoading ? (
            <div className="p-8 text-center">
              <Loader className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-gray-500">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {appointments.length === 0 ? 'No appointments found' : 'No appointments match your search criteria'}
              </p>
              {appointments.length === 0 && (
                <Link
                  to="/patient/book-appointment"
                  className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Calendar size={16} className="mr-2" />
                  Book Your First Appointment
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {appointment.doctorName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.doctorSpecialty}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(appointment.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.timeSlot}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.type === 'online' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.type === 'online' ? 'Video Call' : 'Physical'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(appointment.status)}
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status || 'scheduled'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          title="View Details"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <Link
                          to={`/patient/chat/${appointment.doctorId}`}
                          title="Message Doctor"
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                        >
                          <MessageSquare size={16} />
                        </Link>
                        
                        {appointment.type === 'online' && appointment.status === 'scheduled' && (
                          <Link
                            to={`/patient/video-consultation?doctor=${appointment.doctorId}`}
                            title="Join Video Call"
                            className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          >
                            <Video size={16} />
                          </Link>
                        )}
                        
                        {appointment.status === 'scheduled' && (
                          <button
                            title="Cancel Appointment"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDetailsModal && <AppointmentDetailsModal />}
    </div>
  );
};

export default PatientAppointments;