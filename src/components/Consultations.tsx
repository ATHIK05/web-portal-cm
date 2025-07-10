import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Pill,
  Receipt,
  Download,
  Eye,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/firebaseService';

const Consultations: React.FC = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [prescriptionData, setPrescriptionData] = useState({
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: ''
  });

  const [billData, setBillData] = useState({
    consultationFee: 500,
    testCharges: 0,
    otherCharges: [] as { description: string; amount: number }[],
    total: 500
  });

  // Fetch appointments and patient data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Get appointments based on selected tab
        let appointmentsData;
        if (selectedTab === 'today') {
          appointmentsData = await FirebaseService.getDoctorAppointments(user.uid, new Date());
        } else {
          appointmentsData = await FirebaseService.getDoctorAppointments(user.uid);
          // Filter completed appointments
          appointmentsData = appointmentsData.filter(apt => apt.status === 'completed');
        }

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
        console.error('Error fetching data:', error);
        setMessage('Error loading appointments data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedTab]);

  const filteredAppointments = appointments.filter(appointment => {
    const patient = patients.get(appointment.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
    
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const addMedicine = () => {
    setPrescriptionData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const removeMedicine = (index: number) => {
    setPrescriptionData(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    setPrescriptionData(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const addOtherCharge = () => {
    setBillData(prev => ({
      ...prev,
      otherCharges: [...prev.otherCharges, { description: '', amount: 0 }]
    }));
  };

  const removeOtherCharge = (index: number) => {
    setBillData(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.filter((_, i) => i !== index)
    }));
  };

  const updateOtherCharge = (index: number, field: string, value: string | number) => {
    setBillData(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.map((charge, i) => 
        i === index ? { ...charge, [field]: value } : charge
      )
    }));
  };

  const handleCreatePrescription = async () => {
    if (!selectedAppointment) return;

    setActionLoading(true);
    setMessage('');

    try {
      const validMedicines = prescriptionData.medicines.filter(med => med.name.trim());
      
      if (validMedicines.length === 0) {
        setMessage('Please add at least one medicine');
        setActionLoading(false);
        return;
      }

      const prescriptionId = await FirebaseService.createPrescription(
        selectedAppointment.id,
        validMedicines,
        prescriptionData.instructions
      );

      if (prescriptionId) {
        // Update appointment status to completed
        await FirebaseService.updateAppointmentStatus(selectedAppointment.id, 'completed');
        
        setMessage('Prescription created successfully!');
        setShowPrescriptionModal(false);
        setPrescriptionData({
          medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
          instructions: ''
        });
        
        // Refresh data
        const appointmentsData = selectedTab === 'today' 
          ? await FirebaseService.getDoctorAppointments(user!.uid, new Date())
          : await FirebaseService.getDoctorAppointments(user!.uid).then(data => 
              data.filter(apt => apt.status === 'completed')
            );
        setAppointments(appointmentsData);
      } else {
        setMessage('Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      setMessage('An error occurred while creating prescription');
    } finally {
      setActionLoading(false);
    }
  };

  const calculateTotal = () => {
    const otherTotal = billData.otherCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    return billData.consultationFee + billData.testCharges + otherTotal;
  };

  const handleCreateBill = async () => {
    if (!selectedAppointment) return;

    setActionLoading(true);
    setMessage('');

    try {
      const total = calculateTotal();
      
      const bill = {
        consultationFee: billData.consultationFee,
        testCharges: billData.testCharges,
        medicineCharges: 0,
        otherCharges: billData.otherCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0),
        total,
        breakdown: [
          { description: 'Consultation Fee', amount: billData.consultationFee },
          { description: 'Test Charges', amount: billData.testCharges },
          ...billData.otherCharges.filter(charge => charge.description && charge.amount)
        ]
      };

      const billId = await FirebaseService.createBill(selectedAppointment.id, bill);

      if (billId) {
        // Update appointment status to completed if not already
        if (selectedAppointment.status !== 'completed') {
          await FirebaseService.updateAppointmentStatus(selectedAppointment.id, 'completed');
        }
        
        setMessage('Bill created successfully!');
        setShowBillModal(false);
        setBillData({
          consultationFee: 500,
          testCharges: 0,
          otherCharges: [],
          total: 500
        });
        
        // Refresh data
        const appointmentsData = selectedTab === 'today' 
          ? await FirebaseService.getDoctorAppointments(user!.uid, new Date())
          : await FirebaseService.getDoctorAppointments(user!.uid).then(data => 
              data.filter(apt => apt.status === 'completed')
            );
        setAppointments(appointmentsData);
      } else {
        setMessage('Failed to create bill');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      setMessage('An error occurred while creating bill');
    } finally {
      setActionLoading(false);
    }
  };

  const PrescriptionModal = () => {
    const patient = patients.get(selectedAppointment?.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Create Prescription</h3>
          
          {message && (
            <div className={`p-3 rounded-lg mb-4 ${
              message.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
              <input
                type="text"
                value={patientName}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medicines</label>
              <div className="space-y-3">
                {prescriptionData.medicines.map((medicine, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2">
                    <input 
                      placeholder="Medicine name" 
                      value={medicine.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <input 
                      placeholder="Dosage" 
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <input 
                      placeholder="Frequency" 
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <div className="flex space-x-1">
                      <input 
                        placeholder="Duration" 
                        value={medicine.duration}
                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                      {prescriptionData.medicines.length > 1 && (
                        <button 
                          onClick={() => removeMedicine(index)}
                          className="px-2 py-2 text-red-600 hover:text-red-800"
                          title="Remove medicine"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button 
                  onClick={addMedicine}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                >
                  <Plus size={16} />
                  <span>Add Medicine</span>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
              <textarea
                rows={3}
                value={prescriptionData.instructions}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, instructions: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter special instructions..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowPrescriptionModal(false);
                setMessage('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleCreatePrescription}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {actionLoading && <Loader className="animate-spin" size={16} />}
              <span>Generate Prescription</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const BillModal = () => {
    const patient = patients.get(selectedAppointment?.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Create Bill</h3>
          
          {message && (
            <div className={`p-3 rounded-lg mb-4 ${
              message.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
              <input
                type="text"
                value={patientName}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee</label>
                <input
                  type="number"
                  value={billData.consultationFee}
                  onChange={(e) => setBillData(prev => ({ ...prev, consultationFee: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Charges</label>
                <input
                  type="number"
                  value={billData.testCharges}
                  onChange={(e) => setBillData(prev => ({ ...prev, testCharges: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Other Charges</label>
              <div className="space-y-2">
                {billData.otherCharges.map((charge, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Description"
                      value={charge.description}
                      onChange={(e) => updateOtherCharge(index, 'description', e.target.value)}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-1">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={charge.amount}
                        onChange={(e) => updateOtherCharge(index, 'amount', parseInt(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        onClick={() => removeOtherCharge(index)}
                        className="px-2 py-2 text-red-600 hover:text-red-800"
                        title="Remove charge"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={addOtherCharge}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                >
                  <Plus size={16} />
                  <span>Add Other Charge</span>
                </button>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-xl font-bold text-green-600">₹{calculateTotal()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowBillModal(false);
                setMessage('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateBill}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {actionLoading && <Loader className="animate-spin" size={16} />}
              <span>Generate Bill</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Consultation Management</h2>
          <p className="text-gray-600 mt-1">Manage prescriptions and bills for your patients</p>
        </div>
      </div>

      {message && !showPrescriptionModal && !showBillModal && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setSelectedTab('today')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTab === 'today'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Today's Appointments
        </button>
        <button
          onClick={() => setSelectedTab('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTab === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Completed Consultations
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-gray-500">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No appointments found</p>
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
                    Time
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
                {filteredAppointments.map((appointment) => {
                  const patient = patients.get(appointment.patientId);
                  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
                  
                  return (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={16} className="text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {patientName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {appointment.patientId?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient?.phoneNumber || 'No phone'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient?.email || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{new Date(appointment.date).toLocaleDateString()}</div>
                        <div className="text-gray-500">
                          {appointment.timeSlot || new Date(appointment.date).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.type || 'Consultation'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : appointment.status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status || 'scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {appointment.status === 'completed' ? (
                            <>
                              {appointment.hasPrescription ? (
                                <button 
                                  title="View Prescription"
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                >
                                  <Eye size={16} />
                                </button>
                              ) : (
                                <button 
                                  title="Create Prescription"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowPrescriptionModal(true);
                                    setMessage('');
                                  }}
                                  className="text-green-600 hover:text-green-900 p-1 rounded"
                                >
                                  <Pill size={16} />
                                </button>
                              )}
                              
                              {appointment.hasBill ? (
                                <button 
                                  title="Download Bill"
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                >
                                  <Download size={16} />
                                </button>
                              ) : (
                                <button 
                                  title="Create Bill"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowBillModal(true);
                                    setMessage('');
                                  }}
                                  className="text-purple-600 hover:text-purple-900 p-1 rounded"
                                >
                                  <Receipt size={16} />
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button 
                                title="Create Prescription"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowPrescriptionModal(true);
                                  setMessage('');
                                }}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                              >
                                <Pill size={16} />
                              </button>
                              
                              <button 
                                title="Create Bill"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowBillModal(true);
                                  setMessage('');
                                }}
                                className="text-purple-600 hover:text-purple-900 p-1 rounded"
                              >
                                <Receipt size={16} />
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

      {showPrescriptionModal && <PrescriptionModal />}
      {showBillModal && <BillModal />}
    </div>
  );
};

export default Consultations;