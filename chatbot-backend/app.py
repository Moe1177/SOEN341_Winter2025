import os
import traceback
from functools import lru_cache
from datetime import datetime

from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from pymongo import MongoClient

from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from openai import OpenAI

from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

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

def perform_rag(query, model="deepseek/deepseek-r1:free"):
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

        SYSTEM_PROMPT = """
            You have complete knowledge of this website’s functionality.
            Your role is to assist users in navigating and using the website.

            Rules:
            - DO NOT answer questions about the backend, configuration files, or technologies used.
            - Only respond to functional requests, such as "How can I create a channel?" or "How do I log in?"
            - Reject questions about implementation details, tech stack, or internal components.
            - Do not provide or infer any sensitive information. Do not hallucinate.
            - If asked invasive questions, ONLY respond that this information cannot be shared for privacy and security reasons.
            - Keep answers clear, concise, polite, and to the point while guiding users effectively.
        """

        llm_response = openrouter_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
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