import os
from flask import Flask, request, jsonify, render_template 
from flask_cors import CORS
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import warnings
import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
from urllib.parse import urlparse, quote
import time
import random
from functools import lru_cache
from rag_retriever import RagRetriever
from flask import session
from werkzeug.security import generate_password_hash, check_password_hash
import json
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
from datetime import datetime, timedelta

warnings.filterwarnings("ignore")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "nisra-secret-key-change-in-production") 
# Replace your current CORS configuration with this:
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173", 
            "http://127.0.0.1:5173",
            "http://localhost:3000", 
            "http://127.0.0.1:3000"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True  # Add this line
    }
})
USER_DATA_DIR = Path("user_data")
USER_DATA_DIR.mkdir(exist_ok=True)
USERS_FILE = USER_DATA_DIR / "users.json"
CHAT_HISTORY_DIR = USER_DATA_DIR / "chat_histories"
CHAT_HISTORY_DIR.mkdir(exist_ok=True)

def load_users():
    """Load users from JSON file"""
    if USERS_FILE.exists():
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    """Save users to JSON file"""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def get_user_chat_file(email):
    """Get chat history file path for user"""
    safe_email = email.replace('@', '_').replace('.', '_')
    return CHAT_HISTORY_DIR / f"{safe_email}_chats.json"

def load_user_chats(email):
    """Load user's chat history"""
    chat_file = get_user_chat_file(email)
    if chat_file.exists():
        with open(chat_file, 'r') as f:
            return json.load(f)
    return []

def save_user_chat(email, chat_data):
    """Save user's chat history"""
    chat_file = get_user_chat_file(email)
    chats = load_user_chats(email)
    chats.append(chat_data)
    with open(chat_file, 'w') as f:
        json.dump(chats, f, indent=2)


# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Email configuration for FREE Gmail SMTP
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.environ.get("SMTP_EMAIL")  # Your Gmail
SMTP_PASSWORD = os.environ.get("SMTP_APP_PASSWORD")

# Twilio FREE Trial (Alternative - 500 FREE SMS)
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE = os.environ.get("TWILIO_PHONE", "")

reset_codes = {}  

BASE_MODEL_PATH = os.environ.get("MODEL_BASE_PATH", "./TinyLlama-1.1B-Chat-v1.0")
ADAPTER_PATH = os.environ.get("ADAPTER_PATH", "./trained_model")

# Initialize Gemini API with free tier management
# Initialize Ollama API
LLM_MODEL_NAME = os.environ.get("LLM_MODEL_NAME", "llama3.2-vision:latest")
LLM_API_URL = os.environ.get("LLM_API_URL", "https://chat.ivislabs.in/api/chat/completions")
LLM_API_KEY = os.environ.get("LLM_API_KEY")

ollama_client = None
ollama_rate_limiter = {
    'last_request_time': 0,
    'request_count_minute': 0,
    'request_count_day': 0,
    'day_start': time.time(),
    'minute_start': time.time()
}

if LLM_API_URL and LLM_API_KEY:
    try:
        ollama_client = {
            'api_url': LLM_API_URL,
            'api_key': LLM_API_KEY,
            'model': LLM_MODEL_NAME
        }
        print(f"✅ Ollama API initialized - Model: {LLM_MODEL_NAME}")
    except Exception as e:
        print(f"⚠️ Ollama API initialization failed: {e}")
        ollama_client = None
else:
    print("⚠️ Ollama API not configured - using fallback responses")

def check_ollama_rate_limit():
    """Check if we can make an Ollama request"""
    if not ollama_client:
        return False
    
    current_time = time.time()
    
    # Reset day counter if 24 hours passed
    if current_time - ollama_rate_limiter['day_start'] > 86400:
        ollama_rate_limiter['request_count_day'] = 0
        ollama_rate_limiter['day_start'] = current_time
        print("🔄 Daily Ollama counter reset")
    
    # Reset minute counter if 60 seconds passed
    if current_time - ollama_rate_limiter['minute_start'] > 60:
        ollama_rate_limiter['request_count_minute'] = 0
        ollama_rate_limiter['minute_start'] = current_time
    
    # Check limits (adjust as needed for your Ollama instance)
    if ollama_rate_limiter['request_count_day'] >= 10000:
        print("⚠️ Ollama daily limit reached")
        return False
    
    if ollama_rate_limiter['request_count_minute'] >= 60:
        print("⚠️ Ollama minute limit reached")
        return False
    
    # Enforce minimum delay between requests
    time_since_last = current_time - ollama_rate_limiter['last_request_time']
    if time_since_last < 0.1:
        wait_time = 0.1 - time_since_last
        time.sleep(wait_time)
    
    return True

def increment_ollama_counter():
    """Increment rate limit counters after successful request"""
    ollama_rate_limiter['request_count_minute'] += 1
    ollama_rate_limiter['request_count_day'] += 1
    ollama_rate_limiter['last_request_time'] = time.time()
    print(f"📊 Ollama usage: {ollama_rate_limiter['request_count_minute']}/60 this minute, {ollama_rate_limiter['request_count_day']}/10000 today")
def call_ollama_api(prompt, max_tokens=1000, temperature=0.7):
    """Call LLM API with OpenAI-compatible format"""
    if not ollama_client:
        return None
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ollama_client['api_key']}"
        }
        
        # OpenAI-compatible chat completion format
        payload = {
            "model": ollama_client['model'],
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False
        }
        
        print(f"🔄 Calling LLM API: {ollama_client['api_url']}")
        
        response = requests.post(
            ollama_client['api_url'],
            headers=headers,
            json=payload,
            timeout=60
        )
        
        print(f"📡 LLM Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # OpenAI-compatible format: choices[0].message.content
            if 'choices' in data and len(data['choices']) > 0:
                message = data['choices'][0].get('message', {})
                content = message.get('content', '')
                if content:
                    print(f"✅ LLM Response received ({len(content)} chars)")
                    return content
            
            # Alternative formats
            elif 'message' in data:
                if isinstance(data['message'], dict) and 'content' in data['message']:
                    return data['message']['content']
                elif isinstance(data['message'], str):
                    return data['message']
            
            elif 'response' in data:
                return data['response']
            
            elif 'content' in data:
                return data['content']
            
            print(f"⚠️ Unexpected response format: {list(data.keys())}")
            return None
        
        elif response.status_code == 405:
            print(f"❌ 405 Method Not Allowed")
            print(f"🔗 Endpoint: {ollama_client['api_url']}")
            print(f"💡 Check if the endpoint URL is correct")
            return None
        
        elif response.status_code == 401:
            print(f"❌ 401 Unauthorized - Check your LLM_API_KEY")
            return None
        
        elif response.status_code == 404:
            print(f"❌ 404 Not Found - Check your LLM_API_URL")
            return None
        
        elif response.status_code == 400:
            print(f"❌ 400 Bad Request: {response.text}")
            return None
        
        else:
            print(f"❌ LLM API error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"⏱️ LLM API request timeout")
        return None
    except requests.exceptions.ConnectionError:
        print(f"🔌 LLM API connection error")
        return None
    except Exception as e:
        print(f"❌ LLM API call failed: {e}")
        return None
def generate_with_retrieved_context(user_query, retrieved_contexts, use_ollama=True):
    """
    🧠 GENERATION PHASE - Synthesize retrieved knowledge into natural response
    This is where RAG's 'G' happens using Ollama LLM
    """
    if not use_ollama or not ollama_client or not check_ollama_rate_limit():
        return generate_fallback_with_context(user_query, retrieved_contexts)
    
    # Prepare context from retrieved documents
    context_text = "\n\n".join([
        f"[Source {i+1}]: {ctx.get('answer', ''[:300])}"
        for i, ctx in enumerate(retrieved_contexts[:3])
    ])
    
    # Enhanced prompt for natural therapeutic response
    prompt = f"""You are NISRA, a compassionate mental health support AI. A person asked: "{user_query}"

**Retrieved Context from Knowledge Base:**
{context_text}

**Your Task:**
1. Synthesize the context into a natural, empathetic response
2. Don't just repeat the sources - create a cohesive answer
3. Use therapeutic language (validate feelings, offer hope, suggest actions)
4. If context is insufficient, acknowledge it honestly
5. Always end with encouragement and crisis resources if needed

Respond naturally as if having a caring conversation (400-600 words):"""

    try:
        response_text = call_ollama_api(prompt, max_tokens=800, temperature=0.7)
        increment_ollama_counter()
        
        if response_text:
            return {
                'answer': response_text,
                'generation_method': 'ollama_synthesis',
                'context_used': len(retrieved_contexts)
            }
    except Exception as e:
        print(f"⚠️ Ollama generation failed: {e}")
    
    return generate_fallback_with_context(user_query, retrieved_contexts)


def generate_fallback_with_context(user_query, retrieved_contexts):
    """Fallback generation when Ollama unavailable"""
    if not retrieved_contexts:
        return {
            'answer': "I'm having trouble accessing relevant information right now. For mental health support, please contact 988.",
            'generation_method': 'fallback_empty',
            'context_used': 0
        }
    
    # Simple template-based generation
    best_match = retrieved_contexts[0]
    response = f"""Based on similar situations in our knowledge base:

{best_match['answer'][:400]}

This guidance comes from our counseling database. For personalized support, please consult a licensed professional.

**Crisis Resources:** 988 (US) | 1800-599-0019 (India)"""
    
    return {
        'answer': response,
        'generation_method': 'fallback_template',
        'context_used': len(retrieved_contexts)
    }
# ============================================================================
# GLOBAL CACHED MODEL - LOADED ONCE, REUSED FOREVER
# ============================================================================
model = None
tokenizer = None
use_adapter = False
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_load_time = None

# Professional Mental Health Response Generator
class ProfessionalMentalHealthResponses:
    def __init__(self):
        self.use_ollama = ollama_client is not None
        self.fallback_responses = {
            'anxiety': {
                'response': """I understand you're experiencing anxiety, and I want you to know that what you're feeling is valid and treatable. Anxiety affects millions of people, and there are proven ways to manage it.

**Immediate Relief Techniques:**
- **4-7-8 Breathing**: Inhale for 4 counts, hold for 7, exhale for 8
- **Progressive Muscle Relaxation**: Tense and release each muscle group
- **5-4-3-2-1 Grounding**: Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste

**Cognitive Strategies:**
- Challenge anxious thoughts with evidence
- Practice mindfulness and present-moment awareness
- Use positive self-talk and affirmations

**When to Seek Professional Help:**
If anxiety interferes with daily life, work, or relationships for more than 2 weeks, please consider speaking with a mental health professional.""",
                'sources': [
                    {'title': 'Anxiety Disorders - NIMH', 'url': 'https://www.nimh.nih.gov/health/topics/anxiety-disorders'},
                    {'title': 'CBT for Anxiety - APA', 'url': 'https://www.apa.org/topics/anxiety/cbt'},
                ]
            },
            'depression': {
                'response': """I hear that you're struggling with depression. Depression is a real medical condition that affects how you feel, think, and act—and it's highly treatable.

**Understanding Depression:**
- It's not your fault or a sign of weakness
- Depression affects brain chemistry
- Recovery is possible with proper support

**Crisis Resources:**
If you're having thoughts of suicide, please reach out:
- National Suicide Prevention Lifeline: 988/108
- Crisis Text Line: Text HOME to 741741""",
                'sources': [
                    {'title': 'Depression Basics - NIMH', 'url': 'https://www.nimh.nih.gov/health/publications/depression'},
                ]
            },
            'stress': {
                'response': """I understand you're feeling stressed. It's important to address this before it becomes overwhelming.

**Immediate Stress Relief:**
- Deep Breathing Exercises
- Progressive Muscle Relaxation
- Mindful Movement

**When to Seek Help:**
If stress affects sleep, eating, or relationships consistently, consider speaking with a counselor.""",
                'sources': [
                    {'title': 'Stress Management - Harvard Health', 'url': 'https://www.health.harvard.edu/topics/stress'},
                ]
            }
        }
    
    def get_professional_response_with_ollama(self, user_input):
        """Enhanced professional response using Ollama API"""
        
        if not check_ollama_rate_limit():
            print("⚠️ Ollama rate limit hit - using fallback")
            return self._get_fallback_response(user_input)
        
        try:
            prompt = f"""You are Dr. Sarah Chen, a licensed clinical psychologist with 15 years of experience. Provide a compassionate, professional response to: "{user_input}"

Include:
1. Empathetic acknowledgment
2. Evidence-based information
3. Practical coping strategies
4. Treatment recommendations if appropriate
5. Crisis resources if relevant (988, 911)

Use markdown with ## headers and bullet points. Keep under 800 words."""

            response_text = call_ollama_api(prompt, max_tokens=1000, temperature=0.7)
            
            increment_ollama_counter()
            
            if response_text:
                return {
                    'answer': response_text + "\n\n---\n*✨ Enhanced by Ollama Llama 3.2 Vision • For personalized care, please consult a licensed mental health professional.*",
                    'sources': [{
                        'title': f'Professional Clinical Guidance ({LLM_MODEL_NAME})',
                        'url': 'https://www.apa.org/topics',
                        'snippet': f'Evidence-based mental health information powered by {LLM_MODEL_NAME}',
                        'displayUrl': 'Ollama AI Professional',
                        'source_id': 1,
                        'favicon': 'https://www.google.com/s2/favicons?domain=apa.org',
                        'published_date': datetime.now().strftime('%Y-%m-%d'),
                        'type': 'ai_professional'
                    }],
                    'type': 'professional_guidance',
                    'confidence': 0.95
                }
            else:
                return self._get_fallback_response(user_input)
                
        except Exception as e:
            print(f"❌ Ollama error: {e}")
            return self._get_fallback_response(user_input)
    
    def _get_fallback_response(self, user_input):
        """Fallback response when Ollama is unavailable"""
        user_lower = user_input.lower()
        
        if any(word in user_lower for word in ['anxious', 'anxiety', 'panic', 'worry']):
            response_data = self.fallback_responses['anxiety']
        elif any(word in user_lower for word in ['depressed', 'depression', 'sad', 'hopeless']):
            response_data = self.fallback_responses['depression']
        elif any(word in user_lower for word in ['stressed', 'stress', 'overwhelmed']):
            response_data = self.fallback_responses['stress']
        else:
            response_data = {
                'response': """Thank you for reaching out. Mental health support is available through professional counseling, self-care practices, and community resources. For immediate crisis support, call 988.""",
                'sources': [{'title': 'Mental Health Resources - NAMI', 'url': 'https://www.nami.org'}]
            }
        
        return {
            'answer': response_data['response'],
            'sources': [{
                'title': source['title'],
                'url': source['url'],
                'snippet': 'Professional mental health information',
                'displayUrl': urlparse(source['url']).netloc.replace('www.', ''),
                'source_id': i + 1,
                'favicon': f"https://www.google.com/s2/favicons?domain={urlparse(source['url']).netloc}",
                'published_date': '',
                'type': 'professional_resource'
            } for i, source in enumerate(response_data['sources'])],
            'type': 'professional_guidance',
            'confidence': 0.85
        }
    
    def get_professional_response(self, user_input):
        """Main entry point - tries Ollama first"""
        if self.use_ollama:
            print("🤖 Using Ollama API for professional response...")
            return self.get_professional_response_with_ollama(user_input)
        else:
            print("📚 Using pre-written professional responses...")
            return self._get_fallback_response(user_input)

class EnhancedFreeWebSearcher:
    def __init__(self):
        self.session = requests.Session()
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0'
        ]
    
    def get_headers(self):
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
        }
    
    def comprehensive_free_search(self, query, num_results=4):
        """Comprehensive search like Perplexity - multiple sources"""
        all_results = []
        
        try:
            # Add delay to avoid rate limiting
            time.sleep(0.5)
            
            # Search DuckDuckGo
            ddg_results = self.search_duckduckgo_advanced(query)
            all_results.extend(ddg_results)
            
            time.sleep(0.5)
            
            # Add Wikipedia if relevant
            wiki_result = self.get_wikipedia_summary(query)
            if wiki_result:
                all_results.append(wiki_result)
            
            time.sleep(0.5)
            
            # Add authoritative mental health sources
            if len(all_results) < num_results:
                auth_sources = self.get_authoritative_sources(query)
                all_results.extend(auth_sources)
            
            # Ensure we have exactly num_results
            while len(all_results) < num_results:
                all_results.append(self.create_search_suggestion(query, len(all_results) + 1))
            
            return all_results[:num_results]
            
        except Exception as e:
            print(f"Search error: {e}")
            return [self.create_search_suggestion(query, 1)]
    
    def search_duckduckgo_advanced(self, query):
        """Advanced DuckDuckGo search with better parsing"""
        try:
            # Enhance query for mental health
            enhanced_query = f"{query} mental health treatment information"
            search_url = f"https://html.duckduckgo.com/html/?q={quote(enhanced_query)}"
            
            response = self.session.get(search_url, headers=self.get_headers(), timeout=10)
            
            if response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.content, 'html.parser')
            results = []
            
            # Find search results
            search_results = soup.find_all('div', class_='result')
            
            for i, result in enumerate(search_results[:3]):
                try:
                    title_elem = result.find('a', class_='result__a')
                    snippet_elem = result.find('a', class_='result__snippet')
                    
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    url = title_elem.get('href', '')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else title[:100] + "..."
                    
                    # Skip irrelevant results
                    skip_domains = ['pinterest.com', 'facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com']
                    if any(domain in url.lower() for domain in skip_domains):
                        continue
                    
                    # Prefer authoritative sources
                    domain = urlparse(url).netloc.replace('www.', '') if url else 'unknown'
                    
                    # Clean and enhance snippet for mental health context
                    if len(snippet) < 100:
                        snippet += f" Information about {query} from {domain}."
                    
                    results.append({
                        'title': title[:120],  # Limit title length
                        'url': url,
                        'snippet': snippet[:250],  # Good snippet length
                        'displayUrl': domain,
                        'source_id': i + 1,
                        'favicon': f"https://www.google.com/s2/favicons?domain={domain}",
                        'published_date': '',
                        'type': 'web_search'
                    })
                    
                except Exception as e:
                    continue
            
            return results
            
        except Exception as e:
            print(f"DuckDuckGo search error: {e}")
            return []
    
    def get_wikipedia_summary(self, query):
        """Get Wikipedia summary for educational context"""
        try:
            # Try Wikipedia API
            wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(query)}"
            response = self.session.get(wiki_url, timeout=8)
            
            if response.status_code == 200:
                data = response.json()
                if 'extract' in data and len(data.get('extract', '')) > 100:
                    return {
                        'title': f"Wikipedia: {data.get('title', query)}",
                        'url': data.get('content_urls', {}).get('desktop', {}).get('page', f"https://en.wikipedia.org/wiki/{quote(query)}"),
                        'snippet': data['extract'][:300] + ("..." if len(data['extract']) > 300 else ""),
                        'displayUrl': 'wikipedia.org',
                        'source_id': 90,
                        'favicon': 'https://en.wikipedia.org/static/favicon/wikipedia.ico',
                        'published_date': '',
                        'type': 'encyclopedia'
                    }
            return None
            
        except Exception as e:
            return None
    
    def get_authoritative_sources(self, query):
        """Add authoritative mental health sources"""
        sources = [
            {
                'title': f'Mental Health Information - National Institute of Mental Health',
                'url': f'https://www.nimh.nih.gov/health/find-help',
                'snippet': f'Comprehensive, research-based information about {query} and mental health treatments from the leading federal agency for mental health research.',
                'displayUrl': 'nimh.nih.gov',
                'source_id': 91,
                'favicon': 'https://www.google.com/s2/favicons?domain=nimh.nih.gov',
                'published_date': '',
                'type': 'government_resource'
            },
            {
                'title': f'Mayo Clinic: Mental Health and {query}',
                'url': f'https://www.mayoclinic.org/diseases-conditions/mental-illness',
                'snippet': f'Medical expertise and evidence-based information about {query} from Mayo Clinic physicians and mental health specialists.',
                'displayUrl': 'mayoclinic.org',
                'source_id': 92,
                'favicon': 'https://www.google.com/s2/favicons?domain=mayoclinic.org',
                'published_date': '',
                'type': 'medical_resource'
            }
        ]
        return sources[:2]  # Return top 2 authoritative sources
    
    def create_search_suggestion(self, query, source_id):
        """Create search suggestion when results are limited"""
        return {
            'title': f'Additional Information About "{query}"',
            'url': f'https://www.google.com/search?q={quote(query + " mental health")}',
            'snippet': f'For more comprehensive and current information about "{query}", try searching on Google, Bing, or visit trusted mental health websites directly.',
            'displayUrl': 'search-suggestion',
            'source_id': source_id,
            'favicon': 'https://www.google.com/s2/favicons?domain=google.com',
            'published_date': '',
            'type': 'search_suggestion'
        }

# Advanced AI Response Generator WITH CACHING
class AdvancedAIResponses:
    def __init__(self, model, tokenizer, device):
        self.model = model
        self.tokenizer = tokenizer
        self.device = device
        self.response_cache = {}  # Cache recent responses
        self.cache_max_size = 50  # Keep last 50 responses
    
    def _get_cache_key(self, user_input):
        """Generate cache key for similar inputs"""
        return user_input.lower().strip()[:100]  # Removed @lru_cache
    
    def generate_ai_response(self, user_input):
        """Generate high-quality AI response with caching"""
        
        # Check cache first
        cache_key = self._get_cache_key(user_input)
        if cache_key in self.response_cache:
            print("⚡ Using cached response for similar query")
            cached = self.response_cache[cache_key].copy()
            cached['answer'] = cached['answer'] + "\n\n*[Cached response for faster delivery]*"
            return cached
        
        try:
            if self.model is None or self.tokenizer is None:
                return self.get_fallback_response(user_input)
            
            # Enhanced prompt for better responses
            prompt = f"""You are Dr. Sarah Chen, a compassionate and experienced clinical psychologist. You specialize in evidence-based treatments and have 15 years of experience helping people with mental health challenges. 

Provide a warm, professional, and helpful response to this person who is seeking mental health support. Be empathetic, specific, and actionable in your advice.

Person: "{user_input}"

Dr. Chen:"""

            try:
                inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512, padding=True)
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
            except Exception as e:
                print(f"Tokenization error: {e}")
                return self.get_fallback_response(user_input)
            
            try:
                with torch.no_grad():
                    output_ids = self.model.generate(
                        **inputs,
                        max_new_tokens=80,
                        do_sample=True,
                        temperature=0.7,
                        top_p=0.9,
                        top_k=50,
                        pad_token_id=self.tokenizer.eos_token_id if hasattr(self.tokenizer, 'eos_token_id') else 0,
                        eos_token_id=self.tokenizer.eos_token_id if hasattr(self.tokenizer, 'eos_token_id') else 0,
                        early_stopping=True,
                        repetition_penalty=1.2,
                        no_repeat_ngram_size=3
                    )
                
                response = self.tokenizer.decode(output_ids[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
                cleaned_response = response.strip()
                
                # Remove incomplete sentences
                if cleaned_response and not cleaned_response[-1] in '.!?':
                    sentences = cleaned_response.split('.')
                    cleaned_response = '.'.join(sentences[:-1]) + '.'
                
                # Enhance the response if it's too short or generic
                if len(cleaned_response) < 50:
                    cleaned_response = self.enhance_response(user_input, cleaned_response)
                
                final_response = f"{cleaned_response}\n\n---\n*This response was generated by a fine-tuned AI model trained specifically on mental health conversations and therapeutic techniques. While AI can provide helpful insights, please consider professional counseling for personalized care.*"
                
                result = {
                    'answer': final_response,
                    'sources': [{
                        'title': 'Mental Health AI Model - Specialized Training Data',
                        'url': '#',
                        'snippet': 'AI model trained on thousands of therapeutic conversations, clinical guidelines, and evidence-based mental health practices',
                        'displayUrl': 'ai-model.local',
                        'source_id': 1,
                        'favicon': '/static/icons/ai-brain.png',
                        'published_date': datetime.now().strftime('%Y-%m-%d'),
                        'type': 'ai_generated'
                    }],
                    'type': 'training_model',
                    'confidence': 0.85
                }
                
                # Cache the response
                self.response_cache[cache_key] = result.copy()
                
                # Maintain cache size
                if len(self.response_cache) > self.cache_max_size:
                    oldest_key = next(iter(self.response_cache))
                    del self.response_cache[oldest_key]
                
                return result
            
            except Exception as e:
                print(f"Generation error: {e}")
                return self.get_fallback_response(user_input)
                
        except Exception as e:
            print(f"AI generation error: {e}")
            return self.get_fallback_response(user_input)
    
    def enhance_response(self, user_input, original_response):
        """Enhance short or generic responses"""
        enhancements = {
            'anxiety': "Remember that anxiety is your body's natural alarm system, but sometimes it goes off when there's no real danger. Breathing exercises, grounding techniques, and challenging worried thoughts can help.",
            'depression': "Depression can make everything feel harder, but please know that with proper support and treatment, people do recover and go on to live fulfilling lives.",
            'stress': "Stress is a normal part of life, but chronic stress can impact your health. It's important to develop healthy coping strategies and know when to ask for help.",
            'general': "Your mental health matters, and seeking support shows strength. There are many resources available, from self-help strategies to professional counseling."
        }
        
        user_lower = user_input.lower()
        if 'anxiety' in user_lower or 'anxious' in user_lower:
            return original_response + "\n\n" + enhancements['anxiety']
        elif 'depression' in user_lower or 'depressed' in user_lower:
            return original_response + "\n\n" + enhancements['depression']
        elif 'stress' in user_lower:
            return original_response + "\n\n" + enhancements['stress']
        else:
            return original_response + "\n\n" + enhancements['general']
    
    def get_fallback_response(self, user_input):
        """Fallback response when AI fails"""
        fallback_responses = {
            'anxiety': "I understand you're feeling anxious. While my AI model is experiencing some technical difficulties, I want you to know that anxiety is very treatable. Try taking slow, deep breaths and consider speaking with a mental health professional who can provide personalized support.",
            'depression': "I hear that you're struggling with depression. Even though my AI model isn't working perfectly right now, I want you to know that depression is a real medical condition that's highly treatable. Please consider reaching out to a mental health professional or calling 988 if you need immediate support.",
            'stress': "I can see you're feeling stressed. While my AI model is having some issues, stress is manageable with the right tools and support. Consider some relaxation techniques, and don't hesitate to seek professional support if needed.",
            'default': "I'm here to support you, though my AI model is having some technical difficulties. Your mental health matters, and there are many resources available to help. Consider speaking with a mental health professional for personalized guidance, or call 988 if you're in crisis."
        }
        
        user_lower = user_input.lower()
        if any(word in user_lower for word in ['anxious', 'anxiety']):
            response_text = fallback_responses['anxiety']
        elif any(word in user_lower for word in ['depressed', 'depression']):
            response_text = fallback_responses['depression'] 
        elif any(word in user_lower for word in ['stress', 'stressed']):
            response_text = fallback_responses['stress']
        else:
            response_text = fallback_responses['default']
        
        return {
            'answer': response_text,
            'sources': [],
            'type': 'training_model',
            'confidence': 0.4
        }

# Knowledge Base with Expert Information
class ExpertKnowledgeBase:
    def __init__(self):
        self.use_ollama = ollama_client is not None  # CHANGED
        self.fallback_knowledge = {
    'content': """**Evidence-Based Therapeutic Approaches:**

**Cognitive Behavioral Therapy (CBT)**
One of the most researched treatments for anxiety, depression, and other conditions. Focuses on changing negative thought patterns.

**Dialectical Behavior Therapy (DBT)**
Teaches mindfulness, distress tolerance, emotion regulation, and interpersonal effectiveness.

**Acceptance and Commitment Therapy (ACT)**
Helps develop psychological flexibility and values-based action.

**EMDR**
Particularly effective for trauma and PTSD.

The best approach depends on your specific concerns and preferences.""",
    'sources': [
        {'title': 'Evidence-Based Therapy - APA', 'url': 'https://www.apa.org/ptsd-guideline/treatments'},
        {'title': 'Psychotherapy Types - NAMI', 'url': 'https://www.nami.org/About-Mental-Illness/Treatments/Psychotherapy'}
    ]
}
    
    def search_knowledge_with_ollama(self, query):  # RENAMED
        """Enhanced knowledge using Ollama API"""  # CHANGED
        
        if not check_ollama_rate_limit():  # CHANGED
            print("⚠️ Ollama rate limit hit - using fallback knowledge")  # CHANGED
            return self._get_fallback_knowledge(query)
        
        try:
            prompt = f"""You are a mental health research expert. Provide an authoritative response about: "{query}"

Include:
1. Current research and evidence
2. Evidence-based treatment approaches
3. Professional guidelines
4. Practical applications
5. Cite organizations (APA, NIMH, WHO) when appropriate

Use markdown with ## headers and bullets. Keep under 700 words."""

            response_text = call_ollama_api(prompt, max_tokens=900, temperature=0.7)  # CHANGED
            
            increment_ollama_counter()  # CHANGED
            
            if response_text:  # CHANGED
                return {
                    'answer': response_text + "\n\n---\n*✨ Enhanced by Ollama AI • Expert knowledge from evidence-based research.*",  # CHANGED
                    'sources': [
                        {
                            'title': f'Expert Knowledge Base ({LLM_MODEL_NAME})',  # CHANGED
                            'url': 'https://www.nimh.nih.gov',
                            'snippet': f'AI-curated expert knowledge powered by {LLM_MODEL_NAME}',
                            'displayUrl': 'Ollama Expert AI',  # CHANGED
                            'source_id': 1,
                            'favicon': 'https://www.google.com/s2/favicons?domain=nimh.nih.gov',
                            'published_date': datetime.now().strftime('%Y-%m-%d'),
                            'type': 'ai_knowledge_base'
                        }
                    ],
                    'type': 'expert_knowledge',
                    'confidence': 0.95
                }
            else:
                return self._get_fallback_knowledge(query)
                
        except Exception as e:
            print(f"❌ Ollama error: {e}")  # CHANGED
            return self._get_fallback_knowledge(query)
    
    def _get_fallback_knowledge(self, query):
        
        data = self.fallback_knowledge
    
        return {
            'answer': data['content'],
            'sources': [{
                'title': source['title'],
                'url': source['url'],
                'snippet': 'Expert therapeutic information',
                'displayUrl': urlparse(source['url']).netloc.replace('www.', ''),
                'source_id': i + 1,
                'favicon': f"https://www.google.com/s2/favicons?domain={urlparse(source['url']).netloc}",
                'published_date': '',
                'type': 'knowledge_base'
            } for i, source in enumerate(data['sources'])],
            'type': 'expert_knowledge',
            'confidence': 0.8
        }   
    
    def search_knowledge(self, query):
        """Main entry point - tries Ollama first"""  # CHANGED
        if self.use_ollama:  # CHANGED
            print("🤖 Using Ollama API for expert knowledge...")  # CHANGED
            return self.search_knowledge_with_ollama(query)  # CHANGED
        else:
            print("📚 Using pre-written expert knowledge...")
            return self._get_fallback_knowledge(query)
        
def initialize_model():
    """Initialize model with comprehensive error handling"""
    global model, tokenizer, use_adapter, model_load_time
    
    # Check if already loaded
    if model is not None and tokenizer is not None:
        print("✅ Model already loaded - using cached version")
        return True
    
    try:
        start_time = time.time()
        print(f"🤖 Loading base model from: {BASE_MODEL_PATH}")
        print("⏳ This happens ONCE - subsequent requests use cached model...")
        
        tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_PATH, trust_remote_code=True)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_PATH,
            trust_remote_code=True,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None,
            low_cpu_mem_usage=True
        )

        try:
            model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
            print("✅ Fine-tuned model loaded successfully")
            use_adapter = True
        except Exception as e:
            print(f"⚠️ Could not load PEFT adapter: {e}")
            model = base_model
            use_adapter = False

        model = model.to(device)
        model.eval()
        
        # Enable optimizations
        if hasattr(torch, 'compile') and torch.cuda.is_available():
            try:
                model = torch.compile(model)
                print("✅ Model compiled for faster inference")
            except:
                print("⚠️ Torch compile not available")
        
        load_duration = time.time() - start_time
        model_load_time = datetime.now()
        
        print(f"✅ Model loaded in {load_duration:.2f}s and CACHED in memory")
        print("✅ All future requests will use this cached model (no reloading!)")
        return True
        
    except Exception as e:
        print(f"❌ Model initialization failed: {e}")
        model = None
        tokenizer = None
        use_adapter = False
        return False

# Initialize all components
print("🚀 Initializing NISRA components...")
model_loaded = initialize_model()

professional_responses = ProfessionalMentalHealthResponses()
web_searcher = EnhancedFreeWebSearcher()
ai_generator = AdvancedAIResponses(model, tokenizer, device) if model_loaded else None
knowledge_base = ExpertKnowledgeBase()

rag_retriever = RagRetriever()
# NEW: Enhanced RAG function with web augmentation
# Replace generate_rag_response() in app.py

def generate_rag_response(user_input, use_web_augmentation=True):
    """
    📚 COMPLETE RAG PIPELINE: 
    - Always returns top 2 CSV results
    - Adds web search ONLY if confidence < 0.6
    """
    try:
        # ============================================
        # PHASE 1: GET TOP 2 CSV RESULTS (ALWAYS)
        # ============================================
        result = rag_retriever.get_enhanced_answer(
            user_input,
            use_web=False,  # We handle web separately based on confidence
            use_reranking=True
        )
        
        # Handle greetings
        if result.get('is_greeting'):
            return {
                'answer': result['answer'],
                'sources': [{
                    'title': '👋 Greeting Response',
                    'url': '#greeting',
                    'snippet': 'Natural conversation greeting',
                    'displayUrl': 'NISRA Greeting',
                    'source_id': 1,
                    'type': 'greeting',
                    'favicon': '/static/icons/greeting.png'
                }],
                'type': 'greeting',
                'confidence': result.get('confidence', 0.95),
                'is_greeting': True
            }
        
        # ============================================
        # PHASE 2: EXTRACT TOP 2 CSV RESULTS
        # ============================================
        all_retrieved = result.get('local_sources', [])
        top_2_csv = all_retrieved[:2]  # ✅ Always take top 2
        confidence = result.get('confidence', 0.0)
        
        print(f"📊 RAG Confidence: {confidence:.2f}")
        print(f"📚 Top 2 CSV results retrieved")
        
        # ============================================
        # PHASE 3: ADD WEB IF CONFIDENCE LOW
        # ============================================
        web_results = []
        if use_web_augmentation and confidence < 0.6:
            print(f"⚠️ Low confidence ({confidence:.2f}) - fetching web results...")
            web_results = rag_retriever.retriever.search_web(user_input, num_results=2)
            print(f"🌐 Found {len(web_results)} web sources")
        else:
            print(f"✅ High confidence ({confidence:.2f}) - skipping web search")
        
        # ============================================
        # PHASE 4: GENERATE ANSWER WITH OLLAMA
        # ============================================
        # Use top 2 CSV for generation (web is just supplementary sources)
        generated = generate_with_retrieved_context(
            user_input, 
            top_2_csv,
            use_ollama=True
        )
        
        # ============================================
        # PHASE 5: FORMAT SOURCES
        # ============================================
        all_sources = []
        
        # 📚 ADD TOP 2 CSV RESULTS (ALWAYS SHOWN)
        for i, src in enumerate(top_2_csv, 1):
                    source_file = src.get('source_file', src.get('metadata', {}).get('source', 'unknown'))
                    
                    # Clean up CSV filename for better display
                    if source_file != 'unknown':
                        # Remove path and .csv extension
                        clean_name = source_file.replace('.csv', '').replace('_', ' ').title()
                    else:
                        clean_name = 'Counseling Database'
                    
                    all_sources.append({
                        'title': f"📁 {clean_name} (Case {i})",  # Show actual CSV name
                        'url': '#local',
                        'snippet': src.get('context', src.get('answer', ''))[:200] + '...',
                        'displayUrl': source_file,  # Full filename
                        'source_id': i,
                        'type': 'rag_local',
                        'confidence': float(src.get('score', 0.0)),
                        'favicon': '📊',  # CSV icon
                        'csv_file': source_file,  # NEW: Explicit CSV filename
                        'match_score': f"{float(src.get('score', 0.0)):.2%}"  # NEW: Show match %
                    })
        
        # 🌐 ADD WEB RESULTS (ONLY IF LOW CONFIDENCE)
        for i, web_src in enumerate(web_results, 3):  # Start from source_id 3
            all_sources.append({
                'title': web_src.get('title', 'Web Source'),
                'url': web_src.get('url', '#'),
                'snippet': web_src.get('snippet', '')[:250] + '...',
                'displayUrl': web_src.get('source', 'web'),
                'source_id': i,
                'type': 'web_augmented',
                'favicon': f"https://www.google.com/s2/favicons?domain={web_src.get('source', 'web')}"
            })
        
        # ============================================
        # PHASE 6: BUILD FINAL ANSWER
        # ============================================
        final_answer = generated['answer']
        
# Add metadata footer with CSV source details
        if generated['generation_method'] == 'ollama_synthesis':
            csv_names = []
            for src in top_2_csv:
                source_file = src.get('source_file', 'unknown')
                if source_file != 'unknown':
                    clean_name = source_file.replace('.csv', '').replace('_', ' ').title()
                    csv_names.append(clean_name)
            
            if csv_names:
                csv_list = ', '.join(csv_names)
                metadata = f"\n\n---\n*✨ Generated using {LLM_MODEL_NAME}\n📚 Sources: {csv_list}"
            else:
                metadata = f"\n\n---\n*✨ Generated using {LLM_MODEL_NAME} with {len(top_2_csv)} CSV counseling cases"
            
            if web_results:
                metadata += f"\n🌐 Additional web sources added (low confidence augmentation)*"
            else:
                metadata += "*"
            
            final_answer += metadata
        
        return {
            'answer': final_answer,
            'sources': all_sources,
            'type': 'rag_with_generation',
            'confidence': confidence,
            'generation_method': generated['generation_method'],
            'csv_count': len(top_2_csv),  # Always 2 (or less if database small)
            'web_count': len(web_results),  # 0 if high confidence, 2 if low
            'web_triggered': len(web_results) > 0
        }
        
    except Exception as e:
        print(f"❌ RAG error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'answer': "I'm experiencing technical difficulties. For crisis support, call 988.",
            'sources': [],
            'type': 'rag_error',
            'confidence': 0.0
        }
def generate_training_response(user_input):
    """🧠 TRAINING MODEL - Fine-tuned AI Response"""
    if ai_generator is None:
        return AdvancedAIResponses(None, None, device).get_fallback_response(user_input)
    return ai_generator.generate_ai_response(user_input)

def generate_professional_response(user_input):
    """🩺 PROFESSIONAL - Evidence-based Clinical Response"""
    return professional_responses.get_professional_response(user_input)

def generate_web_response(user_input):
    """🌐 WEB SEARCH - Perplexity-style search and synthesis"""
    try:
        # Search the web for current information
        search_results = web_searcher.comprehensive_free_search(user_input, 4)
        
        if not search_results or len([r for r in search_results if r['type'] != 'search_suggestion']) == 0:
            return {
                'answer': f"I wasn't able to find current web information about '{user_input}' right now. This could be due to search limitations or connectivity issues. Please try again later or search manually on trusted sites like NIMH.gov, MayoClinic.org, or Psychology Today.",
                'sources': [
                    {
                        'title': 'Search Suggestion',
                        'url': f'https://www.google.com/search?q={quote(user_input + " mental health")}',
                        'snippet': 'Try searching on Google for current information',
                        'displayUrl': 'google.com',
                        'source_id': 1,
                        'favicon': 'https://www.google.com/s2/favicons?domain=google.com',
                        'published_date': '',
                        'type': 'search_suggestion'
                    }
                ],
                'type': 'web_search',
                'confidence': 0.2
            }
        
        # Filter out placeholder results
        valid_results = [r for r in search_results if r['type'] != 'search_suggestion']
        
        # Create comprehensive answer based on search results (like Perplexity does)
        answer_parts = []
        
        # Introduction
        answer_parts.append(f"Based on current web searches about **{user_input}**, here's what I found:")
        
        # Synthesize information from sources
        if len(valid_results) >= 3:
            # We have good sources - create comprehensive response
            answer_parts.append(f"\n**Key Information:**")
            
            # Extract key points from each source
            for i, result in enumerate(valid_results[:3]):
                source_info = result['snippet'][:200]
                answer_parts.append(f"\n• **From {result['displayUrl']}:** {source_info}...")
            
            # Add synthesis
            if 'anxiety' in user_input.lower():
                answer_parts.append(f"\n**Current Understanding:**\nAnxiety is widely recognized as a treatable mental health condition. Current research shows that cognitive-behavioral therapy (CBT), exposure therapy, and certain medications are effective treatments. Self-care techniques like breathing exercises, mindfulness, and regular exercise can also provide significant relief.")
            elif 'depression' in user_input.lower():
                answer_parts.append(f"\n**Current Understanding:**\nDepression is a serious but treatable mental health condition affecting millions worldwide. Current treatments include psychotherapy (especially CBT and IPT), antidepressant medications, and lifestyle interventions. Early intervention and professional support significantly improve outcomes.")
            elif 'therapy' in user_input.lower() or 'counseling' in user_input.lower():
                answer_parts.append(f"\n**Current Understanding:**\nPsychotherapy remains one of the most effective treatments for mental health conditions. Different approaches like CBT, DBT, and psychodynamic therapy are used based on individual needs. Many therapists now offer both in-person and online sessions, making treatment more accessible.")
            elif 'stress' in user_input.lower():
                answer_parts.append(f"\n**Current Understanding:**\nStress management is crucial for mental and physical health. Current research emphasizes the importance of healthy coping mechanisms, work-life balance, social support, and professional help when stress becomes overwhelming or chronic.")
            else:
                answer_parts.append(f"\n**Current Understanding:**\nMental health awareness and treatment options continue to evolve. Professional support, evidence-based treatments, and self-care strategies all play important roles in mental wellness. If you're struggling, reaching out for help is always recommended.")
            
        else:
            # Limited results - provide what we can
            answer_parts.append(f"\n**Available Information:**")
            for result in valid_results:
                answer_parts.append(f"\n• **{result['displayUrl']}:** {result['snippet'][:150]}...")
            
            answer_parts.append(f"\n**Note:** Limited current web results available. For comprehensive information, I recommend checking established mental health websites directly.")
        
        # Add professional recommendation
        answer_parts.append(f"\n**Professional Guidance:**\nFor personalized advice about {user_input}, consider consulting with a mental health professional who can provide individualized assessment and treatment recommendations.")
        
        final_answer = "".join(answer_parts)
        
        return {
            'answer': final_answer,
            'sources': search_results[:4],  # Show up to 4 sources
            'type': 'web_search',
            'confidence': 0.85 if len(valid_results) >= 2 else 0.6
        }
        
    except Exception as e:
        print(f"Web search error: {e}")
        return {
            'answer': f"I encountered an error while searching for current information about '{user_input}'. This might be due to temporary connectivity issues or search service limitations.\n\n**What you can do:**\n• Try rephrasing your question\n• Search manually on trusted sites (NIMH.gov, MayoClinic.org, APA.org)\n• Try again in a few minutes\n\n**For immediate help:** If you're in crisis, contact 988 (Suicide & Crisis Lifeline) or emergency services.",
            'sources': [
                {
                    'title': 'Web Search Error',
                    'url': '#',
                    'snippet': 'Unable to access web search at this time',
                    'displayUrl': 'search-error',
                    'source_id': 1,
                    'favicon': '/static/icons/error.png',
                    'published_date': '',
                    'type': 'system_error'
                }
            ],
            'type': 'web_search',
            'confidence': 0.1
        }

def generate_agentic_response(user_input):
    """🔍 AGENTIC RAG - Expert Knowledge Base"""
    return knowledge_base.search_knowledge(user_input)


# NEW: Optimized Mix function (much faster, no redundancy)
def generate_mixed_response(user_input):
    """
    🔄 SMART MIX - Intelligent combination (no redundancy)
    Strategy: Use RAG as base, only add professional if RAG confidence low
    """
    
    # Get RAG response first (includes local + web)
    rag_resp = generate_rag_response(user_input, use_web_augmentation=True)
    
    # If RAG confidence is high (>0.7), return it with minimal additions
    if rag_resp.get('confidence', 0) > 0.7:
        combined_answer = f"""# Comprehensive Response

{rag_resp['answer']}

---
*This response leverages our counseling knowledge base with {rag_resp['local_count']} similar cases{' and ' + str(rag_resp['web_count']) + ' current web sources' if rag_resp['web_count'] > 0 else ''}.*
"""
        return {
            'answer': combined_answer,
            'sources': rag_resp['sources'],
            'type': 'smart_mix_rag_focused',
            'confidence': rag_resp['confidence']
        }
    
    # If RAG confidence low (<0.7), augment with professional response
    print("🔄 RAG confidence low - adding professional guidance...")
    professional_resp = generate_professional_response(user_input)
    
    combined_answer = f"""# Comprehensive Mental Health Support

## 🩺 Professional Clinical Guidance
{professional_resp['answer'].split('---')[0][:700]}

## 📚 Similar Counseling Cases
{rag_resp['answer'][:600]}

---
*This combines professional AI guidance with counseling knowledge base insights. For personalized care, consult a licensed professional.*
"""
    
    all_sources = professional_resp.get('sources', []) + rag_resp.get('sources', [])
    
    return {
        'answer': combined_answer,
        'sources': all_sources[:8],
        'type': 'smart_mix_augmented',
        'confidence': 0.85
    }


def send_email_code(email, code):
    """Send verification code via FREE Gmail SMTP"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("⚠️ Email not configured - code would be:", code)
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = email
        msg['Subject'] = "NISRA - Password Reset Code"
        
        body = f"""
        <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>Your verification code is: <strong style="font-size: 24px; color: #6366f1;">{code}</strong></p>
            <p>This code expires in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <br>
            <p>Best regards,<br>NISRA Mental Health Team</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Email error: {e}")
        return False

def send_sms_code(phone, code):
    """Send verification code via Twilio FREE trial"""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        print(f"⚠️ SMS not configured - code would be sent to {phone}: {code}")
        return False
    
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            body=f"NISRA Password Reset Code: {code}\nExpires in 10 minutes.",
            from_=TWILIO_PHONE,
            to=phone
        )
        
        print(f"✅ SMS sent to {phone}: {message.sid}")
        return True
    except Exception as e:
        print(f"❌ SMS error: {e}")
        return False

def send_guardian_alert_sms(guardian_phone, user_name):
    """Send crisis alert to guardian via SMS (FREE Twilio)"""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        print(f"⚠️ Would send crisis alert to {guardian_phone} for {user_name}")
        return False
    
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            body=f"🚨 CRISIS ALERT: {user_name} may need immediate support. They expressed concerning thoughts. Please check on them urgently. If emergency, call 911/108.",
            from_=TWILIO_PHONE,
            to=guardian_phone
        )
        
        print(f"✅ Crisis alert sent to guardian {guardian_phone}")
        return True
    except Exception as e:
        print(f"❌ Guardian SMS error: {e}")
        return False

def send_guardian_alert_email(guardian_email, user_name, user_message):
    """Send crisis alert to guardian via Email (FREE Gmail SMTP)"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"⚠️ Would send crisis email alert for {user_name}")
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = guardian_email
        msg['Subject'] = f"🚨 URGENT: Mental Health Crisis Alert for {user_name}"
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="background: #fee; border-left: 4px solid #f00; padding: 15px; margin-bottom: 20px;">
                <h2 style="color: #c00; margin: 0;">🚨 CRISIS ALERT</h2>
            </div>
            
            <p><strong>{user_name}</strong> expressed concerning thoughts that indicate they may need immediate mental health support.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><em>"{user_message[:200]}..."</em></p>
            </div>
            
            <h3>⚡ IMMEDIATE ACTION REQUIRED:</h3>
            <ul>
                <li>Contact {user_name} immediately</li>
                <li>Ask if they're safe right now</li>
                <li>Listen without judgment</li>
                <li>If in immediate danger, call 911 (US) or 108 (India)</li>
            </ul>
            
            <h3>📞 Crisis Resources:</h3>
            <ul>
                <li><strong>988 Suicide & Crisis Lifeline</strong> (US) - Call or Text 988</li>
                <li><strong>KIRAN Mental Health Helpline</strong> (India) - 1800-599-0019</li>
                <li><strong>Emergency Services:</strong> 911 (US) / 108 (India)</li>
            </ul>
            
            <p style="color: #666; margin-top: 30px; font-size: 12px;">
                This alert was generated by NISRA Mental Health Assistant based on AI detection of crisis indicators.
                Sent: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            </p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Crisis email sent to guardian {guardian_email}")
        return True
    except Exception as e:
        print(f"❌ Guardian email error: {e}")
        return False

def detect_suicide_risk(text):
    """Detect suicide/self-harm indicators in user message"""
    text_lower = text.lower()
    
    # High-risk keywords
    high_risk_keywords = [
        'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
        'no reason to live', 'ending it all', 'can\'t go on', 'goodbye forever',
        'not worth living', 'kill me', 'wish i was dead', 'hang myself', 'overdose',
        'shoot myself', 'jump off', 'slit my wrists'
    ]
    
    # Medium-risk keywords
    medium_risk_keywords = [
        'self harm', 'hurt myself', 'cutting', 'worthless', 'hopeless',
        'burden to everyone', 'everyone would be better without me',
        'no point anymore', 'give up', 'can\'t take it anymore'
    ]
    
    # Check high risk
    for keyword in high_risk_keywords:
        if keyword in text_lower:
            return 'high', keyword
    
    # Check medium risk
    for keyword in medium_risk_keywords:
        if keyword in text_lower:
            return 'medium', keyword
    
    return 'low', None

@app.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    """Send password reset code via email or SMS"""
    try:
        data = request.json
        identifier = data.get("identifier", "").strip().lower()
        method = data.get("method", "email")  # 'email' or 'phone'
        
        if not identifier:
            return jsonify({"error": "Email or phone required"}), 400
        
        users = load_users()
        
        # Find user by email or phone
        user = None
        if method == 'email':
            if identifier in users:
                user = users[identifier]
        else:  # phone
            for email, user_data in users.items():
                if user_data.get('your_phone') == identifier:
                    user = user_data
                    break
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Generate 6-digit code
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        
        # Store code with expiration
        reset_codes[identifier] = {
            'code': code,
            'expires': datetime.now() + timedelta(minutes=10),
            'attempts': 0
        }
        
        # Send code
        if method == 'email':
            success = send_email_code(identifier, code)
            message = "Reset code sent to your email"
        else:
            success = send_sms_code(identifier, code)
            message = "Reset code sent to your phone"
        
        if not success:
            # For development/testing - return code in response
            print(f"🔐 RESET CODE for {identifier}: {code}")
            return jsonify({
                "success": True,
                "message": f"{message} (Dev mode: {code})",
                "dev_code": code  # Remove in production!
            })
        
        return jsonify({"success": True, "message": message})
        
    except Exception as e:
        print(f"Forgot password error: {e}")
        return jsonify({"error": "Failed to send reset code"}), 500

@app.route("/auth/reset-password", methods=["POST"])
def reset_password():
    """Verify code and reset password"""
    try:
        data = request.json
        identifier = data.get("identifier", "").strip().lower()
        code = data.get("code", "").strip()
        new_password = data.get("newPassword", "")
        
        if not identifier or not code or not new_password:
            return jsonify({"error": "All fields required"}), 400
        
        # Check if code exists
        if identifier not in reset_codes:
            return jsonify({"error": "Invalid or expired code"}), 400
        
        stored_data = reset_codes[identifier]
        
        # Check expiration
        if datetime.now() > stored_data['expires']:
            del reset_codes[identifier]
            return jsonify({"error": "Code expired"}), 400
        
        # Check attempts (prevent brute force)
        if stored_data['attempts'] >= 5:
            del reset_codes[identifier]
            return jsonify({"error": "Too many attempts"}), 429
        
        # Verify code
        if stored_data['code'] != code:
            reset_codes[identifier]['attempts'] += 1
            return jsonify({"error": "Invalid code"}), 400
        
        # Update password
        users = load_users()
        
        # Find user
        user_email = None
        if identifier in users:
            user_email = identifier
        else:
            for email, user_data in users.items():
                if user_data.get('your_phone') == identifier:
                    user_email = email
                    break
        
        if not user_email:
            return jsonify({"error": "User not found"}), 404
        
        # Update password
        users[user_email]['password'] = generate_password_hash(new_password)
        save_users(users)
        
        # Clear reset code
        del reset_codes[identifier]
        
        return jsonify({"success": True, "message": "Password reset successful"})
        
    except Exception as e:
        print(f"Reset password error: {e}")
        return jsonify({"error": "Password reset failed"}), 500

@app.route("/crisis/alert", methods=["POST"])
def send_crisis_alert():
    """Send crisis alert to guardian"""
    try:
        data = request.json
        user_email = session.get('user_email') or data.get('user_email')
        message = data.get('message', '')
        
        if not user_email:
            return jsonify({"error": "User not authenticated"}), 401
        
        users = load_users()
        if user_email not in users:
            return jsonify({"error": "User not found"}), 404
        
        user = users[user_email]
        guardian_phone = user.get('guardian_phone')
        user_name = user.get('name', 'User')
        
        if not guardian_phone:
            return jsonify({"error": "Guardian phone not found"}), 404
        
        # Send SMS alert
        sms_sent = send_guardian_alert_sms(guardian_phone, user_name)
        
        # Also send email if guardian email available (optional)
        guardian_email = user.get('guardian_email')
        email_sent = False
        if guardian_email:
            email_sent = send_guardian_alert_email(guardian_email, user_name, message)
        
        return jsonify({
            "success": True,
            "sms_sent": sms_sent,
            "email_sent": email_sent,
            "message": "Crisis alert sent to guardian"
        })
        
    except Exception as e:
        print(f"Crisis alert error: {e}")
        return jsonify({"error": "Failed to send alert"}), 500
# Flask Routes
@app.route("/")
def home():
    return jsonify({
        "message": "NISRA Backend API is running",
        "status": "healthy",
        "version": "2.0",
        "endpoints": {
            "chat": "/chat",
            "health": "/health"
        }
    })
@app.route("/auth/signup", methods=["POST"])
def signup():
    try:
        data = request.json
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        name = data.get("name", "")
        gender = data.get("gender", "")
        guardian_phone = data.get("guardianPhone", "")
        your_phone = data.get("yourPhone", "")
        
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
        
        users = load_users()
        
        if email in users:
            return jsonify({"error": "User already exists"}), 409
        
        # Create new user
        users[email] = {
            "email": email,
            "password": generate_password_hash(password),
            "name": name,
            "gender": gender,
            "guardian_phone": guardian_phone,
            "your_phone": your_phone,
            "created_at": datetime.now().isoformat()
        }
        
        save_users(users)
        
        # Set session
        session['user_email'] = email
        
        return jsonify({
            "success": True,
            "user": {
                "email": email,
                "name": name,
                "gender": gender
            }
        })
        
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({"error": "Signup failed"}), 500

@app.route("/auth/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
        
        users = load_users()
        
        if email not in users:
            return jsonify({"error": "User not found"}), 404
        
        user = users[email]
        
        if not check_password_hash(user["password"], password):
            return jsonify({"error": "Invalid password"}), 401
        
        # Set session
        session['user_email'] = email
        
        return jsonify({
            "success": True,
            "user": {
                "email": email,
                "name": user.get("name", ""),
                "gender": user.get("gender", "")
            }
        })
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "Login failed"}), 500

@app.route("/auth/logout", methods=["POST"])
def logout():
    session.pop('user_email', None)
    return jsonify({"success": True})

@app.route("/auth/me", methods=["GET"])
def get_current_user():
    email = session.get('user_email')
    if not email:
        return jsonify({"error": "Not authenticated"}), 401
    
    users = load_users()
    if email not in users:
        return jsonify({"error": "User not found"}), 404
    
    user = users[email]
    return jsonify({
        "user": {
            "email": email,
            "name": user.get("name", ""),
            "gender": user.get("gender", "")
        }
    })

@app.route("/chat/history", methods=["GET"])
def get_chat_history():
    email = session.get('user_email')
    if not email:
        return jsonify({"error": "Not authenticated"}), 401
    
    chats = load_user_chats(email)
    return jsonify({"chats": chats})

@app.route("/chat/save", methods=["POST"])
def save_chat():
    email = session.get('user_email')
    if not email:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.json
    chat_data = {
        "id": data.get("id", int(time.time() * 1000)),
        "messages": data.get("messages", []),
        "timestamp": datetime.now().isoformat()
    }
    
    save_user_chat(email, chat_data)
    return jsonify({"success": True})
# NEW: Updated chat endpoint with RAG mode
@app.route("/chat", methods=["POST"])
def chat():
    try:
        email = session.get('user_email')
        
        data = request.json
        user_message = data.get("message", "").strip()
        response_type = data.get("response_type", "training")
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        print(f"🤖 Processing: {user_message} | Type: {response_type} | User: {email or 'anonymous'}")
        
        # SUICIDE RISK DETECTION (keep existing code)
        risk_level, trigger_word = detect_suicide_risk(user_message)
        
        if risk_level in ['high', 'medium']:
            # ... existing crisis code ...
            pass
        
        # GREETING (keep existing code)
        if user_message.lower().strip() in ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you']:
            # ... existing greeting code ...
            pass
        
        # MAIN RESPONSE ROUTING (UPDATED)
        response = None
        
        if response_type == "training":
            response = generate_training_response(user_message)
        elif response_type == "professional":
            response = generate_professional_response(user_message)
        elif response_type == "web":
            response = generate_web_response(user_message)
        elif response_type == "rag":  # NEW MODE!
            response = generate_rag_response(user_message, use_web_augmentation=True)
        elif response_type == "mix":
            response = generate_mixed_response(user_message)  # NEW - optimized version!
        else:
            response = generate_professional_response(user_message)
        
        if not response:
            response = {
                'answer': "I'm sorry, I'm having trouble generating a response right now. Please try again or select a different response mode. For immediate mental health crisis support, please contact 988 (Suicide & Crisis Lifeline).",
                'sources': [],
                'type': 'error',
                'confidence': 0.0
            }
        
        return jsonify({"response": response})
        
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        return jsonify({
            "error": "Internal server error",
            "response": {
                "answer": "I'm experiencing technical difficulties. Please try again in a moment. For immediate mental health crisis support, please contact 988 (Suicide & Crisis Lifeline).",
                "sources": [],
                "type": "error",
                "confidence": 0.0
            }
        }), 500
@app.route("/health")
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "model_cached": "✅ Cached" if model is not None else "❌ Not loaded",
        "model_load_time": model_load_time.isoformat() if model_load_time else None,
        "tokenizer_loaded": tokenizer is not None,
        "adapter_loaded": use_adapter,
        "device": str(device),
        "ollama_status": {  # CHANGED from gemini_status
            "enabled": ollama_client is not None,  # CHANGED
            "model": LLM_MODEL_NAME,
  # NEW
            "api_url": LLM_API_URL if ollama_client else None,  # NEW
            "used_today": ollama_rate_limiter['request_count_day'],  # CHANGED
            "used_this_minute": ollama_rate_limiter['request_count_minute'],  # CHANGED
            "remaining_today": 10000 - ollama_rate_limiter['request_count_day'],  # CHANGED limits
            "remaining_minute": 60 - ollama_rate_limiter['request_count_minute']  # CHANGED limits
        },
        "features": {
            "training_model": "✅ Available",
            "professional_responses": f"✅ {LLM_MODEL_NAME}" if ollama_client else "✅ Fallback",
  # CHANGED
            "web_search": "✅ Available",
            "agentic_rag": f"✅ {LLM_MODEL_NAME}" if ollama_client else "✅ Fallback",
  # CHANGED
            "mixed_analysis": "✅ Available"
        },
        "timestamp": datetime.now().isoformat()
    })
if __name__ == "__main__":
    print("🤖 NISRA - OLLAMA-ENHANCED VERSION")  # CHANGED
    print("=" * 80)
    print(f"🤖 Model Status: {'✅ Loaded & Cached' if model_loaded else '❌ Using fallbacks'}")
    print(f"🔗 Adapter Status: {'✅ Loaded' if use_adapter else '❌ Base model only'}")
    print(f"💻 Device: {device}")
    print(f"📦 Model Caching: ✅ ENABLED - Loads once, reuses forever!")
    print(f"⚡ Response Caching: ✅ ENABLED - Last 50 responses cached")
    print(f"🕐 Model Loaded: {model_load_time.strftime('%H:%M:%S') if model_load_time else 'Not loaded'}")
    print("=" * 80)
    print("🎯 Available Features:")
    print("   🧠 Training Model: Enhanced AI with better error handling")
    print("   🩺 Professional: Evidence-based clinical responses") 
    print("   🌐 Web Search: Perplexity-style synthesis with 3-4 sources")
    print("   🔍 Agentic RAG: Expert knowledge base")
    print("   🔄 Mixed Sources: Comprehensive combined analysis")
    print("=" * 80)
    print("💡 Performance:")
    print("   • First request: 5-10s (one-time model load)")
    print("   • Next requests: 2-3s (model cached)")
    print("   • Repeat queries: <0.5s (response cached)")
    print("=" * 80)
    print("🌐 Server starting at: http://127.0.0.1:5000/")
    print(f"🔮 Ollama API: {'✅ ACTIVE' if ollama_client else '⚠️ Not configured'}")  # CHANGED
    if ollama_client:  # CHANGED
        print(f"   📊 Model: {LLM_MODEL_NAME}")
  # NEW
        print(f"   🔗 API URL: {LLM_API_URL}")  # NEW
    print("💙 Ready to provide AMAZING mental health support with Ollama!")  # CHANGED
    
    app.run(debug=True, host='127.0.0.1', port=5000, threaded=True, use_reloader=False)