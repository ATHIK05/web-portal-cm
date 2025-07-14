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
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import imageCompression from 'browser-image-compression';

const Chat: React.FC = () => {
  const { user, doctor } = useAuth();
  const { patientId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (patientId && user) {
      // Deterministic conversationId: doctorId_patientId (sorted)
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
    // Subscribe to real-time messages
    const unsubscribe = FirebaseService.subscribeToMessages(convId, (msgs) => {
      setMessages(msgs.map(m => ({
        ...m,
        timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp)
      })));
      setLoading(false);
    });
    return unsubscribe;
  };

  // Handle emoji select
  const addEmoji = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  // Handle file attachment
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !patientId || !user) return;
    let base64 = '';
    let type = '';
    try {
      if (file.type.startsWith('image/')) {
        // Compress image
        const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1024 });
        base64 = await imageCompression.getDataUrlFromFile(compressed);
        type = 'image';
      } else if (file.type === 'application/pdf') {
        // Read PDF as base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise(resolve => { reader.onload = resolve; });
        base64 = reader.result as string;
        type = 'pdf';
      } else {
        alert('Only images and PDF files are allowed.');
        return;
      }
      // Store in Firestore
      await FirebaseService.sendMessage(
        conversationId,
        user.uid,
        patientId,
        base64,
        type
      );
      // Store in localStorage for continuity
      const key = `chat_${conversationId}`;
      const local = JSON.parse(localStorage.getItem(key) || '[]');
      local.push({
        from: user.uid,
        to: patientId,
        content: base64,
        type,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(local));
    } catch (err) {
      alert('Failed to attach file.');
    }
    e.target.value = '';
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    if (!conversationId || !patientId) return;
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
      sendMessage();
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
                {patient?.isOnline && (
                  <p className="text-sm text-gray-600">Online</p>
                )}
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
              className={`flex ${isMyMessage(message.from) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isMyMessage(message.from)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {message.type === 'image' ? (
                  <img src={message.content} alt="attachment" className="max-w-xs max-h-60 rounded mb-1" />
                ) : message.type === 'pdf' ? (
                  <a href={message.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block mb-1">View PDF</a>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`text-xs ${
                      isMyMessage(message.from) ? 'text-blue-100' : 'text-gray-500'
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
          <button
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            onClick={handleAttachClick}
            title="Attach file"
          >
            <Paperclip size={20} />
            <input
              type="file"
              accept="image/*,application/pdf"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
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
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50">
                <Picker data={data} onEmojiSelect={addEmoji} theme="light" />
              </div>
            )}
          </div>
          
          <button
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowEmojiPicker(v => !v)}
            title="Insert emoji"
          >
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