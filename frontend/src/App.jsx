import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import BreathingExercise from './BreathingExercise';
import MoodTracker from './MoodTracker';
import Resources from './Resources';
import GamesHub from './GamesHub';
import Exercise from './Exercise.jsx';
import Sidebar from './components/ui/Sidebar';
import { Search, Paperclip, Mic, Send, Moon, Sun, Heart, X, Bookmark } from 'lucide-react';
import CrisisModal from './components/CrisisModal';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const scrollbarStyles = `
  .overflow-y-auto::-webkit-scrollbar {
    width: 8px;
  }
  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
  }
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 4px;
  }
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(107, 114, 128, 0.7);
  }
`;

function App() {
  const messagesEndRef = useRef(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [crisisData, setCrisisData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === "light") return false;
    if (saved === "dark") return true;
    return true;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedModel, setSelectedModel] = useState('training');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [showModal, setShowModal] = useState(null);
  const [savedMessages, setSavedMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  // Check auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('nisra_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem('nisra_user');
      }
    }
  }, []);

  // Load user data when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const userKey = `nisra_saved_${currentUser.email}`;
      const historyKey = `nisra_history_${currentUser.email}`;
      
      const saved = JSON.parse(localStorage.getItem(userKey) || '[]');
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      setSavedMessages(saved);
      setChatHistory(history);
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? "dark" : "light");
  }, [isDark]);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    localStorage.setItem('nisra_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://127.0.0.1:5000/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    }
    
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('nisra_user');
    setMessages([]);
    setChatHistory([]);
    setSavedMessages([]);
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
  };

  const selectChat = (chatId) => {
    setActiveChatId(chatId);
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    if (selectedChat) setMessages(selectedChat.messages);
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const startListening = () => {
    if (SpeechRecognition) {
      if (recognitionRef.current == null) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.onresult = event => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev + transcript);
          setIsListening(false);
        };
        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
      }
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert('Sorry, speech recognition is not supported in this browser.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

 const sendMessage = async () => {
  if (!input.trim() || loading) return;

  const userMsg = { role: 'user', content: input };
  setMessages(prev => [...prev, userMsg]);
  const currentInput = input; // Save input before clearing
  setInput('');
  setLoading(true);

  try {
    const response = await axios.post('http://127.0.0.1:5000/chat', {
      message: currentInput,
      response_type: selectedModel
    }, {
      withCredentials: true // Important for session cookies
    });

    const responseData = response.data.response;
    
    // CHECK FOR CRISIS RESPONSE
    if (responseData.type === 'crisis_intervention') {
      console.log('🚨 Crisis detected!');
      setCrisisData({
        guardianAlerted: responseData.guardian_alerted,
        crisisLevel: responseData.crisis_level
      });
      setShowCrisisModal(true);
    }

    const aiMsg = {
      role: 'assistant',
      content: responseData.answer,
      sources: responseData.sources || []
    };
    
    setMessages(prev => {
      const newMessages = [...prev, aiMsg];
      saveToHistory(newMessages);
      return newMessages;
    });

  } catch (error) {
    console.error('Error:', error);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      sources: []
    }]);
  } finally {
    setLoading(false);
  }
};

  const saveMessage = (message) => {
    if (!currentUser) return;
    const userKey = `nisra_saved_${currentUser.email}`;
    const newSaved = [...savedMessages, { ...message, savedAt: new Date().toISOString() }];
    setSavedMessages(newSaved);
    localStorage.setItem(userKey, JSON.stringify(newSaved));
    alert('💾 Message saved!');
  };

  const removeSavedMessage = (index) => {
    if (!currentUser) return;
    const userKey = `nisra_saved_${currentUser.email}`;
    const updated = savedMessages.filter((_, i) => i !== index);
    setSavedMessages(updated);
    localStorage.setItem(userKey, JSON.stringify(updated));
  };

  const saveToHistory = (msgs) => {
    if (msgs.length === 0 || !currentUser) return;
    const historyKey = `nisra_history_${currentUser.email}`;
    const newHistory = [...chatHistory, {
      id: Date.now(),
      messages: msgs,
      timestamp: new Date().toISOString()
    }];
    setChatHistory(newHistory);
    localStorage.setItem(historyKey, JSON.stringify(newHistory));
  };

  const loadHistorySession = (session) => {
    setMessages(session.messages);
    setShowModal(null);
  };

  const deleteHistorySession = (id) => {
    if (!currentUser) return;
    const historyKey = `nisra_history_${currentUser.email}`;
    const updated = chatHistory.filter(s => s.id !== id);
    setChatHistory(updated);
    localStorage.setItem(historyKey, JSON.stringify(updated));
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }
  {showCrisisModal && (
  <CrisisModal
    onClose={() => setShowCrisisModal(false)}
    guardianAlerted={crisisData?.guardianAlerted}
  />
)}

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0b0f] text-gray-900 dark:text-white flex transition-colors">
      <style>{scrollbarStyles}</style>

      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        setShowModal={setShowModal}
        savedMessages={savedMessages}
        chatHistory={chatHistory}
        startNewChat={startNewChat}
        activeChatId={activeChatId}
        selectChat={selectChat}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col">
        <header className="border-b border-gray-400 dark:border-gray-700 px-6 py-4 flex items-center justify-between bg-white dark:bg-[#0a0b0f]">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-900 dark:text-white">Mental Health Assistant</span>

          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 hover:bg-gray-200 dark:hover:bg-[#16181f] rounded-lg transition border border-gray-500 dark:border-gray-600"
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </header>

        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-[#0a0b0f]">
            <div className="max-w-3xl w-full text-center space-y-8">
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tl from-blue-300 via-indigo-400 to-purple-500"></div>
                </div>
              </div>

              <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
                {getTimeOfDay()}, {currentUser?.name?.split(' ')[0] || 'NISRA'}.
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">Can I help you with anything?</p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-white dark:bg-[#16181f] rounded-2xl p-2 max-w-2xl mx-auto border-2 border-gray-400 dark:border-gray-600 shadow-lg">
                  <button className="p-3 hover:bg-gray-100 dark:hover:bg-[#0a0b0f] rounded-lg transition">
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Message AI Chat..."
                    className="flex-1 bg-transparent py-2 outline-none placeholder-gray-500 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={`p-3 hover:bg-gray-100 dark:hover:bg-[#0a0b0f] rounded-lg transition ${isListening ? 'bg-blue-100' : ''}`}
                    onClick={() => (isListening ? stopListening() : startListening())}
                    disabled={loading}
                  >
                    <Mic className={`w-5 h-5 ${isListening ? 'text-blue-600' : 'text-gray-500'}`} />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:shadow-lg disabled:opacity-40 transition text-white"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {[
                    { id: 'training', label: 'Training Model' },
                    { id: 'professional', label: 'Professional' },
                    { id: 'rag', label: 'RAG+' },  // NEW!
                    { id: 'web', label: 'Web Search' },
                    { id: 'mix', label: 'Mix All 3' }
                  ].map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
                        selectedModel === model.id
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                          : 'bg-white dark:bg-[#16181f] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1d24] border-2 border-gray-400 dark:border-gray-600'
                      }`}
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-[#0a0b0f]" style={{ maxHeight: 'calc(100vh - 240px)' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${msg.role === 'user' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-white dark:bg-[#16181f] text-gray-900 dark:text-white border-2 border-gray-400 dark:border-gray-600'} rounded-2xl px-5 py-3 shadow-lg`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-wrap flex-1">{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <button onClick={() => saveMessage(msg)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" title="Save message">
                        <Bookmark className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-700">
                      <p className="text-xs font-semibold mb-1 opacity-70">Sources:</p>
                      {msg.sources.slice(0, 3).map((source, i) => (
                        <a key={i} href={source.url} target="_blank" rel="noopener noreferrer" className="block text-xs hover:underline opacity-70">
                          {source.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#16181f] border-2 border-gray-400 dark:border-gray-600 rounded-2xl px-5 py-3 shadow-lg">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {messages.length > 0 && (
          <div className="border-t border-gray-400 dark:border-gray-700 p-6 bg-white dark:bg-[#0a0b0f]">
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#16181f] rounded-2xl p-2 max-w-4xl mx-auto border-2 border-gray-400 dark:border-gray-600 shadow-lg">
              <button className="p-3 hover:bg-gray-200 dark:hover:bg-[#0a0b0f] rounded-lg transition">
                <Paperclip className="w-5 h-5 text-gray-500" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Message AI Chat..."
                className="flex-1 bg-transparent py-2 outline-none placeholder-gray-500 text-gray-900 dark:text-white"
                disabled={loading}
              />
              <button
                onClick={() => (isListening ? stopListening() : startListening())}
                className="p-3 hover:bg-gray-200 dark:hover:bg-[#0a0b0f] rounded-lg transition"
              >
                <Mic className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:shadow-lg disabled:opacity-40 transition text-white"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center gap-2 mt-3 flex-wrap">
              {[
                { id: 'training', label: 'Training' },
                { id: 'professional', label: 'Professional' },
                { id: 'rag', label: 'RAG+' },  // NEW!
                { id: 'web', label: 'Web' },
                { id: 'mix', label: 'Mix' }
              ].map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                    selectedModel === model.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-gray-200 dark:bg-[#16181f] text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-400 dark:border-gray-600'
                  }`}
                >
                  {model.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showModal === 'breathing' && <BreathingExercise onClose={() => setShowModal(null)} />}
      {showModal === 'saved' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#16181f] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">💾 Saved Messages</h2>
              <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            {savedMessages.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No saved messages yet.</p>
            ) : (
              <div className="space-y-3">
                {savedMessages.map((msg, idx) => (
                  <div key={idx} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                      <p className="flex-1 text-gray-900 dark:text-white">{msg.content}</p>
                      <button onClick={() => removeSavedMessage(idx)} className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{new Date(msg.savedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showModal === 'history' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#16181f] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📜 Chat History</h2>
              <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            {chatHistory.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No chat history yet.</p>
            ) : (
              <div className="space-y-3">
                {chatHistory.map((session) => (
                  <div key={session.id} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">{session.messages.length} messages</p>
                        <p className="text-xs text-gray-500">{new Date(session.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => loadHistorySession(session)} className="px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-sm">
                          Load
                        </button>
                        <button onClick={() => deleteHistorySession(session.id)} className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showModal === 'mood' && <MoodTracker onClose={() => setShowModal(null)} />}
      {showModal === 'resources' && <Resources onClose={() => setShowModal(null)} currentUser={currentUser} />}
      {showModal === 'games' && <GamesHub onClose={() => setShowModal(null)} />}
      {showModal === 'exercise' && <Exercise onClose={() => setShowModal(null)} />}
    </div>
  );
}

export default App;