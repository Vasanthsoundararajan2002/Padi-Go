"""Diagram lookup and serving helpers."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from config import DIAGRAM_INDEX_PATH, get_diagram_dir

logger = logging.getLogger(__name__)

# In-memory cache of the diagram index
_diagram_index: list[dict] | None = None


def _load_index() -> list[dict]:
    """Load (or reload) the diagram index from disk."""
    global _diagram_index
    if _diagram_index is not None:
        return _diagram_index
    if DIAGRAM_INDEX_PATH.exists():
        with open(DIAGRAM_INDEX_PATH, "r", encoding="utf-8") as f:
            _diagram_index = json.load(f)
    else:
        _diagram_index = []
    return _diagram_index


def reload_index() -> None:
    """Force-reload the diagram index (call after ingestion)."""
    global _diagram_index
    _diagram_index = None
    _load_index()


def find_diagrams_for_page(
    subject: str, medium: str, page_number: int
) -> list[dict]:
    """Return all diagrams on a given page."""
    index = _load_index()
    return [
        d
        for d in index
        if d["subject"] == subject
        and d["medium"] == medium
        and d["page_number"] == page_number
    ]


def find_diagrams_for_pages(
    subject: str, medium: str, page_numbers: list[int]
) -> list[dict]:
    """Return all diagrams across the given pages (de-duplicated)."""
    page_set = set(page_numbers)
    index = _load_index()
    return [
        d
        for d in index
        if d["subject"] == subject
        and d["medium"] == medium
        and d["page_number"] in page_set
    ]


def get_diagram_path(subject: str, medium: str, image_id: str) -> Path | None:
    """Return the filesystem path to a specific diagram image."""
    index = _load_index()
    for d in index:
        if d["subject"] == subject and d["medium"] == medium and d["id"] == image_id:
            path = get_diagram_dir(subject, medium) / d["filename"]
            return path if path.exists() else None
    return None


def search_diagrams_by_caption(
    subject: str, medium: str, query: str, top_k: int = 3
) -> list[dict]:
    """Search diagram captions for relevant diagrams."""
    index = _load_index()
    query_lower = query.lower()
    scored: list[tuple[float, dict]] = []

    for d in index:
        if d["subject"] != subject or d["medium"] != medium:
            continue
        caption = (d.get("caption") or "").lower()
        if not caption:
            continue
        # Simple keyword overlap scoring
        words = query_lower.split()
        matches = sum(1 for w in words if w in caption)
        if matches > 0:
            scored.append((matches / len(words), d))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [d for _, d in scored[:top_k]]
