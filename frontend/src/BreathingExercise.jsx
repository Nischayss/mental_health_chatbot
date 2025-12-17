import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';

function BreathingExercise({ onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('Breathe In');
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);
  const [mode, setMode] = useState('breathing');
  const [selectedMusic, setSelectedMusic] = useState('');
  const [duration, setDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(300);
  const [useMusicInMeditation, setUseMusicInMeditation] = useState(true);
  const audioRef = useRef(null);

  const musicFiles = [
    { id: 'birds', name: 'Birds in Crescent', file: '/sounds/birds-in-cressent.mp3' },
    { id: 'rain', name: 'Gentle Rain', file: '/sounds/gentle-rain.mp3' },
    { id: 'ocean', name: 'Ocean Waves', file: '/sounds/ocean-waves.mp3' },
    { id: 'waterfall', name: 'Small Waterfall', file: '/sounds/small-waterfall.mp3' }
  ];

  useEffect(() => {
    if (!isActive || mode !== 'breathing') return;
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev === 1) {
          setPhase(current => {
            if (current === 'Breathe In') return 'Hold';
            if (current === 'Hold') return 'Breathe Out';
            if (current === 'Breathe Out') {
              setCycles(c => c + 1);
              return 'Breathe In';
            }
          });
          return phase === 'Breathe In' ? 4 : phase === 'Hold' ? 7 : 8;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, phase, mode]);

  useEffect(() => {
    if (!isActive || mode !== 'meditation') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopMeditation();
          alert('Meditation complete! 🧘');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, mode]);

  const startBreathing = () => {
    setIsActive(true);
    setCycles(0);
    setPhase('Breathe In');
    setCount(4);
  };

  const startMeditation = () => {
    if (useMusicInMeditation && !selectedMusic) {
      alert('⚠️ Please select music or toggle "Without Music"');
      return;
    }
    
    setIsActive(true);
    setTimeLeft(duration * 60);

    if (useMusicInMeditation && selectedMusic && audioRef.current) {
      const file = musicFiles.find(m => m.id === selectedMusic)?.file;
      if (file) {
        audioRef.current.src = file;
        audioRef.current.loop = true;
        audioRef.current.volume = 0.6;
        audioRef.current.play().catch(err => {
          console.error('Audio error:', err);
          alert('❌ Music not found. Check if files are in /static/sounds/');
        });
      }
    }
  };

  const stopMeditation = () => {
    setIsActive(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1d24] rounded-2xl p-6 max-w-2xl w-full border border-gray-300 dark:border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🧘 Breathing & Meditation</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition">
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => { setMode('breathing'); setIsActive(false); }}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
              mode === 'breathing'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
            }`}
          >
            🌬️ Breathing
          </button>
          <button
            onClick={() => { setMode('meditation'); setIsActive(false); stopMeditation(); }}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
              mode === 'meditation'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
            }`}
          >
            🧘 Meditation
          </button>
        </div>

        {mode === 'breathing' && (
          <div className="text-center">
            <div className="mb-8">
              <div className={`text-7xl font-bold mb-4 transition-all duration-500 ${
                phase === 'Breathe In' ? 'text-gray-900 dark:text-white scale-110' :
                phase === 'Hold' ? 'text-gray-700 dark:text-gray-400 scale-105' :
                'text-gray-600 dark:text-gray-500 scale-100'
              }`}>
                {count}
              </div>
              <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{phase}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Cycles: {cycles}</div>
            </div>
            <button
              onClick={() => isActive ? setIsActive(false) : startBreathing()}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg flex items-center gap-3 mx-auto ${
                isActive
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900'
              }`}
            >
              {isActive ? <><Pause className="w-5 h-5" /> Stop</> : <><Play className="w-5 h-5" /> Start</>}
            </button>
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>4-7-8 Breathing:</strong> In for 4s, hold 7s, out for 8s
              </p>
            </div>
          </div>
        )}

        {mode === 'meditation' && (
          <div>
            {!isActive ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <span className="font-semibold text-gray-900 dark:text-white">Background Music</span>
                  <button
                    onClick={() => {
                      setUseMusicInMeditation(!useMusicInMeditation);
                      if (useMusicInMeditation) setSelectedMusic('');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                      useMusicInMeditation
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-400 dark:bg-gray-600 text-white'
                    }`}
                  >
                    {useMusicInMeditation ? <><Volume2 className="w-4 h-4" /> With Music</> : <><VolumeX className="w-4 h-4" /> Silent</>}
                  </button>
                </div>

                {useMusicInMeditation && (
                  <div>
                    <label className="block text-sm font-bold mb-3 text-gray-900 dark:text-white">
                      Select Music
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {musicFiles.map(music => (
                        <button
                          key={music.id}
                          onClick={() => setSelectedMusic(music.id)}
                          className={`p-4 rounded-xl font-medium transition ${
                            selectedMusic === music.id
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 ring-2 ring-gray-900 dark:ring-white'
                              : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                          }`}
                        >
                          {music.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold mb-3 text-gray-900 dark:text-white">Duration</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[5, 10, 15, 20].map(min => (
                      <button
                        key={min}
                        onClick={() => setDuration(min)}
                        className={`py-3 rounded-xl font-bold transition ${
                          duration === min
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                        }`}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startMeditation}
                  className="w-full py-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5" /> Start Meditation
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-8">
                  <div className="text-7xl font-bold text-gray-900 dark:text-white mb-4">{formatTime(timeLeft)}</div>
                  <div className="text-xl text-gray-600 dark:text-gray-400">Stay present...</div>
                  {useMusicInMeditation && selectedMusic && (
                    <div className="mt-3 text-sm text-gray-500 dark:text-gray-500">
                      🎵 {musicFiles.find(m => m.id === selectedMusic)?.name}
                    </div>
                  )}
                </div>
                <button
                  onClick={stopMeditation}
                  className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-lg transition shadow-lg flex items-center gap-3 mx-auto"
                >
                  <Pause className="w-5 h-5" /> Stop
                </button>
              </div>
            )}
          </div>
        )}

        <audio ref={audioRef} />
      </div>
    </div>
  );
}

export default BreathingExercise;
