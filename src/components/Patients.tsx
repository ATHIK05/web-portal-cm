import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/firebaseService';
import { useTheme } from '../contexts/ThemeContext';

const Patients: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [logReason, setLogReason] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [patients, setPatients] = useState<any[]>([]);

  // Fetch patients data
  useEffect(() => {
    if (!user) return;

    const fetchPatients = async () => {
      setPatientsLoading(true);
      try {
        // Get all appointments for this doctor to find their patients
        const appointments = await FirebaseService.getDoctorAppointments(user.uid);
        const uniquePatientIds = [...new Set(appointments.map(apt => apt.patientId))];
        
        if (uniquePatientIds.length === 0) {
          setPatients([]);
          return;
        }
        
        // Fetch patient details from patients collection
        const patientsData: any[] = [];
        for (const patientId of uniquePatientIds) {
          if (patientId) {
            try {
              const patientData = await FirebaseService.getPatientById(patientId);
              if (patientData) {
                patientsData.push(patientData);
              }
            } catch (error) {
              console.error(`Error fetching patient ${patientId}:`, error);
            }
          }
        }
        
        setPatients(patientsData);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setMessage('Error loading patients data');
      } finally {
        setPatientsLoading(false);
      }
    };

    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phoneNumber?.includes(searchTerm) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && !patient.isLogged) ||
                         (filterStatus === 'logged' && patient.isLogged);
    
    return matchesSearch && matchesFilter;
  });

  const handleLogPatient = async () => {
    if (!selectedPatient || !logReason) {
      setMessage('Please select a reason');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const success = await FirebaseService.logPatient(selectedPatient.id, logReason, logNotes);
      
      if (success) {
        setMessage('Patient marked as logged successfully');
        setShowLogModal(false);
        setSelectedPatient(null);
        setLogReason('');
        setLogNotes('');
        
        // Refresh patients data
        const appointments = await FirebaseService.getDoctorAppointments(user!.uid);
        const uniquePatientIds = [...new Set(appointments.map(apt => apt.patientId))];
        
        const patientsData: any[] = [];
        for (const patientId of uniquePatientIds) {
          if (patientId) {
            try {
              const patientData = await FirebaseService.getPatientById(patientId);
              if (patientData) {
                patientsData.push(patientData);
              }
            } catch (error) {
              console.error(`Error fetching patient ${patientId}:`, error);
            }
          }
        }
        
        setPatients(patientsData);
      } else {
        setMessage('Failed to log patient');
      }
    } catch (error) {
      console.error('Error logging patient:', error);
      setMessage('An error occurred while logging patient');
    } finally {
      setLoading(false);
    }
  };

  const PatientDetailsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Patient Details</h3>
          <button
            onClick={() => setShowDetailsModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        {selectedPatient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900">
                  {`${selectedPatient.firstName || ''} ${selectedPatient.lastName || ''}`.trim() || 'Not provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{selectedPatient.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-gray-900">{selectedPatient.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <p className="text-gray-900">{selectedPatient.emergencyContact || 'Not provided'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                <p className="text-gray-900">{selectedPatient.insuranceProvider || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Number</label>
                <p className="text-gray-900">{selectedPatient.insuranceNumber || 'Not provided'}</p>
              </div>
            </div>

            {selectedPatient.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-gray-900">{selectedPatient.address}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
              <p className="text-gray-900">
                {selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString() : 'Not available'}
              </p>
            </div>

            {selectedPatient.isLogged && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">Logged Status</h4>
                <p className="text-sm text-orange-800">Reason: {selectedPatient.logReason}</p>
                {selectedPatient.logNotes && (
                  <p className="text-sm text-orange-800 mt-1">Notes: {selectedPatient.logNotes}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const LogPatientModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
        <h3 className="text-lg font-semibold mb-4">Mark Patient as Logged</h3>
        <p className="text-gray-600 mb-4">
          Patient: <strong>{`${selectedPatient?.firstName || ''} ${selectedPatient?.lastName || ''}`.trim()}</strong>
        </p>
        
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${
            message.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Reason</label>
          <div className="space-y-2">
            {['No-show', 'Moved clinics', 'Treatment completed', 'Needs follow-up', 'Other'].map(reason => (
              <label key={reason} className="flex items-center">
                <input
                  type="radio"
                  name="logReason"
                  value={reason}
                  checked={logReason === reason}
                  onChange={(e) => setLogReason(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{reason}</span>
              </label>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              placeholder="Additional notes (optional)"
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              setShowLogModal(false);
              setMessage('');
              setLogReason('');
              setLogNotes('');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleLogPatient}
            disabled={loading || !logReason}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <Loader className="animate-spin" size={16} />}
            <span>Mark as Logged</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Patients</h2>
          <p className="text-gray-600 mt-1">Manage patients who have booked appointments with you</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Total: {filteredPatients.length}</span>
        </div>
      </div>

      {message && !showLogModal && (
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
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 text-white' : ''}`}
              >
                <option value="all">All Patients</option>
                <option value="active">Active</option>
                <option value="logged">Logged</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {patientsLoading ? (
            <div className="p-8 text-center">
              <Loader className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-gray-500">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {patients.length === 0 ? 'No patients found. Patients will appear here once they book appointments with you.' : 'No patients match your search criteria.'}
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
                    Contact
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
                {filteredPatients.map((patient) => {
                  const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
                  
                  return (
                    <tr key={patient.id} className={`
                      ${theme === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'hover:bg-gray-50'}
                    `}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : ''}`}> 
                            <User size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} />
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-medium transition-colors duration-150 cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-gray-900 hover:text-white'}`}> 
                              {fullName || 'Unknown Patient'}
                            </div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}> 
                              Registered: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-900">{patient.phoneNumber || 'No phone'}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-500">{patient.email || 'No email'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {patient.isLogged ? (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                Logged
                              </span>
                              {patient.logReason && (
                                <div className="text-xs text-gray-500 mt-1">{patient.logReason}</div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            title="View Details"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {!patient.isLogged && (
                            <>
                              <button
                                title="Schedule Appointment"
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                              >
                                <Calendar size={16} />
                              </button>
                              
                              <button
                                title="Send Message"
                                className="text-purple-600 hover:text-purple-900 p-1 rounded"
                              >
                                <MessageSquare size={16} />
                              </button>
                              
                              <button
                                title="Mark as Logged"
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setShowLogModal(true);
                                  setMessage('');
                                }}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded"
                              >
                                <Clock size={16} />
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

      {showLogModal && <LogPatientModal />}
      {showDetailsModal && <PatientDetailsModal />}
    </div>
  );
};

export default Patients;