import React, { useState, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  MessageSquare,
  Users,
  Settings,
  Monitor,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';

const VideoConsultation: React.FC = () => {
  const { doctor } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (patientId) {
      // Load patient data and start call
      loadPatientData();
      setIsCallActive(true);
    }
  }, [patientId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const loadPatientData = async () => {
    // Mock patient data - replace with actual Firebase call
    setCurrentPatient({
      id: patientId,
      name: 'Mohamed Athik',
      age: 25,
      phone: '9080262334',
      reason: 'Follow-up consultation'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallDuration(0);
    // Navigate back to dashboard or waiting room
  };

  const toggleVideo = () => setIsVideoOn(!isVideoOn);
  const toggleAudio = () => setIsAudioOn(!isAudioOn);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Video Consultation</h1>
          {currentPatient && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">with</span>
              <span className="font-medium">{currentPatient.name}</span>
              {isCallActive && (
                <span className="text-green-400 text-sm">
                  {formatDuration(callDuration)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/waiting-room"
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <Users size={16} />
            <span>Waiting Room</span>
          </Link>
          <Link
            to="/dashboard"
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex">
        {/* Main Video */}
        <div className="flex-1 relative bg-black">
          {isCallActive ? (
            <div className="w-full h-full flex items-center justify-center">
              {isVideoOn ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Patient Video Feed</p>
                    <p className="text-sm text-gray-400">Video call in progress</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-white">
                  <VideoOff size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Video is off</p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <Video size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-xl mb-2">Ready for Video Consultation</p>
                <p className="text-gray-400">Select a patient from the waiting room to start</p>
              </div>
            </div>
          )}

          {/* Doctor's Video (Picture-in-Picture) */}
          {isCallActive && (
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-white">
                {isVideoOn ? (
                  <div className="text-center">
                    <Camera size={32} className="mx-auto mb-2 opacity-75" />
                    <p className="text-xs">Dr. {doctor?.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <VideoOff size={32} className="mx-auto mb-2 opacity-75" />
                    <p className="text-xs">Video Off</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Chat</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <p className="text-sm text-blue-900">Hello Doctor, thank you for the consultation</p>
                  <span className="text-xs text-blue-600">Patient • 2 min ago</span>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg ml-8">
                  <p className="text-sm text-gray-900">You're welcome! How are you feeling today?</p>
                  <span className="text-xs text-gray-600">You • 1 min ago</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
            } text-white transition-colors`}
            title={isVideoOn ? 'Turn off video' : 'Turn on video'}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${
              isAudioOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
            } text-white transition-colors`}
            title={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full ${
              showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white transition-colors`}
            title="Toggle chat"
          >
            <MessageSquare size={20} />
          </button>

          <button
            className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>

          <button
            className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            title="Share screen"
          >
            <Monitor size={20} />
          </button>

          {isCallActive ? (
            <button
              onClick={handleEndCall}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="End call"
            >
              <PhoneOff size={20} />
            </button>
          ) : (
            <button
              onClick={() => setIsCallActive(true)}
              className="p-3 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors"
              title="Start call"
              disabled={!currentPatient}
            >
              <Phone size={20} />
            </button>
          )}
        </div>

        {/* Patient Info */}
        {currentPatient && (
          <div className="mt-4 text-center text-white">
            <p className="text-sm text-gray-300">
              Consulting with <span className="font-medium">{currentPatient.name}</span>
              {currentPatient.reason && (
                <span className="text-gray-400"> • {currentPatient.reason}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoConsultation;