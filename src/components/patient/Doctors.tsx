import React, { useEffect, useState } from 'react';
import { User, Search, Filter, Clock, MapPin, Star, Video, Phone } from 'lucide-react';
import { PatientFirebaseService } from '../../services/patientFirebaseService';
import { useNavigate } from 'react-router-dom';

const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const doctorsData = await PatientFirebaseService.getAllDoctors();
      setDoctors(doctorsData);
      setFilteredDoctors(doctorsData);
      // Extract unique specialties
      const allSpecialties = doctorsData.flatMap((doctor: any) => doctor.specializations || []);
      const uniqueSpecialties = [...new Set(allSpecialties)];
      setSpecialties(uniqueSpecialties);
    } catch (error) {
      setDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = doctors;
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, filterSpecialty]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Find Doctors</h2>
          <p className="text-gray-600 mt-1">Browse and book appointments with our doctors</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={filterSpecialty}
              onChange={e => setFilterSpecialty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Specialties</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
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
        ) : filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white border-2 rounded-lg p-4 transition-all hover:shadow-md border-gray-200"
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
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock size={14} />
                    <span>{doctor.experience} years experience</span>
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
                    <span>{doctor.phone}</span>
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
                  <button
                    onClick={() => navigate(`/patient/book-appointment?doctor=${doctor.id}`)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No doctors found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctors; 