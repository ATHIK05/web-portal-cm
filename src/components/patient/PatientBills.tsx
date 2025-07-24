import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  DollarSign,
  Loader,
  Receipt,
  CheckCircle
} from 'lucide-react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { PatientFirebaseService } from '../../services/patientFirebaseService';

const PatientBills: React.FC = () => {
  const { user } = usePatientAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchBills();
    }
  }, [user]);

  const fetchBills = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const billsData = await PatientFirebaseService.getPatientBills(user.uid);
      setBills(billsData);
    } catch (error) {
      console.error('Error fetching bills:', error);
      setMessage('Error loading bills');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = async (billId: string) => {
    try {
      const bill = await PatientFirebaseService.getBill(billId);
      if (bill && bill.pdfBase64) {
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

  const handleDownloadBill = async (billId: string) => {
    try {
      const bill = await PatientFirebaseService.getBill(billId);
      if (bill && bill.pdfBase64) {
        PatientFirebaseService.downloadPDFFromBase64(
          bill.pdfBase64,
          `bill_${billId}_${new Date().toISOString().split('T')[0]}.pdf`
        );
      } else {
        setMessage('PDF not available for download');
      }
    } catch (error) {
      console.error('Error downloading bill:', error);
      setMessage('Error downloading bill');
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.breakdown?.some((item: any) => 
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) || bill.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || 
                       new Date(bill.createdAt).toDateString() === new Date(filterDate).toDateString();
    
    return matchesSearch && matchesDate;
  });

  const totalAmount = bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
  const thisMonthAmount = bills
    .filter(bill => {
      const billDate = new Date(bill.createdAt);
      const now = new Date();
      return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, bill) => sum + (bill.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Bills & Payments</h2>
          <p className="text-gray-600 mt-1">View and download your medical bills</p>
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
                placeholder="Search bills..."
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
              <p className="text-gray-500">Loading bills...</p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {bills.length === 0 ? 'No bills found' : 'No bills match your search criteria'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <div key={bill.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Receipt size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Bill #{bill.id.substring(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(bill.createdAt).toLocaleDateString()} at{' '}
                            {new Date(bill.createdAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-13">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Bill Details:</h4>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">₹{bill.total?.toLocaleString()}</p>
                            <div className="flex items-center space-x-1 text-sm text-green-600">
                              <CheckCircle size={14} />
                              <span>Paid</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {bill.breakdown?.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                              <span className="text-sm text-gray-700">{item.description}</span>
                              <span className="font-medium text-gray-900">₹{item.amount?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleViewBill(bill.id)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                        title="View Bill"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDownloadBill(bill.id)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg"
                        title="Download Bill"
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

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-blue-600">₹{thisMonthAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Receipt size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Total Bills</p>
              <p className="text-2xl font-bold text-purple-600">{bills.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientBills;