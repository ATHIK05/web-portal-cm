import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FirebaseService } from '../services/firebaseService';  // Import FirebaseService

const JITSI_DOMAIN = 'meet.jit.si';

const VideoConsultation: React.FC = () => {
  const { doctor, user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [apiInstance, setApiInstance] = useState<any>(null);  // Store API instance

  // Generate a unique room name for one-to-one call
  const roomName = doctor && patientId
    ? [doctor.id, patientId].sort().join('_')
    : 'default_room';
  const displayName = doctor?.name || user?.displayName || 'Doctor';

  useEffect(() => {
    // @ts-ignore
    if (window.JitsiMeetExternalAPI && patientId && doctor) {
      // Clean up previous iframes
      jitsiContainerRef.current!.innerHTML = '';
      // @ts-ignore
      const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName,
        parentNode: jitsiContainerRef.current,
        userInfo: { displayName },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          // Customize interface if needed
        },
      });
      setApiInstance(api);

      // Automatically send invitation link via chat
      const conversationId = [doctor.id, patientId].sort().join('_');
      const inviteLink = `https://${JITSI_DOMAIN}/${roomName}`;
      const messageContent = `Join the video consultation: ${inviteLink}`;
      FirebaseService.sendMessage(
        conversationId,
        doctor.id,  // Assuming doctor.id is the sender's ID
        patientId,
        messageContent,
        'text'
      ).catch(error => console.error('Failed to send invite:', error));

      // Cleanup: Do not dispose here; we'll handle it with End Call button
    }
  }, [roomName, displayName, patientId, doctor]);

  // Function to end the call
  const endCall = () => {
    if (apiInstance) {
      apiInstance.dispose();
      setApiInstance(null);
    }
    navigate('/chat/' + patientId);  // Navigate back to chat or appropriate page
  };

  return (
    <div style={{ height: '80vh', width: '100%', position: 'relative' }}>
      <div ref={jitsiContainerRef} style={{ height: '100%', width: '100%' }} />
      <button
        onClick={endCall}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: 'red',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        End Call
      </button>
    </div>
  );
};

export default VideoConsultation;