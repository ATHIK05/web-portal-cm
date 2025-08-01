import React from 'react';
import { Outlet } from 'react-router-dom';
import PatientSidebar from './PatientSidebar';
import PatientHeader from './PatientHeader';

const PatientLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <PatientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PatientHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;