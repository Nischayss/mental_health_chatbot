// =============================================================================
// NISRA  COMPLETE JAVASCRIPT
// =============================================================================

console.log("🚀 NISRA  loading...");

// Global variables
let lastUserMessage = "";
let isTyping = false;
let currentResponseType = "training";
let breathingInterval = null;
let breathingPhase = 0;
// Voice assistant variables
let isRecording = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Set time-based greeting
// Set time-based greeting
const hour = new Date().getHours();
let greeting = 'Good Morning';
if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
if (hour >= 17) greeting = 'Good Evening';

const greetingEl = document.getElementById('greeting-time');
if (greetingEl) {
    greetingEl.textContent = greeting;
}

    console.log("📱 DOM loaded - initializing NISRA ");
    initializeApp();
});

function initializeApp() {
    console.log("⚙️ Initializing app...");
    
    // Ensure welcome screen is visible
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatMessages = document.getElementById('chat-messages');  
    const chatInputArea = document.getElementById('chat-input-area');
    
    console.log("Elements found:", {
        welcomeScreen: !!welcomeScreen,
        chatMessages: !!chatMessages,
        chatInputArea: !!chatInputArea
    });

    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
        console.log("✅ Welcome screen visible");
    }

    if (chatMessages) {
        chatMessages.style.display = 'none';
        console.log("✅ Chat messages hidden");
    }

    if (chatInputArea) {
        chatInputArea.style.display = 'none';
        console.log("✅ Chat input hidden");
    }

    setupEventListeners();
    // NEW: Restore sidebar state on desktop
    if (window.innerWidth > 768) {
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.querySelector('.menu-btn');
        
        if (sidebar && sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            if (menuBtn) {
                menuBtn.setAttribute('aria-expanded', 'false');
            }
            console.log("💾 Restored collapsed sidebar state");
        }
    }
    checkSystemTheme();
    setResponseType('training');
    updateMoodValue(); // Initialize mood tracker
    
    console.log("🎉 App initialized successfully!");
}

function setupEventListeners() {
    // Input listeners
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', handleInputKeydown);
        chatInput.addEventListener('input', adjustTextareaHeight);
    }

    // Response type button listeners
    document.querySelectorAll('.response-option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setResponseType(this.dataset.type);
        });
    });

    // Close modals when clicking overlay
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });
    
    // Enhanced click outside to close sidebar
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = e.target.closest('.menu-btn');
        const sidebarContent = e.target.closest('.sidebar');
        
        if (window.innerWidth <= 768 && 
            sidebar && sidebar.classList.contains('active') && 
            !menuBtn && 
            !sidebarContent) {
            sidebar.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // NEW: Keyboard support for sidebar toggle
    document.addEventListener('keydown', function(e) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        
        // Escape key closes sidebar
        if (e.key === 'Escape') {
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        }
    });
    
    // NEW: Menu button keyboard accessibility
    const menuBtn = document.querySelector('.menu-btn');
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle');
    
    if (menuBtn) {
        menuBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSidebar();
            }
        });
    }
    
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSidebar();
            }
        });
    }

    console.log("🎧 Event listeners set up");
}

// =============================================================================
// CHAT FUNCTIONS
// =============================================================================

function startChat() {
    console.log("🎯 Starting chat...");
    
    try {
        const welcomeScreen = document.getElementById('welcome-screen');
        const chatMessages = document.getElementById('chat-messages');
        const chatInputArea = document.getElementById('chat-input-area');
        
        // FORCEFULLY OVERRIDE ALL STYLES
        if (welcomeScreen) {
            welcomeScreen.style.setProperty('display', 'none', 'important');
            console.log("✅ Welcome screen hidden");
        }
        
        if (chatMessages) {
            chatMessages.style.setProperty('display', 'block', 'important');
            console.log("✅ Chat messages shown");
        }
        
        if (chatInputArea) {
            chatInputArea.style.setProperty('display', 'block', 'important');
            console.log("✅ Chat input shown");
        }

        // Add welcome message
        setTimeout(() => {
            addMessage({
                answer: "Hello! I'm NISRA  with **4 distinct response types**:\n\n**🧠 Training Model** - Fine-tuned AI trained on mental health conversations\n**🩺 Professional** - Evidence-based clinical guidance from experts\n**🌐 Web Search** - Live search of trusted mental health websites (like Perplexity)\n**🔄 Mix of All 3** - Combined insights from all approaches\n\nSelect your preferred response type using the buttons below and ask me anything about mental health!",
                sources: [{
                    title: 'NISRA  Response System',
                    url: '#',
                    snippet: 'Four specialized response types for comprehensive mental health support',
                    displayUrl: 'NISRA .ai',
                    source_id: 1,
                    type: 'system_info'
                }],
                type: 'welcome',
                confidence: 1.0
            }, 'bot');

            // Focus input
            const input = document.getElementById('chat-input');
            if (input) {
                input.focus();
                console.log("✅ Input focused");
            }
        }, 300);
        
        console.log("🎉 Chat started successfully!");
        
    } catch (error) {
        console.error("❌ Start chat error:", error);
        alert("Error starting chat. Please refresh and try again.");
    }
}

function addMessage(content, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) {
        console.error("❌ Messages container not found!");
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${formatMessageText(content)}</div>
                <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
        `;
    } else {
        const response = typeof content === 'string' ? { answer: content, sources: [], type: 'simple' } : content;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                ${createResponseTypeHeader(response.type)}
                <div class="message-text">${formatMessageText(response.answer)}</div>
                ${response.sources && response.sources.length > 0 ? createSourcesSection(response.sources) : ''}
                <div class="message-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 0.8rem; color: #718096;">
                    <div>${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <div>Confidence: ${Math.round((response.confidence || 0.8) * 100)}%</div>
                </div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    console.log(`✅ Message added: ${sender}`);
}

function createResponseTypeHeader(type) {
    const headers = {
        'training_model': {
            title: '🧠 TRAINING MODEL RESPONSE',
            description: 'Fine-tuned AI trained specifically on mental health conversations',
            color: '#667eea'
        },
        'professional_guidance': {
            title: '🩺 PROFESSIONAL CLINICAL RESPONSE',
            description: 'Evidence-based guidance from clinical psychology experts',
            color: '#48bb78'
        },
        'web_search': {
            title: '🌐 WEB SEARCH RESPONSE (PERPLEXITY-STYLE)',
            description: 'Live search results from trusted mental health websites with synthesis',
            color: '#ed8936'
        },
        'comprehensive_analysis': {
            title: '🔄 MIXED RESPONSE (ALL 3 COMBINED)',
            description: 'Comprehensive analysis using Training + Professional + Web Search',
            color: '#9f7aea'
        },
        'expert_knowledge': {
            title: '🔍 AGENTIC RAG RESPONSE',
            description: 'Expert knowledge base with reasoning and clinical insights',
            color: '#38b2ac'
        },
        'welcome': {
            title: '👋 WELCOME MESSAGE',
            description: 'Introduction to NISRA  capabilities',
            color: '#4299e1'
        }
    };
    
    const header = headers[type] || {
        title: '💬 STANDARD RESPONSE',
        description: 'General mental health support',
        color: '#718096'
    };
    
    return `
        <div class="response-type-header" style="background: rgba(102, 126, 234, 0.1); padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid ${header.color};">
            <div style="font-weight: 600; font-size: 0.9rem; color: ${header.color};">${header.title}</div>
            <div style="font-size: 0.75rem; color: #718096; margin-top: 2px;">${header.description}</div>
        </div>
    `;
}

function createSourcesSection(sources) {
    if (!sources || sources.length === 0) return '';
    
    let sourcesHtml = '<div style="margin-top: 16px; padding: 12px; background: rgba(0,0,0,0.05); border-radius: 8px;"><h4 style="margin: 0 0 12px 0; font-size: 0.9rem;">📚 Sources:</h4>';
    
    sources.forEach((source, index) => {
        sourcesHtml += `
            <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; border-left: 3px solid #667eea;">
                <div style="font-weight: 600; font-size: 0.85rem;">${source.title}</div>
                <div style="font-size: 0.8rem; color: #718096;">${source.displayUrl}</div>
                <div style="font-size: 0.8rem; margin-top: 4px;">${source.snippet}</div>
            </div>
        `;
    });
    
    sourcesHtml += '</div>';
    return sourcesHtml;
}

function createResponseOptions() {
    return `
        <div class="response-options">
            <p><strong>💡 Try Different Response Types:</strong></p>
            <div class="option-buttons">
                <button class="option-btn training-btn" onclick="getSpecificResponse('training')" title="Get response from fine-tuned AI model">
                    <i class="fas fa-brain"></i>
                    <div class="btn-text">
                        <div class="btn-title">Training Model</div>
                        <div class="btn-desc">AI trained on therapy data</div>
                    </div>
                </button>
                <button class="option-btn professional-btn" onclick="getSpecificResponse('professional')" title="Get clinical professional guidance">
                    <i class="fas fa-user-md"></i>
                    <div class="btn-text">
                        <div class="btn-title">Professional</div>
                        <div class="btn-desc">Clinical expertise</div>
                    </div>
                </button>
                <button class="option-btn web-btn" onclick="getSpecificResponse('web')" title="Search trusted mental health websites like Perplexity">
                    <i class="fas fa-globe"></i>
                    <div class="btn-text">
                        <div class="btn-title">Web Search</div>
                        <div class="btn-desc">Live trusted sources</div>
                    </div>
                </button>
                <button class="option-btn mixed-btn" onclick="getSpecificResponse('mix')" title="Combined analysis from all three approaches">
                    <i class="fas fa-layer-group"></i>
                    <div class="btn-text">
                        <div class="btn-title">Mix All 3</div>
                        <div class="btn-desc">Complete analysis</div>
                    </div>
                </button>
            </div>
        </div>
    `;
}

function formatMessageText(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/## (.*?)$/gm, '<h3>$1</h3>')
        .replace(/### (.*?)$/gm, '<h4>$1</h4>');
}

function sendMessage() {
    if (isTyping) return;
    
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    console.log("📤 Sending message:", message);
    
    lastUserMessage = message;
    addMessage(message, 'user');
    input.value = '';
    adjustTextareaHeight();
    
    showTypingIndicator();
    // Check for crisis keywords
    const crisisKeywords = [
        'suicide', 'kill myself', 'hurt myself', 'harm myself', 
        'end it all', 'want to die', 'no point living', 'better off dead',
        'end my life', 'take my life', 'not worth living', 'cant go on'
    ];
    
    const messageLower = message.toLowerCase();
    const isCrisis = crisisKeywords.some(keyword => messageLower.includes(keyword));
    
    if (isCrisis) {
        hideTypingIndicator();
        
        const crisisResponse = {
            answer: `I'm really glad you reached out. What you're feeling is very difficult, and I want you to know that help is available right now.\n\n**🆘 Immediate Help Available:**\n\n📞 **Call or Text 988** - National Suicide Prevention Lifeline (24/7, free, confidential)\n💬 **Text HOME to 741741** - Crisis Text Line\n🚑 **Call 911** - For immediate emergency\n\n**What You Should Know:**\n• These feelings are temporary, even though they don't feel that way right now\n• You are not alone - crisis counselors are trained to help\n• There are effective treatments that can help you feel better\n• Many people who felt this way have recovered and are glad they got help\n\n**I can help you with:**\n• Finding a counselor in your area\n• Breathing exercises to manage overwhelming feelings\n• Coping strategies for right now\n• Continuing our conversation\n\nPlease reach out to someone today. You matter, and you deserve support.`,
            sources: [{
                title: '988 Suicide & Crisis Lifeline',
                url: 'https://988lifeline.org',
                snippet: '24/7 free and confidential crisis support',
                displayUrl: '988lifeline.org',
                source_id: 1,
                favicon: 'https://www.google.com/s2/favicons?domain=988lifeline.org',
                published_date: '',
                type: 'crisis_resource'
            },
            {
                title: 'Crisis Text Line',
                url: 'https://www.crisistextline.org',
                snippet: 'Text HOME to 741741 - Free 24/7 crisis support via text',
                displayUrl: 'crisistextline.org',
                source_id: 2,
                favicon: 'https://www.google.com/s2/favicons?domain=crisistextline.org',
                published_date: '',
                type: 'crisis_resource'
            }],
            type: 'crisis_support',
            confidence: 1.0
        };
        
        addMessage(crisisResponse, 'bot');
        return; // Stop here - don't send to API
    }
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            message: message, 
            response_type: currentResponseType 
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        hideTypingIndicator();
        console.log("📥 Response received:", data);
        
        if (data.error) {
            addMessage({
                answer: "I'm sorry, I encountered an error. Please try again.",
                sources: [],
                type: 'error'
            }, 'bot');
        } else {
            addMessage(data.response, 'bot');
        }
    })
    .catch(error => {
        console.error('❌ Chat error:', error);
        hideTypingIndicator();
        addMessage({
            answer: "I'm having trouble connecting. Please check your connection and try again.",
            sources: [],
            type: 'error'
        }, 'bot');
    });
}

function getSpecificResponse(type) {
    if (!lastUserMessage) return;
    
    // Update the current type temporarily
    const originalType = currentResponseType;
    currentResponseType = type;
    
    showTypingIndicator();
    
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            message: lastUserMessage, 
            response_type: type 
        })
    })
    .then(response => response.json())
    .then(data => {
        hideTypingIndicator();
        addMessage(data.response, 'bot');
        // Restore original type
        currentResponseType = originalType;
    })
    .catch(error => {
        console.error('❌ Response error:', error);
        hideTypingIndicator();
        addMessage({
            answer: "Error getting response. Please try again.",
            sources: [],
            type: 'error'
        }, 'bot');
        currentResponseType = originalType;
    });
}

function showTypingIndicator() {
    isTyping = true;
    const indicator = document.getElementById('typing-indicator');
    const sendBtn = document.getElementById('send-btn');
    
    if (indicator) indicator.style.display = 'block';
    if (sendBtn) sendBtn.disabled = true;
    
    console.log("⏳ Typing indicator shown");
}

function hideTypingIndicator() {
    isTyping = false;
    const indicator = document.getElementById('typing-indicator');
    const sendBtn = document.getElementById('send-btn');
    
    if (indicator) indicator.style.display = 'none';
    if (sendBtn) sendBtn.disabled = false;
    
    console.log("✅ Typing indicator hidden");
}

// =============================================================================
// INPUT HANDLERS
// =============================================================================

function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function adjustTextareaHeight() {
    const textarea = document.getElementById('chat-input');
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
}

// =============================================================================
// UI FUNCTIONS
// =============================================================================

function setResponseType(type) {
    currentResponseType = type;
    
    document.querySelectorAll('.response-option-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });
    
    console.log("🎯 Response type set to:", type);
}

// Update toggle button icon
function updateToggleIcon(isCollapsed) {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (!sidebarToggle) return;
    
    // Only update icon on desktop
    if (window.innerWidth > 768) {
        // Icon is handled by CSS ::before pseudo-element
        // Just update aria-label
        sidebarToggle.setAttribute('aria-label', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
    }
}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.menu-btn');
    
    if (!sidebar) return;
    
    // Mobile behavior (use 'active' class)
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('active');
        const isOpen = sidebar.classList.contains('active');
        
        // Update ARIA
        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', isOpen);
        }
        
        // Prevent body scroll when sidebar is open
        document.body.style.overflow = isOpen ? 'hidden' : 'auto';
        
        console.log("📱 Mobile sidebar toggled:", isOpen ? 'open' : 'closed');
    } 
    // Desktop behavior (use 'collapsed' class)
    else {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        // Update ARIA
        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', !isCollapsed);
        }
        
        // Save state to localStorage
        localStorage.setItem('sidebarCollapsed', isCollapsed);

                // Update icon
        updateToggleIcon(isCollapsed);
        
        console.log("💻 Desktop sidebar toggled:", isCollapsed ? 'collapsed' : 'expanded');
    }
}

function newChat() {
    location.reload();
}

function exportChat() {
    const messages = document.querySelectorAll('.message');
    let chatText = 'NISRA  Chat Export\n========================\n\n';
    
    messages.forEach(message => {
        const sender = message.classList.contains('user') ? 'You' : 'NISRA ';
        const textElement = message.querySelector('.message-text');
        if (textElement) {
            chatText += `${sender}: ${textElement.textContent}\n\n`;
        }
    });
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NISRA -chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const themeIcon = document.getElementById('theme-icon');
    
    // Save theme preference
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    console.log('Theme toggled to:', isDark ? 'dark' : 'light');
}


function checkSystemTheme() {
    const savedTheme = localStorage.getItem('theme');
    // Default to light theme (no dark-theme class)
    // Only add dark theme if explicitly saved as 'dark'
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    } else {
        // Ensure light theme is default
        document.body.classList.remove('dark-theme');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = 'fas fa-moon';
        }
    }
}


function closeCrisis() {
    const banner = document.getElementById('crisis-banner');
    if (banner) banner.style.display = 'none';
}

// =============================================================================
// MODAL FUNCTIONS
// =============================================================================

function openModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.add('active');
    
    console.log("📱 Modal opened:", modalId);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    
    console.log("❌ Modal closed:", modalId);
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');
}

// =============================================================================
// WELLNESS TOOL FUNCTIONS
// =============================================================================

function openMoodTracker() { 
    openModal('mood-modal'); 
}

// =============================================================================
// BREATHING & MEDITATION - COMPLETE REPLACEMENT CODE
// DELETE YOUR OLD BREATHING CODE AND PASTE THIS ENTIRE SECTION
// =============================================================================

// Meditation variables
let currentMeditationAudio = null;
let meditationTimer = null;
let meditationTimeLeft = 0;
let selectedMeditationDuration = 0;

const meditationTracks = [
    { name: 'Birds in Crescent', file: 'birds-in-cressent.mp3' },
    { name: 'Gentle Rain', file: 'gentle-rain.mp3' },
    { name: 'Ocean Waves', file: 'ocean-waves.mp3' },
    { name: 'Small Waterfall', file: 'small-waterfall.mp3' }
];

// Open breathing/meditation selection
function openBreathingExercise() { 
    openModal('breathing-selection-modal'); 
}

// User selects breathing or meditation
function startRelaxationType(type) {
    closeModal('breathing-selection-modal');
    
    if (type === 'breathing') {
        openModal('breathing-modal');
    } else if (type === 'meditation') {
        openModal('meditation-duration-modal');
    }
}

// Select meditation duration
function selectMeditationDuration(minutes) {
    selectedMeditationDuration = minutes;
    closeModal('meditation-duration-modal');
    openModal('meditation-tracks-modal');
    loadMeditationTracks();
}

// Load meditation tracks
function loadMeditationTracks() {
    const tracksList = document.getElementById('meditation-tracks-list');
    if (!tracksList) return;
    
    tracksList.innerHTML = '';
    
    meditationTracks.forEach((track, index) => {
        const trackCard = document.createElement('button');
        trackCard.className = 'meditation-track-card';
        trackCard.onclick = () => startMeditationSession(index);
        trackCard.innerHTML = `
            <div class="track-icon">
                <i class="fas fa-music"></i>
            </div>
            <div class="track-details">
                <div class="track-name">${track.name}</div>
                <div class="track-subtitle">${selectedMeditationDuration} minutes session</div>
            </div>
            <div class="track-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        tracksList.appendChild(trackCard);
    });
}

// Start meditation session
function startMeditationSession(trackIndex) {
    const track = meditationTracks[trackIndex];
    closeModal('meditation-tracks-modal');
    openModal('meditation-session-modal');
    
    // Start video
    const video = document.getElementById('meditation-video');
    if (video) {
        video.style.display = 'block';
        video.play().catch(e => console.log('Video autoplay blocked'));
    }
    
    // Start audio
    currentMeditationAudio = new Audio(`/static/sounds/${track.file}`);
    currentMeditationAudio.loop = true;
    currentMeditationAudio.volume = 0.7;
    currentMeditationAudio.play().catch(e => {
        alert('Cannot play audio. Check if file exists: ' + track.file);
    });
    
    // Start timer
    meditationTimeLeft = selectedMeditationDuration * 60;
    updateMeditationDisplay(track.name);
    
    meditationTimer = setInterval(() => {
        meditationTimeLeft--;
        updateMeditationDisplay(track.name);
        
        if (meditationTimeLeft <= 0) {
            completeMeditation();
        }
    }, 1000);
}

// Update meditation display
function updateMeditationDisplay(trackName) {
    const minutes = Math.floor(meditationTimeLeft / 60);
    const seconds = meditationTimeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('meditation-timer').textContent = timeString;
    document.getElementById('meditation-track-name').textContent = trackName;
}

// Pause meditation
function pauseMeditation() {
    if (currentMeditationAudio) currentMeditationAudio.pause();
    
    const video = document.getElementById('meditation-video');
    if (video) video.pause();
    
    clearInterval(meditationTimer);
    
    const pauseBtn = document.getElementById('pause-meditation-btn');
    pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
    pauseBtn.onclick = resumeMeditation;
}

// Resume meditation
function resumeMeditation() {
    if (currentMeditationAudio) currentMeditationAudio.play();
    
    const video = document.getElementById('meditation-video');
    if (video) video.play();
    
    const trackName = document.getElementById('meditation-track-name').textContent;
    meditationTimer = setInterval(() => {
        meditationTimeLeft--;
        updateMeditationDisplay(trackName);
        if (meditationTimeLeft <= 0) completeMeditation();
    }, 1000);
    
    const pauseBtn = document.getElementById('pause-meditation-btn');
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    pauseBtn.onclick = pauseMeditation;
}

// Stop meditation
function stopMeditation() {
    if (currentMeditationAudio) {
        currentMeditationAudio.pause();
        currentMeditationAudio = null;
    }
    
    const video = document.getElementById('meditation-video');
    if (video) {
        video.pause();
        video.currentTime = 0;
        video.style.display = 'none';
    }
    
    clearInterval(meditationTimer);
    closeModal('meditation-session-modal');
}

// Complete meditation
function completeMeditation() {
    if (currentMeditationAudio) currentMeditationAudio.pause();
    
    const video = document.getElementById('meditation-video');
    if (video) video.pause();
    
    clearInterval(meditationTimer);
    
    alert(`🎉 Meditation Complete!\n\nYou've finished ${selectedMeditationDuration} minutes of mindful meditation.\n\nGreat job taking time for your mental health!`);
    stopMeditation();
}

// ORIGINAL BREATHING EXERCISE - KEEP THIS AS IS
function startBreathing() {
    const circle = document.getElementById('breathing-circle');
    const instruction = document.getElementById('breathing-instruction');
    const count = document.getElementById('breathing-count');
    const startBtn = document.getElementById('start-breathing');
    const stopBtn = document.getElementById('stop-breathing');
    
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';
    
    breathingPhase = 0;
    
    function breathingCycle() {
        switch(breathingPhase) {
            case 0: // Inhale
                instruction.textContent = 'Inhale';
                circle.classList.remove('exhale', 'hold');
                circle.classList.add('inhale');
                let inhaleCount = 4;
                count.textContent = inhaleCount;
                const inhaleTimer = setInterval(() => {
                    inhaleCount--;
                    count.textContent = inhaleCount;
                    if (inhaleCount === 0) {
                        clearInterval(inhaleTimer);
                        breathingPhase = 1;
                        breathingCycle();
                    }
                }, 1000);
                break;
                
            case 1: // Hold
                instruction.textContent = 'Hold';
                circle.classList.remove('inhale', 'exhale');
                circle.classList.add('hold');
                let holdCount = 7;
                count.textContent = holdCount;
                const holdTimer = setInterval(() => {
                    holdCount--;
                    count.textContent = holdCount;
                    if (holdCount === 0) {
                        clearInterval(holdTimer);
                        breathingPhase = 2;
                        breathingCycle();
                    }
                }, 1000);
                break;
                
            case 2: // Exhale
                instruction.textContent = 'Exhale';
                circle.classList.remove('inhale', 'hold');
                circle.classList.add('exhale');
                let exhaleCount = 8;
                count.textContent = exhaleCount;
                const exhaleTimer = setInterval(() => {
                    exhaleCount--;
                    count.textContent = exhaleCount;
                    if (exhaleCount === 0) {
                        clearInterval(exhaleTimer);
                        breathingPhase = 0;
                        if (breathingInterval) {
                            setTimeout(breathingCycle, 1000);
                        }
                    }
                }, 1000);
                break;
        }
    }
    
    breathingInterval = true;
    breathingCycle();
}

function stopBreathing() {
    breathingInterval = null;
    breathingPhase = 0;
    
    const circle = document.getElementById('breathing-circle');
    const instruction = document.getElementById('breathing-instruction');
    const count = document.getElementById('breathing-count');
    const startBtn = document.getElementById('start-breathing');
    const stopBtn = document.getElementById('stop-breathing');
    
    if (circle) circle.classList.remove('inhale', 'hold', 'exhale');
    if (instruction) instruction.textContent = 'Click Start';
    if (count) count.textContent = '4';
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
}

function openResources() { 
    openModal('resources-modal'); 
}



function updateMoodValue() {
    const slider = document.getElementById('mood-slider');
    const valueDisplay = document.getElementById('mood-value');
    if (slider && valueDisplay) {
        valueDisplay.textContent = slider.value;
    }
}

function saveMood() {
    const slider = document.getElementById('mood-slider');
    const note = document.getElementById('mood-note');
    
    if (slider) {
        const mood = slider.value;
        const noteText = note ? note.value : '';
        
        closeModal('mood-modal');
        startChat();
        
        setTimeout(() => {
            const input = document.getElementById('chat-input');
            if (input) {
                input.value = `I've recorded my mood as ${mood}/10 today. ${noteText ? `My note: "${noteText}"` : ''}`;
                sendMessage();
            }
        }, 1000);
    }
    
    // Reset form
    if (slider) slider.value = 5;
    if (note) note.value = '';
    updateMoodValue();
}

// =============================================================================
// WINDOW EVENT HANDLERS
// =============================================================================

window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768 && sidebar) {
        sidebar.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// =============================================================================
// FINAL INITIALIZATION
// =============================================================================
// VOICE RECORDING FUNCTION
function toggleVoiceRecording() {
    const micBtn = document.getElementById('mic-btn');
    
    if (!isRecording) {
        startVoiceRecording();
        micBtn.classList.add('recording');
    } else {
        stopVoiceRecording();
        micBtn.classList.remove('recording');
    }
}

function startVoiceRecording() {
    if (!SpeechRecognition) {
        alert('Voice not supported in your browser');
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let transcript = '';
    
    recognition.onstart = () => {
        console.log('🎤 Listening...');
    };
    
    recognition.onresult = (event) => {
        transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        
        const input = document.getElementById('chat-input');
        if (input) input.value = transcript;
    };
    
    recognition.onerror = (event) => {
        console.error('Voice error:', event.error);
        stopVoiceRecording();
    };
    
    recognition.onend = () => {
        console.log('🎤 Stopped listening');
    };
    
    recognition.start();
    isRecording = true;
}

function stopVoiceRecording() {
    isRecording = false;
    console.log('🎤 Recording stopped');
}
// ===== GAME FUNCTIONS =====

// Memory Game
let memoryCards = [];
let memoryFlipped = [];
let memoryMatches = 0;
const gameEmojis = ['🌟', '🎨', '🎭', '🌈', '🎯', '💝'];

function openGame(gameType) {
    if (gameType === 'memory') {
        openModal('memory-game-modal');
        initMemoryGame();
    } else if (gameType === 'colors') {
        openModal('colors-game-modal');
        initColorGame();
    } else if (gameType === 'snake') {
        openModal('snake-game-modal');
        initSnakeGame();
    }
}

function initMemoryGame() {
    const board = document.getElementById('memory-board');
    board.innerHTML = '';
    memoryCards = [...gameEmojis, ...gameEmojis].sort(() => Math.random() - 0.5);
    memoryMatches = 0;
    memoryFlipped = [];
    
    document.getElementById('memory-score').textContent = 'Matches: 0 / 6';
    
    memoryCards.forEach((emoji, index) => {
        const card = document.createElement('button');
        card.className = 'memory-card';
        card.dataset.emoji = emoji;
        card.dataset.index = index;
        card.textContent = '?';
        card.onclick = () => flipCard(card);
        board.appendChild(card);
    });
}

function flipCard(card) {
    if (memoryFlipped.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }
    
    card.classList.add('flipped');
    card.textContent = card.dataset.emoji;
    memoryFlipped.push(card);
    
    if (memoryFlipped.length === 2) {
        setTimeout(() => {
            const [card1, card2] = memoryFlipped;
            
            if (card1.dataset.emoji === card2.dataset.emoji) {
                card1.classList.add('matched');
                card2.classList.add('matched');
                memoryMatches++;
                document.getElementById('memory-score').textContent = `Matches: ${memoryMatches} / 6`;
                
                if (memoryMatches === 6) {
                    setTimeout(() => alert('🎉 You won! Great memory!'), 300);
                }
            } else {
                card1.classList.remove('flipped');
                card1.textContent = '?';
                card2.classList.remove('flipped');
                card2.textContent = '?';
            }
            
            memoryFlipped = [];
        }, 800);
    }
}

function resetMemoryGame() {
    initMemoryGame();
}

// Color Match Game
let colorScore = 0;

function initColorGame() {
    colorScore = 0;
    document.getElementById('color-score').textContent = 'Score: 0';
    playColorRound();
}

function playColorRound() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#E74C3C', '#3498DB', '#2ECC71'];
    const targetColor = colors[Math.floor(Math.random() * colors.length)];
    const options = [targetColor];
    
    while (options.length < 6) {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        if (!options.includes(randomColor)) {
            options.push(randomColor);
        }
    }
    
    options.sort(() => Math.random() - 0.5);
    
    document.getElementById('color-target').style.background = targetColor;
    
    const optionsDiv = document.getElementById('color-options');
    optionsDiv.innerHTML = '';
    
    options.forEach(color => {
        const option = document.createElement('div');
        option.className = 'color-option';
        option.style.background = color;
        option.onclick = () => checkColor(color, targetColor, option);
        optionsDiv.appendChild(option);
    });
}

function checkColor(selected, target, element) {
    if (selected === target) {
        element.classList.add('correct');
        colorScore++;
        document.getElementById('color-score').textContent = `Score: ${colorScore}`;
        setTimeout(() => playColorRound(), 600);
    } else {
        element.classList.add('wrong');
        setTimeout(() => {
            alert(`Nice try! Final score: ${colorScore}`);
            resetColorGame();
        }, 400);
    }
}

function resetColorGame() {
    colorScore = 0;
    document.getElementById('color-score').textContent = 'Score: 0';
    initColorGame();
}

// ===== WORD SCRAMBLE GAME =====

let scrambleScore = 0;
let scrambleLevel = 1;
let scrambleStreak = 0;
let currentScrambleWord = '';
let currentScrambleHint = '';
let hintsUsed = 0;

// Mental health themed words with hints
const scrambleWords = [
    // Level 1 - Easy (4-5 letters)
    { word: 'CALM', hint: 'Peaceful and relaxed' },
    { word: 'HOPE', hint: 'Optimistic feeling' },
    { word: 'PEACE', hint: 'Freedom from worry' },
    { word: 'HAPPY', hint: 'Feeling joyful' },
    { word: 'SMILE', hint: 'Expression of happiness' },
    { word: 'SLEEP', hint: 'Rest for the mind' },
    { word: 'RELAX', hint: 'To become less tense' },
    { word: 'TRUST', hint: 'Confidence in someone' },
    
    // Level 2 - Medium (6-7 letters)
    { word: 'BREATHE', hint: 'Take in air slowly' },
    { word: 'COMFORT', hint: 'Physical or mental ease' },
    { word: 'COURAGE', hint: 'Bravery in difficulty' },
    { word: 'SUPPORT', hint: 'Help and encouragement' },
    { word: 'HEALING', hint: 'Process of recovery' },
    { word: 'BALANCE', hint: 'Mental equilibrium' },
    { word: 'MINDFUL', hint: 'Present moment awareness' },
    { word: 'THERAPY', hint: 'Professional treatment' },
    { word: 'PATIENCE', hint: 'Ability to wait calmly' },
    { word: 'KINDNESS', hint: 'Quality of being gentle' },
    
    // Level 3 - Hard (8-10 letters)
    { word: 'WELLNESS', hint: 'State of good health' },
    { word: 'STRENGTH', hint: 'Inner power and resilience' },
    { word: 'GRATITUDE', hint: 'Feeling of thankfulness' },
    { word: 'RESILIENCE', hint: 'Ability to bounce back' },
    { word: 'COMPASSION', hint: 'Sympathy and concern' },
    { word: 'MEDITATION', hint: 'Mindfulness practice' },
    { word: 'ACCEPTANCE', hint: 'Acknowledging reality' },
    { word: 'EMPOWERMENT', hint: 'Gaining control of life' },
    { word: 'SELFCARE', hint: 'Taking care of yourself' },
    { word: 'RECOVERY', hint: 'Return to health' }
];

function openGame(gameType) {
    if (gameType === 'memory') {
        openModal('memory-game-modal');
        initMemoryGame();
    } else if (gameType === 'colors') {
        openModal('colors-game-modal');
        initColorGame();
    } else if (gameType === 'scramble') {
        openModal('snake-game-modal');
        initScrambleGame();
    }
}

function initScrambleGame() {
    scrambleScore = 0;
    scrambleLevel = 1;
    scrambleStreak = 0;
    hintsUsed = 0;
    
    updateScrambleUI();
    loadNewScrambleWord();
    
    // Focus input
    const input = document.getElementById('scramble-input');
    input.value = '';
    input.focus();
    
    // Enter key handler
    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            checkScrambleAnswer();
        }
    };
    
    console.log('🎮 Word Scramble game started!');
}

function loadNewScrambleWord() {
    // Select word based on level
    let availableWords;
    if (scrambleLevel <= 3) {
        availableWords = scrambleWords.filter(w => w.word.length <= 5);
    } else if (scrambleLevel <= 7) {
        availableWords = scrambleWords.filter(w => w.word.length >= 6 && w.word.length <= 8);
    } else {
        availableWords = scrambleWords.filter(w => w.word.length >= 8);
    }
    
    const wordObj = availableWords[Math.floor(Math.random() * availableWords.length)];
    currentScrambleWord = wordObj.word;
    currentScrambleHint = wordObj.hint;
    hintsUsed = 0;
    
    // Scramble the word
    displayScrambledWord(currentScrambleWord);
    
    // Clear hint and input
    document.getElementById('word-hint').textContent = `${currentScrambleWord.length} letters`;
    document.getElementById('scramble-input').value = '';
    document.getElementById('scramble-feedback').textContent = '';
    
    console.log('New word:', currentScrambleWord); // For debugging
}

function displayScrambledWord(word) {
    let scrambled = word;
    
    // Keep scrambling until it's different from original
    do {
        scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
    } while (scrambled === word && word.length > 3);
    
    // Display with animation
    const display = document.getElementById('scrambled-display');
    display.innerHTML = '';
    
    scrambled.split('').forEach((letter, index) => {
        const span = document.createElement('span');
        span.textContent = letter;
        span.style.cssText = `
            display: inline-block;
            animation: letterPop 0.4s ease ${index * 0.1}s;
            animation-fill-mode: both;
        `;
        display.appendChild(span);
    });
}

function checkScrambleAnswer() {
    const input = document.getElementById('scramble-input');
    const answer = input.value.trim().toUpperCase();
    const feedback = document.getElementById('scramble-feedback');
    
    if (!answer) return;
    
    if (answer === currentScrambleWord) {
        // Correct answer!
        scrambleStreak++;
        const points = calculatePoints();
        scrambleScore += points;
        
        feedback.innerHTML = `<span style="color: #48bb78;">✓ Correct! +${points} points</span>`;
        feedback.style.animation = 'bounce 0.5s ease';
        
        // Level up every 5 correct answers
        if (scrambleStreak % 5 === 0) {
            scrambleLevel++;
            setTimeout(() => {
                feedback.innerHTML += `<br><span style="color: #667eea;">🎉 Level Up! Now Level ${scrambleLevel}</span>`;
            }, 500);
        }
        
        updateScrambleUI();
        
        // Load new word after delay
        setTimeout(() => {
            loadNewScrambleWord();
            feedback.textContent = '';
        }, 2000);
        
    } else {
        // Wrong answer
        scrambleStreak = 0;
        feedback.innerHTML = `<span style="color: #f56565;">✗ Try again!</span>`;
        input.value = '';
        updateScrambleUI();
    }
}

function calculatePoints() {
    let points = currentScrambleWord.length * 10; // Base points
    points += (scrambleLevel - 1) * 5; // Level bonus
    points += scrambleStreak * 2; // Streak bonus
    
    // Deduct for hints
    points -= hintsUsed * 5;
    
    return Math.max(points, 10); // Minimum 10 points
}

function scrambleHint() {
    const hintDisplay = document.getElementById('word-hint');
    
    if (hintsUsed === 0) {
        // First hint: show category hint
        hintDisplay.textContent = `Hint: ${currentScrambleHint}`;
        hintsUsed++;
    } else if (hintsUsed === 1) {
        // Second hint: reveal first letter
        hintDisplay.textContent = `Hint: Starts with "${currentScrambleWord[0]}"`;
        hintsUsed++;
    } else {
        // Third hint: reveal first two letters
        hintDisplay.textContent = `Hint: Starts with "${currentScrambleWord.substring(0, 2)}"`;
        hintsUsed++;
    }
    
    const feedback = document.getElementById('scramble-feedback');
    feedback.innerHTML = `<span style="color: #ed8936;">Hint used (-5 points)</span>`;
    setTimeout(() => {
        feedback.textContent = '';
    }, 1500);
}

function skipScrambleWord() {
    scrambleStreak = 0;
    updateScrambleUI();
    
    const feedback = document.getElementById('scramble-feedback');
    feedback.innerHTML = `<span style="color: #ed8936;">Skipped! The word was: ${currentScrambleWord}</span>`;
    
    setTimeout(() => {
        loadNewScrambleWord();
        feedback.textContent = '';
    }, 2000);
}

function updateScrambleUI() {
    document.getElementById('scramble-score').textContent = scrambleScore;
    document.getElementById('scramble-level').textContent = scrambleLevel;
    document.getElementById('scramble-streak').textContent = scrambleStreak;
}

function resetScrambleGame() {
    initScrambleGame();
}

// Add CSS animation for letter pop
const style = document.createElement('style');
style.textContent = `
    @keyframes letterPop {
        0% {
            opacity: 0;
            transform: scale(0) translateY(-20px);
        }
        50% {
            transform: scale(1.2);
        }
        100% {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
    
    @keyframes bounce {
        0%, 100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-10px);
        }
    }
`;
document.head.appendChild(style);
// ===== EXERCISE SYSTEM =====

let exerciseType = '';
let currentExerciseIndex = 0;
let exerciseTimer = null;
let exerciseTimeLeft = 30;
let exercisesPaused = false;

const yogaExercises = [
    {
        name: 'Extended Triangle Pose',
        duration: 30,
        instruction: 'Extend arms, lean to side, look up',
        video: '/static/videos/yoga/extended_triangle.mp4',
        animation: {
            leftUpperArm: {x2: 100, y2: 105}, leftLowerArm: {x2: 70, y2: 105}, leftHand: {cx: 70, cy: 105},
            rightUpperArm: {x2: 180, y2: 105}, rightLowerArm: {x2: 210, y2: 105}, rightHand: {cx: 210, cy: 105},
            leftUpperLeg: {x2: 110, y2: 260}, leftLowerLeg: {x2: 90, y2: 320}, leftShoe: {cx: 90, cy: 328},
            rightUpperLeg: {x2: 170, y2: 260}, rightLowerLeg: {x2: 190, y2: 320}, rightShoe: {cx: 190, cy: 328}
        }
    },
    {
        name: 'Downward Facing Dog',
        duration: 30,
        instruction: 'Push hips up, form inverted V shape',
        video: '/static/videos/yoga/downward_dog.mp4',
        animation: {
            leftUpperArm: {x2: 100, y2: 150}, leftLowerArm: {x2: 80, y2: 175}, leftHand: {cx: 80, cy: 175},
            rightUpperArm: {x2: 180, y2: 150}, rightLowerArm: {x2: 200, y2: 175}, rightHand: {cx: 200, cy: 175},
            leftUpperLeg: {x2: 105, y2: 230}, leftLowerLeg: {x2: 85, y2: 280}, leftShoe: {cx: 85, cy: 288},
            rightUpperLeg: {x2: 175, y2: 230}, rightLowerLeg: {x2: 195, y2: 280}, rightShoe: {cx: 195, cy: 288}
        }
    },
    {
        name: 'Cobra Pose',
        duration: 25,
        instruction: 'Arch back, push chest up, look ahead',
        video: '/static/videos/yoga/cobra.mp4',
        animation: {
            leftUpperArm: {x2: 110, y2: 150}, leftLowerArm: {x2: 95, y2: 175}, leftHand: {cx: 95, cy: 175},
            rightUpperArm: {x2: 170, y2: 150}, rightLowerArm: {x2: 185, y2: 175}, rightHand: {cx: 185, cy: 175},
            leftUpperLeg: {x2: 125, y2: 240}, leftLowerLeg: {x2: 115, y2: 290}, leftShoe: {cx: 115, cy: 298},
            rightUpperLeg: {x2: 155, y2: 240}, rightLowerLeg: {x2: 165, y2: 290}, rightShoe: {cx: 165, cy: 298}
        }
    },
    {
        name: 'Child\'s Pose',
        duration: 30,
        instruction: 'Kneel, sit on heels, stretch arms forward',
        video: '/static/videos/yoga/childs_pose.mp4',
        animation: {
            leftUpperArm: {x2: 100, y2: 180}, leftLowerArm: {x2: 80, y2: 200}, leftHand: {cx: 80, cy: 200},
            rightUpperArm: {x2: 180, y2: 180}, rightLowerArm: {x2: 200, y2: 200}, rightHand: {cx: 200, cy: 200},
            leftUpperLeg: {x2: 115, y2: 220}, leftLowerLeg: {x2: 105, y2: 260}, leftShoe: {cx: 105, cy: 268},
            rightUpperLeg: {x2: 165, y2: 220}, rightLowerLeg: {x2: 175, y2: 260}, rightShoe: {cx: 175, cy: 268}
        }
    },
    {
        name: 'Bridge Pose',
        duration: 25,
        instruction: 'Lift hips, press feet down, chest to chin',
        video: '/static/videos/yoga/bridge_pose.mp4',
        animation: {
            leftUpperArm: {x2: 110, y2: 200}, leftLowerArm: {x2: 100, y2: 220}, leftHand: {cx: 100, cy: 220},
            rightUpperArm: {x2: 170, y2: 200}, rightLowerArm: {x2: 180, y2: 220}, rightHand: {cx: 180, cy: 220},
            leftUpperLeg: {x2: 110, y2: 180}, leftLowerLeg: {x2: 100, y2: 240}, leftShoe: {cx: 100, cy: 248},
            rightUpperLeg: {x2: 170, y2: 180}, rightLowerLeg: {x2: 180, y2: 240}, rightShoe: {cx: 180, cy: 248}
        }
    }
];

const aerobicsExercises = [
    {
        name: 'Scissor Chops',
        duration: 30,
        instruction: 'Cross arms in scissor motion, keep moving',
        video: '/static/videos/aerobics/scissor_chops.mp4',
        animation: { leftArm: {x2: 110, y2: 120}, rightArm: {x2: 170, y2: 120}, leftLeg: {x2: 130, y2: 250}, rightLeg: {x2: 150, y2: 250} }
    },
    {
        name: 'Quick Feet Exercise',
        duration: 30,
        instruction: 'Run in place with quick feet movements',
        video: '/static/videos/aerobics/quick_feet.mp4',
        animation: { leftArm: {x2: 120, y2: 140}, rightArm: {x2: 160, y2: 140}, leftLeg: {x2: 120, y2: 240}, rightLeg: {x2: 160, y2: 260} }
    },
    {
        name: 'High Knees',
        duration: 30,
        instruction: 'Lift knees high, pump arms',
        video: '/static/videos/aerobics/high_knees.mp4',
        animation: { leftArm: {x2: 120, y2: 140}, rightArm: {x2: 180, y2: 140}, leftLeg: {x2: 150, y2: 150}, rightLeg: {x2: 180, y2: 250} }
    },
    {
        name: 'Arm Circles',
        duration: 30,
        instruction: 'Make large circles with arms extended',
        video: '/static/videos/aerobics/arm_circles.mp4',
        animation: { leftArm: {x2: 90, y2: 100}, rightArm: {x2: 210, y2: 100}, leftLeg: {x2: 130, y2: 250}, rightLeg: {x2: 150, y2: 250} }
    },
    {
        name: 'Jumping Jacks',
        duration: 30,
        instruction: 'Jump and spread arms and legs wide',
        video: '/static/videos/aerobics/jumping_jack.mp4',
        animation: { leftArm: {x2: 100, y2: 80}, rightArm: {x2: 200, y2: 80}, leftLeg: {x2: 100, y2: 250}, rightLeg: {x2: 200, y2: 250} }
    }
];

function startExercise(type) {
    exerciseType = type;
    currentExerciseIndex = 0;
    exercisesPaused = false;
    
    closeModal('exercise-modal');
    openModal('workout-modal');
    
    const exercises = type === 'yoga' ? yogaExercises : aerobicsExercises;
    
    document.getElementById('workout-title').textContent = type === 'yoga' ? 'Yoga Session' : 'Aerobics Workout';
    document.getElementById('total-exercises').textContent = exercises.length;
    
    // Hide both video and figure initially to prevent flash
    const videoPlayer = document.getElementById('exercise-video-player');
    const svgFigure = document.getElementById('exercise-figure');
    if (videoPlayer) videoPlayer.style.display = 'none';
    if (svgFigure) {
        svgFigure.style.display = 'none';
        svgFigure.style.opacity = '0';
    }
    
    setTimeout(() => {
        runExercise();
    }, 500);
}

function runExercise() {
    const exercises = exerciseType === 'yoga' ? yogaExercises : aerobicsExercises;
    
    if (currentExerciseIndex >= exercises.length) {
        completeWorkout();
        return;
    }
    
    const exercise = exercises[currentExerciseIndex];
    exerciseTimeLeft = exercise.duration;
    
    document.getElementById('current-exercise').textContent = currentExerciseIndex + 1;
    document.getElementById('exercise-name').textContent = exercise.name;
    document.getElementById('exercise-instruction').textContent = exercise.instruction;
    document.getElementById('exercise-timer').textContent = exerciseTimeLeft;
    
    // Update progress
    const progress = ((currentExerciseIndex) / exercises.length) * 100;
    document.getElementById('exercise-progress').style.width = progress + '%';
    
// Load and play video if available
    const videoPlayer = document.getElementById('exercise-video-player');
    const svgFigure = document.getElementById('exercise-figure');
    
    // Initially hide both
    videoPlayer.style.display = 'none';
    svgFigure.style.display = 'none';
    svgFigure.style.opacity = '0';
    
    if (exercise.video && videoPlayer) {
        const video = videoPlayer.querySelector('video');
        video.src = exercise.video;
        video.load();
        
        // Show video player immediately
        videoPlayer.style.display = 'block';
        
        video.play().catch(e => {
            console.log('Video autoplay blocked:', e);
            // Fallback to SVG animation with smooth transition
            videoPlayer.style.display = 'none';
            svgFigure.style.display = 'block';
            setTimeout(() => {
                svgFigure.style.opacity = '1';
                animateFigure(exercise.animation);
            }, 50);
        });
        
        // Loop video
        video.loop = true;
        video.muted = false;
        video.volume = 0.3;
    } else {
        // Show SVG animation with smooth transition
        svgFigure.style.display = 'block';
        setTimeout(() => {
            svgFigure.style.opacity = '1';
            animateFigure(exercise.animation);
        }, 50);
    }
    
    // Start countdown
    exerciseTimer = setInterval(() => {
        if (!exercisesPaused) {
            exerciseTimeLeft--;
            document.getElementById('exercise-timer').textContent = exerciseTimeLeft;
            
            if (exerciseTimeLeft <= 0) {
                clearInterval(exerciseTimer);
                
                // Pause video before moving to next
                if (videoPlayer && videoPlayer.style.display === 'block') {
                    const video = videoPlayer.querySelector('video');
                    video.pause();
                }
                
                currentExerciseIndex++;
                setTimeout(() => runExercise(), 1000);
            }
        }
    }, 1000);
}
function pauseExercise() {
    exercisesPaused = !exercisesPaused;
    const pauseBtn = document.getElementById('pause-btn');
    const videoPlayer = document.getElementById('exercise-video-player');
    
    if (exercisesPaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        // Pause video if playing
        if (videoPlayer && videoPlayer.style.display === 'block') {
            const video = videoPlayer.querySelector('video');
            video.pause();
        }
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        // Resume video if paused
        if (videoPlayer && videoPlayer.style.display === 'block') {
            const video = videoPlayer.querySelector('video');
            video.play();
        }
    }
}

function skipExercise() {
    clearInterval(exerciseTimer);
    currentExerciseIndex++;
    runExercise();
}

function stopExercise() {
    clearInterval(exerciseTimer);
    
    // Stop and reset video
    const videoPlayer = document.getElementById('exercise-video-player');
    if (videoPlayer) {
        const video = videoPlayer.querySelector('video');
        video.pause();
        video.currentTime = 0;
        video.src = '';
    }
    
    closeModal('workout-modal');
    
    const exercises = exerciseType === 'yoga' ? yogaExercises : aerobicsExercises;
    if (currentExerciseIndex > 0) {
        alert(`Great job! You completed ${currentExerciseIndex} out of ${exercises.length} exercises.`);
    }
}

function completeWorkout() {
    clearInterval(exerciseTimer);
    
    document.getElementById('exercise-progress').style.width = '100%';
    document.getElementById('exercise-name').textContent = '🎉 Workout Complete!';
    document.getElementById('exercise-instruction').textContent = 'Amazing job! You finished the entire workout.';
    document.getElementById('exercise-figure').classList.add('exercise-complete');
    
    setTimeout(() => {
        alert('🎉 Congratulations! You completed the workout!\n\nExercise is great for mental health. Keep it up!');
        closeModal('workout-modal');
    }, 2000);
}
// ===== DINO RUNNER GAME =====

let dinoGame = {
    canvas: null,
    ctx: null,
    dino: { x: 50, y: 150, width: 20, height: 40, velocityY: 0, jumping: false },
    obstacles: [],
    score: 0,
    highScore: 0,
    gameLoop: null,
    gameSpeed: 5,
    gravity: 0.6,
    jumpPower: -12,
    isRunning: false
};

function openGame(gameType) {
    if (gameType === 'memory') {
        openModal('memory-game-modal');
        initMemoryGame();
    } else if (gameType === 'colors') {
        openModal('colors-game-modal');
        initColorGame();
    } else if (gameType === 'scramble') {
        openModal('snake-game-modal');
        initScrambleGame();
    } else if (gameType === 'dino') {
        openModal('dino-game-modal');
        initDinoGame();
    }
}

function initDinoGame() {
    dinoGame.canvas = document.getElementById('dino-canvas');
    dinoGame.ctx = dinoGame.canvas.getContext('2d');
    
    // Load high score
    const savedHighScore = localStorage.getItem('dinoHighScore');
    if (savedHighScore) {
        dinoGame.highScore = parseInt(savedHighScore);
        document.getElementById('dino-high-score').textContent = dinoGame.highScore;
    }
    
    // Reset game state
    dinoGame.dino.y = 150;
    dinoGame.dino.velocityY = 0;
    dinoGame.dino.jumping = false;
    dinoGame.obstacles = [];
    dinoGame.score = 0;
    dinoGame.gameSpeed = 5;
    dinoGame.isRunning = false;
    
    document.getElementById('dino-score').textContent = '0';
    document.getElementById('dino-game-over').style.display = 'none';
    document.getElementById('dino-start-btn').style.display = 'inline-flex';
    document.getElementById('dino-restart-btn').style.display = 'none';
    
    // Draw initial scene
    drawDinoGame();
}

function startDinoGame() {
    if (dinoGame.isRunning) return;
    
    dinoGame.isRunning = true;
    dinoGame.obstacles = [];
    dinoGame.score = 0;
    dinoGame.gameSpeed = 5;
    
    document.getElementById('dino-start-btn').style.display = 'none';
    document.getElementById('dino-game-over').style.display = 'none';
    
    // Add keyboard controls
    document.addEventListener('keydown', dinoJump);
    
    // Start game loop
    dinoGame.gameLoop = setInterval(updateDinoGame, 1000 / 60); // 60 FPS
}

function dinoJump(e) {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !dinoGame.dino.jumping && dinoGame.isRunning) {
        e.preventDefault();
        dinoGame.dino.velocityY = dinoGame.jumpPower;
        dinoGame.dino.jumping = true;
    }
}

function updateDinoGame() {
    if (!dinoGame.isRunning) return;
    
    // Update dino physics
    dinoGame.dino.velocityY += dinoGame.gravity;
    dinoGame.dino.y += dinoGame.dino.velocityY;
    
    // Ground collision
    if (dinoGame.dino.y >= 150) {
        dinoGame.dino.y = 150;
        dinoGame.dino.velocityY = 0;
        dinoGame.dino.jumping = false;
    }
    
    // Spawn obstacles
    if (Math.random() < 0.02) {
        dinoGame.obstacles.push({
            x: 600,
            y: 170,
            width: 20,
            height: 30
        });
    }
    
    // Update obstacles
    for (let i = dinoGame.obstacles.length - 1; i >= 0; i--) {
        dinoGame.obstacles[i].x -= dinoGame.gameSpeed;
        
        // Remove off-screen obstacles
        if (dinoGame.obstacles[i].x + dinoGame.obstacles[i].width < 0) {
            dinoGame.obstacles.splice(i, 1);
            dinoGame.score += 10;
            document.getElementById('dino-score').textContent = dinoGame.score;
            
            // Increase difficulty
            if (dinoGame.score % 100 === 0) {
                dinoGame.gameSpeed += 0.5;
            }
        }
    }
    
    // Collision detection
    for (let obstacle of dinoGame.obstacles) {
        if (dinoGame.dino.x < obstacle.x + obstacle.width &&
            dinoGame.dino.x + dinoGame.dino.width > obstacle.x &&
            dinoGame.dino.y < obstacle.y + obstacle.height &&
            dinoGame.dino.y + dinoGame.dino.height > obstacle.y) {
            endDinoGame();
            return;
        }
    }
    
    drawDinoGame();
}

function drawDinoGame() {
    const ctx = dinoGame.ctx;
    const canvas = dinoGame.canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 190, canvas.width, 2);
    
    // Draw dino (cute dinosaur)
    ctx.fillStyle = '#48bb78';
    ctx.fillRect(dinoGame.dino.x, dinoGame.dino.y, dinoGame.dino.width, dinoGame.dino.height);
    
    // Draw eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(dinoGame.dino.x + 14, dinoGame.dino.y + 5, 4, 4);
    
    // Draw obstacles (cacti)
    ctx.fillStyle = '#ed8936';
    for (let obstacle of dinoGame.obstacles) {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        // Add spikes
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(obstacle.x + 5, obstacle.y + (i * 10), 3, 8);
            ctx.fillRect(obstacle.x + 12, obstacle.y + (i * 10), 3, 8);
        }
    }
}

function endDinoGame() {
    dinoGame.isRunning = false;
    clearInterval(dinoGame.gameLoop);
    document.removeEventListener('keydown', dinoJump);
    
    document.getElementById('dino-game-over').style.display = 'block';
    document.getElementById('dino-restart-btn').style.display = 'inline-flex';
    
    // Update high score
    if (dinoGame.score > dinoGame.highScore) {
        dinoGame.highScore = dinoGame.score;
        document.getElementById('dino-high-score').textContent = dinoGame.highScore;
        localStorage.setItem('dinoHighScore', dinoGame.highScore);
        
        setTimeout(() => {
            alert('🎉 NEW HIGH SCORE! ' + dinoGame.highScore + ' points!');
        }, 100);
    }
}

function restartDinoGame() {
    initDinoGame();
    startDinoGame();
}

function stopDinoGame() {
    dinoGame.isRunning = false;
    if (dinoGame.gameLoop) {
        clearInterval(dinoGame.gameLoop);
    }
    document.removeEventListener('keydown', dinoJump);
}
console.log("🎉 NISRA  fully loaded and ready!")