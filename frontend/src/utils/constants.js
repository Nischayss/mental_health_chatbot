export const RESPONSE_TYPES = {
  TRAINING: {
    id: 'training',
    name: 'Training Model',
    icon: '🧠',
    description: 'Fine-tuned AI trained on mental health conversations',
    color: 'from-blue-500 to-purple-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-500',
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    icon: '👨‍⚕️',
    description: 'Evidence-based clinical guidance from psychology experts',
    color: 'from-green-500 to-teal-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-500',
  },
  WEB: {
    id: 'web',
    name: 'Web Search',
    icon: '🌐',
    description: 'Live search of trusted mental health websites (Perplexity-style)',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-500',
  },
  MIX: {
    id: 'mix',
    name: 'Mix All 3',
    icon: '🔄',
    description: 'Comprehensive analysis using all three approaches combined',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-500',
  },
};

export const EMERGENCY_CONTACTS = [
  {
    name: 'Suicide Prevention Lifeline',
    number: '988',
    description: 'Call or text 988 - Available 24/7',
    icon: '📞',
    href: 'tel:988',
  },
  {
    name: 'Emergency Services',
    number: '911',
    description: 'For immediate emergency',
    icon: '🚨',
    href: 'tel:911',
  },
];

export const WELLNESS_TOOLS = [
  { id: 'mood', name: 'Mood Tracker', icon: '😊', color: 'bg-yellow-500' },
  { id: 'breathing', name: 'Breathing Exercise', icon: '💨', color: 'bg-blue-500' },
  { id: 'exercise', name: 'Physical Exercise', icon: '🏃', color: 'bg-green-500' },
  { id: 'resources', name: 'Mental Health Resources', icon: '📚', color: 'bg-purple-500' },
];

export const GAMES = [
  { id: 'memory', name: 'Memory Match', icon: '🧩', description: 'Test your memory skills' },
  { id: 'colors', name: 'Color Match', icon: '🎨', description: 'Match the colors' },
  { id: 'scramble', name: 'Word Scramble', icon: '✏️', description: 'Unscramble words' },
  { id: 'dino', name: 'Dino Runner', icon: '🦖', description: 'Jump and dodge' },
];

export const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'hurt myself', 'harm myself',
  'end it all', 'want to die', 'no point living', 'better off dead',
  'end my life', 'take my life', 'not worth living', 'cant go on'
];
