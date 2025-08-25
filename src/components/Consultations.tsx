import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  User,
  Calendar,
  Clock,
  Stethoscope,
  Pill,
  CreditCard,
  Save,
  X,
  Loader,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/firebaseService';

const Consultations: React.FC = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [loading, setLoading] = useState(false);
  const [consultationsLoading, setConsultationsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'male',
    consultationDate: '',
    consultationType: 'general',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    instructions: '',
    nextAppointment: '',
    notes: ''
  });

  // Prescription form data
  const [prescriptionData, setPrescriptionData] = useState({
    medicines: [{ name: '', dosage: '', duration: '', frequency: '', foodTiming: 'after', morning: '1', afternoon: '1', night: '1' }],
    instructions: '',
    nextAppointment: ''
  });

  // Bill form data
  const [billData, setBillData] = useState({
    consultationFee: 500,
    testCharges: 0,
    medicineCharges: 0,
    otherCharges: 0,
    breakdown: [
      { description: 'Consultation Fee', amount: 500 }
    ]
  });

  useEffect(() => {
    if (user) {
      fetchConsultations();
    }
  }, [user]);

  const fetchConsultations = async () => {
    if (!user) return;
    
    setConsultationsLoading(true);
    try {
      const consultationsData = await FirebaseService.getConsultations(user.uid);
      setConsultations(consultationsData);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      setMessage('Error loading consultations data');
    } finally {
      setConsultationsLoading(false);
    }
  };

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = consultation.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.symptoms?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || consultation.status === filterStatus;
    
    const matchesDate = !filterDate || 
                       new Date(consultation.consultationDate).toDateString() === new Date(filterDate).toDateString();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleCreateConsultation = () => {
    setSelectedConsultation(null);
    setFormData({
      patientName: '',
      patientAge: '',
      patientGender: 'male',
      consultationDate: new Date().toISOString().split('T')[0],
      consultationType: 'general',
      symptoms: '',
      diagnosis: '',
      treatment: '',
      instructions: '',
      nextAppointment: '',
      notes: ''
    });
    setModalMode('create');
    setShowModal(true);
  };

  const handleSaveConsultation = async () => {
    if (!user) return;
    
    setLoading(true);
    setMessage('');

    try {
      const consultationData = {
        ...formData,
        doctorId: user.uid,
        consultationDate: new Date(formData.consultationDate),
        nextAppointment: formData.nextAppointment ? new Date(formData.nextAppointment) : null,
        status: 'completed'
      };

      let success;
      if (modalMode === 'create') {
        success = await FirebaseService.addConsultation(consultationData);
      } else {
        success = await FirebaseService.updateConsultation(selectedConsultation.id, consultationData);
      }

      if (success) {
        setMessage(`Consultation ${modalMode === 'create' ? 'created' : 'updated'} successfully!`);
        setShowModal(false);
        fetchConsultations();
      } else {
        setMessage(`Failed to ${modalMode === 'create' ? 'create' : 'update'} consultation`);
      }
    } catch (error) {
      console.error('Error saving consultation:', error);
      setMessage('An error occurred while saving consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = async () => {
    if (!selectedAppointmentId) return;
    
    setLoading(true);
    try {
      const prescriptionId = await FirebaseService.createPrescription(
        selectedAppointmentId,
        prescriptionData.medicines,
        prescriptionData.instructions,
        prescriptionData.nextAppointment
      );
      
      if (prescriptionId) {
        setMessage('Prescription created successfully!');
        setShowPrescriptionModal(false);
        setPrescriptionData({
          medicines: [{ name: '', dosage: '', duration: '', frequency: '', foodTiming: 'after', morning: '1', afternoon: '1', night: '1' }],
          instructions: '',
          nextAppointment: ''
        });
      } else {
        setMessage('Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      setMessage('Error creating prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async () => {
    if (!selectedAppointmentId) return;
    
    setLoading(true);
    try {
      const total = billData.consultationFee + billData.testCharges + billData.medicineCharges + billData.otherCharges;
      const breakdown = [
        { description: 'Consultation Fee', amount: billData.consultationFee },
        ...(billData.testCharges > 0 ? [{ description: 'Test Charges', amount: billData.testCharges }] : []),
        ...(billData.medicineCharges > 0 ? [{ description: 'Medicine Charges', amount: billData.medicineCharges }] : []),
        ...(billData.otherCharges > 0 ? [{ description: 'Other Charges', amount: billData.otherCharges }] : [])
      ];

      const billId = await FirebaseService.createBill(selectedAppointmentId, {
        consultationFee: billData.consultationFee,
        testCharges: billData.testCharges,
        medicineCharges: billData.medicineCharges,
        otherCharges: billData.otherCharges,
        total,
        breakdown
      });
      
      if (billId) {
        setMessage('Bill created successfully!');
        setShowBillModal(false);
        setBillData({
          consultationFee: 500,
          testCharges: 0,
          medicineCharges: 0,
          otherCharges: 0,
          breakdown: [{ description: 'Consultation Fee', amount: 500 }]
        });
      } else {
        setMessage('Failed to create bill');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      setMessage('Error creating bill');
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = () => {
    setPrescriptionData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', duration: '', frequency: '', foodTiming: 'after', morning: '1', afternoon: '1', night: '1' }]
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

  const PrescriptionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal p-6 w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Prescription</h3>
          <button
            onClick={() => setShowPrescriptionModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Medicines</h4>
              <button
                onClick={addMedicine}
                className="btn-primary text-sm flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Add Medicine</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {prescriptionData.medicines.map((medicine, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Medicine Name</label>
                      <input
                        type="text"
                        value={medicine.name}
                        onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                        className="input-field text-sm"
                        placeholder="Medicine name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={medicine.dosage}
                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                        className="input-field text-sm"
                        placeholder="e.g., 500mg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                      <input
                        type="text"
                        value={medicine.duration}
                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                        className="input-field text-sm"
                        placeholder="e.g., 7 days"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Morning</label>
                      <input
                        type="text"
                        value={medicine.morning}
                        onChange={(e) => updateMedicine(index, 'morning', e.target.value)}
                        className="input-field text-sm"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Afternoon</label>
                      <input
                        type="text"
                        value={medicine.afternoon}
                        onChange={(e) => updateMedicine(index, 'afternoon', e.target.value)}
                        className="input-field text-sm"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Night</label>
                      <input
                        type="text"
                        value={medicine.night}
                        onChange={(e) => updateMedicine(index, 'night', e.target.value)}
                        className="input-field text-sm"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Food Timing</label>
                      <div className="flex items-center space-x-2">
                        <select
                          value={medicine.foodTiming}
                          onChange={(e) => updateMedicine(index, 'foodTiming', e.target.value)}
                          className="input-field text-sm flex-1"
                        >
                          <option value="before">Before Food</option>
                          <option value="after">After Food</option>
                        </select>
                        {prescriptionData.medicines.length > 1 && (
                          <button
                            onClick={() => removeMedicine(index)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</label>
            <textarea
              value={prescriptionData.instructions}
              onChange={(e) => setPrescriptionData(prev => ({ ...prev, instructions: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="Special instructions for the patient..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Next Appointment</label>
            <input
              type="date"
              value={prescriptionData.nextAppointment}
              onChange={(e) => setPrescriptionData(prev => ({ ...prev, nextAppointment: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setShowPrescriptionModal(false)}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePrescription}
            disabled={loading}
            className="btn-success flex items-center space-x-2"
          >
            {loading && <Loader className="animate-spin" size={16} />}
            <Pill size={16} />
            <span>Create Prescription</span>
          </button>
        </div>
      </div>
    </div>
  );

  const BillModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Bill</h3>
          <button
            onClick={() => setShowBillModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Consultation Fee</label>
              <input
                type="number"
                value={billData.consultationFee}
                onChange={(e) => setBillData(prev => ({ ...prev, consultationFee: parseInt(e.target.value) || 0 }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Charges</label>
              <input
                type="number"
                value={billData.testCharges}
                onChange={(e) => setBillData(prev => ({ ...prev, testCharges: parseInt(e.target.value) || 0 }))}
                className="input-field"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medicine Charges</label>
              <input
                type="number"
                value={billData.medicineCharges}
                onChange={(e) => setBillData(prev => ({ ...prev, medicineCharges: parseInt(e.target.value) || 0 }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Other Charges</label>
              <input
                type="number"
                value={billData.otherCharges}
                onChange={(e) => setBillData(prev => ({ ...prev, otherCharges: parseInt(e.target.value) || 0 }))}
                className="input-field"
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900 dark:text-white">Total Amount:</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                ₹{(billData.consultationFee + billData.testCharges + billData.medicineCharges + billData.otherCharges).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setShowBillModal(false)}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateBill}
            disabled={loading}
            className="btn-success flex items-center space-x-2"
          >
            {loading && <Loader className="animate-spin" size={16} />}
            <CreditCard size={16} />
            <span>Create Bill</span>
          </button>
        </div>
      </div>
    </div>
  );

  const ConsultationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal p-6 w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {modalMode === 'create' ? 'New Consultation' : 
             modalMode === 'edit' ? 'Edit Consultation' : 'Consultation Details'}
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Patient Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient Name</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900 dark:text-white">{selectedConsultation?.patientName}</p>
                ) : (
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                    className="input-field"
                    placeholder="Enter patient name"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900 dark:text-white">{selectedConsultation?.patientAge}</p>
                ) : (
                  <input
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                    className="input-field"
                    placeholder="Age"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900 dark:text-white capitalize">{selectedConsultation?.patientGender}</p>
                ) : (
                  <select
                    value={formData.patientGender}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientGender: e.target.value }))}
                    className="input-field"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms</label>
              {modalMode === 'view' ? (
                <p className="text-gray-900 dark:text-white">{selectedConsultation?.symptoms}</p>
              ) : (
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Describe symptoms..."
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnosis</label>
              {modalMode === 'view' ? (
                <p className="text-gray-900 dark:text-white">{selectedConsultation?.diagnosis}</p>
              ) : (
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Enter diagnosis..."
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Treatment</label>
              {modalMode === 'view' ? (
                <p className="text-gray-900 dark:text-white">{selectedConsultation?.treatment}</p>
              ) : (
                <textarea
                  value={formData.treatment}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatment: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Describe treatment plan..."
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setShowModal(false)}
            className="btn-secondary"
            disabled={loading}
          >
            {modalMode === 'view' ? 'Close' : 'Cancel'}
          </button>
          {modalMode !== 'view' && (
            <button
              onClick={handleSaveConsultation}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading && <Loader className="animate-spin" size={16} />}
              <Save size={16} />
              <span>{modalMode === 'create' ? 'Create' : 'Update'} Consultation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Consultations</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage patient consultations and medical records</p>
        </div>
        <button
          onClick={handleCreateConsultation}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>New Consultation</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 
          'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search consultations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400 dark:text-gray-500" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {consultationsLoading ? (
            <div className="p-8 text-center">
              <Loader className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-gray-500 dark:text-gray-400">Loading consultations...</p>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {consultations.length === 0 ? 'No consultations found' : 'No consultations match your search criteria'}
              </p>
              {consultations.length === 0 && (
                <button
                  onClick={handleCreateConsultation}
                  className="mt-4 btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Plus size={16} />
                  <span>Create Your First Consultation</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User size={16} className="text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {consultation.patientName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {consultation.patientAge} years, {consultation.patientGender}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(consultation.consultationDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {consultation.consultationType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {consultation.diagnosis || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="badge-success">
                        {consultation.status || 'completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          title="View Details"
                          onClick={() => {
                            setSelectedConsultation(consultation);
                            setModalMode('view');
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          title="Create Prescription"
                          onClick={() => {
                            setSelectedAppointmentId(consultation.appointmentId || consultation.id);
                            setShowPrescriptionModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded"
                        >
                          <Pill size={16} />
                        </button>
                        
                        <button
                          title="Create Bill"
                          onClick={() => {
                            setSelectedAppointmentId(consultation.appointmentId || consultation.id);
                            setShowBillModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded"
                        >
                          <CreditCard size={16} />
                        </button>
                        
                        <button
                          title="Edit Consultation"
                          onClick={() => {
                            setSelectedConsultation(consultation);
                            setFormData({
                              patientName: consultation.patientName || '',
                              patientAge: consultation.patientAge || '',
                              patientGender: consultation.patientGender || 'male',
                              consultationDate: consultation.consultationDate ? new Date(consultation.consultationDate).toISOString().split('T')[0] : '',
                              consultationType: consultation.consultationType || 'general',
                              symptoms: consultation.symptoms || '',
                              diagnosis: consultation.diagnosis || '',
                              treatment: consultation.treatment || '',
                              instructions: consultation.instructions || '',
                              nextAppointment: consultation.nextAppointment ? new Date(consultation.nextAppointment).toISOString().split('T')[0] : '',
                              notes: consultation.notes || ''
                            });
                            setModalMode('edit');
                            setShowModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 p-1 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          title="Delete Consultation"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this consultation?')) {
                              FirebaseService.deleteConsultation(consultation.id).then(success => {
                                if (success) {
                                  setMessage('Consultation deleted successfully');
                                  fetchConsultations();
                                } else {
                                  setMessage('Failed to delete consultation');
                                }
                              });
                            }
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && <ConsultationModal />}
      {showPrescriptionModal && <PrescriptionModal />}
      {showBillModal && <BillModal />}
    </div>
  );
};

export default Consultations;