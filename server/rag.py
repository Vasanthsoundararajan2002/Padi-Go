"""RAG retrieval engine: search ChromaDB for relevant textbook chunks."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from config import RELEVANCE_THRESHOLD, RETRIEVAL_TOP_K, get_collection_name

logger = logging.getLogger(__name__)


@dataclass
class RetrievalResult:
    """Container for a single retrieved chunk."""
    text: str
    page_number: int
    chapter: str
    score: float
    subject: str
    medium: str


@dataclass
class RAGResponse:
    """Container for the full retrieval response."""
    chunks: list[RetrievalResult] = field(default_factory=list)
    has_relevant_content: bool = False
    query: str = ""


def retrieve(
    query: str,
    subject: str,
    medium: str,
    top_k: int = RETRIEVAL_TOP_K,
) -> RAGResponse:
    """Search the ChromaDB collection for chunks relevant to the query.

    Args:
        query: The user's question.
        subject: Subject id (e.g. "maths").
        medium: Medium id ("en" or "ta").
        top_k: Number of results to return.

    Returns:
        RAGResponse with ranked chunks and a relevance flag.
    """
    from ingest import get_chroma_client, get_embedding_function

    client = get_chroma_client()
    collection_name = get_collection_name(subject, medium)

    try:
        collection = client.get_collection(
            name=collection_name,
            embedding_function=get_embedding_function(),
        )
    except Exception:
        logger.warning("Collection %s not found — has ingestion been run?", collection_name)
        return RAGResponse(query=query)

    results = collection.query(
        query_texts=[query],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    chunks: list[RetrievalResult] = []
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    for doc, meta, dist in zip(documents, metadatas, distances):
        # ChromaDB returns L2 distance by default; lower = more similar.
        # Convert to a similarity-like score (1 / (1 + distance)).
        score = 1.0 / (1.0 + dist)
        chunks.append(
            RetrievalResult(
                text=doc,
                page_number=meta.get("page_number", 0),
                chapter=meta.get("chapter", "Unknown"),
                score=score,
                subject=meta.get("subject", subject),
                medium=meta.get("medium", medium),
            )
        )

    # Sort by score descending
    chunks.sort(key=lambda c: c.score, reverse=True)

    has_relevant = any(c.score >= RELEVANCE_THRESHOLD for c in chunks)

    return RAGResponse(
        chunks=chunks,
        has_relevant_content=has_relevant,
        query=query,
    )


def format_context(rag_response: RAGResponse) -> str:
    """Format retrieved chunks into a context string for the LLM."""
    if not rag_response.chunks:
        return ""

    parts: list[str] = []
    for i, chunk in enumerate(rag_response.chunks, 1):
        parts.append(
            f"[Source {i} — {chunk.chapter}, Page {chunk.page_number}]\n"
            f"{chunk.text}"
        )
    return "\n\n---\n\n".join(parts)


def get_page_references(rag_response: RAGResponse) -> list[dict]:
    """Extract unique page references from retrieval results."""
    seen = set()
    refs = []
    for chunk in rag_response.chunks:
        key = (chunk.page_number, chunk.chapter)
        if key not in seen:
            seen.add(key)
            refs.append({
                "page": chunk.page_number,
                "chapter": chunk.chapter,
                "snippet": chunk.text[:150] + "…" if len(chunk.text) > 150 else chunk.text,
            })
    return refs
