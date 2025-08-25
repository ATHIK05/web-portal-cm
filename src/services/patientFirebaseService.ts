import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Patient, Appointment, Doctor, Prescription, Bill } from '../types';

export class PatientFirebaseService {
  // Patient Services
  static async getPatientProfile(patientId: string): Promise<Patient | null> {
    try {
      const patientDoc = await getDoc(doc(db, 'patients', patientId));
      if (patientDoc.exists()) {
        return { id: patientId, ...patientDoc.data() } as Patient;
      }
      return null;
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      return null;
    }
  }

  static async updatePatientProfile(patientId: string, data: Partial<Patient>): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'patients', patientId), {
        ...data,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating patient profile:', error);
      return false;
    }
  }

  // Doctor Services
  static async getAvailableDoctors(): Promise<Doctor[]> {
    try {
      const doctorsQuery = query(
        collection(db, 'doctors'),
        where('isCheckedIn', '==', true)
      );
      
      const snapshot = await getDocs(doctorsQuery);
      const doctors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Doctor[];
      
      return doctors;
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      return [];
    }
  }

  static async getAllDoctors(): Promise<Doctor[]> {
    try {
      const snapshot = await getDocs(collection(db, 'doctors'));
      const doctors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Doctor[];
      
      return doctors;
    } catch (error) {
      console.error('Error fetching all doctors:', error);
      return [];
    }
  }

  static async getDoctorById(doctorId: string): Promise<Doctor | null> {
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
      if (doctorDoc.exists()) {
        return { id: doctorId, ...doctorDoc.data() } as Doctor;
      }
      return null;
    } catch (error) {
      console.error('Error fetching doctor by ID:', error);
      return null;
    }
  }

  static async getDoctorBookedSlots(doctorId: string, date: Date): Promise<string[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay)),
        where('status', '==', 'scheduled')
      );

      const snapshot = await getDocs(appointmentsQuery);
      return snapshot.docs.map(doc => doc.data().timeSlot);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      return [];
    }
  }

  // Appointment Services
  static async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    try {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', patientId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(appointmentsQuery);
      const appointments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date ? data.date.toDate() : new Date(),
        };
      }) as Appointment[];
      
      return appointments;
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      return [];
    }
  }

  static async bookAppointment(appointmentData: any): Promise<boolean> {
    try {
      // Use atomic transaction to prevent double booking
      const appointmentsRef = collection(db, 'appointments');
      
      const success = await runTransaction(db, async (transaction) => {
        // Check if slot is still available
        const conflictQuery = query(
          appointmentsRef,
          where('doctorId', '==', appointmentData.doctorId),
          where('date', '==', Timestamp.fromDate(appointmentData.appointmentDate)),
          where('timeSlot', '==', appointmentData.timeSlot),
          where('status', '==', 'scheduled')
        );
        
        const conflictSnapshot = await getDocs(conflictQuery);
        if (!conflictSnapshot.empty) {
          throw new Error('Time slot already booked');
        }

        // Book the appointment
        const newAppointmentRef = doc(appointmentsRef);
        transaction.set(newAppointmentRef, {
          ...appointmentData,
          date: Timestamp.fromDate(appointmentData.appointmentDate),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });

        return true;
      });

      return success;
    } catch (error) {
      console.error('Error booking appointment:', error);
      return false;
    }
  }

  static async cancelAppointment(appointmentId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'cancelled',
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return false;
    }
  }

  // Prescription Services
  static async getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    try {
      const prescriptionsRef = collection(db, 'prescriptions');
      const allPrescriptionsSnapshot = await getDocs(prescriptionsRef);
      const prescriptions: Prescription[] = [];
      for (const docSnap of allPrescriptionsSnapshot.docs) {
        const presc = { id: docSnap.id, ...docSnap.data() } as Prescription;
        if (presc.appointmentId) {
          const appointmentDoc = await getDoc(doc(db, 'appointments', presc.appointmentId));
          if (appointmentDoc.exists()) {
            const appointment = appointmentDoc.data();
            console.log('[DEBUG] Prescription', presc.id, 'appointment', presc.appointmentId, 'appointment.patientId', appointment.patientId, 'current patientId', patientId);
            if (appointment.patientId === patientId) {
              prescriptions.push({
                ...presc,
                createdAt:
                  presc.createdAt instanceof Date
                    ? presc.createdAt
                    : (presc.createdAt && typeof (presc.createdAt as any).toDate === 'function')
                      ? (presc.createdAt as any).toDate()
                      : new Date()
              });
            }
          } else {
            console.log('[DEBUG] Prescription', presc.id, 'appointment', presc.appointmentId, 'appointment not found');
          }
        } else {
          console.log('[DEBUG] Prescription', presc.id, 'no appointmentId');
        }
      }
      return prescriptions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      return [];
    }
  }

  static async getPrescription(prescriptionId: string): Promise<Prescription | null> {
    try {
      const prescriptionDoc = await getDoc(doc(db, 'prescriptions', prescriptionId));
      if (prescriptionDoc.exists()) {
        const data = prescriptionDoc.data();
        return {
          id: prescriptionId,
          ...data,
          createdAt: data.createdAt.toDate()
        } as Prescription;
      }
      return null;
    } catch (error) {
      console.error('Error fetching prescription:', error);
      return null;
    }
  }

  // Bill Services
  static async getPatientBills(patientId: string): Promise<Bill[]> {
    try {
      const billsRef = collection(db, 'bills');
      const allBillsSnapshot = await getDocs(billsRef);
      const bills: Bill[] = [];
      for (const docSnap of allBillsSnapshot.docs) {
        const bill = { id: docSnap.id, ...docSnap.data() } as Bill;
        if (bill.appointmentId) {
          const appointmentDoc = await getDoc(doc(db, 'appointments', bill.appointmentId));
          if (appointmentDoc.exists()) {
            const appointment = appointmentDoc.data();
            console.log('[DEBUG] Bill', bill.id, 'appointment', bill.appointmentId, 'appointment.patientId', appointment.patientId, 'current patientId', patientId);
            if (appointment.patientId === patientId) {
              bills.push({
                ...bill,
                createdAt:
                  bill.createdAt instanceof Date
                    ? bill.createdAt
                    : (bill.createdAt && typeof (bill.createdAt as any).toDate === 'function')
                      ? (bill.createdAt as any).toDate()
                      : new Date()
              });
            }
          } else {
            console.log('[DEBUG] Bill', bill.id, 'appointment', bill.appointmentId, 'appointment not found');
          }
        } else {
          console.log('[DEBUG] Bill', bill.id, 'no appointmentId');
        }
      }
      return bills.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error fetching patient bills:', error);
      return [];
    }
  }

  static async getBill(billId: string): Promise<Bill | null> {
    try {
      const billDoc = await getDoc(doc(db, 'bills', billId));
      if (billDoc.exists()) {
        const data = billDoc.data();
        return {
          id: billId,
          ...data,
          createdAt: data.createdAt.toDate()
        } as Bill;
      }
      return null;
    } catch (error) {
      console.error('Error fetching bill:', error);
      return null;
    }
  }

  // Dashboard Statistics
  static async getPatientDashboardStats(patientId: string): Promise<any> {
    try {
      const appointments = await this.getPatientAppointments(patientId);
      const upcoming = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate > new Date() && apt.status === 'scheduled';
      });
      const completed = appointments.filter(apt => apt.status === 'completed');
      
      const doctors = await this.getAvailableDoctors();
      
      return {
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        totalDoctors: doctors.length,
        unreadMessages: 0 // TODO: Implement message counting
      };
    } catch (error) {
      console.error('Error fetching patient dashboard stats:', error);
      return {
        upcomingAppointments: 0,
        completedAppointments: 0,
        totalDoctors: 0,
        unreadMessages: 0
      };
    }
  }

  // Emergency Services
  static async bookEmergencyAppointment(patientId: string, reason: string): Promise<boolean> {
    try {
      // Find available doctors
      const availableDoctors = await this.getAvailableDoctors();
      if (availableDoctors.length === 0) {
        throw new Error('No doctors available for emergency consultation');
      }

      // Book with first available doctor
      const doctor = availableDoctors[0];
      const now = new Date();
      const emergencySlot = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} - Emergency`;

      const appointmentData = {
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specializations?.[0] || 'Emergency',
        patientId,
        date: now,
        timeSlot: emergencySlot,
        type: 'emergency',
        reason: `EMERGENCY: ${reason}`,
        status: 'scheduled',
        isUrgent: true,
        priority: 'urgent'
      };

      const appointmentRef = await addDoc(collection(db, 'appointments'), {
        ...appointmentData,
        date: Timestamp.fromDate(appointmentData.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return !!appointmentRef.id;
    } catch (error) {
      console.error('Error booking emergency appointment:', error);
      return false;
    }
  }

  // Waiting Room Services
  static async joinWaitingRoom(patientId: string, doctorId: string, reason: string): Promise<boolean> {
    try {
      const patient = await this.getPatientProfile(patientId);
      if (!patient) return false;

      await setDoc(doc(db, 'waitingRoom', `${patientId}_${doctorId}`), {
        patientId,
        doctorId,
        name: patient.name,
        phone: patient.phone,
        reason,
        priority: 'normal',
        isOnline: true,
        waitingSince: Timestamp.now(),
        createdAt: Timestamp.now()
      });

      return true;
    } catch (error) {
      console.error('Error joining waiting room:', error);
      return false;
    }
  }

  static async leaveWaitingRoom(patientId: string, doctorId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'waitingRoom', `${patientId}_${doctorId}`), {
        isOnline: false,
        leftAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error leaving waiting room:', error);
      return false;
    }
  }

  // Real-time listeners
  static subscribeToPatientAppointments(patientId: string, callback: (appointments: Appointment[]) => void) {
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId),
      orderBy('date', 'desc')
    );

    return onSnapshot(appointmentsQuery, (snapshot) => {
      const appointments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date ? data.date.toDate() : new Date(),
        };
      }) as Appointment[];
      
      callback(appointments);
    });
  }

  // Messaging Services (reuse from FirebaseService)
  static async sendMessage(conversationId: string, from: string, to: string, content: string, type: string = 'text') {
    try {
      const messagesRef = collection(db, 'notifications');
      await addDoc(messagesRef, {
        conversationId,
        from,
        to,
        content,
        type,
        timestamp: Timestamp.now(),
        seenBy: [from],
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static subscribeToMessages(conversationId: string, callback: (messages: any[]) => void) {
    try {
      const messagesRef = collection(db, 'notifications');
      const q = query(messagesRef, where('conversationId', '==', conversationId), orderBy('timestamp'));
      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date()
        }));
        callback(messages);
      });
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      return () => {};
    }
  }

  // Download PDF from base64
  static downloadPDFFromBase64(base64: string, filename: string): void {
    try {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  }
}