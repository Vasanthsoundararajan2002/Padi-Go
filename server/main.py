"""FastAPI application — main entry point for the Padi And Go AI backend."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from config import GROQ_API_KEY, available_subjects
from padi_adk.runtime import TutorRequest, get_runtime

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Padi And Go AI backend starting …")
    yield
    logger.info("Shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Padi And Go AI",
    description="AI tutoring backend for Tamil Nadu Class 10 subjects",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    subject: Literal["tamil", "english", "maths", "science", "social"]
    medium: Literal["en", "ta"] = "en"
    language: Literal["ta-Latn", "en", "ta"] = "ta-Latn"
    message: str = Field(..., min_length=1, description="The student's question")
    session_id: str = Field(..., min_length=1, max_length=128)
    history: list[ChatMessage] = Field(default_factory=list, description="Conversation history")


class DiagramInfo(BaseModel):
    id: str
    caption: str = ""
    page_number: int = 0


class ReferenceInfo(BaseModel):
    page: int
    chapter: str = ""
    snippet: str = ""


class ChatResponse(BaseModel):
    reply: str
    source: str = "textbook"
    references: list[ReferenceInfo] = Field(default_factory=list)
    diagrams: list[DiagramInfo] = Field(default_factory=list)
    error: str | None = None


class IngestResponse(BaseModel):
    results: list[dict]
    total_chunks: int
    total_diagrams: int


class SubjectInfo(BaseModel):
    id: str
    mediums: list[str]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "padi-and-go-ai"}


@app.get("/api/subjects", response_model=list[SubjectInfo])
async def list_subjects():
    """List available subjects with their medium options."""
    return available_subjects()


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Run one grounded tutor turn through the ADK 2 workflow."""
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Tutor model credentials are not configured.",
        )

    try:
        result = await get_runtime().ask(TutorRequest(
            subject=request.subject,
            medium=request.medium,
            language=request.language,
            message=request.message,
            session_id=request.session_id,
            history=[message.model_dump() for message in request.history],
        ))
    except Exception:
        logger.exception("ADK tutor request failed")
        raise HTTPException(
            status_code=503,
            detail="Tutor is temporarily unavailable. Please try again.",
        ) from None

    return ChatResponse(
        reply=result.reply,
        source=result.source,
        references=[
            ReferenceInfo(page=r["page"], chapter=r.get("chapter", ""), snippet=r.get("snippet", ""))
            for r in result.references
        ],
        diagrams=[
            DiagramInfo(id=d["id"], caption=d.get("caption", ""), page_number=d.get("page_number", 0))
            for d in result.diagrams
        ],
        error=result.error,
    )


@app.post("/api/ingest", response_model=IngestResponse)
async def ingest_textbooks():
    """Ingest all textbook PDFs into ChromaDB (admin endpoint — run once)."""
    from ingest import ingest_all

    logger.info("Starting textbook ingestion …")
    results = ingest_all()

    total_chunks = sum(r.get("chunks", 0) for r in results)
    total_diagrams = sum(r.get("diagrams", 0) for r in results)

    logger.info("Ingestion complete: %d chunks, %d diagrams", total_chunks, total_diagrams)

    return IngestResponse(
        results=results,
        total_chunks=total_chunks,
        total_diagrams=total_diagrams,
    )


@app.get("/api/diagram/{subject}/{medium}/{image_id}")
async def get_diagram(subject: str, medium: str, image_id: str):
    """Serve a textbook diagram image."""
    from diagrams import get_diagram_path

    path = get_diagram_path(subject, medium, image_id)
    if not path:
        raise HTTPException(status_code=404, detail="Diagram not found")

    # Determine media type from extension
    ext = path.suffix.lower()
    media_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
        ".webp": "image/webp",
    }
    media_type = media_types.get(ext, "image/png")

    return FileResponse(path, media_type=media_type)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
