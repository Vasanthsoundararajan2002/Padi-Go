# Padi and Go ADK 2 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current LangChain tutor orchestration with a tested Google ADK 2.10 workflow while preserving the React learning experience, textbook RAG, diagrams, and API response shape.

**Architecture:** FastAPI remains the browser adapter. A small `padi_adk` package owns typed tools, subject agents, in-memory ADK sessions, and request execution. The existing Chroma retrieval, web search, and diagram modules remain the data layer. React adds one in-memory browser-session identifier to chat requests.

**Tech Stack:** Python 3.12, uv, Google ADK 2.10, FastAPI, LiteLLM/Groq adapter, ChromaDB, React 19, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-04-adk-2-migration-design.md`

## Global Constraints

- Preserve `/api/chat` response fields: `reply`, `source`, `references`, `diagrams`, and `error`.
- Keep practice, mock tests, progress, login, PDFs, Chroma collections, and diagram extraction behavior unchanged.
- Store conversation events only in memory; persist only the existing language preference.
- Do not catch provider/tool failures inside ADK tools when that would prevent retry handling.
- Do not stage generated databases, diagrams, virtual environments, credentials, or unrelated untracked files.
- Implement each behavior test-first and commit only verified files.

## Task 1: Pin and inspect the ADK runtime with uv

- [ ] Replace `server/requirements.txt` with `server/pyproject.toml` and `server/uv.lock`, pinning `google-adk==2.10.0` and the minimal model-adapter dependency required by the configured provider.
- [ ] Run `uv sync --project server` and inspect the installed ADK 2.10 signatures for agents, runner, sessions, events, tools, and model adapters.
- [ ] Record only supported public APIs in the implementation; do not guess from older ADK examples.
- [ ] Run: `uv run --project server python -c "import importlib.metadata; print(importlib.metadata.version('google-adk'))"`.

## Task 2: Add typed request, routing, and tool behavior

**Files:**

- Create: `server/padi_adk/__init__.py`
- Create: `server/padi_adk/runtime.py`
- Create: `server/padi_adk/tools.py`
- Create: `server/test_adk_runtime.py`
- Create: `server/test_adk_tools.py`

- [ ] Write failing tests that validate all five subject routes, all three languages, both learning media, retrieval-first behavior, web fallback only after an empty retrieval, page references, and diagram filtering.
- [ ] Run the tests and confirm they fail because the new package does not exist.
- [ ] Implement immutable input/output models and a deterministic subject-agent lookup.
- [ ] Wrap `rag.retrieve`, `search.web_search`, and diagram selection in small typed functions. Let retrieval/search exceptions propagate; keep diagram failure non-fatal at the final response assembly boundary.
- [ ] Run: `uv run --project server pytest server\test_adk_tools.py server\test_adk_runtime.py -q`.

## Task 3: Build the ADK subject agents and runner

**Files:**

- Create: `server/padi_adk/agent.py`
- Modify: `server/padi_adk/runtime.py`
- Modify: `server/test_adk_runtime.py`

- [ ] Write failing tests using a fake ADK runner/event stream to prove the selected subject prompt, textbook context, language, medium, session ID, source metadata, and final text are passed through correctly.
- [ ] Define five ADK `Agent` instances with shared model configuration and subject-specific instructions.
- [ ] Use ADK `InMemorySessionService` and `Runner` with one stable app/user/session identity per browser session.
- [ ] Execute the selected agent asynchronously and extract only the final model response from the ADK event stream.
- [ ] Preserve recent frontend history as request context while ADK session events provide follow-up continuity.
- [ ] Run: `uv run --project server pytest server\test_adk_runtime.py -q`.

## Task 4: Move FastAPI onto ADK

**Files:**

- Modify: `server/main.py`
- Modify: `server/test_main.py`
- Delete: `server/agents.py`
- Delete or replace: `server/test_agents.py`

- [ ] Write failing API tests for `session_id`, validation, successful response conversion, missing credentials (503), and safe exhausted-provider failure.
- [ ] Replace `ask_agent` and the thread-pool call with the asynchronous ADK runtime.
- [ ] Keep health, subject, ingestion, and diagram routes unchanged.
- [ ] Return 422 for invalid subject/medium/language and keep secrets/provider payloads out of client errors.
- [ ] Remove the unused LangChain orchestration module after all imports and tests use ADK.
- [ ] Run: `uv run --project server pytest server -q`.

## Task 5: Add the in-memory browser session ID

**Files:**

- Modify: `src/state.js`
- Modify: `src/state.test.js`
- Modify: `src/chat.js`
- Modify: `src/chat.test.js`
- Modify the chat view/component that calls `sendMessage`.

- [ ] Write failing frontend tests proving a generated session ID is stable across reducer navigation/language changes and is included in `/api/chat`.
- [ ] Generate the ID once in `createInitialSession` with a dependency-safe fallback for test/older browser environments.
- [ ] Pass the ID through the existing chat request without persisting it to local storage.
- [ ] Run: `npm test -- --run`.

## Task 6: Documentation, full verification, and local smoke test

**Files:**

- Modify: `server/.env.example`
- Modify: `README.md`

- [ ] Document backend setup, ingestion, student UI run, and `adk web` inspection commands without exposing credentials or hard-coding a model in frontend code.
- [ ] Run backend tests: `uv run --project server pytest server -q`.
- [ ] Run frontend tests: `npm test -- --run`.
- [ ] Run production build: `npm run build`.
- [ ] Start FastAPI on port 8000 and Vite on port 5174.
- [ ] Smoke test health, all five subject routes, one same-session follow-up, unsupported-content honesty, and the English poem formatting/image flow.
- [ ] Inspect the student UI at `http://127.0.0.1:5174/Padi-Go/#/chat` at desktop and mobile widths.
- [ ] Commit only migration files and push `codex/adk-2-migration` to origin.
