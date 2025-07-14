import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle, Settings, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/firebaseService';

const CheckIn: React.FC = () => {
  const { doctor, user } = useAuth();
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState({ start: '', end: '' });
  const [isCheckedIn, setIsCheckedIn] = useState(doctor?.isCheckedIn || false);
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const timeSlots = [
    { id: 'morning', label: 'Morning', time: '8:00 AM - 12:00 PM', icon: '🌅' },
    { id: 'evening', label: 'Evening', time: '2:00 PM - 6:00 PM', icon: '🌇' },
    { id: 'night', label: 'Night', time: '6:00 PM - 10:00 PM', icon: '🌙' }
  ];

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleCheckIn = async () => {
    if (selectedSlots.length === 0 && !showCustom) {
      setMessage('Please select at least one time slot');
      return;
    }

    if (showCustom && (!customTime.start || !customTime.end)) {
      setMessage('Please provide custom time slot details');
      return;
    }

    if (!user) {
      setMessage('User not authenticated');
      return;
    }
    
    setLoading(true);
    setMessage('');

    try {
      const success = await FirebaseService.checkInDoctor(
        user.uid, 
        selectedSlots,
        showCustom ? customTime : undefined
      );

      if (success) {
        setIsCheckedIn(true);
        setMessage('Successfully checked in! You are now available for appointments. Auto-checkout will occur after 24 hours.');
        // Refresh the page to update doctor state
        window.location.reload();
      } else {
        setMessage('Failed to check in. Please try again.');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setMessage('An error occurred during check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user) {
      setMessage('User not authenticated');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const success = await FirebaseService.checkOutDoctor(user.uid);

      if (success) {
        setIsCheckedIn(false);
        setSelectedSlots([]);
        setCustomTime({ start: '', end: '' });
        setShowCustom(false);
        setMessage('Successfully checked out. You are no longer available for appointments.');
        // Refresh the page to update doctor state
        window.location.reload();
      } else {
        setMessage('Failed to check out. Please try again.');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      setMessage('An error occurred during check-out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Check-In & Slot Management</h2>
          <p className="text-gray-600 mt-1">Manage your availability for today</p>
        </div>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
          isCheckedIn ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isCheckedIn ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium">
            {isCheckedIn ? 'Checked In' : 'Not Checked In'}
          </span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="mr-2" size={20} />
            Select Time Slots
          </h3>
          
          <div className="space-y-3">
            {timeSlots.map((slot) => (
              <div
                key={slot.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedSlots.includes(slot.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isCheckedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isCheckedIn && handleSlotToggle(slot.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{slot.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{slot.label}</p>
                      <p className="text-sm text-gray-600">{slot.time}</p>
                    </div>
                  </div>
                  {selectedSlots.includes(slot.id) && (
                    <CheckCircle className="text-blue-500" size={20} />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={() => !isCheckedIn && setShowCustom(!showCustom)}
              disabled={isCheckedIn}
              className={`flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors ${
                isCheckedIn ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Settings size={16} />
              <span>Add Custom Time</span>
            </button>
          </div>

          {showCustom && !isCheckedIn && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Custom Time Slot</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={customTime.start}
                    onChange={(e) => setCustomTime(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={customTime.end}
                    onChange={(e) => setCustomTime(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="mr-2" size={20} />
            Current Status
          </h3>
          
          {isCheckedIn ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">You are checked in!</h4>
                <p className="text-sm text-green-800 mb-3">
                  Patients can now book appointments with you for the selected time slots.
                </p>
                {doctor?.availableSlots && doctor.availableSlots.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-2">Available Slots:</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.availableSlots.map((slot, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {slot.charAt(0).toUpperCase() + slot.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {doctor?.customTimeSlot && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-green-900">Custom Time:</p>
                    <p className="text-sm text-green-800">
                      {doctor.customTimeSlot.start} - {doctor.customTimeSlot.end}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">Not checked in</h4>
                <p className="text-sm text-yellow-800">
                  You need to check in to become available for patient appointments today.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Select one or more time slots when you'll be available</li>
                  <li>• Add custom time if needed</li>
                  <li>• Click "Check In" to become available for appointments</li>
                  <li>• You can check out anytime to stop receiving new appointments</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        {!isCheckedIn ? (
          <button
            onClick={handleCheckIn}
            disabled={loading || (selectedSlots.length === 0 && !showCustom)}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {loading && <Loader className="animate-spin" size={16} />}
            <span>Check In for Today</span>
          </button>
        ) : (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {loading && <Loader className="animate-spin" size={16} />}
            <span>Check Out</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckIn;