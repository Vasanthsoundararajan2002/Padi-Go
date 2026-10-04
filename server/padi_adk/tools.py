"""Deterministic textbook, web, and diagram tools used by the ADK workflow."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from diagrams import find_diagrams_for_pages
from rag import format_context, get_page_references, retrieve
from search import format_search_context, web_search

logger = logging.getLogger(__name__)

OUT_OF_SCOPE_MARKERS = {
    "cricket score",
    "football score",
    "stock price",
    "movie review",
    "celebrity gossip",
    "weather forecast",
    "write code",
    "programming code",
}


@dataclass(frozen=True)
class Grounding:
    source: str = "general"
    context: str = ""
    references: list[dict] = field(default_factory=list)
    diagrams: list[dict] = field(default_factory=list)


def _select_diagrams(subject: str, medium: str, references: list[dict]) -> list[dict]:
    """Return useful images from the highest-ranked relevant textbook page."""
    for reference in references[:2]:
        matches = find_diagrams_for_pages(subject, medium, [reference["page"]])
        useful = [
            image
            for image in matches
            if min(image.get("width", 0), image.get("height", 0)) >= 150
        ]
        if useful:
            return useful[:2]
    return []


def prepare_grounding(question: str, subject: str, medium: str) -> Grounding:
    """Retrieve the textbook first, using web search only when it has no answer."""
    rag_result = retrieve(question, subject, medium)
    if rag_result.has_relevant_content:
        references = get_page_references(rag_result)
        try:
            diagrams = _select_diagrams(subject, medium, references)
        except Exception:
            logger.exception("Diagram selection failed; returning the grounded text answer")
            diagrams = []
        return Grounding(
            source="textbook",
            context=format_context(rag_result),
            references=references,
            diagrams=diagrams,
        )

    if any(marker in question.casefold() for marker in OUT_OF_SCOPE_MARKERS):
        return Grounding()

    search_result = web_search(question, subject)
    if search_result.success and search_result.results:
        return Grounding(
            source="web_search",
            context=format_search_context(search_result),
        )
    return Grounding()
