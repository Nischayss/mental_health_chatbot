import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, X } from 'lucide-react';

export default function CrisisModal({ onClose, guardianAlerted }) {
  const [countdown, setCountdown] = useState(15);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [countdown]);

  const handleEmergencyCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full shadow-2xl border-4 border-red-500 animate-slideIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-xl relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">We're Here to Help</h2>
              <p className="text-red-100 text-sm mt-1">You're not alone. Help is available right now.</p>
            </div>
            {canClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Guardian Alert Notice */}
          {guardianAlerted && (
            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4">
              <p className="text-green-800 font-semibold flex items-center gap-2">
                <span className="text-2xl">✅</span>
                Your guardian has been notified and will reach out to you shortly.
              </p>
            </div>
          )}

          {/* Immediate Action */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-5">
            <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-3">
              🆘 If you're in immediate danger:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleEmergencyCall('911')}
                className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <Phone className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-sm opacity-90">Emergency (US)</div>
                  <div className="text-xl">Call 911</div>
                </div>
              </button>

              <button
                onClick={() => handleEmergencyCall('108')}
                className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <Phone className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-sm opacity-90">Emergency (India)</div>
                  <div className="text-xl">Call 108</div>
                </div>
              </button>
            </div>
          </div>

          {/* Crisis Hotlines */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-5">
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-3">
              📞 Talk to Someone Right Now (24/7):
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleEmergencyCall('988')}
                className="w-full flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 transition group"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white">988 Suicide & Crisis Lifeline</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Call or text 988 • Free & Confidential</div>
                  </div>
                </div>
                <div className="text-blue-600 font-bold group-hover:translate-x-1 transition">→</div>
              </button>

              <button
                onClick={() => window.open('sms:741741?body=HELLO', '_blank')}
                className="w-full flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 transition group"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white">Crisis Text Line</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Text HELLO to 741741</div>
                  </div>
                </div>
                <div className="text-blue-600 font-bold group-hover:translate-x-1 transition">→</div>
              </button>

              <button
                onClick={() => handleEmergencyCall('18005990019')}
                className="w-full flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 transition group"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white">KIRAN Mental Health (India)</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">1800-599-0019 • 24/7 Support</div>
                  </div>
                </div>
                <div className="text-blue-600 font-bold group-hover:translate-x-1 transition">→</div>
              </button>
            </div>
          </div>

          {/* Reassurance Message */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-5">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">
              💜 You Are Not Alone
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>What you're feeling right now is temporary, even though it doesn't feel that way</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>Many people have felt this way and found help and hope</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>Your life has value and meaning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>Professional help can make a real difference</span>
              </li>
            </ul>
          </div>

          {/* Close Timer */}
          {!canClose && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please read the above resources • Closing in {countdown}s
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((15 - countdown) / 15) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}