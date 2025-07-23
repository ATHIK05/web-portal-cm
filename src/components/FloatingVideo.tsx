import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useVideoCall } from '../contexts/VideoCallContext';

import { useNavigate } from 'react-router-dom';

const JITSI_DOMAIN = 'meet.jit.si';

const FloatingVideo: React.FC = () => {
  const { isActive, isMinimized, roomName, displayName, apiInstance, endCall, restoreCall, setApiInstance } = useVideoCall();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isActive && isMinimized && jitsiContainerRef.current && !apiInstance) {
      // Create new API instance for floating window
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
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          TOOLBAR_BUTTONS: ['microphone', 'camera', 'tileview'],
        },
      });
      setApiInstance(api);
    }

    return () => {
      // Don't dispose here; only on endCall
    };
  }, [isActive, isMinimized, roomName, displayName, apiInstance, setApiInstance]);

  if (!isActive || !isMinimized) return null;

  const handleRestore = () => {
    restoreCall();
    navigate('/video-consultation');
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '300px',
        height: '200px',
        backgroundColor: 'white',
        border: '1px solid gray',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      <div ref={jitsiContainerRef} style={{ height: '100%', width: '100%' }} />
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          onClick={handleRestore}
          style={{ padding: '5px 10px', backgroundColor: 'blue', color: 'white', borderRadius: '4px' }}
        >
          Restore
        </button>
        <button
          onClick={endCall}
          style={{ padding: '5px 10px', backgroundColor: 'red', color: 'white', borderRadius: '4px' }}
        >
          End
        </button>
      </div>
    </div>,
    document.body
  );
};

export default FloatingVideo; 