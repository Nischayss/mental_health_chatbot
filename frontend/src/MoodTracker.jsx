import { useState } from 'react';
import { X, Calendar } from 'lucide-react';

function MoodTracker({ onClose }) {
  const [selectedMood, setSelectedMood] = useState('');
  const [note, setNote] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);

  const moods = [
    { emoji: '😊', label: 'Happy', color: 'bg-green-100 dark:bg-green-900' },
    { emoji: '😌', label: 'Calm', color: 'bg-blue-100 dark:bg-blue-900' },
    { emoji: '😐', label: 'Neutral', color: 'bg-gray-100 dark:bg-gray-700' },
    { emoji: '😔', label: 'Sad', color: 'bg-blue-200 dark:bg-blue-800' },
    { emoji: '😰', label: 'Anxious', color: 'bg-yellow-100 dark:bg-yellow-900' },
    { emoji: '😢', label: 'Depressed', color: 'bg-purple-100 dark:bg-purple-900' },
    { emoji: '😤', label: 'Angry', color: 'bg-red-100 dark:bg-red-900' },
    { emoji: '🤗', label: 'Excited', color: 'bg-pink-100 dark:bg-pink-900' }
  ];

  const saveMood = () => {
    if (!selectedMood) {
      alert('Please select a mood');
      return;
    }

    const newEntry = {
      mood: selectedMood,
      note,
      date: new Date().toLocaleString(),
      id: Date.now()
    };

    setMoodHistory([newEntry, ...moodHistory]);
    setSelectedMood('');
    setNote('');
    alert('Mood logged successfully!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#16181f] rounded-2xl p-8 max-w-2xl w-full border-2 border-gray-400 dark:border-gray-600 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mood Tracker</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mood Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            How are you feeling today?
          </label>
          <div className="grid grid-cols-4 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.label}
                onClick={() => setSelectedMood(mood.label)}
                className={`p-4 rounded-xl transition ${
                  selectedMood === mood.label
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                    : `${mood.color} hover:scale-105`
                }`}
              >
                <div className="text-4xl mb-2">{mood.emoji}</div>
                <div className="text-xs font-medium">{mood.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Add a note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 transition resize-none"
            rows="3"
          />
        </div>

        <button
          onClick={saveMood}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg transition"
        >
          Save Mood Entry
        </button>

        {/* Mood History */}
        {moodHistory.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Mood History
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {moodHistory.map((entry) => (
                <div key={entry.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {moods.find(m => m.label === entry.mood)?.emoji} {entry.mood}
                    </span>
                    <span className="text-xs text-gray-500">{entry.date}</span>
                  </div>
                  {entry.note && <p className="text-sm text-gray-600 dark:text-gray-400">{entry.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MoodTracker;
