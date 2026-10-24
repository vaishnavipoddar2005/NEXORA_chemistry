# NEXORA Virtual Chemistry Lab

NEXORA is an AI powered chemistry learning platform that uses virtual 3D labs, interactive experiments, and hand gestures to help students understand chemistry concepts through visual and practical learning. Students can upload PDFs to get topic explanations and follow step by step experiment instructions.

## Local AI Setup (Windows)

NEXORA uses React, Vite, and React Three Fiber. Its local AI system uses Ollama, Phi-4 14B for answers, and BGE-M3 for document embeddings and retrieval. No OpenAI API key is required.

### 1. Install Ollama

Download Ollama from https://ollama.com/download.

To store models on the D: drive, run this in PowerShell:

```powershell
setx OLLAMA_MODELS "D:\ollama\models"
```

Restart Ollama, then run:

```powershell
ollama pull phi4:14b-q4_K_M
ollama pull bge-m3
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```text
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=phi4:14b-q4_K_M
OLLAMA_EMBED_MODEL=bge-m3
API_PORT=8787
```

### 3. Start the Project

Run from the project folder:

```powershell
npm run dev
```

The backend extracts text from supported documents, creates embeddings, retrieves relevant content, and uses Phi-4 to generate answers based on the retrieved context.

Supported uploads include PDF, DOCX, PPTX, TXT, Markdown, HTML, and JSON files up to 20 MB. Scanned PDFs and images require OCR or vision support.

## Project Checks

```powershell
npm run build
npm run lint
node --check server/index.js
```

The virtual titration experiment is an educational simulation, not a laboratory-grade measurement.