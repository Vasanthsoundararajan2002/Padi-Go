# Padi and Go ADK 2 Migration Design

## Goal

Replace the current hand-written LangChain/Groq tutor orchestration with a Google Agent Development Kit 2.x workflow while preserving the working React interface, textbook RAG, ChromaDB data, diagram selection, three interface languages, and the existing `/api/chat` response contract.

## Scope

The migration covers the Learn chatbot backend. Practice, mock tests, progress, login preview, textbook files, embedding generation, and frontend navigation remain unchanged. No authentication, database, cloud deployment, or persistent conversation storage is introduced.

## Runtime and dependencies

- Python 3.12 remains the backend runtime.
- Pin `google-adk==2.10.0` for a reproducible ADK 2.x baseline.
- Keep FastAPI as the browser-facing HTTP adapter.
- Keep ChromaDB and the existing multilingual embedding configuration.
- Keep the current configured model provider behind an ADK model adapter; model selection stays in environment configuration rather than frontend code.
- Use ADK's in-memory session service. Restarting the backend clears conversations.

## Architecture

### Browser API adapter

`server/main.py` continues to expose `/api/health`, `/api/chat`, `/api/subjects`, and diagram routes. `/api/chat` converts the existing request into an ADK invocation and converts the final workflow result back into the current JSON shape:

```json
{
  "reply": "...",
  "source": "textbook",
  "references": [],
  "diagrams": [],
  "error": null
}
```

The frontend therefore does not need an ADK-specific transport or UI rewrite.

### ADK application

Create a focused `server/padi_adk/` package:

- `agent.py` defines the root coordinator and five subject tutor agents.
- `workflow.py` defines the deterministic ADK 2 graph and request execution entry point.
- `tools.py` exposes textbook retrieval, optional web lookup, and diagram selection as typed ADK tools.
- `prompts.py` owns subject, language, medium, grounding, and output-format instructions.
- `schemas.py` defines validated workflow input and output structures.
- `sessions.py` owns the in-memory session service and stable session lookup.

The old `ask_agent` entry point is removed after the FastAPI adapter and tests use the ADK workflow.

## Agent structure

The root coordinator receives the subject already selected in the UI and routes deterministically; it does not spend a model call guessing the subject.

Five specialist agents provide subject-specific teaching behavior:

- Tamil tutor
- English tutor
- Mathematics tutor
- Science tutor
- Social Science tutor

All agents share the same retrieval tools and response schema. The subject prompt supplies only subject-specific teaching guidance.

## Workflow

Each chat request follows this graph:

1. Validate subject, medium, language, question, and session ID.
2. Retrieve the best textbook chunks from the matching subject and medium collection.
3. Route to textbook-grounded generation when relevant chunks exist.
4. Route to controlled web fallback only when retrieval reports no relevant textbook content and web search is configured.
5. Run the selected subject tutor with the retrieved context and recent session history.
6. Select diagrams only from the highest-ranked relevant textbook pages.
7. Validate and return the structured tutor response.

Retrieval, web lookup, and diagram failures propagate to ADK retry handling. User-facing conversion happens only at the FastAPI boundary so workflow failures are not hidden from ADK.

## Language and response behavior

- `ta-Latn` produces Thanglish.
- `en` produces simple Class 10 English.
- `ta` produces Tamil script.
- The learning medium remains independent from interface language.
- Maths answers show working step by step.
- Poem quotations preserve line breaks using Markdown blockquote lines.
- Unsupported questions receive an honest limitation message.
- Textbook answers include page references; web fallback is labelled clearly.

## Sessions

The frontend creates one random session identifier per browser session and sends it with each chat request. Language changes, subject changes, and module navigation keep that identifier and current frontend state. ADK stores conversational events only in memory. No chat data is written to disk or local storage.

## Error handling

- Invalid requests return HTTP 422.
- Missing model credentials return a concise HTTP 503 message.
- Exhausted ADK retries return a safe tutor-unavailable response without exposing credentials or provider payloads.
- Missing Chroma collections return the existing honest no-content state.
- Web search failure does not replace usable textbook context.
- Diagram failure never prevents the text answer from being returned.

## Testing

Backend tests cover:

- deterministic routing to all five subject agents;
- retrieval and web-fallback branches;
- language and medium propagation;
- session continuity without persistence;
- structured response conversion;
- relevant diagram filtering;
- retry-safe exception behavior;
- health endpoint responsiveness while an ADK request runs.

Existing frontend tests remain unchanged and must pass. The production frontend build must pass. A local smoke test must start both services, ask one textbook question in each subject, verify one follow-up in the same session, and confirm the English poem response shows its textbook image above formatted stanzas.

## Local run experience

The supported commands will be documented as:

```powershell
cd server
.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

```powershell
npm run dev -- --port 5174
```

ADK Web will also be available for inspecting agent routing, tool calls, events, and traces without replacing the student-facing React application.

## Delivery

All migration commits remain on `codex/adk-2-migration`. The known-good pre-ADK implementation remains available on `codex/rag-chatbot-update`. Generated Chroma data, extracted diagrams, virtual environments, API keys, logs, and build output stay excluded from Git.
