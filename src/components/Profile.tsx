import React, { useState } from 'react';
import { 
  User, 
  Camera, 
  Edit, 
  Save, 
  MapPin, 
  Phone, 
  Mail, 
  GraduationCap,
  Award,
  Languages,
  Building,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/firebaseService';

const Profile: React.FC = () => {
  const { doctor, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: doctor?.name || '',
    email: doctor?.email || '',
    phone: doctor?.phone || '',
    experience: doctor?.experience || 0,
    education: doctor?.education || [],
    specializations: doctor?.specializations || [],
    languages: doctor?.languages || [],
    clinics: doctor?.clinics || []
  });

  const handleSave = async () => {
    if (!user) {
      setMessage('User not authenticated');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Prepare the data for Firebase
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        experience: formData.experience,
        education: Array.isArray(formData.education) 
          ? formData.education 
          : formData.education.toString().split(',').map(item => item.trim()).filter(item => item),
        specializations: Array.isArray(formData.specializations) 
          ? formData.specializations 
          : formData.specializations.toString().split(',').map(item => item.trim()).filter(item => item),
        languages: Array.isArray(formData.languages) 
          ? formData.languages 
          : formData.languages.toString().split(',').map(item => item.trim()).filter(item => item),
        clinics: Array.isArray(formData.clinics) 
          ? formData.clinics 
          : formData.clinics.toString().split(',').map(item => item.trim()).filter(item => item),
        lastUpdated: new Date()
      };

      const success = await FirebaseService.updateDoctorProfile(user.uid, updateData);

      if (success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('An error occurred while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: doctor?.name || '',
      email: doctor?.email || '',
      phone: doctor?.phone || '',
      experience: doctor?.experience || 0,
      education: doctor?.education || [],
      specializations: doctor?.specializations || [],
      languages: doctor?.languages || [],
      clinics: doctor?.clinics || []
    });
    setIsEditing(false);
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Doctor Profile</h2>
          <p className="text-gray-600 mt-1">Manage your professional information</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 ${
            isEditing 
              ? 'bg-gray-600 text-white hover:bg-gray-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isEditing ? (
            <>
              <Edit size={16} />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Edit size={16} />
              <span>Edit Profile</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  {doctor?.photo ? (
                    <img 
                      src={doctor.photo} 
                      alt="Doctor" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-white" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700">
                  <Camera size={16} />
                </button>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900">{doctor?.name || 'Doctor Name'}</h3>
              <p className="text-gray-600">{doctor?.specializations?.[0] || 'Specialist'}</p>
              <p className="text-sm text-gray-500 mt-2">{doctor?.experience || 0} years experience</p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="text-gray-400" size={16} />
                <span className="text-gray-700">{doctor?.email || 'No email'}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="text-gray-400" size={16} />
                <span className="text-gray-700">{doctor?.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Professional Information</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900">{doctor?.name || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Years of experience"
                    />
                  ) : (
                    <p className="text-gray-900">{doctor?.experience || 0} years</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 9876543210"
                  />
                ) : (
                  <p className="text-gray-900">{doctor?.phone || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GraduationCap className="inline mr-1" size={16} />
                  Education
                </label>
                {isEditing ? (
                  <textarea
                    value={Array.isArray(formData.education) ? formData.education.join(', ') : formData.education}
                    onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="MBBS, MD, etc. (separate with commas)"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {doctor?.education && doctor.education.length > 0 ? (
                      doctor.education.map((edu, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {edu}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="inline mr-1" size={16} />
                  Specializations
                </label>
                {isEditing ? (
                  <textarea
                    value={Array.isArray(formData.specializations) ? formData.specializations.join(', ') : formData.specializations}
                    onChange={(e) => setFormData(prev => ({ ...prev, specializations: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Cardiology, Internal Medicine, etc. (separate with commas)"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {doctor?.specializations && doctor.specializations.length > 0 ? (
                      doctor.specializations.map((spec, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Languages className="inline mr-1" size={16} />
                  Languages
                </label>
                {isEditing ? (
                  <textarea
                    value={Array.isArray(formData.languages) ? formData.languages.join(', ') : formData.languages}
                    onChange={(e) => setFormData(prev => ({ ...prev, languages: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="English, Hindi, etc. (separate with commas)"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {doctor?.languages && doctor.languages.length > 0 ? (
                      doctor.languages.map((lang, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="inline mr-1" size={16} />
                  Clinics/Hospitals
                </label>
                {isEditing ? (
                  <textarea
                    value={Array.isArray(formData.clinics) ? formData.clinics.join(', ') : formData.clinics}
                    onChange={(e) => setFormData(prev => ({ ...prev, clinics: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="City Hospital, ABC Clinic, etc. (separate with commas)"
                  />
                ) : (
                  <div className="space-y-2">
                    {doctor?.clinics && doctor.clinics.length > 0 ? (
                      doctor.clinics.map((clinic, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-gray-700">{clinic}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading && <Loader className="animate-spin" size={16} />}
                    <Save size={16} />
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;