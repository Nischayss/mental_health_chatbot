import faiss
import numpy as np
import os
import pandas as pd
from transformers import AutoTokenizer, AutoModel
import torch

class DocumentIndexer:
    def __init__(self, csv_path, index_file):
        self.csv_path = csv_path
        self.index_file = index_file
        self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
        self.model = AutoModel.from_pretrained('bert-base-uncased')
        self.model.eval()
        self.docs, self.answers, self.index = self.load_or_index()

    def load_or_index(self):
        if os.path.exists(self.index_file) and os.path.exists(self.csv_path):
            print("Loading existing FAISS index...")
            df = pd.read_csv(self.csv_path)
            docs = df['questionText'].tolist()
            answers = df['answerText'].tolist()
            index = faiss.read_index(self.index_file)
            return docs, answers, index
        else:
            print("Creating new FAISS index...")
            if os.path.exists(self.csv_path):
                df = pd.read_csv(self.csv_path)
                docs = df['questionText'].tolist()
                answers = df['answerText'].tolist()
                embeddings = self.embed_texts(docs)
                index = faiss.IndexFlatL2(embeddings.shape[1])
                index.add(embeddings)
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(self.index_file), exist_ok=True)
                faiss.write_index(index, self.index_file)
                return docs, answers, index
            else:
                # Fallback if no CSV
                docs = ["Mental health is important"]
                answers = ["Please consult a professional for mental health support"]
                embeddings = self.embed_texts(docs)
                index = faiss.IndexFlatL2(embeddings.shape[1])
                index.add(embeddings)
                return docs, answers, index

    def embed_texts(self, texts):
        all_embeddings = []
        with torch.no_grad():
            for text in texts[:100]:  # Limit to avoid memory issues
                inputs = self.tokenizer(str(text), return_tensors="pt", truncation=True, max_length=512)
                outputs = self.model(**inputs)
                emb = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()
                all_embeddings.append(emb)
        return np.stack(all_embeddings)

    def retrieve(self, query, topk=1):
        with torch.no_grad():
            inputs = self.tokenizer(query, return_tensors="pt", truncation=True, max_length=512)
            outputs = self.model(**inputs)
            query_emb = outputs.last_hidden_state.mean(dim=1).numpy()
        
        score, idx = self.index.search(query_emb, topk)
        if score[0][0] < 1.0:  # Good similarity
            return self.answers[idx[0][0]], True
        return "", False

class RagRetriever:
    def __init__(self):
        csv_path = "D:\mental_health_chatbot\document_store\20200325_counsel_chat.csv"  # Your CSV file name
        index_path = './faiss_index/docs.index'
        self.indexer = DocumentIndexer(csv_path, index_path)

    def get_answer(self, user_query):
        return self.indexer.retrieve(user_query, topk=1)
