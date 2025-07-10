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
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Doctor, Patient, Appointment, Prescription, Bill } from '../types';

export class FirebaseService {
  // Doctor Services
  static async getDoctorProfile(doctorId: string): Promise<Doctor | null> {
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
      if (doctorDoc.exists()) {
        return { id: doctorId, ...doctorDoc.data() } as Doctor;
      }
      return null;
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      return null;
    }
  }

  static async updateDoctorProfile(doctorId: string, data: Partial<Doctor>): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'doctors', doctorId), {
        ...data,
        lastUpdated: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      return false;
    }
  }

  static async checkInDoctor(doctorId: string, slots: string[], customTime?: { start: string; end: string }): Promise<boolean> {
    try {
      const checkInData = {
        isCheckedIn: true,
        checkedInAt: Timestamp.now(),
        availableSlots: slots,
        ...(customTime && { customTimeSlot: customTime }),
        lastUpdated: Timestamp.now()
      };
      
      await updateDoc(doc(db, 'doctors', doctorId), checkInData);
      return true;
    } catch (error) {
      console.error('Error checking in doctor:', error);
      return false;
    }
  }

  static async checkOutDoctor(doctorId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'doctors', doctorId), {
        isCheckedIn: false,
        checkedOutAt: Timestamp.now(),
        availableSlots: [],
        customTimeSlot: null,
        lastUpdated: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error checking out doctor:', error);
      return false;
    }
  }

  // Appointment Services
  static async getDoctorAppointments(doctorId: string, date?: Date): Promise<Appointment[]> {
    try {
      // Get all appointments for the doctor
      const appointmentQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId)
      );

      const snapshot = await getDocs(appointmentQuery);
      const allAppointments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle both 'date' and 'appointmentDate' fields
          date: data.appointmentDate ? data.appointmentDate.toDate() : (data.date ? data.date.toDate() : new Date()),
          patientName: data.patientName || 'Unknown Patient'
        };
      }) as Appointment[];
      
      // Filter by date if specified
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const filteredAppointments = allAppointments.filter(appointment => {
          const appointmentDate = appointment.date;
          return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
        });
        
        return filteredAppointments.sort((a, b) => a.date.getTime() - b.date.getTime());
      }
      
      // Return all appointments sorted by date (most recent first)
      return allAppointments.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  static async updateAppointmentStatus(appointmentId: string, status: string, notes?: string): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        lastUpdated: Timestamp.now()
      };
      
      if (notes) {
        updateData.notes = notes;
      }
      
      await updateDoc(doc(db, 'appointments', appointmentId), updateData);
      return true;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return false;
    }
  }

  // Patient Services
  static async getDoctorPatients(doctorId: string): Promise<Patient[]> {
    try {
      // Get all appointments for this doctor to find their patients
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId)
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const patientIds = [...new Set(appointmentsSnapshot.docs.map(doc => doc.data().patientId))];
      
      if (patientIds.length === 0) return [];
      
      // Fetch patient details
      const patients: Patient[] = [];
      for (const patientId of patientIds) {
        try {
          const patientDoc = await getDoc(doc(db, 'patients', patientId));
          if (patientDoc.exists()) {
            patients.push({ id: patientId, ...patientDoc.data() } as Patient);
          } else {
            // If patient document doesn't exist, create a placeholder with appointment data
            const appointmentData = appointmentsSnapshot.docs.find(doc => doc.data().patientId === patientId)?.data();
            if (appointmentData) {
              patients.push({
                id: patientId,
                name: appointmentData.patientName || 'Unknown Patient',
                email: appointmentData.patientEmail || '',
                phone: appointmentData.patientPhone || '',
                age: appointmentData.patientAge || 0,
                gender: appointmentData.patientGender || 'unknown',
                address: '',
                medicalHistory: [],
                isLogged: false,
                createdAt: new Date(),
                lastUpdated: new Date()
              } as Patient);
            }
          }
        } catch (error) {
          console.error(`Error fetching patient ${patientId}:`, error);
        }
      }
      
      return patients;
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return [];
    }
  }

  // Get patient by ID
  static async getPatientById(patientId: string): Promise<Patient | null> {
    try {
      const patientDoc = await getDoc(doc(db, 'patients', patientId));
      if (patientDoc.exists()) {
        const data = patientDoc.data();
        return {
          id: patientId,
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phoneNumber || '',
          phoneNumber: data.phoneNumber || '',
          age: data.age || 0,
          gender: data.gender || 'unknown',
          address: data.address || '',
          emergencyContact: data.emergencyContact || '',
          insuranceProvider: data.insuranceProvider || '',
          insuranceNumber: data.insuranceNumber || '',
          medicalHistory: data.medicalHistory || [],
          isLogged: data.isLogged || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.updatedAt?.toDate() || new Date()
        } as Patient;
      }
      return null;
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      return null;
    }
  }

  static async logPatient(patientId: string, reason: string, notes?: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'patients', patientId), {
        isLogged: true,
        loggedAt: Timestamp.now(),
        logReason: reason,
        logNotes: notes || '',
        lastUpdated: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error logging patient:', error);
      return false;
    }
  }

  // Prescription Services
  static async createPrescription(appointmentId: string, medicines: any[], instructions: string): Promise<string | null> {
    try {
      const prescriptionData = {
        appointmentId,
        medicines,
        instructions,
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'prescriptions'), prescriptionData);
      
      // Update appointment with prescription reference
      await updateDoc(doc(db, 'appointments', appointmentId), {
        prescriptionId: docRef.id,
        hasPrescription: true,
        lastUpdated: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating prescription:', error);
      return null;
    }
  }

  static async getPrescription(prescriptionId: string): Promise<Prescription | null> {
    try {
      const prescriptionDoc = await getDoc(doc(db, 'prescriptions', prescriptionId));
      if (prescriptionDoc.exists()) {
        return { id: prescriptionId, ...prescriptionDoc.data() } as Prescription;
      }
      return null;
    } catch (error) {
      console.error('Error fetching prescription:', error);
      return null;
    }
  }

  // Bill Services
  static async createBill(appointmentId: string, billData: Omit<Bill, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const bill = {
        ...billData,
        appointmentId,
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'bills'), bill);
      
      // Update appointment with bill reference
      await updateDoc(doc(db, 'appointments', appointmentId), {
        billId: docRef.id,
        hasBill: true,
        lastUpdated: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating bill:', error);
      return null;
    }
  }

  static async getBill(billId: string): Promise<Bill | null> {
    try {
      const billDoc = await getDoc(doc(db, 'bills', billId));
      if (billDoc.exists()) {
        return { id: billId, ...billDoc.data() } as Bill;
      }
      return null;
    } catch (error) {
      console.error('Error fetching bill:', error);
      return null;
    }
  }

  // Report Services
  static async generatePatientReport(doctorId: string, patientId: string, dateRange: { start: Date; end: Date }, reportType: string): Promise<string | null> {
    try {
      // Get patient data
      const patientDoc = await getDoc(doc(db, 'patients', patientId));
      if (!patientDoc.exists()) {
        throw new Error('Patient not found');
      }
      const patient = { id: patientId, ...patientDoc.data() } as Patient;

      // Get appointments in date range
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId),
        where('patientId', '==', patientId)
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const allAppointments = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as Appointment[];

      // Filter appointments by date range
      const filteredAppointments = allAppointments.filter(apt => {
        return apt.date >= dateRange.start && apt.date <= dateRange.end;
      });

      // Get prescriptions and bills for these appointments
      const prescriptions: Prescription[] = [];
      const bills: Bill[] = [];

      for (const appointment of filteredAppointments) {
        if (appointment.prescriptionId) {
          const prescription = await this.getPrescription(appointment.prescriptionId);
          if (prescription) prescriptions.push(prescription);
        }
        if (appointment.billId) {
          const bill = await this.getBill(appointment.billId);
          if (bill) bills.push(bill);
        }
      }

      // Generate PDF content based on report type
      const reportData = {
        patient,
        appointments: filteredAppointments,
        prescriptions: reportType === 'comprehensive' || reportType === 'prescriptions' ? prescriptions : [],
        bills: reportType === 'comprehensive' || reportType === 'bills' ? bills : [],
        dateRange,
        reportType,
        generatedAt: new Date()
      };

      // Generate PDF as base64 string
      const pdfBase64 = await this.generatePDFFromData(reportData);

      // Store report in Firebase
      const reportDoc = {
        doctorId,
        patientId,
        patientName: patient.name,
        reportType,
        dateRange: {
          start: Timestamp.fromDate(dateRange.start),
          end: Timestamp.fromDate(dateRange.end)
        },
        pdfBase64,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'reports'), reportDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error generating patient report:', error);
      return null;
    }
  }

  static async generatePDFFromData(reportData: any): Promise<string> {
    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Set up the PDF
      doc.setFontSize(20);
      doc.text('Patient Medical Report', 20, 20);

      // Patient Information
      doc.setFontSize(16);
      doc.text('Patient Information', 20, 40);
      doc.setFontSize(12);
      doc.text(`Name: ${reportData.patient.name}`, 20, 50);
      doc.text(`Age: ${reportData.patient.age} years`, 20, 60);
      doc.text(`Gender: ${reportData.patient.gender}`, 20, 70);
      doc.text(`Phone: ${reportData.patient.phone}`, 20, 80);
      doc.text(`Email: ${reportData.patient.email}`, 20, 90);

      // Report Details
      doc.text(`Report Type: ${reportData.reportType}`, 20, 110);
      doc.text(`Date Range: ${reportData.dateRange.start.toLocaleDateString()} - ${reportData.dateRange.end.toLocaleDateString()}`, 20, 120);
      doc.text(`Generated: ${reportData.generatedAt.toLocaleDateString()}`, 20, 130);

      let yPosition = 150;

      // Appointments
      if (reportData.appointments.length > 0) {
        doc.setFontSize(16);
        doc.text('Appointment History', 20, yPosition);
        yPosition += 20;
        
        doc.setFontSize(10);
        reportData.appointments.forEach((appointment: any, index: number) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`${index + 1}. Date: ${appointment.date.toLocaleDateString()} - Status: ${appointment.status}`, 20, yPosition);
          if (appointment.notes) {
            yPosition += 10;
            doc.text(`   Notes: ${appointment.notes}`, 20, yPosition);
          }
          yPosition += 15;
        });
      }

      // Prescriptions
      if (reportData.prescriptions.length > 0) {
        yPosition += 10;
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(16);
        doc.text('Prescriptions', 20, yPosition);
        yPosition += 20;
        
        doc.setFontSize(10);
        reportData.prescriptions.forEach((prescription: any, index: number) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`Prescription ${index + 1}:`, 20, yPosition);
          yPosition += 10;
          
          prescription.medicines.forEach((medicine: any) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(`- ${medicine.name} (${medicine.dosage}) - ${medicine.frequency} for ${medicine.duration}`, 25, yPosition);
            yPosition += 8;
          });
          
          if (prescription.instructions) {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(`Instructions: ${prescription.instructions}`, 25, yPosition);
            yPosition += 10;
          }
          yPosition += 5;
        });
      }

      // Bills
      if (reportData.bills.length > 0) {
        yPosition += 10;
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(16);
        doc.text('Billing History', 20, yPosition);
        yPosition += 20;
        
        doc.setFontSize(10);
        reportData.bills.forEach((bill: any, index: number) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`Bill ${index + 1}: Total ₹${bill.total}`, 20, yPosition);
          yPosition += 10;
          
          bill.breakdown.forEach((item: any) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(`- ${item.description}: ₹${item.amount}`, 25, yPosition);
            yPosition += 8;
          });
          yPosition += 5;
        });
      }

      // Convert to base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      return pdfBase64;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  static async getReports(doctorId: string): Promise<any[]> {
    try {
      // Use simple query without orderBy to avoid composite index requirement
      const reportsQuery = query(
        collection(db, 'reports'),
        where('doctorId', '==', doctorId)
      );
      
      const snapshot = await getDocs(reportsQuery);
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        dateRange: {
          start: doc.data().dateRange.start.toDate(),
          end: doc.data().dateRange.end.toDate()
        }
      }));
      
      // Sort in memory by createdAt (descending)
      return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }

  static async downloadReport(reportId: string): Promise<string | null> {
    try {
      const reportDoc = await getDoc(doc(db, 'reports', reportId));
      if (reportDoc.exists()) {
        return reportDoc.data().pdfBase64;
      }
      return null;
    } catch (error) {
      console.error('Error downloading report:', error);
      return null;
    }
  }

  // Dashboard Statistics
  static async getDashboardStats(doctorId: string): Promise<any> {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Get all appointments for the doctor and filter in memory
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId)
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const allAppointments = appointmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          date: data.appointmentDate ? data.appointmentDate.toDate() : (data.date ? data.date.toDate() : new Date())
        };
      });
      
      // Filter today's appointments in memory
      const todayAppointments = allAppointments.filter(apt => {
        const aptDate = apt.date;
        return aptDate >= startOfDay && aptDate <= endOfDay;
      });
      
      // Monthly revenue - get all bills and filter
      const monthlyBillsQuery = query(
        collection(db, 'bills')
      );
      
      const monthlyBillsSnapshot = await getDocs(monthlyBillsQuery);
      const monthlyRevenue = monthlyBillsSnapshot.docs
        .filter(doc => {
          const createdAt = doc.data().createdAt.toDate();
          return createdAt >= startOfMonth && createdAt <= endOfMonth;
        })
        .reduce((total, doc) => {
          return total + (doc.data().total || 0);
        }, 0);
      
      // Total patients
      const patients = await this.getDoctorPatients(doctorId);
      
      return {
        todayAppointments: todayAppointments.length,
        completedConsultations: todayAppointments.filter(apt => apt.status === 'completed').length,
        pendingAppointments: todayAppointments.filter(apt => apt.status === 'scheduled').length,
        totalPatients: patients.length,
        monthlyRevenue
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        todayAppointments: 0,
        completedConsultations: 0,
        pendingAppointments: 0,
        totalPatients: 0,
        monthlyRevenue: 0
      };
    }
  }

  // Real-time listeners
  static subscribeToAppointments(doctorId: string, callback: (appointments: Appointment[]) => void) {
    // Use a simpler query that doesn't require composite index
    const appointmentQuery = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId)
    );

    return onSnapshot(appointmentQuery, (snapshot) => {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const allAppointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as Appointment[];
      
      // Filter today's appointments and sort in memory
      const todayAppointments = allAppointments
        .filter(apt => {
          const aptDate = apt.date;
          return aptDate >= startOfDay && aptDate <= endOfDay;
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      callback(todayAppointments);
    });
  }
}