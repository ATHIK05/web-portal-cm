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
        checkInDate: Timestamp.fromDate(new Date()), // Store check-in date for auto-checkout
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

  // Auto-checkout after 24 hours
  static async checkAutoCheckout(doctorId: string): Promise<boolean> {
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
      if (doctorDoc.exists()) {
        const data = doctorDoc.data();
        if (data.isCheckedIn && data.checkInDate) {
          const checkInTime = data.checkInDate.toDate();
          const now = new Date();
          const hoursDiff = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff >= 24) {
            await this.checkOutDoctor(doctorId);
            return true; // Auto-checked out
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking auto-checkout:', error);
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
          patientName: data.patientName || 'Unknown Patient',
          status: data.status || 'scheduled', // <-- Ensure status is present
          // Add other fields as needed
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
      // Generate PDF first
      const pdfBase64 = await this.generatePrescriptionPDF({
        id: 'temp',
        appointmentId,
        medicines,
        instructions,
        createdAt: new Date()
      } as any);

      const prescriptionData = {
        appointmentId,
        medicines,
        instructions,
        pdfBase64,
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
      // Fetch the appointment to get doctorId
      const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
      if (!appointmentDoc.exists()) throw new Error('Appointment not found');
      const appointment = appointmentDoc.data();
      const doctorId = appointment.doctorId;

      // Fetch doctor profile for name
      const doctorProfile = await this.getDoctorProfile(doctorId);
      const doctorName = doctorProfile?.name || 'Unknown';

      // Generate PDF first
      const pdfBase64 = await this.generateBillPDF({
        id: appointmentId,
        ...billData,
        createdAt: new Date()
      } as any, doctorName);

      const bill = {
        ...billData,
        appointmentId,
        pdfBase64,
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
          status: data.status || 'scheduled',
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

  // Video Consultation Services
  static async getWaitingPatients(doctorId: string): Promise<any[]> {
    try {
      // Mock data for now - implement actual Firebase query
      return [
        {
          id: 'patient1',
          name: 'Mohamed Athik',
          waitingSince: '10:30 AM',
          reason: 'Follow-up consultation'
        }
      ];
    } catch (error) {
      console.error('Error fetching waiting patients:', error);
      return [];
    }
  }

  // PDF Generation Services
  static async generatePrescriptionPDF(prescription: Prescription): Promise<string> {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Branding Header
      doc.setFillColor(59, 130, 246); // Blue
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Crescent Moon Medical Center', 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Medical Prescription', 105, 25, { align: 'center' });

      // Patient & Doctor Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Prescription ID: ${prescription.id}`, 15, 40);
      doc.text(`Date: ${prescription.createdAt.toLocaleDateString()}`, 15, 48);
      doc.text(`Time: ${prescription.createdAt.toLocaleTimeString()}`, 120, 48);
      doc.text('Doctor: Dr. Mohamed Athik', 15, 56);
      doc.text('Specialty: Cardiology', 120, 56);

      // Medicines Table
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Prescribed Medicines', 15, 68);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, 72, 180, 8, 'F');
      doc.text('No.', 18, 78);
      doc.text('Medicine', 28, 78);
      doc.text('Dosage', 80, 78);
      doc.text('Frequency', 120, 78);
      doc.text('Duration', 160, 78);
      let y = 86;
      doc.setFont('helvetica', 'normal');
      prescription.medicines.forEach((med, i) => {
        doc.text(`${i + 1}`, 18, y);
        doc.text(med.name, 28, y);
        doc.text(med.dosage, 80, y);
        doc.text(med.frequency, 120, y);
        doc.text(med.duration, 160, y);
        y += 10;
      });

      // Instructions Section
      if (prescription.instructions) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Instructions:', 15, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const splitInstructions = doc.splitTextToSize(prescription.instructions, 170);
        doc.text(splitInstructions, 15, y + 16);
        y += 16 + splitInstructions.length * 6;
      }

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('This is a computer-generated prescription. For queries, contact Crescent Moon Medical Center.', 15, 285);
      return doc.output('datauristring').split(',')[1];
    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      throw error;
    }
  }

  static async generateBillPDF(bill: Bill, doctorName: string): Promise<string> {
  // Helper: Convert number to words (simple version)
  function numberToWords(num: number): string {
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num || 0) < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '');
    if (num < 10000) return a[Math.floor(num / 1000)] + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    return num.toString();
  }

  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Branding Header
    doc.setFillColor(34, 197, 94); // Green
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('KBN Nursing Center', 105, 15, { align: 'center' });
    doc.setFontSize(13);
    doc.text('Medical Bill', 105, 25, { align: 'center' });

    // Bill Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bill ID: ${bill.id.substring(0, 6)}`, 15, 40);
    doc.text(`Date: ${bill.createdAt.toLocaleDateString()}`, 15, 48);
    doc.text(`Time: ${bill.createdAt.toLocaleTimeString()}`, 120, 48);
    doc.text(`Doctor: Dr. ${doctorName}`, 15, 56);
    doc.text(`Specialty: Cardiology`, 120, 56);

    // Bill Details Table
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill Details', 15, 68);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 72, 180, 8, 'F');
    doc.text('No.', 18, 78);
    doc.text('Description', 28, 78);
    doc.text('Amount (₹)', 185, 78, { align: 'right' });

    let y = 86;
    doc.setFont('helvetica', 'normal');
    bill.breakdown.forEach((item, i) => {
      doc.text(`${i + 1}`, 18, y);
      doc.text(item.description, 28, y);
      doc.text(`${item.amount.toLocaleString()}`, 185, y, { align: 'right' }); // <-- move to 185
      y += 10;
    });

    // Total Section (Green Box)
    doc.setFillColor(34, 197, 94);
    doc.rect(15, y + 8, 180, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: ₹${bill.total.toLocaleString()}`, 105, y + 18, { align: 'center' });

    // Amount in Words
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount in Words: ${numberToWords(bill.total)} Rupees Only`, 105, y + 34, { align: 'center' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for choosing Crescent Moon Medical Center. Payment due within 30 days.', 15, 285);

    return doc.output('datauristring').split(',')[1];
  } catch (error) {
    console.error('Error generating bill PDF:', error);
    throw error;
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