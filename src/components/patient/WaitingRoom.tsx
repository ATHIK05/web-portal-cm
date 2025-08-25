import React, { useEffect, useState } from 'react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { PatientFirebaseService } from '../../services/patientFirebaseService';
import { Video, Clock, AlertCircle, Loader, User } from 'lucide-react';

const WaitingRoom: React.FC = () => {
  const { user, patient } = usePatientAuth();
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  useEffect(() => {
    // Fetch all doctors for dropdown
    PatientFirebaseService.getAvailableDoctors().then(setDoctors);
  }, []);

  useEffect(() => {
    if (doctorId) {
      const doctor = doctors.find(d => d.id === doctorId);
      setSelectedDoctor(doctor);
    }
  }, [doctorId, doctors]);

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

  const startVideoCall = () => {
    if (selectedDoctor) {
      const roomName = [user?.uid, doctorId].sort().join('_');
      window.open(`https://meet.jit.si/${roomName}`, '_blank');
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Video Consultation</h2>
          <p className="text-gray-600 mt-1">Join video consultation with your doctor</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            joined || message.includes('successfully') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {!joined ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Available Doctor</label>
              {doctors.length === 0 ? (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No doctors are currently available for video consultation.</p>
                  <p className="text-sm text-gray-400 mt-2">Please check back later or book a regular appointment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doc: any) => (
                    <div
                      key={doc.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        doctorId === doc.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => setDoctorId(doc.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Dr. {doc.name}</h4>
                          <p className="text-sm text-gray-600">{doc.specializations?.[0] || 'General'}</p>
                          <p className="text-xs text-green-600">Available Now</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {doctorId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Consultation (Optional)</label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="e.g. Follow-up, new symptoms, general consultation..."
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleJoin}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                    disabled={loading}
                  >
                    {loading ? <Loader className="animate-spin" size={20} /> : <Video size={20} />}
                    <span>Join Waiting Room</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 text-green-700 bg-green-50 p-6 rounded-lg">
              <Clock size={24} />
              <span className="text-lg font-medium">Waiting for Dr. {selectedDoctor?.name} to start the consultation...</span>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your doctor will be notified that you're waiting</li>
                <li>• You'll receive a notification when the doctor is ready</li>
                <li>• The video call will start automatically</li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={startVideoCall}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Video size={20} />
                <span>Start Video Call Now</span>
              </button>
              <button
                onClick={handleLeave}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                disabled={loading}
              >
                {loading ? <Loader className="animate-spin" size={20} /> : <AlertCircle size={20} />}
                <span>Leave</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Video Consultation Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Before the call:</h4>
            <ul className="space-y-1">
              <li>• Ensure stable internet connection</li>
              <li>• Test your camera and microphone</li>
              <li>• Find a quiet, well-lit space</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">During the call:</h4>
            <ul className="space-y-1">
              <li>• Speak clearly and look at the camera</li>
              <li>• Have your medical history ready</li>
              <li>• Take notes of doctor's advice</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom; 