import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun,
  Save,
  User,
  Mail,
  Phone,
  Clock,
  Video,
  MessageSquare,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/firebaseService';
import { useTheme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { user, doctor } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      appointmentReminders: true,
      newPatientAlerts: true
    },
    consultation: {
      videoConsultationEnabled: false,
      consultationDuration: 30,
      bufferTime: 10,
      autoAcceptAppointments: false
    },
    privacy: {
      profileVisibility: 'public',
      shareDataWithPartners: false,
      allowPatientReviews: true
    },
    appearance: {
      theme: 'light',
      language: 'en',
      timezone: 'Asia/Kolkata'
    }
  });
  const [language, setLanguage] = useState(settings.appearance.language);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  useEffect(() => {
    setLanguage(settings.appearance.language);
  }, [settings.appearance.language]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      // Load settings from Firebase or use defaults
      const doctorProfile = await FirebaseService.getDoctorProfile(user.uid);
      if (doctorProfile?.settings) {
        setSettings(prev => ({ ...prev, ...doctorProfile.settings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const success = await FirebaseService.updateDoctorProfile(user.uid, {
        settings,
        lastUpdated: new Date()
      });
      
      if (success) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('An error occurred while saving settings.');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const SettingSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="text-blue-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const ToggleSwitch = ({ enabled, onChange, label, description }: any) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600 mt-1">Manage your account preferences and configurations</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading && <Loader className="animate-spin" size={16} />}
          <Save size={16} />
          <span>Save Changes</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingSection title="Notifications" icon={Bell}>
          <ToggleSwitch
            enabled={settings.notifications.emailNotifications}
            onChange={(value: boolean) => updateSetting('notifications', 'emailNotifications', value)}
            label="Email Notifications"
            description="Receive notifications via email"
          />
          <ToggleSwitch
            enabled={settings.notifications.smsNotifications}
            onChange={(value: boolean) => updateSetting('notifications', 'smsNotifications', value)}
            label="SMS Notifications"
            description="Receive notifications via SMS"
          />
          <ToggleSwitch
            enabled={settings.notifications.appointmentReminders}
            onChange={(value: boolean) => updateSetting('notifications', 'appointmentReminders', value)}
            label="Appointment Reminders"
            description="Get reminded about upcoming appointments"
          />
          <ToggleSwitch
            enabled={settings.notifications.newPatientAlerts}
            onChange={(value: boolean) => updateSetting('notifications', 'newPatientAlerts', value)}
            label="New Patient Alerts"
            description="Get notified when new patients book appointments"
          />
        </SettingSection>

        <SettingSection title="Video Consultation" icon={Video}>
          <ToggleSwitch
            enabled={settings.consultation.videoConsultationEnabled}
            onChange={(value: boolean) => updateSetting('consultation', 'videoConsultationEnabled', value)}
            label="Enable Video Consultation"
            description="Allow patients to book video consultations"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consultation Duration (minutes)
            </label>
            <select
              value={settings.consultation.consultationDuration}
              onChange={(e) => updateSetting('consultation', 'consultationDuration', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buffer Time (minutes)
            </label>
            <select
              value={settings.consultation.bufferTime}
              onChange={(e) => updateSetting('consultation', 'bufferTime', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
            </select>
          </div>

          <ToggleSwitch
            enabled={settings.consultation.autoAcceptAppointments}
            onChange={(value: boolean) => updateSetting('consultation', 'autoAcceptAppointments', value)}
            label="Auto-accept Appointments"
            description="Automatically accept new appointment requests"
          />
        </SettingSection>

        <SettingSection title="Privacy & Security" icon={Shield}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Visibility
            </label>
            <select
              value={settings.privacy.profileVisibility}
              onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <option value="public">Public</option>
              <option value="limited">Limited</option>
              <option value="private">Private</option>
            </select>
          </div>

          <ToggleSwitch
            enabled={settings.privacy.shareDataWithPartners}
            onChange={(value: boolean) => updateSetting('privacy', 'shareDataWithPartners', value)}
            label="Share Data with Partners"
            description="Allow sharing anonymized data with healthcare partners"
          />

          <ToggleSwitch
            enabled={settings.privacy.allowPatientReviews}
            onChange={(value: boolean) => updateSetting('privacy', 'allowPatientReviews', value)}
            label="Allow Patient Reviews"
            description="Let patients leave reviews and ratings"
          />
        </SettingSection>

        <SettingSection title="Appearance & Language" icon={Globe}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  theme === 'light' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <Sun size={16} />
                <span>Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <Moon size={16} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                updateSetting('appearance', 'language', e.target.value);
              }}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.appearance.timezone}
              onChange={(e) => updateSetting('appearance', 'timezone', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="Europe/London">Greenwich Mean Time (GMT)</option>
            </select>
          </div>
        </SettingSection>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <User className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{doctor?.name || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{doctor?.email || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{doctor?.phone || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-medium text-gray-900">
                {doctor?.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;