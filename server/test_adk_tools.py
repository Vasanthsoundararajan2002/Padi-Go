from unittest.mock import patch

from padi_adk.tools import prepare_grounding
from rag import RAGResponse, RetrievalResult
from search import SearchResponse, SearchResult


def test_textbook_grounding_returns_references_and_only_large_best_page_diagram():
    retrieved = RAGResponse(
        chunks=[
            RetrievalResult("Life poem", 23, "Life", 0.95, "english", "en"),
            RetrievalResult("Life notes", 21, "Life", 0.90, "english", "en"),
        ],
        has_relevant_content=True,
    )
    diagrams = [
        {"id": "qr", "page_number": 23, "width": 100, "height": 100},
        {"id": "poem", "page_number": 23, "width": 1200, "height": 900},
        {"id": "later", "page_number": 21, "width": 1200, "height": 900},
    ]

    with patch("padi_adk.tools.retrieve", return_value=retrieved), patch(
        "padi_adk.tools.find_diagrams_for_pages",
        side_effect=lambda _subject, _medium, pages: [
            image for image in diagrams if image["page_number"] in pages
        ],
    ):
        result = prepare_grounding("Explain Life", "english", "en")

    assert result.source == "textbook"
    assert [reference["page"] for reference in result.references] == [23, 21]
    assert [diagram["id"] for diagram in result.diagrams] == ["poem"]
    assert "Life poem" in result.context


def test_web_search_runs_only_when_textbook_has_no_relevant_content():
    empty = RAGResponse(has_relevant_content=False)
    web = SearchResponse(
        results=[SearchResult("Extra", "Useful fact", "https://example.test")],
        success=True,
    )

    with patch("padi_adk.tools.retrieve", return_value=empty), patch(
        "padi_adk.tools.web_search", return_value=web
    ) as search:
        result = prepare_grounding("Beyond the book", "science", "en")

    search.assert_called_once_with("Beyond the book", "science")
    assert result.source == "web_search"
    assert "Useful fact" in result.context


def test_empty_retrieval_and_search_produce_honest_general_grounding():
    with patch("padi_adk.tools.retrieve", return_value=RAGResponse()), patch(
        "padi_adk.tools.web_search", return_value=SearchResponse()
    ):
        result = prepare_grounding("Unknown", "tamil", "ta")

    assert result.source == "general"
    assert result.context == ""


def test_obviously_unrelated_question_does_not_trigger_web_search():
    with patch("padi_adk.tools.retrieve", return_value=RAGResponse()), patch(
        "padi_adk.tools.web_search"
    ) as search:
        result = prepare_grounding("Tell me today's cricket score", "maths", "en")

    search.assert_not_called()
    assert result.source == "general"
