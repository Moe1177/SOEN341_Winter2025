import eventlet
eventlet.monkey_patch()

import os
import traceback
from functools import lru_cache

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from sentence_transformers import SentenceTransformer

from pinecone import Pinecone
from openai import OpenAI

from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

port = int(os.environ.get('PORT', 5000))

# Use a more lightweight embedding model
@lru_cache(maxsize=128)
def get_huggingface_embeddings(text, model_name="sentence-transformers/all-MiniLM-L6-v2"):
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
        pinecone_index = ClientManager.get_pinecone_client().Index("flask-rag")
        openrouter_client = ClientManager.get_openrouter_client()
        print("Connecting to Pinecone...")

        raw_query_embedding = get_huggingface_embeddings(query)
        print("Embedding query...")
        top_matches = pinecone_index.query(
            vector=raw_query_embedding.tolist(),
            top_k=3,
            include_metadata=True,
            namespace=os.environ.get("GITHUB_REPO_URL")
        )
        print("Returned top matches...")
        
        contexts = [item['metadata']['text'] for item in top_matches['matches']]
        augmented_query = "\n" + "\n\n-------\n\n".join(contexts[:10]) + \
                          "\n-------\n\n\n\n\nMY QUESTION:\n" + query

        system_prompt = """
            You are an AI assistant specialized in guiding users through the functionalities of this website. Your responses must strictly follow these rules:

            ### 🔹 **Core Directives**
            1. **Scope Limitation**:
            - Only answer questions about **user-facing website functionalities** (e.g., "How do I create a channel?", "How do I reset my password?").
            - Never discuss backend, tech stack, or configuration details. If asked, respond:
                *"I’m sorry, but I can’t provide technical implementation details. I can only assist with user-facing functionalities."*

            2. **Response Format**:
            - For **step-by-step instructions**, use:
                ```markdown
                1. Navigate to [X] page.
                2. Click [Y] button.
                3. Enter [Z] details.
                ```
            - For **yes/no questions**, provide a clear answer first, then optional context:
                *"Yes. You can do this by [brief explanation]."*

            3. **Privacy & Security**:
            - If asked about sensitive/unauthorized topics (e.g., user data, admin features), respond:
                *"I’m sorry, but I can’t provide that information due to privacy and security reasons."*

            4. **Anti-Hallucination**:
            - Never invent features or steps. If unsure, say:
                *"This functionality isn’t documented in my guidelines. Could you rephrase or ask about a different feature?"*

            5. **Response Format Rules**:
                5.1. **Language**: Use only natural English—no Markdown (**, -, `) or code formatting.
                5.2. **Steps**:  
                - Group by device type if needed (e.g., "For Desktop Users:").  
                - Use numbered steps for sequences (1, 2, 3...).  
                - For sub-steps, use bullet points (plain * or ○ symbols).  
                5.3. **Brevity**: Avoid repeating UI labels (e.g., say "purple button" once).  
                5.4. **Clarity**: Explicitly note shared behaviors (e.g., "Both devices use the same page."). 

            ### 🔹 **Tone & Style**
            - Be **polite, concise, and professional**.
            - Use **bullet points for complex instructions**.
            - Avoid technical jargon unless the user demonstrates advanced knowledge.

            ### 🔹 **Example Interactions**
            User: "How do I log in?"
            → **You**: 
            1. Go to the homepage and click "Login".
            2. Enter your email and password.
            3. Click "Submit".

            User: "What database does this use?"
            → **You**: 
            "I’m sorry, but I can’t provide technical implementation details. I can only assist with user-facing functionalities."
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

    response_text = perform_rag(user_message)

    print("Response:", response_text)

    emit('chat_response', {'response': response_text})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=port, debug=False)