import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VideoCallProvider } from './contexts/VideoCallContext';
import FloatingVideo from './components/FloatingVideo';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CheckIn from './components/CheckIn';
import Consultations from './components/Consultations';
import Patients from './components/Patients';
import Reports from './components/Reports';
import Profile from './components/Profile';
import Appointments from './components/Appointments';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import VideoConsultation from './components/VideoConsultation';
import WaitingRoom from './components/WaitingRoom';
import Chat from './components/Chat';
import { ThemeProvider } from './contexts/ThemeContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="consultations" element={<Consultations />} />
        <Route path="patients" element={<Patients />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="video-consultation" element={<VideoConsultation />} />
        <Route path="waiting-room" element={<WaitingRoom />} />
        <Route path="chat/:patientId" element={<Chat />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <VideoCallProvider>
            <AppContent />
            <FloatingVideo />
          </VideoCallProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;