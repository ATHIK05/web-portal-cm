import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Search,
  Filter,
  PieChart,
  BarChart3,
  Loader,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/firebaseService';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState('comprehensive');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);

  useEffect(() => {
    if (user) {
      loadPatients();
      loadReports();
    }
  }, [user]);

  const loadPatients = async () => {
    if (!user) return;
    setLoadingPatients(true);
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
      console.error('Error loading patients:', error);
      setMessage('Error loading patients data');
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadReports = async () => {
    if (!user) return;
    setLoadingReports(true);
    try {
      const reportsData = await FirebaseService.getReports(user.uid);
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedPatient) {
      setMessage('Please select a patient');
      return;
    }

    if (!dateRange.start || !dateRange.end) {
      setMessage('Please select date range');
      return;
    }

    if (!user) {
      setMessage('User not authenticated');
      return;
    }
    
    setLoading(true);
    setMessage('');

    try {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      if (startDate > endDate) {
        setMessage('Start date cannot be after end date');
        setLoading(false);
        return;
      }

      const selectedPatientData = patients.find(p => p.id === selectedPatient);
      if (!selectedPatientData) {
        setMessage('Selected patient not found');
        setLoading(false);
        return;
      }

      const reportId = await FirebaseService.generatePatientReport(
        user.uid,
        selectedPatientData.id,
        { start: startDate, end: endDate },
        reportType
      );

      if (reportId) {
        setMessage('Report generated successfully!');
        loadReports(); // Refresh reports list
        
        // Download the report
        const pdfBase64 = await FirebaseService.downloadReport(reportId);
        if (pdfBase64) {
          const patientName = `${selectedPatientData.firstName || ''} ${selectedPatientData.lastName || ''}`.trim();
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${pdfBase64}`;
          link.download = `${patientName}_report_${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
        }
      } else {
        setMessage('Failed to generate report. Please try again.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setMessage('An error occurred while generating the report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId: string, patientName: string, createdAt: Date) => {
    try {
      const pdfBase64 = await FirebaseService.downloadReport(reportId);
      if (pdfBase64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfBase64}`;
        link.download = `${patientName}_report_${createdAt.toISOString().split('T')[0]}.pdf`;
        link.click();
      } else {
        setMessage('Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      setMessage('Error downloading report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Patient Reports</h2>
          <p className="text-gray-600 mt-1">Export comprehensive patient consultation records</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Patient Report</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingPatients}
                >
                  <option value="">
                    {loadingPatients ? 'Loading patients...' : 'Choose a patient...'}
                  </option>
                  {patients.map(patient => {
                    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
                    return (
                      <option key={patient.id} value={patient.id}>
                        {fullName || 'Unknown Patient'} ({patient.phoneNumber || 'No phone'})
                      </option>
                    );
                  })}
                </select>
              </div>
              {patients.length === 0 && !loadingPatients && (
                <p className="text-sm text-gray-500 mt-1">
                  No patients found. Patients will appear here once they book appointments with you.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportType"
                    value="comprehensive"
                    checked={reportType === 'comprehensive'}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Comprehensive Report (All data)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportType"
                    value="prescriptions"
                    checked={reportType === 'prescriptions'}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Prescriptions Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportType"
                    value="bills"
                    checked={reportType === 'bills'}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Bills Only</span>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Report Will Include:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Patient demographics and contact information</li>
                <li>• Complete appointment history for selected date range</li>
                {(reportType === 'comprehensive' || reportType === 'prescriptions') && (
                  <li>• All prescriptions with medicine details</li>
                )}
                {(reportType === 'comprehensive' || reportType === 'bills') && (
                  <li>• Billing records and payment history</li>
                )}
                <li>• Doctor's notes and observations</li>
                <li>• Generated as downloadable PDF</li>
              </ul>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={loading || !selectedPatient || !dateRange.start || !dateRange.end || loadingPatients}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader className="animate-spin" size={16} />}
              <Download size={16} />
              <span>{loading ? 'Generating...' : 'Generate & Download Report'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
            {loadingReports ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                    <div>
                      <div className="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-3">
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{report.patientName}</p>
                      <p className="text-xs text-gray-600">
                        {report.createdAt.toLocaleDateString()} • {report.reportType}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDownloadReport(report.id, report.patientName, report.createdAt)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                      title="Download Report"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No reports generated yet</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Patients</span>
                <span className="text-sm font-medium text-gray-900">
                  {loadingPatients ? '...' : patients.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reports Generated</span>
                <span className="text-sm font-medium text-gray-900">
                  {loadingReports ? '...' : reports.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="text-sm font-medium text-gray-900">
                  {loadingReports ? '...' : reports.filter(r => {
                    const reportDate = r.createdAt;
                    const now = new Date();
                    return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;