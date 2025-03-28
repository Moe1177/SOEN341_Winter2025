# Flask RAG Chatbot Backend

## Project Overview
This is a Flask-based backend for a Retrieval-Augmented Generation (RAG) chatbot that uses Pinecone for vector search, SentenceTransformers for embeddings, and OpenRouter for language model interactions.

## Prerequisites
- Python 3.9+
- pip
- virtualenv (recommended)

## Setup Instructions

### 1. Head to root directory
```bash
cd .. (Should be in root directory)
```

### 2. Create and Activate Virtual Environment
```bash
# Create virtual environment
# For linux or Mac
python3 -m venv .venv

# For Windows
python -m venv .venv

# Activate virtual environment
# On Windows
.venv\Scripts\activate

# On macOS/Linux
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
# For Windows
pip install -r requirements.txt

# For Linux and Mac
pip3 install -r requirements.txt
```

### 4. Environment Configuration
Create a `.env` file in the chatbot-backend folder with the following variables:
```
SECRET_KEY=your_flask_secret_key
MONGO_URI=your_mongodb_connection_string
PINECONE_API_KEY=your_pinecone_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
GITHUB_REPO_URL=your_github_repo_namespace
```

### 5. Required Services
Ensure you have the following services set up:
- MongoDB
- Pinecone
- OpenRouter

### 6. Run the Application
```bash
# For development
python app.py
```

## Application Components
- Flask web framework
- Flask-SocketIO for real-time communication
- SentenceTransformers for text embeddings
- Pinecone for vector database
- OpenRouter for AI model interactions
- MongoDB for chat history storage

## Key Features
- Retrieval-Augmented Generation (RAG) chatbot
- Real-time messaging via WebSocket
- Cached embedding generation
- Secure environment variable management

## Deployment Notes
- Use a production WSGI server like Gunicorn
- Set `debug=False` in production
- Implement proper secret management
- Configure CORS appropriately

## Troubleshooting
- Ensure all environment variables are correctly set
- Check network connectivity to external services
- Verify API keys and permissions
