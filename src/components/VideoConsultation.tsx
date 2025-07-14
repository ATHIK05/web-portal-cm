import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

const JITSI_DOMAIN = 'meet.jit.si';

const VideoConsultation: React.FC = () => {
  const { doctor, user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

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
      return () => api.dispose();
    }
  }, [roomName, displayName, patientId, doctor]);

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <div ref={jitsiContainerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default VideoConsultation;