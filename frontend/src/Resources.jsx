 import { X, Phone, Mail, Globe, Shield, Heart, AlertCircle } from 'lucide-react';

export default function Resources({ onClose, currentUser }) {
  const emergencyResources = [
    {
      name: '988 Suicide & Crisis Lifeline',
      description: 'Free, confidential 24/7 support for people in distress',
      contact: '988',
      type: 'call',
      region: 'US',
      icon: <Phone className="w-6 h-6" />
    },
    {
      name: 'Crisis Text Line',
      description: 'Text-based crisis support available 24/7',
      contact: '741741',
      message: 'HELLO',
      type: 'sms',
      region: 'US',
      icon: <Phone className="w-6 h-6" />
    },
    {
      name: 'Emergency Services',
      description: 'Immediate emergency response',
      contact: '911',
      type: 'call',
      region: 'US',
      icon: <AlertCircle className="w-6 h-6" />
    },
    {
      name: 'KIRAN Mental Health Helpline',
      description: '24/7 mental health support in multiple languages',
      contact: '1800-599-0019',
      type: 'call',
      region: 'India',
      icon: <Phone className="w-6 h-6" />
    },
    {
      name: 'Emergency Services (India)',
      description: 'Immediate emergency response',
      contact: '108',
      type: 'call',
      region: 'India',
      icon: <AlertCircle className="w-6 h-6" />
    }
  ];

  const onlineResources = [
    {
      name: 'National Institute of Mental Health (NIMH)',
      description: 'Comprehensive mental health information and resources',
      url: 'https://www.nimh.nih.gov',
      icon: <Globe className="w-6 h-6" />
    },
    {
      name: 'Mental Health America',
      description: 'Mental health screening tools and resources',
      url: 'https://www.mhanational.org',
      icon: <Heart className="w-6 h-6" />
    },
    {
      name: 'NAMI (National Alliance on Mental Illness)',
      description: 'Support, education, and advocacy for mental health',
      url: 'https://www.nami.org',
      icon: <Shield className="w-6 h-6" />
    },
    {
      name: 'Psychology Today - Find a Therapist',
      description: 'Directory of mental health professionals',
      url: 'https://www.psychologytoday.com/us/therapists',
      icon: <Globe className="w-6 h-6" />
    }
  ];

  const handleContact = (resource) => {
    if (resource.type === 'call') {
      window.location.href = `tel:${resource.contact}`;
    } else if (resource.type === 'sms') {
      window.open(`sms:${resource.contact}?body=${resource.message || ''}`, '_blank');
    }
  };

// Get guardian info from currentUser prop (fetched from backend)
  const getGuardianInfo = () => {
    if (currentUser && currentUser.guardian_phone) {
      return {
        phone: currentUser.guardian_phone || 'Not provided',
        name: 'Guardian'
      };
    }
    return null;
  };

  const guardianInfo = getGuardianInfo();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#16181f] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 dark:border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Mental Health Resources</h2>
                <p className="text-blue-100 text-sm">Support is always available</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Guardian Contact Section - PROMINENT */}
          {guardianInfo && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 dark:border-green-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                    🛡️ Your Trusted Guardian
                  </h3>
                  <p className="text-green-800 dark:text-green-200 mb-3">
                    Your guardian is here to support you. They'll be notified if you need urgent help.
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Guardian Contact</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Phone className="w-5 h-5 text-green-600" />
                          {guardianInfo.phone}
                        </p>
                      </div>
                      <button
                        onClick={() => window.location.href = `tel:${guardianInfo.phone}`}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
                      >
                        <Phone className="w-5 h-5" />
                        Call Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Resources */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Emergency Crisis Support (24/7)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyResources.map((resource, index) => (
                <button
                  key={index}
                  onClick={() => handleContact(resource)}
                  className="bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 rounded-xl p-4 transition group text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                      {resource.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white">{resource.name}</h4>
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-400">
                          {resource.region}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{resource.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">{resource.contact}</span>
                        {resource.message && (
                          <span className="text-xs text-gray-500">• Text: {resource.message}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Online Resources */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-500" />
              Online Resources & Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onlineResources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-4 transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                      {resource.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {resource.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{resource.description}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 truncate">{resource.url}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-5">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Remember
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>It's okay to ask for help - seeking support is a sign of strength</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>Your feelings are valid and you deserve support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>Recovery is possible with the right support and treatment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>You are not alone - millions of people experience mental health challenges</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}