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
import { FirebaseService } from '../services/firebaseService';

const Chat: React.FC = () => {
  const { user, doctor } = useAuth();
  const { patientId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (patientId && user) {
      const ids = [user.uid, patientId].sort();
      const convId = `${ids[0]}_${ids[1]}`;
      setConversationId(convId);
      loadPatientData();
      loadMessages(convId);
    }
  }, [patientId, user]);

  const loadPatientData = async () => {
    if (!patientId) return;
    try {
      const data = await FirebaseService.getPatientById(patientId);
      setPatient(data);
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const loadMessages = (convId: string) => {
    setLoading(true);
    if (!convId) return;
    const unsubscribe = FirebaseService.subscribeToMessages(convId, (msgs) => {
      setMessages(msgs.map(m => ({
        ...m,
        timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp)
      })));
      setLoading(false);
    });
    return unsubscribe;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !conversationId || !patientId) return;

    try {
      await FirebaseService.sendMessage(
        conversationId,
        user.uid,
        patientId,
        newMessage.trim(),
        'text'
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (from: string) => from === user?.uid;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="header p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/waiting-room"
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft size={20} />
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                {patient?.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                )}
              </div>
              
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">{patient?.name || 'Patient'}</h2>
                {patient?.isOnline && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Online</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Voice call"
            >
              <Phone size={20} />
            </button>
            
            <Link
              to={`/video-consultation?patient=${patientId}`}
              className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
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
              className={`flex ${isMyMessage(message.from) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isMyMessage(message.from)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`text-xs ${
                      isMyMessage(message.from) ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
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
      <div className="header p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="input-field resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="btn-primary p-2"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;