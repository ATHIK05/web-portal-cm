import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  Loader,
  FileText
} from 'lucide-react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { PatientFirebaseService } from '../../services/patientFirebaseService';

const PatientPrescriptions: React.FC = () => {
  const { user } = usePatientAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const prescriptionsData = await PatientFirebaseService.getPatientPrescriptions(user.uid);
      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setMessage('Error loading prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrescription = async (prescriptionId: string) => {
    try {
      const prescription = await PatientFirebaseService.getPrescription(prescriptionId);
      if (prescription && prescription.pdfBase64) {
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

  const handleDownloadPrescription = async (prescriptionId: string) => {
    try {
      const prescription = await PatientFirebaseService.getPrescription(prescriptionId);
      if (prescription && prescription.pdfBase64) {
        PatientFirebaseService.downloadPDFFromBase64(
          prescription.pdfBase64,
          `prescription_${prescriptionId}_${new Date().toISOString().split('T')[0]}.pdf`
        );
      } else {
        setMessage('PDF not available for download');
      }
    } catch (error) {
      console.error('Error downloading prescription:', error);
      setMessage('Error downloading prescription');
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.medicines?.some((med: any) => 
      med.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || prescription.instructions?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || 
                       new Date(prescription.createdAt).toDateString() === new Date(filterDate).toDateString();
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Prescriptions</h2>
          <p className="text-gray-600 mt-1">View and download your medical prescriptions</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Error') ? 'bg-red-50 text-red-800 border border-red-200' : 
          'bg-blue-50 text-blue-800 border border-blue-200'
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
                placeholder="Search prescriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400" size={20} />
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
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-gray-500">Loading prescriptions...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-8 text-center">
              <Pill className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {prescriptions.length === 0 ? 'No prescriptions found' : 'No prescriptions match your search criteria'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPrescriptions.map((prescription) => (
                <div key={prescription.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Pill size={20} className="text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Prescription #{prescription.id.substring(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(prescription.createdAt).toLocaleDateString()} at{' '}
                            {new Date(prescription.createdAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-13">
                        <h4 className="font-medium text-gray-900 mb-2">Medicines:</h4>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-3">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Medicine</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-700">Morning</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-700">Afternoon</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-700">Night</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-700">Food</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                          {prescription.medicines?.map((medicine: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2">
                                  <div>
                                    <p className="font-medium text-gray-900">{medicine.name}</p>
                                    <p className="text-xs text-gray-500">{medicine.dosage} • {medicine.duration}</p>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center text-gray-700">{medicine.morning || '1'}</td>
                                <td className="px-3 py-2 text-center text-gray-700">{medicine.afternoon || '1'}</td>
                                <td className="px-3 py-2 text-center text-gray-700">{medicine.night || '1'}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    medicine.foodTiming === 'before' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {medicine.foodTiming === 'before' ? 'Before' : 'After'}
                                  </span>
                                </td>
                              </tr>
                          ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {prescription.instructions && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Instructions:</h4>
                            <p className="text-sm text-gray-600">{prescription.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleViewPrescription(prescription.id)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                        title="View Prescription"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDownloadPrescription(prescription.id)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg"
                        title="Download Prescription"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Pill size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Total Prescriptions</p>
              <p className="text-2xl font-bold text-green-600">{prescriptions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                {prescriptions.filter(p => {
                  const prescDate = new Date(p.createdAt);
                  const now = new Date();
                  return prescDate.getMonth() === now.getMonth() && 
                         prescDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Recent</p>
              <p className="text-2xl font-bold text-purple-600">
                {prescriptions.filter(p => {
                  const prescDate = new Date(p.createdAt);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return prescDate >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPrescriptions;