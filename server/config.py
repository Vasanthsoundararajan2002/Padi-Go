"""Configuration and constants for the Padi And Go AI backend."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# --- API Keys ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
HF_TOKEN = os.getenv("HF_TOKEN", "")

# --- Models ---
LLM_MODEL = os.getenv("LLM_MODEL", "qwen/qwen3.8-27b")
EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

# --- Paths ---
BASE_DIR = Path(__file__).parent
PROJECT_DIR = BASE_DIR.parent
TEXTBOOKS_DIR = PROJECT_DIR / "Textbooks"
CHROMA_DIR = BASE_DIR / "chroma_db"
DIAGRAMS_DIR = BASE_DIR / "diagrams"
DIAGRAM_INDEX_PATH = BASE_DIR / "diagram_index.json"

# --- RAG Settings ---
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
RETRIEVAL_TOP_K = 5
RELEVANCE_THRESHOLD = 0.3

# --- Textbook mapping: subject → {medium: pdf_filename} ---
TEXTBOOK_MAP = {
    "tamil": {
        "ta": "Class_10_Tamil_2025_Edition-www.tntextbooks.in.pdf",
    },
    "english": {
        "en": "Class_10_English_2024_Edition-www.tntextbooks.in.pdf",
    },
    "maths": {
        "en": "Class_10_Mathematics_English_2025_Edition-www.tntextbooks.in.pdf",
        "ta": "Class_10_Mathematics_Tamil_2025_Edition-www.tntextbooks.in.pdf",
    },
    "science": {
        "en": "Class_10_Science_English_2024_Edition-www.tntextbooks.in.pdf",
        "ta": "Class_10_Science_Tamil_2024_Edition-www.tntextbooks.in.pdf",
    },
    "social": {
        "en": "Class_10_Social_Science_English_2025_Edition-www.tntextbooks.in.pdf",
        "ta": "Class_10_Social_Science_Tamil_2025_Edition-www.tntextbooks.in.pdf",
    },
}


def get_collection_name(subject: str, medium: str) -> str:
    """Return the ChromaDB collection name for a subject+medium pair."""
    return f"{subject}_{medium}"


def get_textbook_path(subject: str, medium: str) -> Path | None:
    """Return the full path to the textbook PDF, or None if not found."""
    filename = TEXTBOOK_MAP.get(subject, {}).get(medium)
    if not filename:
        return None
    path = TEXTBOOKS_DIR / filename
    return path if path.exists() else None


def get_diagram_dir(subject: str, medium: str) -> Path:
    """Return the directory for extracted diagrams."""
    path = DIAGRAMS_DIR / subject / medium
    path.mkdir(parents=True, exist_ok=True)
    return path


def available_subjects() -> list[dict]:
    """Return available subjects with their medium options."""
    result = []
    for subject, mediums in TEXTBOOK_MAP.items():
        available_mediums = [m for m in mediums if get_textbook_path(subject, m)]
        if available_mediums:
            result.append({"id": subject, "mediums": available_mediums})
    return result
