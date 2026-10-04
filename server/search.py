"""Web search fallback using SerpAPI for beyond-textbook questions."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from config import SERPAPI_KEY

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """A single web search result."""
    title: str
    snippet: str
    link: str


@dataclass
class SearchResponse:
    """Container for web search results."""
    results: list[SearchResult] = field(default_factory=list)
    query: str = ""
    success: bool = False


def web_search(query: str, subject: str, top_k: int = 3) -> SearchResponse:
    """Search the web using SerpAPI when textbook doesn't have the answer.

    Args:
        query: The user's question.
        subject: Subject id for context (e.g. "maths").
        top_k: Number of results to return.

    Returns:
        SearchResponse with top results.
    """
    if not SERPAPI_KEY:
        logger.warning("SERPAPI_KEY not set — web search unavailable")
        return SearchResponse(query=query, success=False)

    try:
        from serpapi import GoogleSearch

        # Augment query with educational context
        search_query = f"Tamil Nadu Class 10 {subject} {query}"

        params = {
            "q": search_query,
            "api_key": SERPAPI_KEY,
            "engine": "google",
            "num": top_k,
            "hl": "en",
        }

        search = GoogleSearch(params)
        raw_results = search.get_dict()

        results: list[SearchResult] = []
        for item in raw_results.get("organic_results", [])[:top_k]:
            results.append(
                SearchResult(
                    title=item.get("title", ""),
                    snippet=item.get("snippet", ""),
                    link=item.get("link", ""),
                )
            )

        return SearchResponse(results=results, query=search_query, success=True)

    except Exception as e:
        logger.error("Web search failed: %s", e)
        return SearchResponse(query=query, success=False)


def format_search_context(search_response: SearchResponse) -> str:
    """Format search results into a context string for the LLM."""
    if not search_response.results:
        return ""

    parts: list[str] = []
    for i, result in enumerate(search_response.results, 1):
        parts.append(
            f"[Web Result {i}: {result.title}]\n"
            f"{result.snippet}\n"
            f"Source: {result.link}"
        )
    return "\n\n---\n\n".join(parts)
