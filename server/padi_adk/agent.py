"""Five subject-specialist Google ADK agents."""

from __future__ import annotations

from google.adk import Agent
from google.adk.models.lite_llm import LiteLLMClient, LiteLlm
from google.genai import types

from config import LLM_MODEL

SUBJECT_GUIDANCE = {
    "tamil": "Teach Tamil literature, grammar, poetry, and prose warmly and accurately.",
    "english": (
        "Teach English literature, grammar, comprehension, and writing. Preserve poem "
        "line breaks with > before each quoted line and a blank line between stanzas."
    ),
    "maths": (
        "Teach algebra, geometry, trigonometry, statistics, and number theory. Always "
        "show every step and explain why it works."
    ),
    "science": (
        "Teach Physics, Chemistry, and Biology with relatable examples. For experiments "
        "state procedure, observation, and inference."
    ),
    "social": (
        "Teach History, Geography, Civics, and Economics. Explain causes, consequences, "
        "timelines, and links to Tamil Nadu and India."
    ),
}


def _provider_model_name() -> str:
    return LLM_MODEL if LLM_MODEL.startswith("groq/") else f"groq/{LLM_MODEL}"


class RetryingLiteLLMClient(LiteLLMClient):
    """Let LiteLLM honor provider retry timing for temporary rate limits."""

    async def acompletion(self, model, messages, tools, **kwargs):
        kwargs.setdefault("num_retries", 2)
        kwargs.setdefault("timeout", 60)
        return await super().acompletion(model, messages, tools, **kwargs)

    def completion(self, model, messages, tools, stream=False, **kwargs):
        kwargs.setdefault("num_retries", 2)
        kwargs.setdefault("timeout", 60)
        return super().completion(model, messages, tools, stream=stream, **kwargs)


def build_subject_agents(model=None) -> dict[str, Agent]:
    """Build the specialist agents with one shared ADK model adapter."""
    adk_model = model or LiteLlm(
        model=_provider_model_name(),
        llm_client=RetryingLiteLLMClient(),
    )
    return {
        subject: Agent(
            name=f"{subject}_tutor",
            description=f"Tamil Nadu Class 10 {subject} tutor",
            model=adk_model,
            instruction=(
                "You are a patient Tamil Nadu State Board Class 10 teacher. "
                f"{guidance} Follow the supplied language, medium, source, and grounding "
                "rules exactly. Be concise, encouraging, and honest about limits."
            ),
            generate_content_config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=500,
            ),
            mode="single_turn",
            rerun_on_resume=True,
        )
        for subject, guidance in SUBJECT_GUIDANCE.items()
    }
