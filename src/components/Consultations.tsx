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
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FirebaseService } from '../services/firebaseService';

// Add explicit type for MemoizedPrescriptionModal props
interface MemoizedPrescriptionModalProps {
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

const MemoizedPrescriptionModal = React.memo(function MemoizedPrescriptionModal({
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
}: MemoizedPrescriptionModalProps) {
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
              {prescriptionData.medicines.map((medicine: any) => (
                <div key={medicine.id} className="grid grid-cols-4 gap-2">
                  <input
                    name={`medicine-name-${medicine.id}`}
                    placeholder="Medicine name"
                    value={medicine.name}
                    onChange={(e) => updateMedicine(medicine.id, 'name', e.target.value)}
                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-600' : ''}`}
                    autoComplete="off"
                  />
                  <input
                    name={`medicine-dosage-${medicine.id}`}
                    placeholder="Dosage"
                    value={medicine.dosage}
                    onChange={(e) => updateMedicine(medicine.id, 'dosage', e.target.value)}
                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-600' : ''}`}
                    autoComplete="off"
                  />
                  <input
                    name={`medicine-frequency-${medicine.id}`}
                    placeholder="Frequency"
                    value={medicine.frequency}
                    onChange={(e) => updateMedicine(medicine.id, 'frequency', e.target.value)}
                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-600' : ''}`}
                    autoComplete="off"
                  />
                  <div className="relative">
                    <input
                      name={`medicine-duration-${medicine.id}`}
                      placeholder="Duration"
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-600' : ''}`}
                      autoComplete="off"
                    />
                    {prescriptionData.medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(medicine.id)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 text-red-600 hover:text-red-800 bg-transparent"
                        title="Remove medicine"
                        tabIndex={-1}
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
              onChange={(e) => setPrescriptionData((prev: any) => ({ ...prev, instructions: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-600' : ''}`}
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
});

const Consultations: React.FC = () => {
  const { user } = useAuth();
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

  // Update the type for medicines to include 'id'
  const [prescriptionData, setPrescriptionData] = useState({
    medicines: [{ id: Date.now().toString() + Math.random().toString(36).slice(2), name: '', dosage: '', frequency: '', duration: '' }],
    instructions: ''
  });

  const [billData, setBillData] = useState<{
    consultationFee: number;
    testCharges: number;
    otherCharges: { description: string; amount: number }[];
    total: number;
    breakdown: { description: string; amount: number }[];
  }>({
    consultationFee: 500,
    testCharges: 0,
    otherCharges: [],
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

  // When adding a new medicine, generate a unique id
  
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
        // When resetting prescriptionData after creating a prescription
        setPrescriptionData({
          medicines: [{ id: Date.now().toString() + Math.random().toString(36).slice(2), name: '', dosage: '', frequency: '', duration: '' }],
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

  const handleViewPrescription = async (prescriptionId: string) => {
    try {
      const prescription = await FirebaseService.getPrescription(prescriptionId);
      if (prescription) {
        if (prescription.pdfBase64) {
          // Open PDF in new tab for preview
          const pdfWindow = window.open();
          if (pdfWindow) {
            pdfWindow.document.write(`
              <iframe width='100%' height='100%' src='data:application/pdf;base64,${prescription.pdfBase64}'></iframe>
            `);
          }
        } else {
          setMessage('PDF not available for this prescription');
        }
      }
    } catch (error) {
      console.error('Error viewing prescription:', error);
      setMessage('Error loading prescription');
    }
  };

  const handleViewBill = async (billId: string) => {
    try {
      const bill = await FirebaseService.getBill(billId);
      if (bill) {
        if (bill.pdfBase64) {
          // Open PDF in new tab for preview
          const pdfWindow = window.open();
          if (pdfWindow) {
            pdfWindow.document.write(`
              <iframe width='100%' height='100%' src='data:application/pdf;base64,${bill.pdfBase64}'></iframe>
            `);
          }
        } else {
          setMessage('PDF not available for this bill');
        }
      }
    } catch (error) {
      console.error('Error viewing bill:', error);
      setMessage('Error loading bill');
    }
  };

  const handleDownloadPrescription = async (prescriptionId: string) => {
    try {
      const prescription = await FirebaseService.getPrescription(prescriptionId);
      if (prescription && prescription.pdfBase64) {
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
      if (bill && bill.pdfBase64) {
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
        ],
        appointmentId: selectedAppointment.id
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
          total: 500,
          breakdown: [
            { description: 'Consultation Fee', amount: 500 },
            { description: 'Test Charges', amount: 0 }
          ]
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

  // Memoize handlers to avoid modal remounts
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
        { id: Date.now().toString() + Math.random().toString(36).slice(2), name: '', dosage: '', frequency: '', duration: '' }
      ]
    }));
  }, []);

  const BillModal = () => {
    const patient = patients.get(selectedAppointment?.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';

    // Helper for amount in words
    function numberToWords(num: number): string {
      const a = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
      ];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if ((num = num || 0) < 20) return a[num];
      if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
      if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '');
      if (num < 10000) return a[Math.floor(num / 1000)] + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
      return num.toString();
    }

    const billIdShort = selectedAppointment?.billId ? selectedAppointment.billId.substring(0, 6) : 'N/A';
    const totalAmount = billData.consultationFee + billData.testCharges + billData.otherCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    const totalAmountWords = numberToWords(totalAmount);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-green-600 mb-1">KBN Nursing Home</h2>
            <div className="text-lg font-semibold text-green-500 mb-2">Medical Bill</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm"><span className="font-semibold">Bill ID:</span> {billIdShort}</div>
              <div className="text-sm"><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</div>
              <div className="text-sm"><span className="font-semibold">Doctor:</span> Dr. {user?.displayName}</div>
            </div>
            <div>
              <div className="text-sm"><span className="font-semibold">Time:</span> {new Date().toLocaleTimeString()}</div>
              <div className="text-sm"><span className="font-semibold">Specialty:</span> Cardiology</div>
            </div>
          </div>
          <div className="mb-4">
            <div className="font-bold text-lg mb-2">Bill Details</div>
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">No.</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2">1</td>
                  <td className="px-4 py-2">Consultation Fee</td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      value={billData.consultationFee}
                      onChange={e => setBillData(prev => ({ ...prev, consultationFee: Number(e.target.value) }))}
                      className="w-24 px-2 py-1 border rounded text-right"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">2</td>
                  <td className="px-4 py-2">Test Charges</td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      value={billData.testCharges}
                      onChange={e => setBillData(prev => ({ ...prev, testCharges: Number(e.target.value) }))}
                      className="w-24 px-2 py-1 border rounded text-right"
                    />
                  </td>
                </tr>
                {billData.otherCharges.map((charge, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{idx + 3}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={charge.description}
                        onChange={e => updateOtherCharge(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                        placeholder="Other charge description"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={charge.amount}
                        onChange={e => updateOtherCharge(idx, 'amount', Number(e.target.value))}
                        className="w-24 px-2 py-1 border rounded text-right"
                      />
                      <button
                        type="button"
                        onClick={() => removeOtherCharge(idx)}
                        className="ml-2 text-red-600 hover:text-red-800"
                        title="Remove charge"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addOtherCharge}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Other Charge
            </button>
          </div>
          <div className="bg-green-500 text-white text-xl font-bold rounded-lg px-6 py-4 text-center mb-2">
            Total Amount: ₹{totalAmount}
          </div>
          <div className="text-center text-gray-700 mb-4">
            <span className="font-semibold">Amount in Words:</span> {totalAmountWords} Rupees Only
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

  // Restore filteredAppointments
  const filteredAppointments = appointments.filter(appointment => {
    const patient = patients.get(appointment.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
                    <tr key={appointment.id} className={
                      `${theme === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'hover:bg-gray-50'}`
                    }>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-100'}`}> 
                            <User size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-blue-600'} />
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-medium transition-colors duration-150 cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-gray-900 hover:text-white'}`}> 
                              {patientName}
                            </div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}> 
                              ID: {appointment.patientId?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}> 
                          {patient?.phoneNumber || 'No phone'}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}> 
                          {patient?.email || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className={theme === 'dark' ? 'text-white' : ''}>{new Date(appointment.date).toLocaleDateString()}</div>
                        <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>
                          {appointment.timeSlot || new Date(appointment.date).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {appointment.type || 'Consultation'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === 'completed' 
                            ? (theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                            : appointment.status === 'scheduled'
                            ? (theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                            : (theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800')
                        }`}>
                          {appointment.status || 'scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {appointment.status === 'completed' ? (
                            <>
                              {appointment.hasPrescription ? (
                                <div className="flex space-x-1">
                                  <button 
                                    title="View Prescription"
                                    onClick={() => handleViewPrescription(appointment.prescriptionId)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button 
                                    title="Download Prescription"
                                    onClick={() => handleDownloadPrescription(appointment.prescriptionId)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded"
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
                                  className="text-green-600 hover:text-green-900 p-1 rounded"
                                >
                                  <Pill size={16} />
                                </button>
                              )}
                              
                              {appointment.hasBill ? (
                                <div className="flex space-x-1">
                                  <button 
                                    title="View Bill"
                                    onClick={() => handleViewBill(appointment.billId)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button 
                                    title="Download Bill"
                                    onClick={() => handleDownloadBill(appointment.billId)}
                                    className="text-purple-600 hover:text-purple-900 p-1 rounded"
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

      {showPrescriptionModal && (
        <MemoizedPrescriptionModal
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
      {showBillModal && <BillModal />}
    </div>
  );
};

export default Consultations;