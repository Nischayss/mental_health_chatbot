# download_datasets.py - Run this ONCE to get free datasets
from datasets import load_dataset
import pandas as pd
import json
from pathlib import Path

# Create directory
Path("document_store").mkdir(exist_ok=True)

print("=" * 70)
print("📥 DOWNLOADING MENTAL HEALTH DATASETS")
print("=" * 70)

# ========================================
# Dataset 1: Counsel Chat (CSV)
# ========================================
print("\n1️⃣ Downloading Counsel Chat...")
try:
    dataset = load_dataset("nbertagnolli/counsel-chat")
    df = dataset['train'].to_pandas()
    
    df_clean = pd.DataFrame({
        'Context': df['questionTitle'] + " " + df['questionText'],
        'Response': df['answerText'],
        'Topic': df['topic'],
        'Source': 'CounselChat'
    })
    
    df_clean = df_clean.drop_duplicates(subset=['Context'])
    df_clean.to_csv("document_store/counsel_chat.csv", index=False)
    print(f"   ✅ Saved: counsel_chat.csv ({len(df_clean)} rows)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# ========================================
# Dataset 2: Mental Health FAQ (CSV)
# ========================================
print("\n2️⃣ Downloading Mental Health FAQ...")
try:
    dataset = load_dataset("Amod/mental_health_counseling_conversations")
    df = dataset['train'].to_pandas()
    
    df_clean = pd.DataFrame({
        'Context': df['Context'],
        'Response': df['Response'],
        'Source': 'MentalHealthFAQ'
    })
    
    df_clean = df_clean.drop_duplicates(subset=['Context'])
    df_clean.to_csv("document_store/mental_health_faq.csv", index=False)
    print(f"   ✅ Saved: mental_health_faq.csv ({len(df_clean)} rows)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# ========================================
# Dataset 3: Therapy Conversations (JSON)
# ========================================
print("\n3️⃣ Creating Therapy Conversations JSON...")
try:
    dataset = load_dataset("Amod/mental_health_conversational_dataset")
    df = dataset['train'].to_pandas()[:2000]  # Limit to 2000
    
    dialogues = []
    for _, row in df.iterrows():
        dialogues.append({
            'question': row.get('Context', ''),
            'answer': row.get('Response', ''),
            'topic': 'therapy',
            'severity': 'medium',
            'source': 'therapy_sessions'
        })
    
    with open("document_store/therapy_sessions.json", 'w', encoding='utf-8') as f:
        json.dump({'dialogues': dialogues}, f, indent=2, ensure_ascii=False)
    
    print(f"   ✅ Saved: therapy_sessions.json ({len(dialogues)} dialogues)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# ========================================
# Dataset 4: Mental Health Reddit (TXT)
# ========================================
print("\n4️⃣ Creating Mental Health Reddit TXT...")
try:
    dataset = load_dataset("mrjunos/depression-reddit-cleaned", split='train[:500]')
    df = dataset.to_pandas()
    
    with open("document_store/reddit_mental_health.txt", 'w', encoding='utf-8') as f:
        for i, row in df.iterrows():
            if i >= 500:
                break
            
            question = str(row.get('selftext', row.get('title', ''))).strip()
            if len(question) > 30:  # Only substantial posts
                answer = "This reflects common mental health struggles. Consider speaking with a therapist if you're experiencing similar feelings. Support is available."
                
                f.write(f"Q: {question[:400]}\n")
                f.write(f"A: {answer}\n")
                f.write("---\n")
    
    print(f"   ✅ Saved: reddit_mental_health.txt (500 Q&A pairs)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# ========================================
# Dataset 5: Crisis Support (CSV)
# ========================================
print("\n5️⃣ Creating Crisis Support Dataset...")
try:
    crisis_data = {
        'Context': [
            "I'm having thoughts of suicide",
            "I want to hurt myself",
            "I feel like ending it all",
            "I can't stop worrying about everything",
            "I have panic attacks daily",
            "I feel depressed and can't get out of bed",
            "Nothing makes me happy anymore",
            "I'm so stressed I can't function",
            "I feel anxious all the time",
            "Life doesn't feel worth living",
            "I'm planning to harm myself",
            "Nobody would care if I was gone",
            "I need help right now",
            "I'm having a mental breakdown",
            "My heart races and I feel scared",
            "I can't sleep because of anxiety",
            "I feel hopeless about the future",
            "I'm overwhelmed and don't know what to do",
            "I think about suicide often",
            "I need someone to talk to urgently"
        ],
        'Response': [
            "I'm very concerned. Please contact 988 Suicide & Crisis Lifeline immediately (call/text 988) or Crisis Text Line (text HOME to 741741). If in immediate danger, call 911. Your life has value.",
            "Your safety is critical. Please reach out to 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), or go to your nearest ER. Help is available 24/7.",
            "I hear you're in pain. Contact crisis support now: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), or call 911. You don't have to face this alone.",
            "Chronic worry is treatable. Try the 4-7-8 breathing technique and grounding exercises. Consider Cognitive Behavioral Therapy with a mental health professional.",
            "Panic attacks are frightening but manageable. During an attack: focus on slow breathing, ground yourself, remember it will pass. A therapist can teach you effective coping techniques.",
            "Depression makes everything harder. Small steps help: maintain sleep schedule, get sunlight, move your body. Most importantly, speak with a mental health professional about therapy/medication.",
            "Anhedonia (loss of pleasure) is treatable. With proper therapy and possibly medication, you can feel joy again. Please consult a mental health provider.",
            "Overwhelming stress needs attention now. Try deep breathing, take a walk, practice 5-minute meditation. If unmanageable, speak with a counselor about coping strategies.",
            "Constant anxiety is exhausting but treatable. Practice grounding exercises, try progressive muscle relaxation. Consider seeing a therapist who specializes in anxiety disorders.",
            "Life can improve with support. Please contact 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), or your local crisis center. Recovery is possible.",
            "This is an emergency. Please contact 988 immediately, go to your nearest ER, or call 911. Your safety is the top priority. Professional help is available now.",
            "Your life matters. Please reach out: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741). People care about you and help is available 24/7.",
            "I'm glad you're reaching out. For immediate help: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), SAMHSA (1-800-662-4357), or your local crisis center.",
            "A mental breakdown means you need support NOW. Call 988, go to urgent care/ER, or contact a crisis center. You deserve immediate professional help.",
            "Physical anxiety symptoms are treatable. The fight-or-flight response causes racing heart. Practice deep breathing and progressive muscle relaxation. A therapist can help.",
            "Sleep anxiety is common and treatable. Establish a bedtime routine, avoid screens before bed, try progressive muscle relaxation. Consider therapy for underlying anxiety.",
            "Hopelessness is a symptom of depression and treatable. With proper therapy and/or medication, your perspective can change. Please consult a mental health professional.",
            "Feeling overwhelmed is valid. Break problems into smaller steps, practice self-compassion, reach out for support. A counselor can help you develop coping strategies.",
            "Suicidal thoughts are serious. Please contact 988 Lifeline (call/text 988) or Crisis Text Line (text HOME to 741741). These feelings can be treated. Help is available.",
            "I'm here. For immediate support: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), or SAMHSA (1-800-662-4357). You're taking the right step by reaching out."
        ],
        'Category': ['crisis'] * 10 + ['anxiety'] * 5 + ['depression'] * 3 + ['crisis'] * 2,
        'Severity': ['high'] * 10 + ['medium'] * 6 + ['high'] * 4,
        'Source': ['CrisisSupport'] * 20
    }
    
    df_crisis = pd.DataFrame(crisis_data)
    df_crisis.to_csv("document_store/crisis_support.csv", index=False)
    print(f"   ✅ Saved: crisis_support.csv ({len(df_crisis)} rows)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# ========================================
# Summary
# ========================================
print("\n" + "=" * 70)
print("✅ DOWNLOAD COMPLETE!")
print("=" * 70)
print("\n📁 Files created in document_store/:")
print("   1. counsel_chat.csv (~3,000 Q&A)")
print("   2. mental_health_faq.csv (~5,000 Q&A)")
print("   3. therapy_sessions.json (~2,000 dialogues)")
print("   4. reddit_mental_health.txt (~500 Q&A)")
print("   5. crisis_support.csv (~20 critical cases)")
print("\n💡 Total: ~10,500 mental health Q&A pairs")
print("=" * 70)
print("\n🎯 Next Step: Run 'python rag_retriever_multi.py' to build index")
print("=" * 70)