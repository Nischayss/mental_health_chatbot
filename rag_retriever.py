# rag_retriever.py - COMPLETE WITH GREETING DETECTION (CLEAN VERSION)
import faiss
import numpy as np
import os
import pandas as pd
import pickle
from pathlib import Path
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote
import time
import random
import json

class MultiFileRAGRetriever:
    """
    Production-Ready RAG supporting CSV, JSON, TXT files
    - Hybrid search (semantic FAISS + keyword BM25)
    - Cross-encoder re-ranking
    - Web augmentation
    - Multiple data sources
    - Greeting detection for natural conversation
    """
    
    def __init__(self, data_sources, index_dir="./faiss_index"):
        if isinstance(data_sources, str):
            self.data_sources = [data_sources]
        else:
            self.data_sources = data_sources
        
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(exist_ok=True)
        
        self.index_file = self.index_dir / "multi_rag.index"
        self.cache_file = self.index_dir / "multi_rag_cache.pkl"
        self.bm25_file = self.index_dir / "multi_rag_bm25.pkl"
        
        self.embedding_model = None
        self.reranker = None
        self.bm25 = None
        
        self.docs = []
        self.answers = []
        self.metadata = []
        self.index = None
        
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        ]
        
        self._load_or_build_index()
    
    def _load_embedding_model(self):
        if self.embedding_model is None:
            print("📄 Loading SentenceTransformer (all-mpnet-base-v2)...")
            self.embedding_model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
            print("✅ Embedding model loaded")
    
    def _load_reranker(self):
        if self.reranker is None:
            print("📄 Loading re-ranker...")
            self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            print("✅ Re-ranker loaded")
    
    def _load_data_from_file(self, file_path):
        file_path = Path(file_path)
        
        if not file_path.exists():
            print(f"⚠️ File not found: {file_path}")
            return [], [], []
        
        ext = file_path.suffix.lower()
        print(f"📄 Loading {file_path.name}...")
        
        try:
            if ext == '.csv':
                df = pd.read_csv(file_path)
                
                context_col = None
                response_col = None
                
                for col in df.columns:
                    col_lower = col.lower()
                    if col_lower in ['context', 'question', 'query', 'input', 'questiontext']:
                        context_col = col
                    if col_lower in ['response', 'answer', 'output', 'reply', 'answertext']:
                        response_col = col
                
                if not context_col or not response_col:
                    print(f"   ❌ Columns not found. Available: {list(df.columns)}")
                    return [], [], []
                
                questions = df[context_col].astype(str).tolist()
                answers = df[response_col].astype(str).tolist()
                
                metadata_cols = [c for c in df.columns if c not in [context_col, response_col]]
                if metadata_cols:
                    metadata = df[metadata_cols].to_dict('records')
                else:
                    metadata = [{'source': file_path.name}] * len(questions)
                
                print(f"   ✅ Loaded {len(questions)} Q&A pairs from CSV")
                return questions, answers, metadata
            
            elif ext == '.json':
                with open(file_path, encoding='utf-8') as f:
                    data = json.load(f)
                
                questions = []
                answers = []
                metadata = []
                
                if isinstance(data, list):
                    for item in data:
                        q = item.get('question', item.get('context', item.get('query', '')))
                        a = item.get('answer', item.get('response', item.get('reply', '')))
                        if q and a:
                            questions.append(str(q))
                            answers.append(str(a))
                            metadata.append({'source': file_path.name, **item})
                
                elif 'dialogues' in data:
                    for item in data['dialogues']:
                        q = item.get('question', item.get('context', ''))
                        a = item.get('answer', item.get('response', ''))
                        if q and a:
                            questions.append(str(q))
                            answers.append(str(a))
                            metadata.append({'source': file_path.name, **item})
                
                elif 'data' in data:
                    for item in data['data']:
                        q = item.get('question', item.get('context', ''))
                        a = item.get('answer', item.get('response', ''))
                        if q and a:
                            questions.append(str(q))
                            answers.append(str(a))
                            metadata.append({'source': file_path.name, **item})
                
                else:
                    print(f"   ❌ Unknown JSON format")
                    return [], [], []
                
                print(f"   ✅ Loaded {len(questions)} Q&A pairs from JSON")
                return questions, answers, metadata
            
            elif ext == '.txt':
                with open(file_path, encoding='utf-8') as f:
                    content = f.read()
                
                pairs = content.split('---')
                questions = []
                answers = []
                
                for pair in pairs:
                    pair = pair.strip()
                    if not pair:
                        continue
                    
                    if 'Q:' in pair and 'A:' in pair:
                        parts = pair.split('A:', 1)
                        q = parts[0].replace('Q:', '').strip()
                        a = parts[1].strip()
                        
                        if q and a and len(q) > 10:
                            questions.append(q)
                            answers.append(a)
                
                metadata = [{'source': file_path.name}] * len(questions)
                print(f"   ✅ Loaded {len(questions)} Q&A pairs from TXT")
                return questions, answers, metadata
            
            else:
                print(f"   ❌ Unsupported format: {ext}")
                return [], [], []
        
        except Exception as e:
            print(f"   ❌ Error loading {file_path.name}: {e}")
            return [], [], []
    
    def _load_or_build_index(self):
        if self.index_file.exists() and self.cache_file.exists():
            try:
                print("⚡ Loading cached multi-file RAG index...")
                
                self.index = faiss.read_index(str(self.index_file))
                
                with open(self.cache_file, 'rb') as f:
                    cache = pickle.load(f)
                    self.docs = cache['docs']
                    self.answers = cache['answers']
                    self.metadata = cache.get('metadata', [{}] * len(self.docs))
                    cached_sources = cache.get('sources', [])
                
                if self.bm25_file.exists():
                    with open(self.bm25_file, 'rb') as f:
                        self.bm25 = pickle.load(f)
                
                print(f"✅ Loaded {len(self.docs)} dialogues from {len(cached_sources)} file(s)")
                
                self._load_embedding_model()
                return
                
            except Exception as e:
                print(f"⚠️ Cache load failed: {e}")
                print("🔨 Rebuilding index...")
        
        self._build_new_index()
    
    def _build_new_index(self):
        print("🔨 Building multi-source RAG index...")
        print(f"📚 Processing {len(self.data_sources)} file(s)...")
        
        all_questions = []
        all_answers = []
        all_metadata = []
        
        for source in self.data_sources:
            questions, answers, metadata = self._load_data_from_file(source)
            all_questions.extend(questions)
            all_answers.extend(answers)
            all_metadata.extend(metadata)
        
        if not all_questions:
            print("❌ No data loaded - creating fallback")
            self._create_fallback()
            return
        
        print(f"\n📊 Total loaded: {len(all_questions)} Q&A pairs")
        
        self.docs = all_questions
        self.answers = all_answers
        self.metadata = all_metadata
        
        self._load_embedding_model()
        
        print(f"📄 Generating embeddings (this may take 2-5 minutes)...")
        embeddings = self.embedding_model.encode(
            self.docs[:15000],
            batch_size=32,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        
        print("📄 Building FAISS semantic search index...")
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings.astype('float32'))
        print("✅ FAISS index built")
        
        print("📄 Building BM25 keyword search index...")
        tokenized_docs = [doc.lower().split() for doc in self.docs[:15000]]
        self.bm25 = BM25Okapi(tokenized_docs)
        print("✅ BM25 index built")
        
        self._save_index()
        
        print(f"\n✅ Multi-source RAG built successfully!")
    
    def _save_index(self):
        try:
            faiss.write_index(self.index, str(self.index_file))
            
            with open(self.cache_file, 'wb') as f:
                pickle.dump({
                    'docs': self.docs,
                    'answers': self.answers,
                    'metadata': self.metadata,
                    'sources': self.data_sources,
                    'version': '3.0'
                }, f)
            
            with open(self.bm25_file, 'wb') as f:
                pickle.dump(self.bm25, f)
            
            print(f"💾 Index saved to {self.index_dir}")
            
        except Exception as e:
            print(f"⚠️ Save failed: {e}")
    
    def _create_fallback(self):
        print("⚠️ Creating fallback index")
        self.docs = ["Mental health support is available"]
        self.answers = ["Please consult a licensed mental health professional for personalized care."]
        self.metadata = [{'source': 'fallback'}]
        
        self._load_embedding_model()
        embeddings = self.embedding_model.encode(self.docs, convert_to_numpy=True)
        self.index = faiss.IndexFlatL2(embeddings.shape[1])
        self.index.add(embeddings.astype('float32'))
        
        self.bm25 = BM25Okapi([doc.lower().split() for doc in self.docs])
    
    # ========================================================================
    # GREETING DETECTION METHODS
    # ========================================================================
    
    def _is_greeting(self, query):
        query_lower = query.lower().strip()
        query_clean = query_lower.rstrip('!?.,:;')
        
        simple_greetings = {
            'hi', 'hello', 'hey', 'hiya', 'howdy', 'yo', 'sup', 
            'wassup', 'greetings', 'hola', 'namaste', 'hi there'
        }
        
        time_greetings = {
            'good morning', 'good afternoon', 'good evening', 'good night',
            'morning', 'afternoon', 'evening'
        }
        
        check_ins = {
            'how are you', "how're you", 'how are u', 'how r u',
            "what's up", 'whats up', "what's going on", 'whats going on',
            "how's it going", 'hows it going', "how's everything",
            'how are you doing', 'how have you been', "how's your day",
            "how's life", 'how do you do'
        }
        
        gratitude = {
            'thank you', 'thanks', 'thank u', 'thx', 'thanx',
            'thanks a lot', 'thank you so much', 'thanks so much',
            'i appreciate it', 'appreciate it', "you're helpful",
            'that helped', 'that was helpful'
        }
        
        farewells = {
            'bye', 'goodbye', 'good bye', 'see you', 'see ya',
            'see you later', 'talk to you later', 'ttyl',
            'gotta go', 'got to go', 'i have to go', 'have to go',
            'catch you later', 'take care', 'later', 'cya'
        }
        
        casual = {
            'okay', 'ok', 'k', 'alright', 'cool', 'nice',
            'great', 'awesome', 'sounds good', 'got it',
            "i'm fine", "i'm okay", "i'm good", "i'm alright",
            'fine', 'not much', 'nothing much', 'nm',
            'just checking in', 'just saying hi'
        }
        
        system_questions = {
            'testing', 'test', 'are you there', 'are you available',
            'are you real', 'are you a bot', 'are you human',
            'who are you', 'what are you', "what's your name",
            'whats your name', 'tell me about yourself'
        }
        
        introductions = {
            "i'm new here", 'im new here', 'new here', 'first time here',
            'first time', 'what can you do', 'what do you do',
            'can you help me', 'can you help', 'i need help',
            'i need someone to talk to', 'can we talk'
        }
        
        all_greeting_phrases = (
            simple_greetings | time_greetings | check_ins | 
            gratitude | farewells | casual | 
            system_questions | introductions
        )
        
        if query_clean in all_greeting_phrases:
            return True
        
        for phrase in all_greeting_phrases:
            if query_clean.startswith(phrase):
                return True
        
        word_count = len(query_clean.split())
        if word_count <= 3:
            greeting_keywords = {
                'hi', 'hey', 'hello', 'thanks', 'bye', 'ok', 
                'yeah', 'yes', 'no', 'sure', 'fine', 'good'
            }
            words = set(query_clean.split())
            if words & greeting_keywords:
                return True
        
        return False
    
    def _get_greeting_response(self, query):
        query_lower = query.lower().strip().rstrip('!?.,:;')
        
        greeting_search_map = {
            'hi': 'hello greeting introduction welcome mental health support',
            'hello': 'hello greeting welcome mental health counseling',
            'hey': 'hey greeting casual hello mental health',
            'how are you': 'how are you feeling mental health wellbeing check-in',
            "what's up": 'what is up how are you feeling mental state',
            'thank you': 'thank you gratitude appreciation therapy progress',
            'thanks': 'thanks gratitude appreciation mental health support',
            'bye': 'goodbye farewell ending session closure mental health',
            'goodbye': 'goodbye farewell ending therapy session',
            "i'm fine": 'i am fine wellbeing mental health check',
            "i'm new here": 'new here first time introduction mental health support',
            'what can you do': 'capabilities mental health support help available',
            'can you help me': 'help support mental health assistance available',
            'who are you': 'who are you introduction mental health support'
        }
        
        search_query = None
        for key, value in greeting_search_map.items():
            if key in query_lower:
                search_query = value
                break
        
        if not search_query:
            search_query = 'greeting hello introduction mental health support'
        
        try:
            results = self.retrieve_hybrid(search_query, topk=1, alpha=0.85)
            
            if results and len(results) > 0 and results[0]['score'] > 0.25:
                best_match = results[0]
                return {
                    'answer': best_match['answer'],
                    'local_sources': results,
                    'web_sources': [],
                    'confidence': 0.95,
                    'type': 'greeting',
                    'is_greeting': True
                }
        except Exception as e:
            print(f"⚠️ Greeting search error: {e}")
        
        fallback_responses = {
            'hi': "Hello! I'm NISRA, your mental health support companion. I'm here to listen without judgment. How are you feeling today?",
            'hello': "Hi there! Welcome to a safe space for mental health support. How can I help you today?",
            'how are you': "I'm here and ready to support you. More importantly, how are YOU feeling?",
            'thank you': "You're very welcome! I'm here 24/7 whenever you need support. Is there anything else you'd like to talk about?",
            'bye': "Take care of yourself! Remember, I'm here 24/7 whenever you need support. 💙",
            'goodbye': "Goodbye! I'm here whenever you need me. Take care! 💙",
            "i'm fine": "I'm glad you're doing fine! If there's anything you'd like to talk about, I'm here.",
            "i'm new here": "Welcome! I'm NISRA, a mental health support companion. This is a safe space to discuss anything. What brings you here?",
            'what can you do': "I can provide mental health support, coping strategies, information, and a listening ear. I'm here 24/7 to help. What do you need?",
            'can you help me': "Absolutely! I'm here to help. Please tell me what's going on.",
            'who are you': "I'm NISRA, a mental health support companion. I'm here to listen and help. What can I do for you today?"
        }
        
        for key, response in fallback_responses.items():
            if key in query_lower:
                return {
                    'answer': response,
                    'local_sources': [],
                    'web_sources': [],
                    'confidence': 0.90,
                    'type': 'greeting',
                    'is_greeting': True
                }
        
        return {
            'answer': "Hello! I'm NISRA, your mental health support companion. I'm here to listen and help. How are you feeling today?",
            'local_sources': [],
            'web_sources': [],
            'confidence': 0.85,
            'type': 'greeting',
            'is_greeting': True
        }
    
    # ========================================================================
    # RAG RETRIEVAL METHODS
    # ========================================================================
    
    def retrieve_hybrid(self, query, topk=5, alpha=0.7):
        query_emb = self.embedding_model.encode([query], convert_to_numpy=True)
        faiss_scores, faiss_idx = self.index.search(
            query_emb.astype('float32'), 
            min(topk * 3, len(self.docs))
        )
        
        tokenized_query = query.lower().split()
        bm25_scores = self.bm25.get_scores(tokenized_query)
        
        combined = {}
        
        max_dist = faiss_scores[0][0] if len(faiss_scores[0]) > 0 else 1
        for i, idx in enumerate(faiss_idx[0]):
            if idx < len(self.answers):
                similarity = 1 / (1 + faiss_scores[0][i] / max_dist)
                combined[int(idx)] = alpha * similarity
        
        max_bm25 = np.max(bm25_scores) if np.max(bm25_scores) > 0 else 1
        for idx, score in enumerate(bm25_scores):
            if idx < len(self.answers):
                normalized = score / max_bm25
                if idx in combined:
                    combined[idx] += (1 - alpha) * normalized
                else:
                    combined[idx] = (1 - alpha) * normalized
        
        sorted_results = sorted(combined.items(), key=lambda x: x[1], reverse=True)
        
        results = []
        for idx, score in sorted_results[:topk]:
            metadata = self.metadata[idx] if idx < len(self.metadata) else {}
            source_file = metadata.get('source', 'unknown')
            
            results.append({
                'answer': self.answers[idx],
                'context': self.docs[idx],
                'score': float(score),
                'metadata': metadata,
                'source_file': source_file  # ✅ This should already be working
            })
        
        return results
    
    def retrieve_with_reranking(self, query, topk=3):
        candidates = self.retrieve_hybrid(query, topk=topk * 3)
        
        if len(candidates) <= topk:
            return candidates
        
        self._load_reranker()
        
        pairs = [[query, c['answer']] for c in candidates]
        rerank_scores = self.reranker.predict(pairs)
        
        for i, candidate in enumerate(candidates):
            candidate['rerank_score'] = float(rerank_scores[i])
            candidate['original_score'] = candidate['score']
            candidate['score'] = float(rerank_scores[i])
        
        candidates.sort(key=lambda x: x['rerank_score'], reverse=True)
        
        return candidates[:topk]
    
    def search_web(self, query, num_results=2):
        try:
            time.sleep(0.5)
            search_url = f"https://html.duckduckgo.com/html/?q={quote(query + ' mental health')}"
            headers = {'User-Agent': random.choice(self.user_agents)}
            
            response = requests.get(search_url, headers=headers, timeout=10)
            if response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.content, 'html.parser')
            results = []
            
            for result in soup.find_all('div', class_='result')[:num_results]:
                try:
                    title_elem = result.find('a', class_='result__a')
                    snippet_elem = result.find('a', class_='result__snippet')
                    
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        url = title_elem.get('href', '')
                        snippet = snippet_elem.get_text(strip=True) if snippet_elem else ''
                        
                        if any(d in url.lower() for d in ['facebook', 'twitter', 'instagram']):
                            continue
                        
                        results.append({
                            'title': title[:120],
                            'url': url,
                            'snippet': snippet[:300],
                            'source': 'web'
                        })
                except:
                    continue
            
            return results
        except:
            return []
    
    def get_augmented_answer(self, query, use_web=True, use_reranking=True):
        """Main method with greeting detection"""
        
        # Check if greeting first
        if self._is_greeting(query):
            print("👋 Detected greeting - using greeting handler...")
            greeting_response = self._get_greeting_response(query)
            if greeting_response:
                return greeting_response
        
        # Regular RAG for mental health queries
        if use_reranking:
            local_results = self.retrieve_with_reranking(query, topk=3)
        else:
            local_results = self.retrieve_hybrid(query, topk=3)
        
        avg_score = np.mean([r['score'] for r in local_results]) if local_results else 0
        confidence = float(avg_score)
        
        web_results = []
        if use_web and confidence < 0.6:
            print("🔍 Low local confidence - searching web...")
            web_results = self.search_web(query, num_results=2)
        
        answer_parts = []
        
        if local_results:
            answer_parts.append(f"## 📚 From Knowledge Base:\n")
            for i, result in enumerate(local_results, 1):
                source_file = result.get('source_file', 'unknown')
                answer_text = result['answer'][:400]
                answer_parts.append(f"**Case {i}** (from {source_file}):\n{answer_text}...\n")
        
        if web_results:
            answer_parts.append(f"\n## 🌐 Current Web Information:\n")
            for result in web_results:
                answer_parts.append(f"- **{result['title']}**: {result['snippet'][:200]}...\n")
        
        answer_parts.append(f"\n## 💡 Recommendation:\n")
        answer_parts.append(
            f"This response combines evidence from {len(local_results)} similar cases in our knowledge base"
            + (f" and {len(web_results)} current web sources" if web_results else "")
            + ". For personalized support, please consult a licensed mental health professional."
        )
        
        final_answer = "\n".join(answer_parts)
        
        return {
            'answer': final_answer,
            'local_sources': local_results,
            'web_sources': web_results,
            'confidence': confidence,
            'type': 'rag_augmented',
            'is_greeting': False
        }


class RagRetriever:
    """Wrapper for app.py compatibility"""
    def __init__(self):
        data_sources = [
            r"D:\mental_health_chatbot\document_store\mental_health_dialogue_train.csv",
            r"D:\mental_health_chatbot\document_store\counsel_chat.csv",
            r"D:\mental_health_chatbot\document_store\mental_health_faq.csv",
            r"D:\mental_health_chatbot\document_store\therapy_sessions.json",
            r"D:\mental_health_chatbot\document_store\greetings_conversation.csv",  # ✅ ADDED
            r"D:\mental_health_chatbot\document_store\crisis_support.csv",
        ]
        
        existing_sources = [s for s in data_sources if Path(s).exists()]
        
        if not existing_sources:
            print("⚠️ No data sources found! Using fallback.")
            existing_sources = data_sources
        
        self.retriever = MultiFileRAGRetriever(existing_sources)
    
    def get_answer(self, user_query, use_web=True):
        result = self.retriever.get_augmented_answer(user_query, use_web=use_web)
        
        answers_with_scores = [
            (source['answer'], source['score']) 
            for source in result['local_sources']
        ]
        
        return answers_with_scores, True
    
    def get_enhanced_answer(self, user_query, use_web=True, use_reranking=True):
        return self.retriever.get_augmented_answer(
            user_query, 
            use_web=use_web, 
            use_reranking=use_reranking
        )


if __name__ == "__main__":
    print("=" * 70)
    print("🚀 Multi-File RAG System Test with Greeting Detection")
    print("=" * 70)
    
    retriever = RagRetriever()
    
    test_queries = [
        "Hi!",
        "Hello there",
        "How are you?",
        "Thank you so much",
        "Bye",
        "Good morning",
        "I'm feeling anxious",
        "How do I cope with depression?",
        "I can't sleep at night",
        "What is cognitive behavioral therapy?"
    ]
    
    print(f"\n🧪 Testing {len(test_queries)} queries...\n")
    
    for query in test_queries:
        print(f"🔍 Query: '{query}'")
        print("-" * 70)
        
        result = retriever.get_enhanced_answer(query, use_web=False)
        
        if result.get('is_greeting'):
            print("✅ GREETING DETECTED")
            print(f"   Type: {result.get('type', 'unknown')}")
            print(f"   Confidence: {result['confidence']:.2f}")
            print(f"   Response: {result['answer'][:150]}...")
        else:
            print("🧠 MENTAL HEALTH QUERY")
            print(f"   Type: {result.get('type', 'unknown')}")
            print(f"   Confidence: {result['confidence']:.2f}")
            print(f"   Local sources: {len(result['local_sources'])}")
            print(f"   Web sources: {len(result['web_sources'])}")
            
            # Show first source snippet
            if result['local_sources']:
                first = result['local_sources'][0]
                print(f"   Best match: {first['answer'][:100]}...")
        
        print("=" * 70)
        print()
    
    print("\n✅ Test complete!")
    print("\n📊 Summary:")
    print("   - Greetings should show '✅ GREETING DETECTED'")
    print("   - Mental health queries should show '🧠 MENTAL HEALTH QUERY'")
    print("   - If all detections are correct, greeting system is working!")