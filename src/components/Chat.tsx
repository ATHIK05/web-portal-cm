import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Video, 
  Paperclip, 
  Smile,
  ArrowLeft,
  User,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';

const Chat: React.FC = () => {
  const { user, doctor } = useAuth();
  const { patientId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
      loadMessages();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      // Mock patient data - replace with actual Firebase call
      setPatient({
        id: patientId,
        name: 'Mohamed Athik',
        phone: '9080262334',
        email: 'mohamedathikr.22msc@kongu.edu',
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      // Mock messages - replace with actual Firebase call
      const mockMessages = [
        {
          id: '1',
          senderId: patientId,
          senderName: 'Mohamed Athik',
          message: 'Hello Doctor, I wanted to discuss my recent test results',
          timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          type: 'text'
        },
        {
          id: '2',
          senderId: user?.uid,
          senderName: doctor?.name,
          message: 'Hello! I\'ve reviewed your test results. How are you feeling today?',
          timestamp: new Date(Date.now() - 240000), // 4 minutes ago
          type: 'text'
        },
        {
          id: '3',
          senderId: patientId,
          senderName: 'Mohamed Athik',
          message: 'I\'m feeling much better, but I have some questions about the medication',
          timestamp: new Date(Date.now() - 180000), // 3 minutes ago
          type: 'text'
        },
        {
          id: '4',
          senderId: user?.uid,
          senderName: doctor?.name,
          message: 'Of course! I\'m happy to answer any questions. Would you like to schedule a video call to discuss this in detail?',
          timestamp: new Date(Date.now() - 120000), // 2 minutes ago
          type: 'text'
        },
        {
          id: '5',
          senderId: patientId,
          senderName: 'Mohamed Athik',
          message: 'Yes, that would be great. When would be a good time?',
          timestamp: new Date(Date.now() - 60000), // 1 minute ago
          type: 'text'
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const message = {
      id: Date.now().toString(),
      senderId: user.uid,
      senderName: doctor?.name || 'Doctor',
      message: newMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Here you would save the message to Firebase
    try {
      // await FirebaseService.sendMessage(patientId, message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (senderId: string) => senderId === user?.uid;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/waiting-room"
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                {patient?.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div>
                <h2 className="font-semibold text-gray-900">{patient?.name || 'Patient'}</h2>
                <p className="text-sm text-gray-600">
                  {patient?.isOnline ? 'Online' : `Last seen ${formatTime(patient?.lastSeen || new Date())}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              title="Voice call"
            >
              <Phone size={20} />
            </button>
            
            <Link
              to={`/video-consultation?patient=${patientId}`}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
              title="Video call"
            >
              <Video size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isMyMessage(message.senderId) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isMyMessage(message.senderId)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`text-xs ${
                      isMyMessage(message.senderId) ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
            <Smile size={20} />
          </button>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;