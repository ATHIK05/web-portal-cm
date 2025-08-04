export interface Doctor {
  id: string;
  name: string;
  email: string;
  photo?: string;
  experience: number;
  education: string[];
  specializations: string[];
  languages: string[];
  clinics: string[];
  phone: string;
  isCheckedIn: boolean;
  checkedInAt?: Date;
  availableSlots: string[];
  customTimeSlot?: { start: string; end: string };
  weeklySchedule?: WeeklySchedule;
  createdAt?: Date;
  lastUpdated?: Date;
  settings?: {
    notifications: {
      emailNotifications: boolean;
      smsNotifications: boolean;
      appointmentReminders: boolean;
      newPatientAlerts: boolean;
    };
    consultation: {
      videoConsultationEnabled: boolean;
      consultationDuration: number;
      bufferTime: number;
      autoAcceptAppointments: boolean;
    };
    privacy: {
      profileVisibility: string;
      shareDataWithPartners: boolean;
      allowPatientReviews: boolean;
    };
    appearance: {
      theme: string;
      language: string;
      timezone: string;
    };
  };
}

export interface WeeklySchedule {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
  saturday: string[];
  sunday: string[];
}

export interface Patient {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  phoneNumber?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  address: string;
  emergencyContact?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  medicalHistory: string[];
  isLogged: boolean;
  loggedAt?: Date;
  logReason?: string;
  logNotes?: string;
  createdAt?: Date;
  lastUpdated?: Date;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  patientName?: string;
  date: Date;
  timeSlot: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'physical' | 'online';
  notes?: string;
  prescriptionId?: string;
  billId?: string;
  hasPrescription?: boolean;
  hasBill?: boolean;
  doctorName?: string;
  doctorSpecialty?: string;
  createdAt?: Date;
  lastUpdated?: Date;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  medicines: Medicine[];
  instructions: string;
  createdAt: Date;
  pdfUrl?: string;
  pdfBase64?: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Bill {
  id: string;
  appointmentId: string;
  consultationFee: number;
  testCharges: number;
  medicineCharges: number;
  otherCharges: number;
  total: number;
  breakdown: BillItem[];
  createdAt: Date;
  pdfUrl?: string;
  pdfBase64?: string;
}

export interface BillItem {
  description: string;
  amount: number;
}

export interface Report {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  reportType: 'comprehensive' | 'prescriptions' | 'bills';
  dateRange: {
    start: Date;
    end: Date;
  };
  pdfBase64: string;
  createdAt: Date;
}

export type TimeSlot = 'morning' | 'evening' | 'night' | 'custom';