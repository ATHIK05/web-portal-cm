import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Video, 
  MessageSquare, 
  Clock, 
  Phone,
  User,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const WaitingRoom: React.FC = () => {
  const { user } = useAuth();
  const [waitingPatients, setWaitingPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Real-time Firestore listener for waiting patients
    // Uncomment the where line if you want to filter by doctorId
    const q = query(
      collection(db, 'waitingRoom'),
      // where('doctorId', '==', user.uid),
      orderBy('waitingSince', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          waitingSince: data.waitingSince?.toDate ? data.waitingSince.toDate() : data.waitingSince
        };
      });
      setWaitingPatients(patients);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredPatients = waitingPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startVideoCall = (patientId: string) => {
    // Navigate to video consultation with patient
    window.location.href = `/video-consultation?patient=${patientId}`;
  };

  const sendMessage = (patientId: string) => {
    // Navigate to chat with patient
    window.location.href = `/chat/${patientId}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Waiting Room</h2>
          <p className="text-gray-600 mt-1">Manage patients waiting for video consultation</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Video Consultation Active</span>
          </div>
          <Link
            to="/video-consultation"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Video size={16} />
            <span>Consultation Room</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Users className="text-gray-400" size={20} />
              <span className="text-sm text-gray-600">
                {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} waiting
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading waiting patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No patients in waiting room</p>
              <p className="text-sm text-gray-400">
                Patients will appear here when they join for video consultation
              </p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div key={patient.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        patient.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(patient.priority)}`}>
                          {patient.priority}
                        </span>
                        {!patient.isOnline && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            Offline
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{patient.reason}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>Waiting since {patient.waitingSince}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone size={12} />
                          <span>{patient.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => sendMessage(patient.id)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Send message"
                    >
                      <MessageSquare size={18} />
                    </button>
                    
                    <button
                      onClick={() => startVideoCall(patient.id)}
                      disabled={!patient.isOnline}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        patient.isOnline
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={patient.isOnline ? 'Start video call' : 'Patient is offline'}
                    >
                      <Video size={16} />
                      <span>Start Call</span>
                    </button>
                  </div>
                </div>

                {patient.priority === 'urgent' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Urgent consultation requested - Patient has been waiting for {patient.waitingDuration}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Total Waiting</p>
              <p className="text-2xl font-bold text-blue-600">{waitingPatients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Video size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Online Patients</p>
              <p className="text-2xl font-bold text-green-600">
                {waitingPatients.filter(p => p.isOnline).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Urgent Cases</p>
              <p className="text-2xl font-bold text-red-600">
                {waitingPatients.filter(p => p.priority === 'urgent').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;