import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope } from 'lucide-react';

const Landing: React.FC = () => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleChoice = (role: 'doctor' | 'patient') => {
    setOpen(false);
    setTimeout(() => {
      if (role === 'doctor') navigate('/login');
      else navigate('/patient/login');
    }, 400); // allow modal fade-out
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 animate-gradient bg-gradient-to-br from-indigo-500 via-purple-400 to-pink-400 opacity-90" style={{ filter: 'blur(2px)' }} />
      <style>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientBG 8s ease-in-out infinite;
        }
      `}</style>
      {/* Glassmorphic Modal */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-10">
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl shadow-2xl p-10 max-w-lg w-full text-center border border-white/40 animate-fade-in">
            <h2 className="text-3xl font-extrabold mb-3 text-indigo-800 drop-shadow">Welcome!</h2>
            <p className="mb-8 text-lg text-gray-700 font-medium">Who are you?</p>
            <div className="flex gap-8 justify-center">
              <button
                className="flex flex-col items-center gap-2 px-8 py-6 bg-white/70 hover:bg-indigo-600 hover:text-white rounded-xl shadow-lg transition-all duration-300 border border-indigo-200 hover:scale-105 focus:outline-none"
                onClick={() => handleChoice('doctor')}
              >
                <Stethoscope size={40} className="text-indigo-700 mb-1" />
                <span className="text-xl font-semibold">Doctor</span>
              </button>
              <button
                className="flex flex-col items-center gap-2 px-8 py-6 bg-white/70 hover:bg-pink-500 hover:text-white rounded-xl shadow-lg transition-all duration-300 border border-pink-200 hover:scale-105 focus:outline-none"
                onClick={() => handleChoice('patient')}
              >
                <User size={40} className="text-pink-600 mb-1" />
                <span className="text-xl font-semibold">Patient</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing; 