import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FirebaseService } from '../services/firebaseService';
import { useVideoCall } from '../contexts/VideoCallContext';

const JITSI_DOMAIN = 'meet.jit.si';

const VideoConsultation: React.FC = () => {
  const { doctor, user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { startCall, minimizeCall, apiInstance, setApiInstance, isMinimized } = useVideoCall();

  // Generate a unique room name for one-to-one call
  const roomName = doctor && patientId
    ? [doctor.id, patientId].sort().join('_')
    : 'default_room';
  const displayName = doctor?.name || user?.displayName || 'Doctor';

  useEffect(() => {
    if (patientId && doctor && !isMinimized) {
      // Start the call in context
      startCall(roomName, patientId, displayName);

      // Create API instance if not exists
      if (!apiInstance && window.JitsiMeetExternalAPI) {
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
      }

      // Automatically send invitation link via chat (once)
      const conversationId = [doctor.id, patientId].sort().join('_');
      const inviteLink = `https://${JITSI_DOMAIN}/${roomName}`;
      const messageContent = `Join the video consultation: ${inviteLink}`;
      FirebaseService.sendMessage(
        conversationId,
        doctor.id,
        patientId,
        messageContent,
        'text'
      ).catch(error => console.error('Failed to send invite:', error));
    }
  }, [patientId, doctor, roomName, displayName, isMinimized, apiInstance, startCall, setApiInstance]);

  const handleMinimize = () => {
    minimizeCall();
    navigate('/waiting-room');  // Or any default page
  };

  const endCall = () => {
    if (apiInstance) {
      apiInstance.dispose();
      setApiInstance(null);
    }
    navigate('/waiting-room');
  };

  if (isMinimized) {
    // Don't render full UI if minimized
    return null;
  }

  return (
    <div style={{ height: '80vh', width: '100%', position: 'relative' }}>
      <div ref={jitsiContainerRef} style={{ height: '100%', width: '100%' }} />
      <button
        onClick={handleMinimize}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          padding: '10px 20px',
          backgroundColor: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Minimize
      </button>
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