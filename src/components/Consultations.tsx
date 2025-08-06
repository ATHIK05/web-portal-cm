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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  Heart,
  Activity
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-card max-w-6xl w-full m-4 max-h-[95vh] overflow-hidden animate-scale-in">
        {/* Prescription Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Dr. A. Atheeb, M.D.(GEN.MED), D.M.(CARDIO).</h2>
              <p className="text-blue-100 mb-2">Interventional Cardiologist Reg. No. 54501</p>
              <div className="text-sm text-blue-100 space-y-1">
                <p>Consultations Hours : <span className="font-medium">10.00 a.m to 1.00 p.m</span></p>
                <p className="ml-20">6.00 p.m to 9.00 p.m</p>
                <p>Sunday <span className="ml-12">10.00 a.m to 12.00 Noon</span></p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold mb-1">K.B.N. Nursing Home</h3>
              <div className="text-sm text-blue-100 space-y-1">
                <p className="font-medium">K.B.N. HEART CARE UNIT,</p>
                <p>49/1, Mosikeeranan Street,</p>
                <p>(Krishna Theatre Road) Erode - 638 003.</p>
                <p>Phone : 0424 - 2225599, 2210576, 2224477</p>
                <p>Mob : 96888 83668</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mt-2 ml-auto">
                <Heart className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {message && (
            <div className={`p-4 rounded-xl mb-6 border ${
              message.includes('successfully') 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {message.includes('successfully') ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-lg font-semibold text-gray-800">Patient's Name :</label>
              <div className="border-b-2 border-gray-800 pb-1">
                <span className="text-lg font-medium">{patientName}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-lg font-semibold text-gray-800">Date :</label>
              <div className="border-b-2 border-gray-800 pb-1">
                <span className="text-lg font-medium">{new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>

          {/* Large Rx Symbol */}
          <div className="flex items-center mb-8">
            <div className="text-6xl font-bold text-blue-600 mr-8">℞</div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Prescription Details</h3>
            </div>
          </div>

          {/* Prescription Table */}
          <div className="mb-8">
            <div className="border-2 border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-r-2 border-gray-800 px-4 py-3 text-center font-bold">
                      <div>உணவு</div>
                      <div className="text-sm">முன் / பின்</div>
                    </th>
                    <th className="border-r-2 border-gray-800 px-4 py-3 text-center font-bold">காலை</th>
                    <th className="border-r-2 border-gray-800 px-4 py-3 text-center font-bold">மதியம்</th>
                    <th className="border-r-2 border-gray-800 px-4 py-3 text-center font-bold">இரவு</th>
                    <th className="px-4 py-3 text-center font-bold">Medicine Details</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptionData.medicines.map((medicine: any, index: number) => (
                    <tr key={medicine.id} className="border-t-2 border-gray-800">
                      <td className="border-r-2 border-gray-800 px-4 py-4 text-center">
                        <select
                          value={medicine.foodTiming || 'before'}
                          onChange={(e) => updateMedicine(medicine.id, 'foodTiming', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-center text-sm"
                        >
                          <option value="before">முன் (Before)</option>
                          <option value="after">பின் (After)</option>
                        </select>
                      </td>
                      <td className="border-r-2 border-gray-800 px-4 py-4 text-center">
                        <input
                          type="text"
                          value={medicine.morning || ''}
                          onChange={(e) => updateMedicine(medicine.id, 'morning', e.target.value)}
                          className="w-16 px-2 py-1 border rounded text-center"
                          placeholder="1"
                        />
                      </td>
                      <td className="border-r-2 border-gray-800 px-4 py-4 text-center">
                        <input
                          type="text"
                          value={medicine.afternoon || ''}
                          onChange={(e) => updateMedicine(medicine.id, 'afternoon', e.target.value)}
                          className="w-16 px-2 py-1 border rounded text-center"
                          placeholder="1"
                        />
                      </td>
                      <td className="border-r-2 border-gray-800 px-4 py-4 text-center">
                        <input
                          type="text"
                          value={medicine.night || ''}
                          onChange={(e) => updateMedicine(medicine.id, 'night', e.target.value)}
                          className="w-16 px-2 py-1 border rounded text-center"
                          placeholder="1"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <input
                            placeholder="Medicine name"
                            value={medicine.name}
                            onChange={(e) => updateMedicine(medicine.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="off"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              placeholder="Dosage (e.g., 10mg)"
                              value={medicine.dosage}
                              onChange={(e) => updateMedicine(medicine.id, 'dosage', e.target.value)}
                              className="px-2 py-1 border rounded text-sm"
                              autoComplete="off"
                            />
                            <input
                              placeholder="Duration (e.g., 7 days)"
                              value={medicine.duration}
                              onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                              className="px-2 py-1 border rounded text-sm"
                              autoComplete="off"
                            />
                          </div>
                          {prescriptionData.medicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedicine(medicine.id)}
                              className="text-red-600 hover:text-red-800 text-sm flex items-center space-x-1"
                              title="Remove medicine"
                            >
                              <XCircle size={14} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              onClick={addMedicine}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-2 px-4 py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition-all duration-300"
            >
              <Plus size={16} />
              <span>Add Medicine Row</span>
            </button>
          </div>

          {/* Other Instructions */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-3">Other Instructions</label>
            <textarea
              rows={4}
              value={prescriptionData.instructions}
              onChange={(e) => setPrescriptionData((prev: any) => ({ ...prev, instructions: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter special instructions..."
            />
          </div>

          {/* Next Appointment */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-3">Next Appointment Date :</label>
            <div className="border-b-2 border-gray-800 pb-2 w-64">
              <input
                type="date"
                value={prescriptionData.nextAppointment || ''}
                onChange={(e) => setPrescriptionData((prev: any) => ({ ...prev, nextAppointment: e.target.value }))}
                className="text-lg font-medium bg-transparent border-none outline-none"
              />
            </div>
          </div>

          {/* Hospital Name in Tamil */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">K.B.N. மருத்துவமனை</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              setShowPrescriptionModal(false);
              setMessage('');
            }}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePrescription}
            disabled={actionLoading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {actionLoading && <Loader className="animate-spin" size={18} />}
            <Pill size={18} />
            <span>Generate Prescription</span>
          </button>
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

  // Update the type for medicines to include all required fields
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
        prescriptionData.instructions,
        prescriptionData.nextAppointment
      );

      if (prescriptionId) {
        // Update appointment status to completed
        await FirebaseService.updateAppointmentStatus(selectedAppointment.id, 'completed');
        
        setMessage('Prescription created successfully!');
        setShowPrescriptionModal(false);
        // Reset prescription data
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="glass-card max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto animate-scale-in">
          {/* Bill Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 text-center">
            <h2 className="text-2xl font-bold mb-1">KBN Nursing Home</h2>
            <div className="text-lg font-semibold">Medical Bill</div>
          </div>

          <div className="p-6">
            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="text-sm"><span className="font-semibold">Bill ID:</span> {billIdShort}</div>
                <div className="text-sm"><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</div>
                <div className="text-sm"><span className="font-semibold">Doctor:</span> Dr. {doctor?.name || 'Doctor'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm"><span className="font-semibold">Time:</span> {new Date().toLocaleTimeString()}</div>
                <div className="text-sm"><span className="font-semibold">Patient:</span> {patientName}</div>
                <div className="text-sm"><span className="font-semibold">Specialty:</span> {doctor?.specializations?.[0] || 'General'}</div>
              </div>
            </div>

            {/* Bill Details Table */}
            <div className="mb-6">
              <div className="font-bold text-lg mb-4 flex items-center">
                <Receipt className="mr-2 text-green-600" size={20} />
                Bill Details
              </div>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r">No.</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r">Description</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3 border-r">1</td>
                      <td className="px-4 py-3 border-r">Consultation Fee</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={billData.consultationFee}
                          onChange={e => setBillData(prev => ({ ...prev, consultationFee: Number(e.target.value) }))}
                          className="w-24 px-2 py-1 border rounded text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 border-r">2</td>
                      <td className="px-4 py-3 border-r">Test Charges</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={billData.testCharges}
                          onChange={e => setBillData(prev => ({ ...prev, testCharges: Number(e.target.value) }))}
                          className="w-24 px-2 py-1 border rounded text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                    </tr>
                    {billData.otherCharges.map((charge, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-3 border-r">{idx + 3}</td>
                        <td className="px-4 py-3 border-r">
                          <input
                            type="text"
                            value={charge.description}
                            onChange={e => updateOtherCharge(idx, 'description', e.target.value)}
                            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
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
                              className="w-24 px-2 py-1 border rounded text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeOtherCharge(idx)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Remove charge"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addOtherCharge}
                className="mt-3 text-green-600 hover:text-green-800 text-sm flex items-center space-x-2 px-4 py-2 border border-green-300 rounded-lg hover:bg-green-50 transition-all duration-300"
              >
                <Plus size={16} />
                <span>Add Other Charge</span>
              </button>
            </div>

            {/* Total Section */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-xl px-6 py-4 text-center mb-4 shadow-lg">
              Total Amount: ₹{totalAmount.toLocaleString()}
            </div>
            <div className="text-center text-gray-700 mb-6 p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold">Amount in Words:</span> {totalAmountWords} Rupees Only
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setShowBillModal(false);
                setMessage('');
              }}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBill}
              disabled={actionLoading}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {actionLoading && <Loader className="animate-spin" size={18} />}
              <Receipt size={18} />
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'scheduled':
        return <Clock size={16} className="text-blue-600" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-teal-600/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="glass-card p-8 animate-slide-in-up">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold gradient-text flex items-center">
                <Stethoscope className="mr-4 text-blue-600" size={40} />
                Consultation Management
              </h2>
              <p className="text-gray-600 mt-2 text-lg">Manage prescriptions and bills for your patients</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="glass-card px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-600/10">
                <div className="flex items-center space-x-2">
                  <Activity className="text-blue-600" size={20} />
                  <span className="font-medium text-gray-800">Dr. {doctor?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {message && !showPrescriptionModal && !showBillModal && (
          <div className={`glass-card p-6 border-l-4 animate-slide-in-right ${
            message.includes('successfully') 
              ? 'border-green-500 bg-green-50/50 text-green-800' 
              : 'border-red-500 bg-red-50/50 text-red-800'
          }`}>
            <div className="flex items-center space-x-3">
              {message.includes('successfully') ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="glass-card p-2 animate-slide-in-up animation-delay-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTab('today')}
              className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                selectedTab === 'today'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:bg-white/20 hover:scale-105'
              }`}
            >
              <Calendar size={20} />
              <span>Today's Appointments</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {appointments.filter(apt => selectedTab === 'today').length}
              </span>
            </button>
            <button
              onClick={() => setSelectedTab('completed')}
              className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                selectedTab === 'completed'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:bg-white/20 hover:scale-105'
              }`}
            >
              <CheckCircle size={20} />
              <span>Completed Consultations</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {appointments.filter(apt => apt.status === 'completed').length}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass-card p-6 animate-slide-in-up animation-delay-300">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search appointments by patient name, ID, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/80 transition-all duration-300 text-lg"
            />
          </div>
        </div>

        {/* Appointments Table */}
        <div className="glass-card animate-slide-in-up animation-delay-400">
          {loading ? (
            <div className="p-12 text-center">
              <div className="relative">
                <Loader className="animate-spin mx-auto mb-6 text-blue-600" size={48} />
                <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-xl"></div>
              </div>
              <p className="text-gray-600 text-lg">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="relative mb-6">
                <Calendar className="mx-auto h-20 w-20 text-gray-400" />
                <div className="absolute inset-0 bg-gray-400/10 rounded-full blur-xl"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No appointments found</h3>
              <p className="text-gray-600">
                {selectedTab === 'today' 
                  ? 'No appointments scheduled for today' 
                  : 'No completed consultations found'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Schedule
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAppointments.map((appointment, index) => {
                      const patient = patients.get(appointment.patientId);
                      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
                      
                      return (
                        <tr 
                          key={appointment.id} 
                          className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 transform hover:scale-[1.02]"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <td className="px-6 py-6">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                  <User size={20} className="text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">{patientName}</div>
                                <div className="text-xs text-gray-500">ID: {appointment.patientId?.substring(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-900 font-medium">{patient?.phoneNumber || 'No phone'}</div>
                              <div className="text-xs text-gray-500">{patient?.email || 'No email'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">{new Date(appointment.date).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500 flex items-center space-x-1">
                                <Clock size={12} />
                                <span>
                                  {appointment.timeSlot || new Date(appointment.date).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {appointment.type || 'Consultation'}
                            </span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(appointment.status)}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                                {appointment.status || 'scheduled'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex space-x-2">
                              {appointment.status === 'completed' ? (
                                <>
                                  {appointment.hasPrescription ? (
                                    <div className="flex space-x-2">
                                      <button 
                                        title="View Prescription"
                                        onClick={() => handleViewPrescription(appointment.prescriptionId)}
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      <button 
                                        title="Download Prescription"
                                        onClick={() => handleDownloadPrescription(appointment.prescriptionId)}
                                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-300 transform hover:scale-110"
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
                                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                                    >
                                      <Pill size={16} />
                                    </button>
                                  )}
                                  
                                  {appointment.hasBill ? (
                                    <div className="flex space-x-2">
                                      <button 
                                        title="View Bill"
                                        onClick={() => handleViewBill(appointment.billId)}
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      <button 
                                        title="Download Bill"
                                        onClick={() => handleDownloadBill(appointment.billId)}
                                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-all duration-300 transform hover:scale-110"
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
                                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-all duration-300 transform hover:scale-110"
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
                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-300 transform hover:scale-110"
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
                                    className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-all duration-300 transform hover:scale-110"
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
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-in-up animation-delay-500">
          <div className="glass-card p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Calendar size={24} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
            <div className="text-sm text-gray-600">Total Appointments</div>
          </div>
          
          <div className="glass-card p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {appointments.filter(apt => apt.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          
          <div className="glass-card p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Pill size={24} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {appointments.filter(apt => apt.hasPrescription).length}
            </div>
            <div className="text-sm text-gray-600">Prescriptions</div>
          </div>
          
          <div className="glass-card p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Receipt size={24} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {appointments.filter(apt => apt.hasBill).length}
            </div>
            <div className="text-sm text-gray-600">Bills Generated</div>
          </div>
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