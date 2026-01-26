# 🚀 Quick Start Guide - PDF RAG Study Assistant

## Prerequisites
- Python 3.9+
- Node.js 18+
- Gemini API Key (free tier available)

---

## Backend Setup

### 1. Install Dependencies
```bash
cd c:\Users\rudra\Desktop\pdf_qa_rag
python -m venv venv
venv\Scripts\Activate.ps1
pip install fastapi uvicorn langchain langchain-community langchain-core python-multipart google-generativeai pypdf python-docx faiss-cpu sentence-transformers python-dotenv
```

### 2. Configure Environment
Create `.env` file in project root:
```
GEMINI_API_KEY=your_api_key_here
```

Get free Gemini API key: https://aistudio.google.com/apikey

### 3. Run Backend
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs on: `http://localhost:8000`

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## Usage Flow

### Step 1: Upload PDF
1. Click **"Upload PDF"** card (left panel)
2. Select your study material PDF
3. Wait for indexing (shows progress bar)
4. Success message appears with file stats

### Step 2: Upload Syllabus
1. Click **"Upload & Parse"** (center-top panel)
2. Select syllabus (PDF or DOCX)
3. System extracts:
   - Subject name
   - Units (Unit I, II, III, etc.)
   - Topics per unit
   - Answer format hint

### Step 3: Select Study Options
1. Choose **Unit** from dropdown
2. Choose **Topic** (loads automatically)
3. Select **Answer Length** (3/5/12 marks)
4. Info box shows topic details

### Step 4: Ask Questions
1. Type question in chat input
2. Click **Send** or press **Enter**
3. AI generates answer from PDF
4. Sources shown below answer
5. Chat history saved in session

---

## API Endpoints

### POST /ingest/
Upload and index PDF

**Request:**
```bash
curl -X POST "http://localhost:8000/ingest/" \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "status": "success",
  "message": "PDF ingested successfully",
  "filename": "document.pdf",
  "pages": 56,
  "chunks": 113
}
```

### POST /syllabus/upload
Parse syllabus and extract structure

**Request:**
```bash
curl -X POST "http://localhost:8000/syllabus/upload" \
  -F "file=@syllabus.pdf"
```

**Response:**
```json
{
  "subject": "Data Warehousing",
  "units": [
    {
      "name": "Unit I",
      "topics": ["topic1", "topic2", ...],
      "format": "long"
    }
  ]
}
```

### POST /qa
Ask question about the PDF

**Request:**
```bash
curl -X POST "http://localhost:8000/qa" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is data warehousing?",
    "subject": "Data Warehousing",
    "unit": "Unit I",
    "topic": "Introduction to Data Warehousing",
    "marks": 5
  }'
```

**Response:**
```json
{
  "answer": "Detailed answer from PDF...",
  "pages": ["1", "2", "3"],
  "sources": [
    {
      "page": 1,
      "text": "Relevant text from page..."
    }
  ],
  "error": false
}
```

---

## File Structure

```
pdf_qa_rag/
├── app/
│   ├── main.py                 # FastAPI app
│   ├── api/
│   │   ├── routes/
│   │   │   ├── ingest.py      # PDF upload endpoint
│   │   │   ├── qa.py          # Q&A endpoint
│   │   │   └── syllabus.py    # Syllabus upload endpoint
│   │   └── schemas/
│   │       ├── qa.py          # Request/response schemas
│   │       └── ingest.py
│   ├── services/
│   │   ├── ingestion_service.py    # PDF processing
│   │   ├── syllabus_service.py     # Syllabus parsing
│   │   ├── rag_service.py          # RAG pipeline ⭐
│   │   ├── gemini_llm.py           # LLM interface
│   │   └── llm_service.py
│   ├── rag/
│   │   ├── prompts.py              # LLM prompts ⭐
│   │   ├── retriever.py            # Document retrieval ⭐
│   │   ├── chunking.py             # Text chunking
│   │   └── memory.py
│   ├── vectorstore/
│   │   └── faiss_store.py          # FAISS vector store
│   ├── core/
│   │   ├── config.py               # Configuration ⭐
│   │   └── logging.py
│   └── data/
│       ├── uploaded_pdfs/
│       └── vector_db/
│           └── index.faiss
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/              # Chat UI
│   │   │   ├── study/             # Study controls
│   │   │   ├── upload/            # Upload components
│   │   │   ├── syllabus/          # Syllabus upload
│   │   │   └── layout/            # Layout
│   │   ├── context/
│   │   │   └── AppContext.jsx     # State management
│   │   ├── api/
│   │   │   └── client.js          # API calls
│   │   └── pages/
│   │       └── Home.jsx           # Main page
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── requirements.txt
├── IMPROVEMENTS.md                 # This file
└── README.md
```

⭐ = Recently enhanced/fixed

---

## Performance Tips

### Backend:
- Increase `CHUNK_SIZE` for longer documents (1000-1500)
- Reduce `TOP_K` if searching is slow (3-5)
- Use GPU embeddings if available

### Frontend:
- Disable animations on mobile: Add condition in framer-motion config
- Lazy load components if needed
- Use React DevTools to check unnecessary re-renders

---

## Troubleshooting

### 1. **Answers not from PDF**
```
✓ Ensure PDF is uploaded successfully (shows success message)
✓ Check vector store path exists: app/data/vector_db
✓ Upload larger PDFs (system indexes better with more content)
✓ Try different keywords in questions
```

### 2. **API Key Error**
```
✗ Error: GEMINI_API_KEY not found
✓ Create .env file in project root
✓ Add: GEMINI_API_KEY=sk-...
✓ Restart backend server
```

### 3. **CORS Errors in Frontend**
```
✗ Access to XMLHttpRequest blocked
✓ Check CORS configuration in app/main.py
✓ Verify frontend URL matches allow_origins
✓ Default: http://localhost:5173
```

### 4. **Slow Responses**
```
✗ Waiting too long for answers
✓ Check internet connection (API calls)
✓ Reduce document size or chunk size
✓ Use fewer search results (reduce k in retriever)
```

### 5. **Animations Lag on Mobile**
```
✗ UI feels jittery or slow
✓ Reduce animation complexity
✓ Disable spring physics on mobile
✓ Use prefers-reduced-motion media query
```

---

## Advanced Configuration

### Customize Chunk Strategy
Edit `app/core/config.py`:
```python
CHUNK_SIZE = 1000      # Larger = more context
CHUNK_OVERLAP = 200    # Higher = better continuity
TOP_K = 8              # More = slower but better
```

### Customize Retrieval
Edit `app/rag/retriever.py`:
```python
search_kwargs={
    "k": 8,            # Results to return
    "fetch_k": 20,     # Candidates to consider
    "lambda_mult": 0.85 # 0.0=diversity, 1.0=relevance
}
```

### Customize Prompts
Edit `app/rag/prompts.py` to adjust answer format, tone, or style.

---

## Deployment (Production)

### Using Gunicorn + Nginx:
```bash
# Backend
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app

# Frontend
npm run build
# Serve dist folder with Nginx
```

### Using Docker:
```dockerfile
# Backend Dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]
```

---

## Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **LangChain Docs**: https://python.langchain.com
- **Gemini API**: https://ai.google.dev
- **Framer Motion**: https://www.framer.com/motion
- **Tailwind CSS**: https://tailwindcss.com
- **FAISS**: https://github.com/facebookresearch/faiss

---

## Support

For issues or questions:
1. Check IMPROVEMENTS.md for detailed changes
2. Review error logs in console/terminal
3. Check browser console (Frontend Dev Tools)
4. Test with simpler queries first

---

**Status**: ✅ Production Ready
**Last Updated**: January 26, 2026
**Version**: 2.0 (Enhanced)
