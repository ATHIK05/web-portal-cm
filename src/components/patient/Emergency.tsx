import React, { useState } from 'react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { PatientFirebaseService } from '../../services/patientFirebaseService';
import { AlertCircle, Loader } from 'lucide-react';

const Emergency: React.FC = () => {
  const { user } = usePatientAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEmergency = async () => {
    if (!user || !reason.trim()) {
      setMessage('Please describe your emergency.');
      return;
    }
    setLoading(true);
    const ok = await PatientFirebaseService.bookEmergencyAppointment(user.uid, reason);
    setSuccess(ok);
    setMessage(ok ? 'Emergency appointment requested! A doctor will contact you soon.' : 'Failed to request emergency appointment.');
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-xl shadow border">
      <h2 className="text-2xl font-bold mb-2 flex items-center"><AlertCircle className="mr-2 text-red-600" />Emergency</h2>
      <p className="text-gray-600 mb-4">If you have an urgent medical need, request an emergency consultation. A doctor will be notified immediately.</p>
      {message && (
        <div className={`mb-4 p-3 rounded ${success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{message}</div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Describe your emergency</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
            placeholder="e.g. Chest pain, severe headache, etc."
            disabled={loading || success}
          />
        </div>
        <button
          onClick={handleEmergency}
          className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
          disabled={loading || success}
        >
          {loading ? <Loader className="animate-spin mr-2" /> : <AlertCircle className="mr-2" />} Request Emergency
        </button>
      </div>
      <div className="mt-6 text-sm text-gray-500">
        <p>If this is a life-threatening emergency, please call your local emergency number immediately.</p>
      </div>
    </div>
  );
};

export default Emergency; 