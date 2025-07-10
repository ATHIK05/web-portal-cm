import { useState, useEffect } from 'react';
import { FirebaseService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

export const useAppointments = (date?: Date) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const data = await FirebaseService.getDoctorAppointments(user.uid, date);
        setAppointments(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch appointments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, date]);

  return { appointments, loading, error, refetch: () => {
    if (user) {
      FirebaseService.getDoctorAppointments(user.uid, date).then(setAppointments);
    }
  }};
};

export const usePatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPatients = async () => {
      setLoading(true);
      try {
        const data = await FirebaseService.getDoctorPatients(user.uid);
        setPatients(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch patients');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user]);

  return { patients, loading, error, refetch: () => {
    if (user) {
      FirebaseService.getDoctorPatients(user.uid).then(setPatients);
    }
  }};
};

export const useDashboardStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    todayAppointments: 0,
    completedConsultations: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await FirebaseService.getDashboardStats(user.uid);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, loading, refetch: () => {
    if (user) {
      FirebaseService.getDashboardStats(user.uid).then(setStats);
    }
  }};
};