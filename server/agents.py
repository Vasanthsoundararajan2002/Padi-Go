"""Subject-specific AI agent logic with teaching-focused system prompts."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from config import GROQ_API_KEY, LLM_MODEL
from diagrams import find_diagrams_for_pages, search_diagrams_by_caption
from rag import RAGResponse, format_context, get_page_references, retrieve
from search import SearchResponse, format_search_context, web_search

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# System prompts — one per subject
# ---------------------------------------------------------------------------

LANGUAGE_INSTRUCTIONS = {
    "ta-Latn": "Respond in Thanglish (Tamil written in English letters). Example: 'Nalla kelvi! Idha ippadi solve pannalaam…'",
    "en": "Respond in clear, simple English suitable for a Class 10 student.",
    "ta": "Respond in Tamil (தமிழ்). Use proper Tamil script throughout.",
}

SUBJECT_PROMPTS = {
    "tamil": (
        "You are a warm, patient Tamil language teacher for Tamil Nadu State Board Class 10. "
        "You teach Tamil literature, grammar (இலக்கணம்), poetry (பாடல்), and prose (உரைநடை). "
        "Help students understand the beauty of Tamil language. Explain poems with meaning and context. "
        "For grammar, give clear rules with examples."
    ),
    "english": (
        "You are an encouraging English teacher for Tamil Nadu State Board Class 10. "
        "You teach English literature, grammar, comprehension, and writing skills. "
        "Explain literary devices, themes, and character analysis in stories and poems. "
        "When quoting poem lines from the textbook, preserve their original line breaks. "
        "Put > before each quoted line and leave a blank line between stanzas. "
        "For grammar topics, provide clear rules with examples. "
        "Help students improve their reading comprehension and writing."
    ),
    "maths": (
        "You are a patient, step-by-step Mathematics teacher for Tamil Nadu State Board Class 10. "
        "You teach algebra, geometry, trigonometry, statistics, and number theory. "
        "ALWAYS show your working step by step. Never skip steps. "
        "Use simple explanations before formal notation. "
        "When solving problems, explain WHY each step works, not just what to do. "
        "If a formula is needed, state the formula first, then show how to apply it."
    ),
    "science": (
        "You are a curious, enthusiastic Science teacher for Tamil Nadu State Board Class 10. "
        "You teach Physics, Chemistry, and Biology. "
        "Explain scientific concepts with real-world examples students can relate to. "
        "For experiments, describe the procedure, observation, and inference clearly. "
        "Use analogies to make complex ideas simple. "
        "When chemical equations are involved, balance them and explain the reaction."
    ),
    "social": (
        "You are a knowledgeable Social Science teacher for Tamil Nadu State Board Class 10. "
        "You teach History, Geography, Civics, and Economics. "
        "Connect historical events to their causes and consequences. "
        "For Geography, relate concepts to Tamil Nadu and India specifically. "
        "For Civics, explain constitutional concepts in simple terms. "
        "Use timelines, comparisons, and stories to make learning engaging."
    ),
}


def _build_system_prompt(
    subject: str, medium: str, language: str
) -> str:
    """Construct the full system prompt for a subject agent."""
    base = SUBJECT_PROMPTS.get(subject, SUBJECT_PROMPTS["maths"])
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["en"])
    medium_label = "Tamil medium" if medium == "ta" else "English medium"

    return (
        f"{base}\n\n"
        f"MEDIUM: You are teaching from the {medium_label} textbook.\n\n"
        f"LANGUAGE: {lang_instruction}\n\n"
        "RULES:\n"
        "1. Always teach step by step. Explain concepts before giving answers.\n"
        "2. When textbook content is provided, base your answer on it and cite the source: "
        "'As explained in [Chapter], Page [number]…'\n"
        "3. If a diagram from the textbook is relevant, mention it and say "
        "'[DIAGRAM: image_id]' so the UI can display it.\n"
        "4. If the question goes beyond the textbook and web search results are provided, "
        "use them but clearly say: 'This topic is not in your textbook, but here is what I found…'\n"
        "5. Be encouraging and supportive. Use phrases like "
        "'Nalla kelvi!', 'Good question!', 'Very good!' etc.\n"
        "6. Keep explanations concise but thorough. Use bullet points and numbered steps.\n"
        "7. If you truly don't know something, say so honestly.\n"
        "8. For mathematical expressions, use clear notation (e.g. x², √, ×, ÷).\n"
    )


# ---------------------------------------------------------------------------
# LLM client
# ---------------------------------------------------------------------------

def _get_llm() -> ChatGroq:
    """Create a Groq LLM client."""
    return ChatGroq(
        api_key=GROQ_API_KEY,
        model_name=LLM_MODEL,
        temperature=0.3,
        max_tokens=900,
    )


# ---------------------------------------------------------------------------
# Agent response
# ---------------------------------------------------------------------------

@dataclass
class AgentResponse:
    """The complete response from a subject agent."""
    reply: str = ""
    source: str = "textbook"  # "textbook" | "web_search" | "general"
    references: list[dict] = field(default_factory=list)
    diagrams: list[dict] = field(default_factory=list)
    error: str | None = None


def ask_agent(
    subject: str,
    medium: str,
    language: str,
    message: str,
    history: list[dict] | None = None,
) -> AgentResponse:
    """Send a question to the subject agent and get a teaching response.

    Flow:
    1. RAG retrieval from textbook
    2. If no relevant content → web search fallback
    3. LLM generates response with context
    4. Post-process for diagram references
    """
    history = history or []

    # 1. RAG retrieval
    rag_result: RAGResponse = retrieve(message, subject, medium)
    context = ""
    source = "textbook"
    references: list[dict] = []

    if rag_result.has_relevant_content:
        context = format_context(rag_result)
        references = get_page_references(rag_result)
        source = "textbook"
    else:
        # 2. Web search fallback
        search_result: SearchResponse = web_search(message, subject)
        if search_result.success and search_result.results:
            context = format_search_context(search_result)
            source = "web_search"
        else:
            source = "general"

    # 3. Build messages for LLM
    system_prompt = _build_system_prompt(subject, medium, language)
    messages = [SystemMessage(content=system_prompt)]

    # Add context
    if context:
        context_label = (
            "TEXTBOOK CONTENT (use this to answer the student's question):"
            if source == "textbook"
            else "WEB SEARCH RESULTS (the textbook doesn't cover this; use these):"
        )
        messages.append(SystemMessage(content=f"{context_label}\n\n{context}"))

    # Add chat history
    for entry in history[-10:]:  # Keep last 10 messages for context
        role = entry.get("role", "user")
        content = entry.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        else:
            messages.append(AIMessage(content=content))

    # Add current question
    messages.append(HumanMessage(content=message))

    # 4. Call LLM
    try:
        llm = _get_llm()
        response = llm.invoke(messages)
        reply = response.content
    except Exception as e:
        logger.error("LLM call failed: %s", e)
        return AgentResponse(
            error=f"AI service error: {str(e)}",
            source=source,
        )

    # 5. Post-process: find diagrams
    diagrams: list[dict] = []

    # Try the two best-matching pages; skip pages that only contain QR codes.
    if references:
        for reference in references[:2]:
            matches = find_diagrams_for_pages(subject, medium, [reference["page"]])
            diagrams = [d for d in matches if min(d.get("width", 0), d.get("height", 0)) >= 150]
            if diagrams:
                break

    # Also check if the user asked about a diagram specifically
    diagram_keywords = ["diagram", "figure", "image", "picture", "graph", "chart",
                        "படம்", "வரைபடம்", "வரிவடிவம்"]
    if not references and any(kw in message.lower() for kw in diagram_keywords):
        caption_matches = search_diagrams_by_caption(subject, medium, message)
        # Merge without duplicates
        existing_ids = {d["id"] for d in diagrams}
        for d in caption_matches:
            if d["id"] not in existing_ids:
                diagrams.append(d)

    # Tiny square images in these PDFs are QR codes, not teaching diagrams.
    diagrams = [d for d in diagrams if min(d.get("width", 0), d.get("height", 0)) >= 150][:2]

    return AgentResponse(
        reply=reply,
        source=source,
        references=references,
        diagrams=diagrams,
    )
