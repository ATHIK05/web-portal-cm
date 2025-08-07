import React, { useState, useEffect, useCallback } from 'react';
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
  Loader,
  Save,
  X,
  Clock,
  Stethoscope,
  Heart,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FirebaseService } from '../services/firebaseService';

// Premium Prescription Modal Component
interface PrescriptionModalProps {
  prescriptionData: any;
  updateMedicine: (id: string, field: string, value: string) => void;
  removeMedicine: (id: string) => void;
  addMedicine: () => void;
  setShowPrescriptionModal: (show: boolean) => void;
  setMessage: (msg: string) => void;
  setPrescriptionData: React.Dispatch<React.SetStateAction<any>>;
  actionLoading: boolean;
  handleCreatePrescription: () => void;
  patients: Map<string, any>;
  selectedAppointment: any;
  theme: string;
  message: string;
}

const PremiumPrescriptionModal = React.memo(function PremiumPrescriptionModal({
  prescriptionData,
  updateMedicine,
  removeMedicine,
  addMedicine,
  setShowPrescriptionModal,
  setMessage,
  setPrescriptionData,
  actionLoading,
  handleCreatePrescription,
  patients,
  selectedAppointment,
  theme,
  message
}: PrescriptionModalProps) {
  const patient = patients.get(selectedAppointment?.patientId);
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Pill size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Create Prescription</h3>
                <p className="text-blue-100 text-sm">Patient: {patientName}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPrescriptionModal(false);
                setMessage('');
              }}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {message && (
            <div className={`p-4 rounded-xl mb-6 border ${
              message.includes('successfully') 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Doctor Header Section */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Dr. A. Atheeb</h4>
                <p className="text-sm text-gray-600">M.D.(GEN.MED), D.M.(CARDIO)</p>
                <p className="text-sm text-gray-600">Interventional Cardiologist Reg. No. 54501</p>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Consultations Hours: 10.00 a.m to 1.00 p.m</p>
                  <p className="ml-16">6.00 p.m to 9.00 p.m</p>
                  <p>Sunday: 10.00 a.m to 12.00 Noon</p>
                </div>
              </div>
              <div className="text-right">
                <h4 className="font-bold text-gray-900 text-lg">K.B.N. Nursing Home</h4>
                <p className="text-sm text-gray-600">K.B.N. HEART CARE UNIT</p>
                <p className="text-xs text-gray-500">49/1, Mosikeeranan Street,</p>
                <p className="text-xs text-gray-500">(Krishna Theatre Road) Erode - 638 003</p>
                <p className="text-xs text-gray-500">Phone: 0424 - 2225599, 2210576, 2224477</p>
                <p className="text-xs text-gray-500">Mob: 96888 83668</p>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient's Name</label>
              <input
                type="text"
                value={patientName}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium"
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="text"
                value={new Date().toLocaleDateString('en-GB')}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium"
              />
            </div>
          </div>

          {/* Prescription Symbol */}
          <div className="text-center mb-6">
            <div className="text-6xl font-serif text-blue-600">℞</div>
          </div>

          {/* Prescription Table */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <th className="border border-gray-300 px-3 py-3 text-center text-sm font-bold text-gray-800">
                    <div>உணவு</div>
                    <div className="text-xs">முன் / பின்</div>
                  </th>
                  <th className="border border-gray-300 px-3 py-3 text-center text-sm font-bold text-gray-800">காலை</th>
                  <th className="border border-gray-300 px-3 py-3 text-center text-sm font-bold text-gray-800">மதியம்</th>
                  <th className="border border-gray-300 px-3 py-3 text-center text-sm font-bold text-gray-800">இரவு</th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-gray-800">Medicine Details</th>
                  <th className="border border-gray-300 px-2 py-3 text-center text-sm font-bold text-gray-800">Action</th>
                </tr>
              </thead>
              <tbody>
                {prescriptionData.medicines.map((medicine: any, index: number) => (
                  <tr key={medicine.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="border border-gray-300 px-2 py-3 text-center">
                      <select
                        value={medicine.foodTiming || 'before'}
                        onChange={(e) => updateMedicine(medicine.id, 'foodTiming', e.target.value)}
                        className="w-full text-center text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        <option value="before">முன்</option>
                        <option value="after">பின்</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 px-2 py-3 text-center">
                      <input
                        type="text"
                        value={medicine.morning || '1'}
                        onChange={(e) => updateMedicine(medicine.id, 'morning', e.target.value)}
                        className="w-full text-center text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded"
                        placeholder="1"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-3 text-center">
                      <input
                        type="text"
                        value={medicine.afternoon || '1'}
                        onChange={(e) => updateMedicine(medicine.id, 'afternoon', e.target.value)}
                        className="w-full text-center text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded"
                        placeholder="1"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-3 text-center">
                      <input
                        type="text"
                        value={medicine.night || '1'}
                        onChange={(e) => updateMedicine(medicine.id, 'night', e.target.value)}
                        className="w-full text-center text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded"
                        placeholder="1"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-3">
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Medicine name (e.g., Paracetamol)"
                          value={medicine.name}
                          onChange={(e) => updateMedicine(medicine.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Dosage (e.g., 500mg)"
                            value={medicine.dosage}
                            onChange={(e) => updateMedicine(medicine.id, 'dosage', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Duration (e.g., 5 days)"
                            value={medicine.duration}
                            onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-2 py-3 text-center">
                      {prescriptionData.medicines.length > 1 && (
                        <button
                          onClick={() => removeMedicine(medicine.id)}
                          className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                          title="Remove medicine"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200">
              <button
                onClick={addMedicine}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 hover:scale-105"
              >
                <Plus size={16} />
                <span>Add Medicine Row</span>
              </button>
            </div>
          </div>

          {/* Other Instructions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <label className="block text-sm font-bold text-gray-800 mb-3">Other Instructions</label>
            <textarea
              rows={4}
              value={prescriptionData.instructions}
              onChange={(e) => setPrescriptionData((prev: any) => ({ ...prev, instructions: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Enter special instructions for the patient..."
            />
          </div>

          {/* Next Appointment */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <label className="block text-sm font-bold text-gray-800 mb-3">Next Appointment Date</label>
            <input
              type="date"
              value={prescriptionData.nextAppointment || ''}
              onChange={(e) => setPrescriptionData((prev: any) => ({ ...prev, nextAppointment: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tamil Hospital Name */}
          <div className="text-center mb-6">
            <p className="text-lg font-bold text-gray-800">K.B.N. மருத்துவமனை</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowPrescriptionModal(false);
                setMessage('');
              }}
              disabled={actionLoading}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-all duration-200 hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePrescription}
              disabled={actionLoading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center space-x-2 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              {actionLoading ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              <span>{actionLoading ? 'Generating...' : 'Save Prescription'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const Consultations: React.FC = () => {
  const { user, doctor } = useAuth();
  const { theme } = useTheme();
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
    medicines: [{ 
      id: Date.now().toString() + Math.random().toString(36).slice(2), 
      name: '', 
      dosage: '', 
      duration: '',
      foodTiming: 'before',
      morning: '1',
      afternoon: '1',
      night: '1'
    }],
    instructions: '',
    nextAppointment: ''
  });

  const [billData, setBillData] = useState({
    consultationFee: 500,
    testCharges: 0,
    otherCharges: [] as { description: string; amount: number }[],
    total: 500,
    breakdown: [
      { description: 'Consultation Fee', amount: 500 },
      { description: 'Test Charges', amount: 0 }
    ]
  });

  // Fetch appointments and patient data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let appointmentsData;
        if (selectedTab === 'today') {
          appointmentsData = await FirebaseService.getDoctorAppointments(user.uid, new Date());
        } else {
          appointmentsData = await FirebaseService.getDoctorAppointments(user.uid);
          appointmentsData = appointmentsData.filter(apt => apt.status === 'completed');
        }

        setAppointments(appointmentsData);

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

  const updateMedicine = useCallback((id: string, field: string, value: string) => {
    setPrescriptionData(prev => ({
      ...prev,
      medicines: prev.medicines.map(med => med.id === id ? { ...med, [field]: value } : med)
    }));
  }, []);

  const removeMedicine = useCallback((id: string) => {
    setPrescriptionData(prev => ({
      ...prev,
      medicines: prev.medicines.filter(med => med.id !== id)
    }));
  }, []);

  const addMedicine = useCallback(() => {
    setPrescriptionData(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { 
          id: Date.now().toString() + Math.random().toString(36).slice(2), 
          name: '', 
          dosage: '', 
          duration: '',
          foodTiming: 'before',
          morning: '1',
          afternoon: '1',
          night: '1'
        }
      ]
    }));
  }, []);

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
        prescriptionData.instructions,
        prescriptionData.nextAppointment
      );

      if (prescriptionId) {
        await FirebaseService.updateAppointmentStatus(selectedAppointment.id, 'completed');
        
        setMessage('Prescription created successfully!');
        setShowPrescriptionModal(false);
        setPrescriptionData({
          medicines: [{ 
            id: Date.now().toString() + Math.random().toString(36).slice(2), 
            name: '', 
            dosage: '', 
            duration: '',
            foodTiming: 'before',
            morning: '1',
            afternoon: '1',
            night: '1'
          }],
          instructions: '',
          nextAppointment: ''
        });
        
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
        if (selectedAppointment.status !== 'completed') {
          await FirebaseService.updateAppointmentStatus(selectedAppointment.id, 'completed');
        }
        
        setMessage('Bill created successfully!');
        setShowBillModal(false);
        setBillData({
          consultationFee: 500,
          testCharges: 0,
          otherCharges: [],
          total: 500,
          breakdown: [
            { description: 'Consultation Fee', amount: 500 },
            { description: 'Test Charges', amount: 0 }
          ]
        });
        
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

  const handleViewPrescription = async (prescriptionId: string) => {
    try {
      const prescription = await FirebaseService.getPrescription(prescriptionId);
      if (prescription?.pdfBase64) {
        const pdfWindow = window.open();
        if (pdfWindow) {
          pdfWindow.document.write(`
            <iframe width='100%' height='100%' src='data:application/pdf;base64,${prescription.pdfBase64}'></iframe>
          `);
        }
      } else {
        setMessage('PDF not available for this prescription');
      }
    } catch (error) {
      console.error('Error viewing prescription:', error);
      setMessage('Error loading prescription');
    }
  };

  const handleViewBill = async (billId: string) => {
    try {
      const bill = await FirebaseService.getBill(billId);
      if (bill?.pdfBase64) {
        const pdfWindow = window.open();
        if (pdfWindow) {
          pdfWindow.document.write(`
            <iframe width='100%' height='100%' src='data:application/pdf;base64,${bill.pdfBase64}'></iframe>
          `);
        }
      } else {
        setMessage('PDF not available for this bill');
      }
    } catch (error) {
      console.error('Error viewing bill:', error);
      setMessage('Error loading bill');
    }
  };

  const handleDownloadPrescription = async (prescriptionId: string) => {
    try {
      const prescription = await FirebaseService.getPrescription(prescriptionId);
      if (prescription?.pdfBase64) {
        FirebaseService.downloadPDFFromBase64(
          prescription.pdfBase64,
          `prescription_${prescriptionId}.pdf`
        );
      } else {
        setMessage('PDF not available for download');
      }
    } catch (error) {
      console.error('Error downloading prescription:', error);
      setMessage('Error downloading prescription');
    }
  };

  const handleDownloadBill = async (billId: string) => {
    try {
      const bill = await FirebaseService.getBill(billId);
      if (bill?.pdfBase64) {
        FirebaseService.downloadPDFFromBase64(
          bill.pdfBase64,
          `bill_${billId}.pdf`
        );
      } else {
        setMessage('PDF not available for download');
      }
    } catch (error) {
      console.error('Error downloading bill:', error);
      setMessage('Error downloading bill');
    }
  };

  // Premium Bill Modal
  const PremiumBillModal = () => {
    const patient = patients.get(selectedAppointment?.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
    const totalAmount = calculateTotal();

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-white/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Receipt size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Generate Medical Bill</h3>
                  <p className="text-green-100 text-sm">Patient: {patientName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBillModal(false);
                  setMessage('');
                }}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            {/* Hospital Header */}
            <div className="text-center mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <h2 className="text-2xl font-bold text-green-700 mb-1">KBN Nursing Home</h2>
              <div className="text-lg font-semibold text-green-600">Medical Bill</div>
            </div>

            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="space-y-2 text-sm">
                  <div><span className="font-semibold text-gray-700">Bill ID:</span> <span className="text-gray-900">{selectedAppointment?.id?.substring(0, 8) || 'N/A'}</span></div>
                  <div><span className="font-semibold text-gray-700">Date:</span> <span className="text-gray-900">{new Date().toLocaleDateString()}</span></div>
                  <div><span className="font-semibold text-gray-700">Doctor:</span> <span className="text-gray-900">Dr. {doctor?.name || 'Doctor'}</span></div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="space-y-2 text-sm">
                  <div><span className="font-semibold text-gray-700">Time:</span> <span className="text-gray-900">{new Date().toLocaleTimeString()}</span></div>
                  <div><span className="font-semibold text-gray-700">Specialty:</span> <span className="text-gray-900">{doctor?.specializations?.[0] || 'General'}</span></div>
                  <div><span className="font-semibold text-gray-700">Patient:</span> <span className="text-gray-900">{patientName}</span></div>
                </div>
              </div>
            </div>

            {/* Bill Details Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-gray-50 to-green-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-bold text-gray-800">Bill Details</h4>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">1</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Consultation Fee</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        value={billData.consultationFee}
                        onChange={e => setBillData(prev => ({ ...prev, consultationFee: Number(e.target.value) }))}
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-green-500"
                      />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">2</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Test Charges</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        value={billData.testCharges}
                        onChange={e => setBillData(prev => ({ ...prev, testCharges: Number(e.target.value) }))}
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-green-500"
                      />
                    </td>
                  </tr>
                  {billData.otherCharges.map((charge, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{idx + 3}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={charge.description}
                          onChange={e => updateOtherCharge(idx, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="Other charge description"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <input
                            type="number"
                            min={0}
                            value={charge.amount}
                            onChange={e => updateOtherCharge(idx, 'amount', Number(e.target.value))}
                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            onClick={() => removeOtherCharge(idx)}
                            className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                            title="Remove charge"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-gradient-to-r from-gray-50 to-green-50 border-t border-gray-200">
                <button
                  onClick={addOtherCharge}
                  className="flex items-center space-x-2 text-green-600 hover:text-green-800 font-medium transition-all duration-200 hover:scale-105"
                >
                  <Plus size={16} />
                  <span>Add Other Charge</span>
                </button>
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6 text-center mb-4 shadow-lg">
              <div className="text-2xl font-bold">Total Amount: ₹{totalAmount.toLocaleString()}</div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gradient-to-r from-gray-50 to-green-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBillModal(false);
                  setMessage('');
                }}
                disabled={actionLoading}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBill}
                disabled={actionLoading}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center space-x-2 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                {actionLoading ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                <span>{actionLoading ? 'Generating...' : 'Generate Bill'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredAppointments = appointments.filter(appointment => {
    const patient = patients.get(appointment.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const todayCount = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.date);
    return aptDate.toDateString() === today.toDateString();
  }).length;

  const completedCount = appointments.filter(apt => apt.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-red-600/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Consultation Management
            </h2>
            <p className="text-gray-600">Create prescriptions and bills for your patients</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <Activity className="text-blue-600" size={18} />
              <span className="text-sm font-medium text-gray-700">Dr. {doctor?.name}</span>
            </div>
          </div>
        </div>

        {message && !showPrescriptionModal && !showBillModal && (
          <div className={`p-4 rounded-xl border backdrop-blur-sm ${
            message.includes('successfully') 
              ? 'bg-green-50/80 text-green-800 border-green-200' 
              : 'bg-red-50/80 text-red-800 border-red-200'
          } animate-slide-in-up`}>
            {message}
          </div>
        )}

        {/* Premium Tab Navigation */}
        <div className="flex space-x-2 p-2 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg">
          <button
            onClick={() => setSelectedTab('today')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
              selectedTab === 'today'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <Clock size={18} />
            <span>Today's Appointments</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              selectedTab === 'today' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
            }`}>
              {todayCount}
            </span>
          </button>
          <button
            onClick={() => setSelectedTab('completed')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
              selectedTab === 'completed'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <CheckCircle size={18} />
            <span>Completed Consultations</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              selectedTab === 'completed' ? 'bg-white/20' : 'bg-green-100 text-green-600'
            }`}>
              {completedCount}
            </span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search appointments, patients, or reasons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
              <FileText className="text-blue-600" size={18} />
              <span className="text-sm font-medium text-blue-800">
                {filteredAppointments.length} Results
              </span>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Loader className="animate-spin text-white" size={24} />
              </div>
              <p className="text-gray-600 font-medium">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-gray-500" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No appointments found</p>
              <p className="text-gray-500 text-sm">
                {selectedTab === 'today' ? 'No appointments scheduled for today' : 'No completed consultations yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Patient</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Schedule</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.map((appointment, index) => {
                    const patient = patients.get(appointment.patientId);
                    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
                    
                    return (
                      <tr 
                        key={appointment.id} 
                        className="hover:bg-blue-50/50 transition-all duration-200 group"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                              <User size={18} className="text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{patientName}</div>
                              <div className="text-sm text-gray-500">ID: {appointment.patientId?.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900">{patient?.phoneNumber || 'No phone'}</div>
                            <div className="text-sm text-gray-500">{patient?.email || 'No email'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(appointment.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.timeSlot || new Date(appointment.date).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {appointment.type || 'Consultation'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            appointment.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'scheduled'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status || 'scheduled'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {appointment.status === 'completed' ? (
                              <>
                                {appointment.hasPrescription ? (
                                  <div className="flex space-x-1">
                                    <button 
                                      title="View Prescription"
                                      onClick={() => handleViewPrescription(appointment.prescriptionId)}
                                      className="w-9 h-9 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    >
                                      <Eye size={16} />
                                    </button>
                                    <button 
                                      title="Download Prescription"
                                      onClick={() => handleDownloadPrescription(appointment.prescriptionId)}
                                      className="w-9 h-9 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    >
                                      <Download size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    title="Create Prescription"
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setShowPrescriptionModal(true);
                                      setMessage('');
                                    }}
                                    className="w-9 h-9 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                  >
                                    <Pill size={16} />
                                  </button>
                                )}
                                
                                {appointment.hasBill ? (
                                  <div className="flex space-x-1">
                                    <button 
                                      title="View Bill"
                                      onClick={() => handleViewBill(appointment.billId)}
                                      className="w-9 h-9 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    >
                                      <Eye size={16} />
                                    </button>
                                    <button 
                                      title="Download Bill"
                                      onClick={() => handleDownloadBill(appointment.billId)}
                                      className="w-9 h-9 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    >
                                      <Download size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    title="Create Bill"
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setShowBillModal(true);
                                      setMessage('');
                                    }}
                                    className="w-9 h-9 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
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
                                  className="w-9 h-9 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
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
                                  className="w-9 h-9 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
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
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPrescriptionModal && (
        <PremiumPrescriptionModal
          prescriptionData={prescriptionData}
          updateMedicine={updateMedicine}
          removeMedicine={removeMedicine}
          addMedicine={addMedicine}
          setShowPrescriptionModal={setShowPrescriptionModal}
          setMessage={setMessage}
          setPrescriptionData={setPrescriptionData}
          actionLoading={actionLoading}
          handleCreatePrescription={handleCreatePrescription}
          patients={patients}
          selectedAppointment={selectedAppointment}
          theme={theme}
          message={message}
        />
      )}
      {showBillModal && <PremiumBillModal />}
    </div>
  );
};

export default Consultations;