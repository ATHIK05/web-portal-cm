import React, { useEffect, useState } from 'react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { PatientFirebaseService } from '../../services/patientFirebaseService';
import { User, MessageSquare, Loader } from 'lucide-react';

const Messages: React.FC = () => {
  const { user } = usePatientAuth();
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
      const uniqueDoctors = Array.from(new Set(appts.map(a => a.doctorId)));
      setConversations(uniqueDoctors.map(doctorId => ({ doctorId, doctorName: appts.find(a => a.doctorId === doctorId)?.doctorName })));
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
    const unsubscribe = PatientFirebaseService.subscribeToMessages(conversationId, async msgs => {
      setMessages(msgs);
      setLoading(false);
      // Mark all messages as seen by the patient if not already
      for (const msg of msgs) {
        if (!msg.seenBy || !msg.seenBy.includes(user.uid)) {
          await PatientFirebaseService.markMessageSeen(msg.id, user.uid);
        }
      }
      // If all messages are seen by both doctor and patient, move to localStorage and delete from Firestore
      if (msgs.length > 0 && msgs.every(m => m.seenBy && m.seenBy.includes(user.uid) && m.seenBy.includes(selectedConversation.doctorId))) {
        localStorage.setItem(`chat_${conversationId}`, JSON.stringify(msgs));
        await PatientFirebaseService.deleteMessagesForConversation(conversationId);
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [selectedConversation, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setLoading(true);
    const conversationId = getConversationId(selectedConversation.doctorId);
    await PatientFirebaseService.sendMessage(conversationId, user.uid, selectedConversation.doctorId, newMessage, 'text');
    setNewMessage('');
    setLoading(false);
  };

  // Load localStorage messages if no Firestore messages
  useEffect(() => {
    if (!selectedConversation || !user) return;
    const conversationId = getConversationId(selectedConversation.doctorId);
    if (messages.length === 0) {
      const localMsgs = localStorage.getItem(`chat_${conversationId}`);
      if (localMsgs) setMessages(JSON.parse(localMsgs));
    }
  }, [selectedConversation, user, messages.length]);

  return (
    <div className="flex h-full">
      <aside className="w-72 bg-white border-r border-gray-200 p-4">
        <h2 className="text-xl font-bold mb-4 flex items-center"><MessageSquare className="mr-2" />Messages</h2>
        {conversations.length === 0 ? (
          <div className="text-gray-500 text-sm">No conversations yet.</div>
        ) : (
          <ul>
            {conversations.map(conv => (
              <li key={conv.doctorId}>
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg mb-2 flex items-center space-x-2 ${selectedConversation?.doctorId === conv.doctorId ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <User size={18} />
                  <span>Dr. {conv.doctorName || conv.doctorId.substring(0, 8)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <main className="flex-1 flex flex-col">
        {selectedConversation ? (
          <div className="flex flex-col h-full">
            <div className="border-b px-6 py-4 flex items-center space-x-2">
              <User size={20} />
              <span className="font-semibold">Dr. {selectedConversation.doctorName || selectedConversation.doctorId.substring(0, 8)}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {loading ? (
                <Loader className="animate-spin mx-auto" />
              ) : messages.length === 0 ? (
                <div className="text-gray-500 text-center">No messages yet.</div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.from === user.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-4 py-2 rounded-lg max-w-xs ${msg.from === user.uid ? 'bg-green-100 text-green-900' : 'bg-white border'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Type your message..."
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={loading || !newMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">Select a conversation</div>
        )}
      </main>
    </div>
  );
};

export default Messages; 