# Padi and Go

Padi and Go is a multilingual learning platform for Tamil Nadu State Board Class 10 students. It combines a textbook-grounded tutor with practice, mock tests, and progress revision across Tamil, English, Maths, Science, and Social Science.

## Learning levels

1. Learn — textbook RAG chatbot with relevant page images and step-by-step answers
2. Practise — topic questions, hints, feedback, and retry
3. Test — timed sample mock tests with review and objective scoring
4. Improve — attempt history, mistakes, explanations, and related practice links

The interface supports Thanglish, English, and Tamil. Language changes preserve in-session work.

## Frontend

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

The app opens at `http://127.0.0.1:5173/Padi-Go/#/chat`. Run `npm test` for the frontend tests and `npm run build` for a production build.

## AI backend

Requires Python 3.11 or newer.

```bash
cd server
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
```

Add the required API keys to `server/.env`, then build the local textbook index:

```bash
.venv\Scripts\python ingest.py --all
.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

The Vite development server proxies `/api` requests to the backend. Chroma data and extracted textbook diagrams are generated locally and are intentionally excluded from Git.

## Textbooks and privacy

The included PDFs are used as the local retrieval source. Learning activity stays in browser session memory; only the interface language preference is persisted. Login remains a preview and does not authenticate users. The project is not affiliated with the Tamil Nadu government.
