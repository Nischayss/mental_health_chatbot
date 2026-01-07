import { X, Phone, AlertTriangle, Shield } from 'lucide-react';

export default function CrisisModal({ onClose, guardianAlerted, crisisLevel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-red-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Crisis Support</h2>
              <p className="text-red-100">Immediate help is available 24/7</p>
            </div>
          </div>
        </div>

        {/* Guardian Alert Banner */}
        {guardianAlerted && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 m-6 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">Guardian Notified</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your guardian has been alerted and may reach out to you soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Numbers */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border-2 border-red-200 dark:border-red-700">
            <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
              <Phone className="w-6 h-6" />
              🆘 Call NOW for Immediate Help
            </h3>
            
            <div className="space-y-3">
              {/* US Numbers */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-bold text-gray-900 dark:text-white text-lg mb-2">🇺🇸 United States</p>
                <a href="tel:988" className="block text-3xl font-bold text-red-600 hover:text-red-700 mb-1">
                  988
                </a>
                <p className="text-sm text-gray-600 dark:text-gray-400">Suicide & Crisis Lifeline (Call or Text)</p>
                
                <a href="tel:911" className="block text-2xl font-bold text-red-600 hover:text-red-700 mt-3">
                  911
                </a>
                <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Services</p>
              </div>

              {/* India Numbers */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-bold text-gray-900 dark:text-white text-lg mb-2">🇮🇳 India</p>
                <a href="tel:18005990019" className="block text-2xl font-bold text-red-600 hover:text-red-700 mb-1">
                  1800-599-0019
                </a>
                <p className="text-sm text-gray-600 dark:text-gray-400">KIRAN Mental Health Helpline</p>
                
                <a href="tel:108" className="block text-2xl font-bold text-red-600 hover:text-red-700 mt-3">
                  108
                </a>
                <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Services</p>
              </div>
            </div>
          </div>

          {/* Important Message */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-lg">
            <p className="text-gray-900 dark:text-gray-100 font-semibold mb-2">
              💛 You Are Not Alone
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Crisis counselors are trained professionals who can help you through this difficult time. 
              They're available 24/7, and the call is free and confidential.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a 
              href="tel:988"
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-bold text-center hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Call 988 (US) / 108 (India) Now
            </a>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-4 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              I'm Safe - Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}