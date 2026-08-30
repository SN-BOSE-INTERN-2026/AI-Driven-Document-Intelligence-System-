# AI-Driven Document Intelligence System

A MERN-based platform that digitizes handwritten notes, PDFs, and images, then lets users summarize and semantically query them using OpenAI GPT-4o-mini and Pinecone-powered RAG.

## Features

- 📤 Upload handwritten notes, images, PDFs, or DOCX files
- 🔍 Real-time OCR text extraction via **Tesseract.js**, with live progress over **Socket.io**
- 🧠 AI-generated summaries and key-entity extraction via **OpenAI GPT-4o-mini**
- 💬 Semantic Q&A over your documents using **Pinecone** vector search (RAG)
- 🔐 JWT authentication with role-based access control (RBAC) and rate limiting
- ☁️ Deployed on **Render** (backend) + **MongoDB Atlas** (database)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| AI / NLP | OpenAI GPT-4o-mini |
| Vector Search | Pinecone |
| OCR & Uploads | Tesseract.js, Multer |
| Real-time | Socket.io |
| Auth & Security | JWT, RBAC, rate limiting |
| Deployment | Render, MongoDB Atlas |

## Architecture

```
Client (React)
   │  HTTPS / REST
   ▼
Express API Gateway ── JWT Auth + RBAC + Rate Limiting
   │
   ├── Multer (file upload) → Tesseract.js (OCR) ──► Socket.io (live progress) ──► Client
   │                                │
   │                                ▼
   │                         MongoDB Atlas (documents, users, metadata)
   │
   ├── OpenAI Embeddings → Pinecone (vector index)
   │                                │
   │                                ▼
   └── Query → Pinecone (top-k retrieval) → OpenAI GPT-4o-mini → Summary / Answer → Client
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- OpenAI API key
- Pinecone API key

### Installation

```bash
git clone <repo-url>
cd ai-document-intelligence

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in `server/`:

```
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=your_index_name
```

### Run Locally

```bash
# Start backend
cd server
npm run dev

# Start frontend (in a new terminal)
cd client
npm run dev
```

## API Endpoints (high-level)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/documents/upload` | Upload a file (Multer + Tesseract.js OCR) |
| GET | `/api/documents` | List user's documents |
| POST | `/api/documents/:id/summarize` | Generate GPT-4o-mini summary |
| POST | `/api/query` | RAG-based Q&A over documents (Pinecone + GPT-4o-mini) |

## Deployment

- Backend hosted on **Render**, with a scheduled cron ping to prevent cold starts.
- Database hosted on **MongoDB Atlas**.

## License

MIT
