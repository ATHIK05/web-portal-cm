import React from 'react';
import { Outlet } from 'react-router-dom';
import PatientSidebar from './PatientSidebar';
import PatientHeader from './PatientHeader';

const PatientLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-green-600/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>
      
      <PatientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <PatientHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 animate-fade-in-scale">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;