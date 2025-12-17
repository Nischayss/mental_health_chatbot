# Mental Health Chatbot

A retrieval-augmented chatbot for mental health support. This repository includes a Flask-like backend, a Vite + React frontend, local model files for an LLM (TinyLlama), and document/index stores used for retrieval.

## Features
- Conversation UI with context and history (frontend in `frontend/src`)
- Retrieval-augmented responses using documents in `document_store/` and `faiss_index/`
- Local LLM model folder: `TinyLlama-1.1B-Chat-v1.0` (weights + tokenizer)
- Trained adapter in `trained_model/` for domain-specific behavior

## Requirements
- Python 3.10+ (Windows tested)
- Node.js 18+ and npm/yarn for the frontend
- GPU recommended for local model inference; CPU will work but slower

## Quick Start (local)

1. Create and activate a Python virtual environment

```bash
python -m venv .venv
.\.venv\Scripts\activate
```

2. Install Python dependencies

```bash
pip install -r requirements.txt
```

3. Install frontend dependencies and run dev server

```bash
cd frontend
npm install
npm run dev
```

4. Run the backend (from project root)

```bash
python app.py
# or if the project uses flask run: FLASK_APP=app.py flask run
```

Open the frontend URL shown by Vite (usually http://localhost:5173) to use the app.

## Project Layout
- `app.py` — backend entrypoint (API + chat endpoints)
- `rag_retriever.py`, `web_search.py` — retrieval and search utilities
- `document_store/` — CSV and source documents used for retrieval
- `faiss_index/` — Faiss vector index files
- `TinyLlama-1.1B-Chat-v1.0/` — local model weights and tokenizer
- `trained_model/` — adapter weights used to fine-tune behavior
- `frontend/` — React + Vite app (UI components in `frontend/src`)
- `user_data/` — sample users and chat histories

### Detailed Project Structure

- `app.py` — main Python server. Exposes REST endpoints for chat and retrieval.
- `rag_retriever.py` — builds and queries vector store and retrieval pipeline.
- `web_search.py` — optional web-search helper used to enrich retrieval (may require API keys).
- `document_store/20200325_counsel_chat.csv` — sample dataset used for retrieval examples.
- `faiss_index/` — prebuilt Faiss index files (binaries and metadata) used by the retriever.
- `TinyLlama-1.1B-Chat-v1.0/` — model artifacts (weights, tokenizer, config). Configure `MODEL_DIR` to point here.
- `trained_model/` — optional adapter or fine-tuned weights applied on top of the base model.
- `frontend/` — Vite + React frontend. Key files:
	- `frontend/src/App.jsx` — app shell and routing
	- `frontend/src/components/chat/*` — chat UI components
	- `frontend/package.json` — frontend scripts and deps
- `user_data/` — persisted users and chat histories (JSON). Treat this as sensitive.

If you add new modules, place retrieval-related code in `rag_retriever.py` or a new module under a clear `services/` namespace.

## Model & Data Notes
- This repository stores model files locally under `TinyLlama-1.1B-Chat-v1.0` and an adapter in `trained_model/`. Ensure you have appropriate hardware and legal rights to run these models.
- The `document_store/20200325_counsel_chat.csv` is included for retrieval examples; treat user data responsibly.

## Environment & Secrets
- If your setup requires API keys or other secrets, export them as environment variables before starting the backend. No secrets are committed to this repository by default.

### `.env.example` and recommended variables

Copy `.env.example` to `.env` and fill values before running locally. Many Python apps use `python-dotenv` or similar to load `.env` files; if not present, set the variables in your shell.

Common variables and purpose:

- `FLASK_ENV` — `development` or `production`. Affects debug mode and reloading.
- `FLASK_APP` — path to the Flask entrypoint (e.g., `app.py`).
- `SECRET_KEY` — app secret for session/csrf signing. Replace `changeme` with a secure random value.
- `MODEL_DIR` — relative path to local model directory (default: `TinyLlama-1.1B-Chat-v1.0`).
- `ADAPTER_DIR` — path to the trained adapter (if used): `trained_model`.
- `FAISS_INDEX_DIR` — path to the `faiss_index` folder.
- `DOCUMENT_STORE` — path to `document_store`.
- `PORT` — port to run the backend on (e.g., `8000`).
- `FRONTEND_URL` — URL where the frontend runs (default: `http://localhost:5173`).
- `OPENAI_API_KEY` — optional; only set if you use external APIs for web search or fallback LLMs.
- `DATABASE_URL` — optional DB connection string (e.g., `sqlite:///data.db`).

Example usage (Windows PowerShell):

```powershell
copy .env.example .env
(Notepad .env) # or edit as preferred
python app.py
```

On Unix/macOS:

```bash
cp .env.example .env
export $(cat .env | xargs)
python app.py
```

## Troubleshooting
- Port in use: change ports in `app.py` or Vite config.
- Index missing: re-run the index build script (if provided) to create files under `faiss_index/`.

## Contributing
- Open issues or PRs for bugs and improvements.
- Add tests for backend APIs and frontend components where possible.

## License
Specify your license here (e.g., MIT). If you want me to add a license file, tell me which one.

---
If you'd like, I can also:
- Add a short `run-local` script for Windows to start both frontend and backend.
- Commit the README and create a small checklist/PR.

## Project Tree (Backend / Frontend grouped)

The repository separates server (backend) and client (frontend) concerns. Use the backend section to run the Python server and the frontend section to run the Vite app.

```
mental_health_chatbot/
├─ backend/
│  ├─ app.py
│  ├─ rag_retriever.py
│  ├─ web_search.py
│  ├─ requirements.txt
│  ├─ .env.example
│  ├─ models/
│  │  └─ TinyLlama-1.1B-Chat-v1.0/
│  │     ├─ model.safetensors
│  │     └─ tokenizer.*
│  ├─ trained_model/
│  │  └─ adapter_model.safetensors
│  ├─ document_store/
│  │  └─ 20200325_counsel_chat.csv
│  ├─ faiss_index/
│  └─ templates/
│     └─ index.html
├─ frontend/
│  ├─ package.json
│  ├─ index.html
│  └─ src/
│     ├─ App.jsx
│     ├─ main.jsx
│     ├─ index.css
│     └─ components/
│        ├─ chat/
│        │  ├─ ChatWindow.jsx
│        │  ├─ ChatInput.jsx
│        │  └─ ChatMessage.jsx
│        ├─ Auth.jsx
│        └─ ModelSelector.jsx
├─ user_data/
│  ├─ users.json
│  └─ chat_histories/
└─ README.MD
```

Run each part separately:

Backend (from repo root):

```powershell
python app.py
```

Frontend (from `frontend`):

```bash
cd frontend
npm install
npm run dev
```

This grouped tree makes the separation clearer; tell me if you prefer the original flat layout or want additional files listed.

## Project Tree

A concise visual tree of the repository (top-level and key files):

```
mental_health_chatbot/
├─ app.py
├─ rag_retriever.py
├─ web_search.py
├─ requirements.txt
├─ README.MD
├─ .env.example
├─ TinyLlama-1.1B-Chat-v1.0/
│  ├─ model.safetensors
│  ├─ config.json
│  └─ tokenizer.*
├─ trained_model/
│  ├─ adapter_model.safetensors
│  └─ adapter_config.json
├─ document_store/
│  └─ 20200325_counsel_chat.csv
├─ faiss_index/
├─ user_data/
│  ├─ users.json
│  └─ chat_histories/
├─ frontend/
│  ├─ package.json
│  ├─ index.html
│  └─ src/
│     ├─ App.jsx
│     ├─ main.jsx
│     ├─ index.css
│     ├─ BreathingExercise.jsx
│     ├─ MoodTracker.jsx
│     └─ components/
│        ├─ Auth.jsx
│        ├─ ModelSelector.jsx
│        └─ chat/
│           ├─ ChatWindow.jsx
│           ├─ ChatInput.jsx
│           └─ ChatMessage.jsx
└─ templates/
	└─ index.html

```

This tree focuses on the most relevant files and folders; add or expand entries if you'd like a deeper view for any subfolder.
