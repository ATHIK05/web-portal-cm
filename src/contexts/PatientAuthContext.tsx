import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Patient } from '../types';

interface PatientAuthContextType {
  user: User | null;
  patient: Patient | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

export const usePatientAuth = () => {
  const context = useContext(PatientAuthContext);
  if (context === undefined) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
};

interface PatientAuthProviderProps {
  children: ReactNode;
}

export const PatientAuthProvider: React.FC<PatientAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const patientDoc = await getDoc(doc(db, 'patients', user.uid));
          if (patientDoc.exists()) {
            const patientData = { 
              id: user.uid, 
              ...patientDoc.data(),
              name: `${patientDoc.data().firstName || ''} ${patientDoc.data().lastName || ''}`.trim()
            } as Patient;
            setPatient(patientData);
          }
        } catch (error) {
          console.error('Error fetching patient data:', error);
        }
      } else {
        setPatient(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    patient,
    loading,
    signOut
  };

  return (
    <PatientAuthContext.Provider value={value}>
      {children}
    </PatientAuthContext.Provider>
  );
};