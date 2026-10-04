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

## ADK 2 AI backend

Requires Python 3.12 and [uv](https://docs.astral.sh/uv/). Google ADK 2.10 runs the five subject tutors, while ChromaDB supplies textbook passages and page images.

```powershell
uv sync --project server
Copy-Item server\.env.example server\.env
```

Add the required API keys to `server/.env`, then build the local textbook index:

```powershell
uv run --project server python server\ingest.py --all
uv run --project server uvicorn main:app --app-dir server --host 127.0.0.1 --port 8000
```

In another terminal, start the student interface:

```powershell
npm install
npm run dev -- --port 5174
```

Open `http://127.0.0.1:5174/Padi-Go/#/chat`. The Vite server proxies `/api` to FastAPI. Chroma data, extracted diagrams, the uv virtual environment, and ADK in-memory sessions stay local and are excluded from Git.

For developer inspection of ADK events and workflow execution, run:

```powershell
uv run --project server adk web server
```

The `padi_adk` entry accepts a normal question as an English-medium Maths preview. To inspect another route, send JSON such as `{"subject":"science","medium":"en","language":"ta-Latn","message":"Explain Newton's third law","session_id":"adk-web-preview"}`.

Run all checks with `uv run --project server pytest server -q`, `npm test -- --run`, and `npm run build`.

## Textbooks and privacy

The included PDFs are used as the local retrieval source. Learning activity stays in browser session memory; only the interface language preference is persisted. Login remains a preview and does not authenticate users. The project is not affiliated with the Tamil Nadu government.
