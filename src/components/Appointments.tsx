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
  Phone,
  Mail,
  Loader,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/firebaseService';
import { useTheme } from '../contexts/ThemeContext';

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<Map<string, any>>(new Map());

  // Fetch appointments and patient data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setAppointmentsLoading(true);
      try {
        // Get appointments
        const appointmentsData = await FirebaseService.getDoctorAppointments(user.uid);
        setAppointments(appointmentsData);

        // Fetch patient details for all appointments
        const patientMap = new Map();
        const uniquePatientIds = [...new Set(appointmentsData.map(apt => apt.patientId))];
        
        for (const patientId of uniquePatientIds) {
          if (patientId) {
            try {
              const patientData = await FirebaseService.getPatientById(patientId);
              if (patientData) {
                patientMap.set(patientId, patientData);
              }
            } catch (error) {
              console.error(`Error fetching patient ${patientId}:`, error);
            }
          }
        }
        
        setPatients(patientMap);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setMessage('Error loading appointments data');
      } finally {
        setAppointmentsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredAppointments = appointments.filter(appointment => {
    const patient = patients.get(appointment.patientId);
    const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Unknown Patient';
    
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    
    const matchesDate = !filterDate || 
                       new Date(appointment.date).toDateString() === new Date(filterDate).toDateString();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    setLoading(true);
    setMessage('');

    try {
      const success = await FirebaseService.updateAppointmentStatus(appointmentId, newStatus);
      
      if (success) {
        setMessage(`Appointment status updated to ${newStatus}`);
        // Refresh appointments
        const appointmentsData = await FirebaseService.getDoctorAppointments(user!.uid);
        setAppointments(appointmentsData);
      } else {
        setMessage('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setMessage('An error occurred while updating appointment status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = (appointmentId: string) => {
    // Navigate to consultations with appointment ID
    window.location.href = `/consultations?appointment=${appointmentId}&action=prescription`;
  };

  const handleCreateBill = (appointmentId: string) => {
    // Navigate to consultations with appointment ID
    window.location.href = `/consultations?appointment=${appointmentId}&action=bill`;
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

  const AppointmentDetailsModal = () => {
    const patient = patients.get(selectedAppointment?.patientId);
    const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Unknown Patient';

    return (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <p className="text-gray-900">{patientName}</p>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <p className="text-gray-900">{patient?.phoneNumber || 'No phone'}</p>
                  <p className="text-sm text-gray-600">{patient?.email || 'No email'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                  <p className="text-gray-900">{patient?.emergencyContact || 'Not provided'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <p className="text-gray-900">
                    {new Date(selectedAppointment.date).toLocaleDateString()} at{' '}
                    {selectedAppointment.timeSlot || new Date(selectedAppointment.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-gray-900">{selectedAppointment.type || 'Consultation'}</p>
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
                  {selectedAppointment.status !== 'completed' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedAppointment.id, 'completed');
                        setShowDetailsModal(false);
                      }}
                      disabled={loading}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark Completed
                    </button>
                  )}
                  
                  {selectedAppointment.status === 'scheduled' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedAppointment.id, 'cancelled');
                        setShowDetailsModal(false);
                      }}
                      disabled={loading}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                  
                  {selectedAppointment.status === 'scheduled' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedAppointment.id, 'no-show');
                        setShowDetailsModal(false);
                      }}
                      disabled={loading}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Mark No-Show
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Appointments</h2>
          <p className="text-gray-600 mt-1">Manage your appointment schedule</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Total: {filteredAppointments.length}</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('updated') ? 'bg-green-50 text-green-800 border border-green-200' : 
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' ? 'bg-gray-800 text-white' : ''
                  }`}
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
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
                {filteredAppointments.map((appointment) => {
                  const patient = patients.get(appointment.patientId);
                  const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Unknown Patient';
                  
                  return (
                    <tr key={appointment.id} className={`
                      ${theme === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'hover:bg-gray-50'}
                    `}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : ''}`}> 
                            <User size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} />
                          </div>
                          <div className="ml-4">
                            <div
                              className={`text-sm font-medium transition-colors duration-150 cursor-pointer
                                ${theme === 'dark' ? 'text-white group-hover:text-gray-200' : 'text-gray-900 hover:text-white'}`}
                            >
                              {patientName}
                            </div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}> 
                              {patient?.phoneNumber || 'No phone'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(appointment.date).toLocaleDateString()}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                          {appointment.timeSlot || new Date(appointment.date).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {appointment.reason || appointment.type || 'Consultation'}
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
                          
                          {appointment.status === 'scheduled' && (
                            <>
                              <button
                                title="Mark Completed"
                                onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                                disabled={loading}
                                className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                              >
                                <CheckCircle size={16} />
                              </button>
                              
                              <button
                                title="Cancel Appointment"
                                onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                                disabled={loading}
                                className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          
                          {appointment.status === 'completed' && (
                            <>
                              <button
                                title="Create Prescription"
                                onClick={() => handleCreatePrescription(appointment.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Prescription
                              </button>
                              
                              <button
                                title="Create Bill"
                                onClick={() => handleCreateBill(appointment.id)}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                              >
                                Bill
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDetailsModal && <AppointmentDetailsModal />}
    </div>
  );
};

export default Appointments;