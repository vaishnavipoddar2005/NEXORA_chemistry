# NEXORA Virtual Chemistry Lab

NEXORA is a React, Vite and React Three Fiber chemistry learning app. Dr. Nova's local RAG path uses Ollama, Phi-4 14B for answers, and BGE-M3 for document embeddings and retrieval. No OpenAI API key is required.

## Local AI setup (Windows)

This laptop has a 4 GB RTX 3050 and 15.8 GB system RAM. Phi-4's 14B quantized model is the viable option from the supplied list; Llama 3.3 70B and Qwen3 30B exceed the available memory/storage budget. The 14B model runs quantized and may respond slower than a cloud model.

Install Ollama from [ollama.com/download](https://ollama.com/download). There is 17.5 GB free on D: and 8.1 GB on C:. Put model files on D: before downloading them:

```powershell
setx OLLAMA_MODELS "D:\ollama\models"
```

Restart Ollama after setting that variable, then run:

```powershell
ollama pull phi4:14b-q4_K_M
ollama pull bge-m3
```

Optional `.env` settings (copy `.env.example` to `.env`):

```text
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=phi4:14b-q4_K_M
OLLAMA_EMBED_MODEL=bge-m3
API_PORT=8787
```

Then start NEXORA from the project folder:

```powershell
npm run dev
```

This starts the frontend and backend together. The backend checks Ollama and both models on each question, extracts text from supported files, embeds document chunks with BGE-M3, persists their vectors and metadata in `server/data/knowledge-store.json`, retrieves relevant chunks, and asks Phi-4 to answer from that context. The built-in chemistry reference is indexed on first use. Newly uploaded PDFs/Word/PPT/text documents remain available after restart.

Supported text uploads: PDF, Word `.docx`, PowerPoint `.pptx`, TXT, Markdown, HTML and JSON, up to 20 MB. Legacy `.doc` must be saved as `.docx`. Scanned-only PDFs and images require OCR/vision and are not readable by Phi-4; the UI reports this instead of pretending to read them.

## Checks

```powershell
npm run build
npm run lint
node --check server/index.js
```

The titration model is an educational simulation, not laboratory-grade measurement.
