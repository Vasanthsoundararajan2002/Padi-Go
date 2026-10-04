"""PDF ingestion pipeline: extract text + images, chunk, embed, store in ChromaDB."""

import json
import logging
from functools import lru_cache
from pathlib import Path

import pymupdf as fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    CHROMA_DIR,
    DIAGRAM_INDEX_PATH,
    TEXTBOOK_MAP,
    get_collection_name,
    get_diagram_dir,
    get_textbook_path,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

def extract_text_from_pdf(pdf_path: Path) -> list[dict]:
    """Extract text from every page of a PDF.

    Returns a list of dicts: {page_number, text}.
    """
    doc = fitz.open(str(pdf_path))
    pages = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        if text.strip():
            pages.append({"page_number": page_num + 1, "text": text})
    doc.close()
    return pages


def detect_chapter(text: str, page_number: int) -> str:
    """Try to detect the chapter title from page text (best-effort heuristic)."""
    import re

    # Common patterns: "Chapter 1", "CHAPTER 1:", "Unit 1", "அலகு 1"
    patterns = [
        r"(?i)chapter\s+(\d+)\s*[:\.\-–]?\s*(.*)",
        r"(?i)unit\s+(\d+)\s*[:\.\-–]?\s*(.*)",
        r"அலகு\s+(\d+)\s*[:\.\-–]?\s*(.*)",
        r"பாடம்\s+(\d+)\s*[:\.\-–]?\s*(.*)",
    ]
    for line in text.split("\n")[:10]:  # Check first 10 lines
        line = line.strip()
        for pattern in patterns:
            match = re.match(pattern, line)
            if match:
                num = match.group(1)
                title = match.group(2).strip() if match.group(2) else ""
                return f"Chapter {num}: {title}" if title else f"Chapter {num}"
    return f"Page {page_number}"


# ---------------------------------------------------------------------------
# Image / diagram extraction
# ---------------------------------------------------------------------------

def extract_images_from_pdf(
    pdf_path: Path, subject: str, medium: str
) -> list[dict]:
    """Extract images from every page and save to the diagrams directory.

    Returns a list of diagram metadata dicts.
    """
    diagram_dir = get_diagram_dir(subject, medium)
    doc = fitz.open(str(pdf_path))
    diagrams: list[dict] = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)

        for img_idx, img_info in enumerate(image_list):
            xref = img_info[0]
            try:
                base_image = doc.extract_image(xref)
            except Exception:
                continue

            if not base_image or not base_image.get("image"):
                continue

            image_bytes = base_image["image"]
            ext = base_image.get("ext", "png")

            # Skip very small images (likely icons/bullets)
            width = base_image.get("width", 0)
            height = base_image.get("height", 0)
            if width < 80 or height < 80:
                continue

            image_id = f"page_{page_num + 1}_img_{img_idx}"
            filename = f"{image_id}.{ext}"
            filepath = diagram_dir / filename

            with open(filepath, "wb") as f:
                f.write(image_bytes)

            # Try to find nearby caption text
            caption = _find_caption(page, img_info)

            diagrams.append({
                "id": image_id,
                "subject": subject,
                "medium": medium,
                "page_number": page_num + 1,
                "filename": filename,
                "width": width,
                "height": height,
                "caption": caption,
            })

    doc.close()
    return diagrams


def _find_caption(page, img_info) -> str:
    """Best-effort attempt to find caption text near an image."""
    try:
        # Get text blocks on the page
        blocks = page.get_text("blocks")
        # Look for blocks containing "Fig", "Figure", "படம்", "Diagram"
        for block in blocks:
            text = block[4] if len(block) > 4 else ""
            text_lower = text.lower().strip()
            if any(
                kw in text_lower
                for kw in ["fig.", "figure", "diagram", "படம்", "chart", "graph"]
            ):
                return text.strip()[:200]
    except Exception:
        pass
    return ""


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def chunk_pages(
    pages: list[dict], subject: str, medium: str
) -> list[dict]:
    """Split extracted pages into overlapping chunks with metadata."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    all_chunks: list[dict] = []
    current_chapter = "Unknown"

    for page_data in pages:
        page_num = page_data["page_number"]
        text = page_data["text"]

        # Detect chapter from page content
        detected = detect_chapter(text, page_num)
        if detected and not detected.startswith("Page"):
            current_chapter = detected

        chunks = splitter.split_text(text)
        for i, chunk_text in enumerate(chunks):
            all_chunks.append({
                "text": chunk_text,
                "metadata": {
                    "subject": subject,
                    "medium": medium,
                    "page_number": page_num,
                    "chapter": current_chapter,
                    "chunk_index": i,
                },
            })

    return all_chunks


# ---------------------------------------------------------------------------
# Embedding + ChromaDB storage
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_embedding_function():
    """Create the embedding function using EmbeddingGemma-300M."""
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

    from config import EMBEDDING_MODEL, HF_TOKEN

    # Set HF token for gated model access
    if HF_TOKEN:
        import os
        os.environ["HF_TOKEN"] = HF_TOKEN
        os.environ["HUGGING_FACE_HUB_TOKEN"] = HF_TOKEN

    return SentenceTransformerEmbeddingFunction(
        model_name=EMBEDDING_MODEL,
        trust_remote_code=True,
    )


def get_chroma_client():
    """Return a persistent ChromaDB client."""
    import chromadb

    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def store_chunks_in_chroma(
    chunks: list[dict], subject: str, medium: str
) -> int:
    """Embed chunks and store them in a ChromaDB collection.

    Returns the number of chunks stored.
    """
    if not chunks:
        return 0

    client = get_chroma_client()
    embedding_fn = get_embedding_function()
    collection_name = get_collection_name(subject, medium)

    # Delete existing collection if it exists (re-ingest)
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass

    collection = client.get_or_create_collection(
        name=collection_name,
        embedding_function=embedding_fn,
    )

    # ChromaDB has a batch limit; process in batches of 100
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        ids = [f"{collection_name}_{i + j}" for j in range(len(batch))]
        documents = [c["text"] for c in batch]
        metadatas = [c["metadata"] for c in batch]

        collection.add(ids=ids, documents=documents, metadatas=metadatas)

    return len(chunks)


# ---------------------------------------------------------------------------
# Full ingestion pipeline
# ---------------------------------------------------------------------------

def ingest_textbook(subject: str, medium: str) -> dict:
    """Run the full ingestion pipeline for a single textbook.

    Returns a summary dict with counts.
    """
    pdf_path = get_textbook_path(subject, medium)
    if not pdf_path:
        return {"error": f"Textbook not found: {subject}/{medium}"}

    logger.info("Ingesting %s/%s from %s", subject, medium, pdf_path.name)

    # 1. Extract text
    pages = extract_text_from_pdf(pdf_path)
    logger.info("  Extracted %d pages of text", len(pages))

    # 2. Extract images/diagrams
    diagrams = extract_images_from_pdf(pdf_path, subject, medium)
    logger.info("  Extracted %d diagrams", len(diagrams))

    # 3. Chunk text
    chunks = chunk_pages(pages, subject, medium)
    logger.info("  Created %d chunks", len(chunks))

    # 4. Store in ChromaDB
    stored = store_chunks_in_chroma(chunks, subject, medium)
    logger.info("  Stored %d chunks in ChromaDB", stored)

    return {
        "subject": subject,
        "medium": medium,
        "pages": len(pages),
        "diagrams": len(diagrams),
        "chunks": stored,
        "diagram_details": diagrams,
    }


def ingest_all() -> list[dict]:
    """Ingest all textbooks and build the diagram index.

    Returns a list of per-textbook summaries.
    """
    results = []
    all_diagrams: list[dict] = []

    for subject, mediums in TEXTBOOK_MAP.items():
        for medium in mediums:
            result = ingest_textbook(subject, medium)
            results.append(result)
            if "diagram_details" in result:
                all_diagrams.extend(result.pop("diagram_details"))

    # Save diagram index
    with open(DIAGRAM_INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(all_diagrams, f, indent=2, ensure_ascii=False)
    logger.info("Saved diagram index with %d entries", len(all_diagrams))

    return results


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    print("Starting full textbook ingestion …")
    summaries = ingest_all()
    for s in summaries:
        print(f"  {s['subject']}/{s['medium']}: {s.get('pages', 0)} pages, "
              f"{s.get('diagrams', 0)} diagrams, {s.get('chunks', 0)} chunks")
    print("Done!")
