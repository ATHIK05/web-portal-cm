import React, { useEffect, useState } from 'react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { PatientFirebaseService } from '../../services/patientFirebaseService';
import { User, MessageSquare, Loader, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Messages: React.FC = () => {
  const { user } = usePatientAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch conversations (doctors patient has appointments with)
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    PatientFirebaseService.getPatientAppointments(user.uid).then(appts => {
      const uniqueDoctors = Array.from(new Set(appts.map(a => a.doctorId)))
        .map(doctorId => {
          const appointment = appts.find(a => a.doctorId === doctorId);
          return {
            doctorId,
            doctorName: appointment?.doctorName || 'Unknown Doctor'
          };
        });
      setConversations(uniqueDoctors);
      setLoading(false);
    });
  }, [user]);

  // Helper to get consistent conversationId (sorted)
  const getConversationId = (doctorId: string) => {
    if (!user) return '';
    return [user.uid, doctorId].sort().join('_');
  };

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user) return;
    setLoading(true);
    const conversationId = getConversationId(selectedConversation.doctorId);
    const unsubscribe = PatientFirebaseService.subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, [selectedConversation, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const conversationId = getConversationId(selectedConversation.doctorId);
    try {
      await PatientFirebaseService.sendMessage(conversationId, user!.uid, selectedConversation.doctorId, newMessage, 'text');
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Messages</h2>
          <p className="text-gray-600 mt-1">Chat with your doctors</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex">
        <aside className="w-72 border-r border-gray-200 p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MessageSquare className="mr-2" size={20} />
            Conversations
          </h3>
          {loading ? (
            <div className="flex justify-center">
              <Loader className="animate-spin" size={24} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No conversations yet.</p>
              <p className="text-xs mt-2">Book an appointment to start chatting with doctors.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {conversations.map(conv => (
                <li key={conv.doctorId}>
                  <button
                    className={`w-full text-left px-3 py-3 rounded-lg flex items-center space-x-3 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      selectedConversation?.doctorId === conv.doctorId 
                        ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <User size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Dr. {conv.doctorName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Click to chat</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        
        <main className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center space-x-3 bg-white dark:bg-gray-800">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Dr. {selectedConversation.doctorName}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.from === user?.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-2 rounded-lg max-w-xs ${
                        msg.from === user?.uid 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.from === user?.uid ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : ''}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="input-field flex-1"
                  placeholder="Type your message..."
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="btn-success flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <MessageSquare className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-lg">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Messages; 