"""Textbook-image selection for grounded tutor answers."""

import unittest
from types import SimpleNamespace
from unittest.mock import patch

from agents import _get_llm, ask_agent
from rag import RAGResponse, RetrievalResult


class DiagramSelectionTest(unittest.TestCase):
    def test_llm_output_request_fits_the_service_minute_limit(self):
        with patch('agents.ChatGroq') as groq:
            _get_llm()
        self.assertLessEqual(groq.call_args.kwargs['max_tokens'], 900)

    def test_poem_uses_only_real_illustration_from_best_matching_page(self):
        result = RAGResponse(chunks=[
            RetrievalResult("Life by Henry Van Dyke", 23, "Life", 0.95, "english", "en"),
            RetrievalResult("Life by Henry Van Dyke", 21, "Life", 0.9, "english", "en"),
            RetrievalResult("Another topic", 49, "Other", 0.5, "english", "en"),
        ], has_relevant_content=True)
        images = [
            {"id": "qr", "page_number": 21, "width": 100, "height": 100},
            {"id": "ship", "page_number": 21, "width": 2099, "height": 2692},
            {"id": "other", "page_number": 49, "width": 2480, "height": 3425},
        ]
        llm = SimpleNamespace(invoke=lambda _: SimpleNamespace(content="Life is a journey."))
        with patch("agents.retrieve", return_value=result), patch("agents._get_llm", return_value=llm), \
             patch("agents.find_diagrams_for_pages", side_effect=lambda _s, _m, pages: [i for i in images if i["page_number"] in pages]), \
             patch("agents.search_diagrams_by_caption", return_value=[]):
            answer = ask_agent("english", "en", "en", "Explain Life with an image")
        self.assertEqual([image["id"] for image in answer.diagrams], ["ship"])


if __name__ == "__main__":
    unittest.main()
