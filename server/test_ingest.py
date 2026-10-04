"""Embedding setup should not reload the model for every question."""

import unittest
import sys
from types import ModuleType
from unittest.mock import Mock, patch

from ingest import get_embedding_function


class EmbeddingReuseTest(unittest.TestCase):
    def test_one_embedding_model_is_reused_across_queries(self):
        embedding_functions = ModuleType("chromadb.utils.embedding_functions")
        create = Mock(return_value=object())
        embedding_functions.SentenceTransformerEmbeddingFunction = create
        modules = {
            "chromadb": ModuleType("chromadb"),
            "chromadb.utils": ModuleType("chromadb.utils"),
            "chromadb.utils.embedding_functions": embedding_functions,
        }
        get_embedding_function.cache_clear()
        with patch.dict(sys.modules, modules):
            first = get_embedding_function()
            second = get_embedding_function()
        get_embedding_function.cache_clear()
        self.assertIs(first, second)
        self.assertEqual(create.call_count, 1)


if __name__ == "__main__":
    unittest.main()
