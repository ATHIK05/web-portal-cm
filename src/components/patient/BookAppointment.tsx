import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  User, 
  Clock, 
  MapPin,
  Star,
  Video,
  Phone,
  Loader,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { usePatientAuth } from '../../contexts/PatientAuthContext';
import { PatientFirebaseService } from '../../services/patientFirebaseService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSearchParams, useNavigate } from 'react-router-dom';

const BookAppointment: React.FC = () => {
  const { user, patient } = usePatientAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preSelectedDoctorId = searchParams.get('doctor');
  
  const [step, setStep] = useState(1); // 1: Select Doctor, 2: Select Date/Time, 3: Confirm
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('morning');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'physical' | 'online'>('physical');
  const [reason, setReason] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  // Helper: Generate 15-min slots for a period
  const generateSlots = (start: number, end: number) => {
    const slots = [];
    for (let h = start; h < end; h++) {
      for (let m = 0; m < 60; m += 15) {
        const from = new Date(0, 0, 0, h, m);
        const to = new Date(0, 0, 0, h, m + 15);
        const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        slots.push(`${fmt(from)} - ${fmt(to)}`);
      }
    }
    return slots;
  };

  const slotMap = {
    morning: generateSlots(8, 12),
    evening: generateSlots(12, 18),
    night: generateSlots(18, 22),
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    // Filter doctors based on search, specialty, and availability
    let filtered = doctors;
    if (showOnlyAvailable) {
      filtered = filtered.filter(doctor => doctor.isCheckedIn);
    }
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specializations?.some((spec: string) =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (filterSpecialty !== 'all') {
      filtered = filtered.filter(doctor =>
        doctor.specializations?.includes(filterSpecialty)
      );
    }
    // If a doctor is pre-selected, always include them
    if (preSelectedDoctorId) {
      const preDoctor = doctors.find(d => d.id === preSelectedDoctorId);
      if (preDoctor && !filtered.some(d => d.id === preDoctor.id)) {
        filtered = [preDoctor, ...filtered];
      }
    }
    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, filterSpecialty, showOnlyAvailable, preSelectedDoctorId]);

  useEffect(() => {
    // If pre-selected doctor, find and select them
    if (preSelectedDoctorId && doctors.length > 0) {
      const doctor = doctors.find(d => d.id === preSelectedDoctorId);
      if (doctor) {
        setSelectedDoctor(doctor);
        setStep(2);
      }
    }
  }, [preSelectedDoctorId, doctors]);

  useEffect(() => {
    // When date/slot changes, fetch available times
    if (selectedDoctor && selectedDate && selectedSlot) {
      fetchAvailableTimes();
    }
  }, [selectedDoctor, selectedDate, selectedSlot]);

  const fetchDoctors = async () => {
    setDoctorsLoading(true);
    try {
      // Fetch all doctors, not just available
      const allDoctors = await PatientFirebaseService.getAllDoctors();
      setDoctors(allDoctors);
      setFilteredDoctors(allDoctors);
      // Extract unique specialties
      const allSpecialties = allDoctors.flatMap(doctor => doctor.specializations || []);
      const uniqueSpecialties = [...new Set(allSpecialties)];
      setSpecialties(uniqueSpecialties);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setMessage('Error loading doctors');
    } finally {
      setDoctorsLoading(false);
    }
  };

  const fetchAvailableTimes = async () => {
    if (!selectedDoctor || !selectedDate) return;
    
    try {
      const dayStr = selectedDate.toISOString().split('T')[0];
      const bookedSlots = await PatientFirebaseService.getDoctorBookedSlots(
        selectedDoctor.id, 
        selectedDate
      );
      
      const allSlots = slotMap[selectedSlot as keyof typeof slotMap] || [];
      const available = allSlots.filter(slot => !bookedSlots.includes(slot));
      setAvailableTimes(available);
      setSelectedTime('');
    } catch (error) {
      console.error('Error fetching available times:', error);
    }
  };

  const handleBookAppointment = async () => {
    if (!user || !selectedDoctor || !selectedDate || !selectedTime) {
      setMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const appointmentData = {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specializations?.[0] || 'General',
        patientId: user.uid,
        patientName: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim(),
        appointmentDate: selectedDate,
        timeSlot: selectedTime,
        type: appointmentType,
        reason: reason || 'General consultation',
        status: 'scheduled',
        isUrgent,
        createdAt: new Date(),
      };

      const success = await PatientFirebaseService.bookAppointment(appointmentData);
      
      if (success) {
        setMessage('Appointment booked successfully!');
        setTimeout(() => {
          navigate('/patient/appointments');
        }, 2000);
      } else {
        setMessage('Failed to book appointment. The selected time slot may no longer be available.');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setMessage('An error occurred while booking the appointment');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Select a Doctor</h3>
        <div className="text-sm text-gray-500">Step 1 of 3</div>
      </div>
      <div className="flex items-center space-x-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400" size={20} />
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showOnlyAvailable"
            checked={showOnlyAvailable}
            onChange={e => setShowOnlyAvailable(e.target.checked)}
            className="mr-1"
          />
          <label htmlFor="showOnlyAvailable" className="text-sm text-gray-700">Only show available</label>
        </div>
      </div>
      {doctorsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-full h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedDoctor?.id === doctor.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedDoctor(doctor)}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  {doctor.isCheckedIn && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Dr. {doctor.name}</h4>
                  <p className="text-sm text-gray-600">{doctor.specializations?.[0]}</p>
                  <p className="text-xs text-gray-500">{doctor.phone}</p>
                  <p className="text-xs text-gray-500">{doctor.clinics?.[0]}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Clock size={14} />
                  <span>{doctor.experience || 0} years experience</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin size={14} />
                  <span>{doctor.clinics?.[0] || 'KBN Nursing Center'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star size={14} className="text-yellow-500" />
                  <span>4.8 (120 reviews)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone size={14} />
                  <span>{doctor.phone || 'Contact via portal'}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  doctor.isCheckedIn
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {doctor.isCheckedIn ? 'Available' : 'Offline'}
                </span>
                <div className="flex space-x-1">
                  <Video size={16} className="text-blue-600" />
                  <Phone size={16} className="text-green-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {filteredDoctors.length === 0 && !doctorsLoading && (
        <div className="text-center py-8">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No doctors found matching your criteria</p>
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={() => setStep(2)}
          disabled={!selectedDoctor}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg"
        >
          Next: Select Date & Time
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Select Date & Time</h3>
        <div className="text-sm text-gray-500">Step 2 of 3</div>
      </div>

      {selectedDoctor && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Dr. {selectedDoctor.name}</h4>
              <p className="text-sm text-gray-600">{selectedDoctor.specializations?.[0]}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            minDate={new Date()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            dateFormat="MMMM d, yyyy"
            placeholderText="Choose a date"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
            <option value="evening">Evening (12:00 PM - 6:00 PM)</option>
            <option value="night">Night (6:00 PM - 10:00 PM)</option>
          </select>
        </div>
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {availableTimes.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  selectedTime === time
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          {availableTimes.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">No available times for this slot. Please try another slot.</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Type</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="appointmentType"
              value="physical"
              checked={appointmentType === 'physical'}
              onChange={(e) => setAppointmentType(e.target.value as 'physical' | 'online')}
              className="mr-2"
            />
            <span className="text-sm">Physical Visit</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="appointmentType"
              value="online"
              checked={appointmentType === 'online'}
              onChange={(e) => setAppointmentType(e.target.value as 'physical' | 'online')}
              className="mr-2"
            />
            <span className="text-sm">Video Consultation</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={3}
          placeholder="Describe your symptoms or reason for the appointment..."
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isUrgent"
          checked={isUrgent}
          onChange={(e) => setIsUrgent(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="isUrgent" className="text-sm text-gray-700">
          This is an urgent consultation
        </label>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Back: Select Doctor
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={!selectedDate || !selectedTime}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Confirm Booking
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Confirm Appointment</h3>
        <div className="text-sm text-gray-500">Step 3 of 3</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Appointment Summary</h4>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Doctor:</span>
            <span className="font-medium">Dr. {selectedDoctor?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Specialty:</span>
            <span>{selectedDoctor?.specializations?.[0]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span>{selectedDate?.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span>{selectedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="capitalize">{appointmentType === 'online' ? 'Video Consultation' : 'Physical Visit'}</span>
          </div>
          {reason && (
            <div className="flex justify-between">
              <span className="text-gray-600">Reason:</span>
              <span className="text-right max-w-xs">{reason}</span>
            </div>
          )}
          {isUrgent && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Urgent Consultation</span>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.includes('successfully') ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{message}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setStep(2)}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Back: Date & Time
        </button>
        <button
          onClick={handleBookAppointment}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading && <Loader className="animate-spin" size={16} />}
          <span>Confirm Booking</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Book Appointment</h2>
          <p className="text-gray-600 mt-1">Schedule a consultation with our doctors</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default BookAppointment;