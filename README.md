# NISRA – AI-Powered Mental Health Assistant

**A privacy-first, self-hostable mental health support system combining AI assistance with evidence-based wellness tools**
NISRA implements a **Hybrid Generative Adaptive RAG**, with local retrieval and API-based generation only. This ensures privacy-first, cost-efficient, and well-grounded responses.

---

## ⚠️ Important Disclaimer

**NISRA is a research and educational prototype and is NOT a substitute for professional mental health care.** If you or someone you know is experiencing a mental health crisis, please contact:The required assistance 
---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Limitations](#-limitations)
- [Authors](#-authors)

---

## 🎯 Overview

NISRA (Neural Interactive Support & Resource Assistant) is a  mental health assistant demonstrating responsible AI implementation in sensitive domains which includes RAG. The system combines:

- **Local AI Model Processing**: Fine-tuned TinyLlama-1.1B with PEFT adapters and RAG responses
- **Multi-Modal Response System**: Local model, professional guidance, and web-assisted responses
- **Crisis Detection & Intervention**: Rule-based safety layer with emergency resources
- **Holistic Wellness Features**: Mood tracking, breathing exercises, games, and resources
- **RAG Based Response**:uses RAG based response and api-key for generation 
### Use Cases

- Academic research and demonstrations
- Educational AI/ML projects
- Privacy-focused mental health support prototyping

---

## ✨ Features

### 🤖 AI-Powered Chat Interface

- **Multiple Response Modes**:
  - **Training Model**: Fine-tuned local model with mental health specialization
  - **Professional**: Safe, guidance-oriented responses by api key 
  - **RAG System**: Mental health knowledge base with hybrid FAISS + BM25 retrieval, cross-encoder re-ranking (ms-marco-MiniLM-L-6-v2), and adaptive web augmentation under low-confidence conditions (<0.6).
  - **Web-Assisted**: Context-enriched responses using web search
  - **Mixed Strategy**: Adaptive combination of available modes

- Intelligent conversation history management
- Real-time typing indicators
- User-configurable response strategy

### Technical Features

⚡ Smart Caching:

- FAISS index cached after first build (~73 seconds startup)
- Subsequent loads: <2 seconds
- Response caching for frequently asked questions

## Models Used

- RAG Embeddings: all-mpnet-base-v2 (768 dimensions) - Best sentence transformer for semantic search
- Re-ranker: cross-encoder/ms-marco-MiniLM-L-6-v2 - Improves top-k results quality
- Fine-tuned Model: TinyLlama-1.1B-Chat with PEFT adapters
- Professional LLM: Llama 3.2 Vision via Ollama API (configurable)

## Multi-Format Data Support:

- CSV files (counsel_chat, mental_health_faq, crisis_support)
- JSON files (therapy_sessions, structured dialogues)

### 🛡️ Safety & Crisis Management

- Keyword-based crisis detection for high-risk language patterns
- Immediate intervention with crisis-specific responses
- Emergency resource modal with helplines and professional resources
- Optional guardian alert system (SMS/email notifications)
- Multi-layer safety checks and content filtering

### 🧘 Wellness Companion Features

- **Mood Tracker**: Visual mood logging with analytics
- **Breathing Exercises**: Guided breathing patterns with audio
- **Physical Exercise Library**: 
  - Aerobic exercises with video demonstrations
  - Yoga poses with video guides
- **Games & Activities**: Relaxation-focused content
- **Resource Center**: Curated mental health resources
- **Ambient Soundscapes**: Nature sounds (rain, ocean, birds, waterfall)

### 👤 User Management

- Authentication system (signup, login, session management)
- Password recovery via email/SMS
- Local browser storage for privacy
- Customizable user preferences

---

## 🛠 Technology Stack

### Backend
- **Framework**: Flask 
- **ML/AI**: Hugging Face Transformers, PyTorch, PEFT
- **Model**: TinyLlama-1.1B-Chat-v1.0
- **Communication**: SMTP (email), Twilio (SMS)(optional)

### Frontend
- **Framework**: React with Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Package Manager**: npm 11.6.2

### Infrastructure
- **Backend**: http://127.0.0.1:5000
- **Frontend**: http://localhost:3000
- **Model**: Local inference (self-hosted)

---

## 📦 Installation

### Prerequisites

- **Python**: 3.10
- **Node.js**: 24.10.0
- **npm**: 11.6.2
- **Git**: For repository cloning

### training model 

## 🧠 Model Training (Required for Local AI Mode)

This project supports **local fine-tuned inference**.  
To enable the **Training Model** response mode, you must first fine-tune the base language model using the provided counseling dataset.

---

### 📂 Dataset

- **Path**
  ```
  document_store/20200325_counsel_chat.csv
  ```
- **Source**: Counseling-style question–answer dataset  
- **Purpose**: Used to specialize the base LLM for mental health–oriented conversations

---

### 🧪 Training Environment Options

You can train the model using either of the following environments:

- **Jupyter Notebook (Local Machine)**
- **Google Colab (Recommended – GPU support)**

> ⚠️ **CPU-based training is not recommended** due to high memory consumption and long training time.

---

## Download & Prepare RAG Data

1.**Download datasets from HuggingFace**
   - python download_datasets.py

2.**Build RAG index (runs automatically on first app.py launch)**
   -python rag_retriever.py


### 🚀 Training Steps (Google Colab – Recommended)

1. **Open Google Colab**

2. Navigate to **Runtime → Change runtime type**
   - **Hardware Accelerator**: `GPU`[used here is cpu for local deployment trained using gpu]
   - **Python version**: `3.10`

3. **Clone the repository**
   ```bash
   git clone https://github.com/Nischayss/mental_health.git
   cd mental_health_chatbot
   ```

4. **Install training dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Open the training notebook**
   ```
   trained_model/1_train_model.ipynb
   ```

6. **Update the dataset path inside the notebook**
   ```python
   DATASET_PATH = "document_store/20200325_counsel_chat.csv"
   ```

7. **Run all cells in the notebook**
   - Loads the base model (**TinyLlama-1.1B**)
   - Applies **LoRA / PEFT fine-tuning**
   - Trains on counseling conversations
   - Saves trained adapters automatically

---

### 📌 Notes

- Model training is a **one-time process**
- Re-training is only required if:
  - The dataset is updated
  - The base model is changed
- Without training, the application will fall back to API-based or rule-based responses

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/Nischayss/mental_health.git
cd mental_health_chatbot

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Run backend
python app.py
```

**Backend runs at**: `http://127.0.0.1:5000`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm start
```

**Frontend runs at**: `http://localhost:3000`

### Model Setup (Optional)

For local model inference:

1. Download TinyLlama-1.1B-Chat-v1.0 from Hugging Face
2. Place model files in `MODEL_BASE_PATH` directory
3. Ensure PEFT adapters are in `trained_model/` directory
4. Update `.env` with correct paths

> **Note**: Application works without local models using fallback responses or external APIs.

---

## ⚙️ Configuration

### Backend Environment Variables (`.env`)

```env
# Application Security
SECRET_KEY=your-secret-key-here

# Local Model Paths
MODEL_BASE_PATH=path/to/TinyLlama-1.1B-Chat-v1.0
ADAPTER_PATH=trained_model

# External LLM API (Optional)
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=your-api-key-here

# Email Configuration (Optional)
SMTP_EMAIL=your-email@gmail.com
SMTP_APP_PASSWORD=your-app-password

# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Web Search (Optional)
SEARCH_API_KEY=your-search-api-key
```

### Frontend Environment Variables (`frontend/.env`)

```env
# API Endpoint
REACT_APP_API_URL=http://127.0.0.1:5000

# Feature Flags
REACT_APP_ENABLE_WEB_SEARCH=true
REACT_APP_ENABLE_CRISIS_ALERTS=true
```

### Security Notes

- Never commit `.env` files
- Use strong, unique `SECRET_KEY`
- Rotate API keys regularly
- Enable HTTPS in production

---

## 🚀 Usage

### Starting the Application

1. **Start Backend**:
   ```bash
   python app.py
   ```

2. **Start Frontend** (new terminal):
   ```bash
   cd frontend
   npm start
   ```

3. **Access**: Open browser to `http://localhost:3000`

### Basic Workflow

1. Create account or login
2. Select response mode (Training/Professional/Web/Mix)
3. Start conversation in chat interface
4. Explore wellness features from sidebar
5. Crisis support activates automatically when needed

### API Endpoints

#### Chat
```http
POST /chat
Content-Type: application/json

{
  "message": "I'm feeling anxious today",
  "mode": "professional",
  "user_id": "user123"
}
```

#### Health Check
```http
GET /health
```

#### Authentication
```http
POST /auth/signup
POST /auth/login
POST /auth/logout
POST /auth/reset-password
```

---

## 📁 Project Structure

```
mental_health_chatbot/
├── app.py                      # Flask application entry point
├── rag_retriever.py            # RAG/FAISS retrieval logic
├── requirements.txt            # Python dependencies
├── .env.example                # Environment template
├── .gitignore
│
├── templates/
│   └── index.html
│
├── trained_model/              # Model config & adapters
│   ├── 1_train_model.ipynb
│   ├── adapter_config.json
│   ├── tokenizer files...
│   └── README.md
│
├── frontend/                   # React application
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   │
│   │   ├── BreathingExercise.jsx
│   │   ├── Exercise.jsx
│   │   ├── GamesHub.jsx
│   │   ├── MoodTracker.jsx
│   │   ├── Resources.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── Auth.jsx
│   │   │   ├── CrisisModal.jsx
│   │   │   ├── ModelSelector.jsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatInput.jsx
│   │   │   │   ├── ChatMessage.jsx
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   └── FloatingChatButton.jsx
│   │   │   └── ui/
│   │   │       ├── Button.jsx
│   │   │       └── Sidebar.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useChat.js
│   │   │   └── useTheme.js
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   └── utils/
│   │       └── constants.js
│   │
│   └── static/
│       ├── sounds/             # Ambient audio files
│       │   ├── birds-in-cressent.mp3
│       │   ├── gentle-rain.mp3
│       │   ├── ocean-waves.mp3
│       │   └── small-waterfall.mp3
│       │
│       └── videos/             # Exercise videos
│           ├── aerobics/
│           │   ├── arm_circles.mp4
│           │   ├── high_knees.mp4
│           │   ├── jumping_jack.mp4
│           │   ├── quick_feet.mp4
│           │   └── scissor_chops.mp4
│           └── yoga/
│               ├── bridge_pose.mp4
│               ├── childs_pose.mp4
│               ├── cobra.mp4
│               ├── downward_dog.mp4
│               └── extended_triangle.mp4
│
└── assets/
    └── highlights.svg
```

---

## ⚠️ Limitations

### Technical
- Crisis detection uses keyword matching (not ML-based)
- Local model requires significant disk space and compute
- Browser storage is not encrypted
- No automated testing suite
- Single-user focus (not multi-user ready)

### Clinical
- **Not a medical device**: No FDA approval or clinical validation
- **Not therapy**: Does not replace licensed professionals
- **Not diagnostic**: Cannot diagnose conditions
- **Limited crisis handling**: Basic resource provision only

---

## 🤝 Contributing

Contributions welcome! Areas of interest:

- Enhanced crisis detection algorithms
- Improved model fine-tuning
- New wellness features
- Testing suite development
- Documentation improvements
- Accessibility enhancements

### Steps

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

---

## 👥 Authors

- **Nischay SS**
- **Shivashankar Naik**
- **Shivashankar Murthy**
- **Ullas**

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Hugging Face for transformer models and PEFT
- TinyLlama team for the base model
- Mental health professionals for guidance
- Open source community

---


**If you're in crisis, please reach out to a professional immediately.**

**NISRA is for learning and exploration, not a replacement for human care.**

Made with ❤️ for mental health awareness and responsible AI development by us - team NISRA ❤️

