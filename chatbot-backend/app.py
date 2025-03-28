import os
import traceback
from functools import lru_cache
from datetime import datetime

from flask import Flask
from flask_socketio import SocketIO, emit
from pymongo import MongoClient

from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from openai import OpenAI

from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Lightweight connection management
mongo_client = MongoClient(os.environ.get('MONGO_URI'), maxPoolSize=10)
db = mongo_client.get_default_database()
chats_collection = db.chats

# Use a more lightweight embedding model
@lru_cache(maxsize=128)
def get_huggingface_embeddings(text, model_name="sentence-transformers/all-mpnet-base-v2"):
    model = SentenceTransformer(model_name)
    return model.encode(text)

# Singleton pattern for Pinecone and OpenRouter clients
class ClientManager:
    _pinecone_instance = None
    _openrouter_instance = None

    @classmethod
    def get_pinecone_client(cls):
        if not cls._pinecone_instance:
            cls._pinecone_instance = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
        return cls._pinecone_instance

    @classmethod
    def get_openrouter_client(cls):
        if not cls._openrouter_instance:
            cls._openrouter_instance = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=os.environ.get("OPENROUTER_API_KEY")
            )
        return cls._openrouter_instance



def strip_markdown(text):
    """
    Remove markdown-like formatting and return plain text.
    """
    # Remove angle brackets at start of lines
    text = text.replace('<think>', '').replace('</think>', '')
    
    # Remove markdown-style links
    import re
    text = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'\1', text)
    
    # Strip any remaining HTML-like tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text.strip()

def perform_rag(query, model="deepseek/deepseek-r1-distill-llama-70b:free"):
    try:
        pinecone_index = ClientManager.get_pinecone_client().Index("codebase-rag")
        openrouter_client = ClientManager.get_openrouter_client()

        raw_query_embedding = get_huggingface_embeddings(query)
        top_matches = pinecone_index.query(
            vector=raw_query_embedding.tolist(),
            top_k=3,
            include_metadata=True,
            namespace=os.environ.get("GITHUB_REPO_URL")
        )
        
        contexts = [item['metadata']['text'] for item in top_matches['matches']]
        augmented_query = "\n" + "\n\n-------\n\n".join(contexts[:10]) + \
                          "\n-------\n\n\n\n\nMY QUESTION:\n" + query

        system_prompt = """
            - You have ultimate knowledge over this codebase.
            - You are an AI agent that helps users navigate the website to  help them do what they need to do.
            - You do not answer any questions about the backend, about any configuration file, or anything that has nothing to do with a functionality from the website.
            - A good user request would be for example how can I create a channel or how can I log in.
            - A bad user request would be how was this component of the website built, or what technology was used in this part of the website.
            - Also do not release any sensitive information. Do not hallucinate. Answer the user's question by following the previous instructions. Consider the entire context provided to answer the user's question.
            - If any invasive questions are asked, ONLY reply that this information cannot be given out due to privacy, and security reasons.
            - You should not even give out one word of information on tech stack or anything else. Make all answers clear, and concise and easy to understand for the user.
            - Also, make the answers straight to the point as well as be polite, and navigate the user properly. 
        """

        llm_response = openrouter_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": augmented_query}
            ]
        )
        reponse_content = llm_response.choices[0].message.content
        return strip_markdown(reponse_content)
    except Exception as e:
        print("Error in perform_rag:", e)
        traceback.print_exc()
        return "Sorry, I encountered an error processing your request."

@socketio.on('chat_message')
def handle_chat_message(data):
    user_message = data.get('message')

    if not user_message:
        emit('chat_response', {'response': 'Invalid message.'})
        return

    chats_collection.insert_one({
        'sender': 'user',
        'message': user_message,
        'timestamp': datetime.now()
    })

    response_text = perform_rag(user_message)

    print("Response:", response_text)

    chats_collection.insert_one({
        'sender': 'bot',
        'message': response_text,
        'timestamp': datetime.now()
    })

    emit('chat_response', {'response': response_text})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)