import React, { createContext, useContext, useState, ReactNode } from 'react';

import { JitsiMeetExternalAPI } from 'jitsi-meet';  // Assuming types are available; add if needed

export interface VideoCallState {
  isActive: boolean;
  isMinimized: boolean;
  roomName: string;
  patientId: string;
  displayName: string;
  apiInstance: JitsiMeetExternalAPI | null;
  setApiInstance: (api: JitsiMeetExternalAPI | null) => void;  // Add this
  startCall: (roomName: string, patientId: string, displayName: string) => void;
  minimizeCall: () => void;
  restoreCall: () => void;
  endCall: () => void;
}

const VideoCallContext = createContext<VideoCallState | undefined>(undefined);

export const VideoCallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [apiInstance, setApiInstance] = useState<JitsiMeetExternalAPI | null>(null);

  const startCall = (newRoomName: string, newPatientId: string, newDisplayName: string) => {
    setRoomName(newRoomName);
    setPatientId(newPatientId);
    setDisplayName(newDisplayName);
    setIsActive(true);
    setIsMinimized(false);
  };

  const minimizeCall = () => {
    setIsMinimized(true);
  };

  const restoreCall = () => {
    setIsMinimized(false);
  };

  const endCall = () => {
    if (apiInstance) {
      apiInstance.dispose();
    }
    setApiInstance(null);
    setIsActive(false);
    setIsMinimized(false);
    setRoomName('');
    setPatientId('');
    setDisplayName('');
  };

  return (
    <VideoCallContext.Provider
      value={{
        isActive,
        isMinimized,
        roomName,
        patientId,
        displayName,
        apiInstance,
        setApiInstance,  // Add this
        startCall,
        minimizeCall,
        restoreCall,
        endCall,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (undefined === context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
}; 