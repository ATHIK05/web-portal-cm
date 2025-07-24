import React, { useEffect, useState } from 'react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { PatientFirebaseService } from '../../services/patientFirebaseService';
import { Video, Clock, AlertCircle, Loader } from 'lucide-react';

const WaitingRoom: React.FC = () => {
  const { user, patient } = usePatientAuth();
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all doctors for dropdown
    PatientFirebaseService.getAllDoctors().then(setDoctors);
  }, []);

  const handleJoin = async () => {
    if (!user || !doctorId) {
      setMessage('Please select a doctor.');
      return;
    }
    setLoading(true);
    const success = await PatientFirebaseService.joinWaitingRoom(user.uid, doctorId, reason || 'Waiting for consultation');
    setJoined(success);
    setMessage(success ? 'You have joined the waiting room.' : 'Failed to join waiting room.');
    setLoading(false);
  };

  const handleLeave = async () => {
    if (!user || !doctorId) return;
    setLoading(true);
    await PatientFirebaseService.leaveWaitingRoom(user.uid, doctorId);
    setJoined(false);
    setMessage('You have left the waiting room.');
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow border">
      <h2 className="text-2xl font-bold mb-2 flex items-center"><Video className="mr-2" />Waiting Room</h2>
      <p className="text-gray-600 mb-4">Join the waiting room to let your doctor know you are ready for a video consultation.</p>
      {message && (
        <div className={`mb-4 p-3 rounded ${joined ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{message}</div>
      )}
      {!joined ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Select a doctor --</option>
              {doctors.map((doc: any) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.name} ({doc.specializations?.[0] || 'General'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Follow-up, new symptoms, etc."
            />
          </div>
          <button
            onClick={handleJoin}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <Loader className="animate-spin mr-2" /> : <Video className="mr-2" />} Join Waiting Room
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-green-700">
            <Clock />
            <span>Waiting for your doctor to start the consultation...</span>
          </div>
          <button
            onClick={handleLeave}
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <Loader className="animate-spin mr-2" /> : <AlertCircle className="mr-2" />} Leave Waiting Room
          </button>
        </div>
      )}
    </div>
  );
};

export default WaitingRoom; 