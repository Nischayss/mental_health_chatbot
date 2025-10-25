import os
import requests
from dotenv import load_dotenv

load_dotenv()

def web_search(query):
    api_key = os.environ.get('SEARCH_API_KEY')
    if not api_key:
        return "I don't have access to web search right now, but I'd be happy to help you with mental health questions or other topics I can assist with directly."
    
    try:
        # Using Google Custom Search API
        search_engine_id = "017576662512468239146:omuauf_lfve"
        url = f"https://www.googleapis.com/customsearch/v1"
        
        params = {
            'key': api_key,
            'cx': search_engine_id,
            'q': query,
            'num': 3
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'items' in data and len(data['items']) > 0:
            results = []
            for item in data['items'][:2]:
                snippet = item.get('snippet', '')
                if snippet:
                    results.append(snippet)
            
            if results:
                return " ".join(results)
            else:
                return f"I found some information about '{query}' but couldn't extract clear details. Could you be more specific about what you'd like to know?"
        else:
            return f"I couldn't find specific information about '{query}' right now. Feel free to ask me about mental health topics or try rephrasing your question."
            
    except requests.exceptions.Timeout:
        return "The search is taking too long. Please try asking your question in a different way."
    except Exception as e:
        print(f"Web search error: {e}")
        return f"I'm having trouble searching for information about '{query}' at the moment. Is there anything else I can help you with?"
