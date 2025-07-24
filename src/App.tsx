import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PatientAuthProvider, usePatientAuth } from './contexts/PatientAuthContext';
import { VideoCallProvider } from './contexts/VideoCallContext';
import FloatingVideo from './components/FloatingVideo';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Landing from './components/Landing';
import Layout from './components/Layout';
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
import PatientLogin from './components/patient/PatientLogin';
import PatientLayout from './components/patient/PatientLayout';
import PatientDashboard from './components/patient/PatientDashboard';
import PatientAppointments from './components/patient/PatientAppointments';
import BookAppointment from './components/patient/BookAppointment';
import PatientPrescriptions from './components/patient/PatientPrescriptions';
import PatientBills from './components/patient/PatientBills';
import Doctors from './components/patient/Doctors';
import Messages from './components/patient/Messages';
import PatientWaitingRoom from './components/patient/WaitingRoom';
import Emergency from './components/patient/Emergency';

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

const PatientProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = usePatientAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/patient/login" />;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <VideoCallProvider>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Landing />} />

            {/* Doctor Auth */}
            <Route path="/login" element={
              <AuthProvider>
                <Login />
              </AuthProvider>
            } />

            {/* Doctor Portal */}
            <Route path="/*" element={
              <AuthProvider>
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              </AuthProvider>
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

            {/* Patient Auth */}
            <Route path="/patient/login" element={
              <PatientAuthProvider>
                <PatientLogin />
              </PatientAuthProvider>
            } />

            {/* Patient Portal */}
            <Route path="/patient/*" element={
              <PatientAuthProvider>
                <PatientProtectedRoute>
                  <PatientLayout />
                </PatientProtectedRoute>
              </PatientAuthProvider>
            }>
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="appointments" element={<PatientAppointments />} />
              <Route path="book-appointment" element={<BookAppointment />} />
              <Route path="prescriptions" element={<PatientPrescriptions />} />
              <Route path="bills" element={<PatientBills />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="messages" element={<Messages />} />
              <Route path="waiting-room" element={<PatientWaitingRoom />} />
              <Route path="emergency" element={<Emergency />} />
            </Route>
          </Routes>
          <FloatingVideo />
        </VideoCallProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;