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
import { useTheme } from '../contexts/ThemeContext';

const Consultations: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
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
  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'male',
    consultationDate: '',
    consultationType: 'general',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medicines: [{ name: '', dosage: '', duration: '', frequency: '', foodTiming: 'after' }],
    instructions: '',
    nextAppointment: '',
    consultationFee: 500,
    testCharges: 0,
    medicineCharges: 0,
    otherCharges: 0,
    notes: ''
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
      medicines: [{ name: '', dosage: '', duration: '', frequency: '', foodTiming: 'after' }],
      instructions: '',
      nextAppointment: '',
      consultationFee: 500,
      testCharges: 0,
      medicineCharges: 0,
      otherCharges: 0,
      notes: ''
    });
    setModalMode('create');
    setShowModal(true);
  };

  const handleEditConsultation = (consultation: any) => {
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
      medicines: consultation.medicines || [{ name: '', dosage: '', duration: '', frequency: '', foodTiming: 'after' }],
      instructions: consultation.instructions || '',
      nextAppointment: consultation.nextAppointment ? new Date(consultation.nextAppointment).toISOString().split('T')[0] : '',
      consultationFee: consultation.consultationFee || 500,
      testCharges: consultation.testCharges || 0,
      medicineCharges: consultation.medicineCharges || 0,
      otherCharges: consultation.otherCharges || 0,
      notes: consultation.notes || ''
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleViewConsultation = (consultation: any) => {
    setSelectedConsultation(consultation);
    setModalMode('view');
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
        total: formData.consultationFee + formData.testCharges + formData.medicineCharges + formData.otherCharges,
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

  const handleDeleteConsultation = async (consultationId: string) => {
    if (!confirm('Are you sure you want to delete this consultation?')) return;
    
    setLoading(true);
    try {
      const success = await FirebaseService.deleteConsultation(consultationId);
      if (success) {
        setMessage('Consultation deleted successfully');
        fetchConsultations();
      } else {
        setMessage('Failed to delete consultation');
      }
    } catch (error) {
      console.error('Error deleting consultation:', error);
      setMessage('An error occurred while deleting consultation');
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = () => {
    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', duration: '', frequency: '', foodTiming: 'after' }]
    }));
  };

  const removeMedicine = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const ConsultationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {modalMode === 'create' ? 'New Consultation' : 
             modalMode === 'edit' ? 'Edit Consultation' : 'Consultation Details'}
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Patient Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900">{selectedConsultation?.patientName}</p>
                ) : (
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter patient name"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900">{selectedConsultation?.patientAge}</p>
                ) : (
                  <input
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Age"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900 capitalize">{selectedConsultation?.patientGender}</p>
                ) : (
                  <select
                    value={formData.patientGender}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientGender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Consultation Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Consultation Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900">{new Date(selectedConsultation?.consultationDate).toLocaleDateString()}</p>
                ) : (
                  <input
                    type="date"
                    value={formData.consultationDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, consultationDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900 capitalize">{selectedConsultation?.consultationType}</p>
                ) : (
                  <select
                    value={formData.consultationType}
                    onChange={(e) => setFormData(prev => ({ ...prev, consultationType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="followup">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="routine">Routine Check-up</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
              {modalMode === 'view' ? (
                <p className="text-gray-900">{selectedConsultation?.symptoms}</p>
              ) : (
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe symptoms..."
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
              {modalMode === 'view' ? (
                <p className="text-gray-900">{selectedConsultation?.diagnosis}</p>
              ) : (
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter diagnosis..."
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
              {modalMode === 'view' ? (
                <p className="text-gray-900">{selectedConsultation?.treatment}</p>
              ) : (
                <textarea
                  value={formData.treatment}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe treatment plan..."
                />
              )}
            </div>
          </div>

          {/* Medicines */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-900">Medicines</h4>
              {modalMode !== 'view' && (
                <button
                  onClick={addMedicine}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  <Plus size={16} className="inline mr-1" />
                  Add Medicine
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {(modalMode === 'view' ? selectedConsultation?.medicines || [] : formData.medicines).map((medicine: any, index: number) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Medicine Name</label>
                      {modalMode === 'view' ? (
                        <p className="text-sm text-gray-900">{medicine.name}</p>
                      ) : (
                        <input
                          type="text"
                          value={medicine.name}
                          onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Medicine name"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                      {modalMode === 'view' ? (
                        <p className="text-sm text-gray-900">{medicine.dosage}</p>
                      ) : (
                        <input
                          type="text"
                          value={medicine.dosage}
                          onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="e.g., 500mg"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                      {modalMode === 'view' ? (
                        <p className="text-sm text-gray-900">{medicine.duration}</p>
                      ) : (
                        <input
                          type="text"
                          value={medicine.duration}
                          onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="e.g., 7 days"
                        />
                      )}
                    </div>
                    <div className="flex items-end">
                      {modalMode === 'view' ? (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                          <p className="text-sm text-gray-900">{medicine.frequency}</p>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                          <input
                            type="text"
                            value={medicine.frequency}
                            onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g., 2x daily"
                          />
                        </div>
                      )}
                      {modalMode !== 'view' && formData.medicines.length > 1 && (
                        <button
                          onClick={() => removeMedicine(index)}
                          className="ml-2 p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              {modalMode === 'view' ? (
                <p className="text-gray-900">{selectedConsultation?.instructions}</p>
              ) : (
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Special instructions..."
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              {modalMode === 'view' ? (
                <p className="text-gray-900">{selectedConsultation?.notes}</p>
              ) : (
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional notes..."
                />
              )}
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Billing Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900">₹{selectedConsultation?.consultationFee}</p>
                ) : (
                  <input
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, consultationFee: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Charges</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900">₹{selectedConsultation?.testCharges}</p>
                ) : (
                  <input
                    type="number"
                    value={formData.testCharges}
                    onChange={(e) => setFormData(prev => ({ ...prev, testCharges: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Charges</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900">₹{selectedConsultation?.medicineCharges}</p>
                ) : (
                  <input
                    type="number"
                    value={formData.medicineCharges}
                    onChange={(e) => setFormData(prev => ({ ...prev, medicineCharges: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Charges</label>
                {modalMode === 'view' ? (
                  <p className="text-gray-900">₹{selectedConsultation?.otherCharges}</p>
                ) : (
                  <input
                    type="number"
                    value={formData.otherCharges}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherCharges: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Amount:</span>
                <span className="text-xl font-bold text-green-600">
                  ₹{modalMode === 'view' 
                    ? selectedConsultation?.total 
                    : (formData.consultationFee + formData.testCharges + formData.medicineCharges + formData.otherCharges)
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Next Appointment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Appointment</label>
            {modalMode === 'view' ? (
              <p className="text-gray-900">
                {selectedConsultation?.nextAppointment 
                  ? new Date(selectedConsultation.nextAppointment).toLocaleDateString()
                  : 'Not scheduled'
                }
              </p>
            ) : (
              <input
                type="date"
                value={formData.nextAppointment}
                onChange={(e) => setFormData(prev => ({ ...prev, nextAppointment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            {modalMode === 'view' ? 'Close' : 'Cancel'}
          </button>
          {modalMode !== 'view' && (
            <button
              onClick={handleSaveConsultation}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
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
          <h2 className="text-3xl font-bold text-gray-900">Consultations</h2>
          <p className="text-gray-600 mt-1">Manage patient consultations and medical records</p>
        </div>
        <button
          onClick={handleCreateConsultation}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>New Consultation</span>
        </button>
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
                placeholder="Search consultations..."
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
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
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
          {consultationsLoading ? (
            <div className="p-8 text-center">
              <Loader className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-gray-500">Loading consultations...</p>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {consultations.length === 0 ? 'No consultations found' : 'No consultations match your search criteria'}
              </p>
              {consultations.length === 0 && (
                <button
                  onClick={handleCreateConsultation}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                >
                  <Plus size={16} />
                  <span>Create Your First Consultation</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
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
                {filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className={`
                    ${theme === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'hover:bg-gray-50'}
                  `}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : ''}`}> 
                          <User size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} />
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium transition-colors duration-150 cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-gray-900 hover:text-white'}`}> 
                            {consultation.patientName}
                          </div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}> 
                            {consultation.patientAge} years, {consultation.patientGender}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(consultation.consultationDate).toLocaleDateString()}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {consultation.consultationType}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {consultation.diagnosis || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        ₹{consultation.total || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {consultation.status || 'completed'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          title="View Details"
                          onClick={() => handleViewConsultation(consultation)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          title="Edit Consultation"
                          onClick={() => handleEditConsultation(consultation)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          title="Delete Consultation"
                          onClick={() => handleDeleteConsultation(consultation.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
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
    </div>
  );
};

export default Consultations;