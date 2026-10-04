import asyncio
from unittest.mock import AsyncMock, patch

from google.adk import Agent
from google.genai import types

from padi_adk.runtime import (
    TutorRequest,
    TutorRuntime,
    agent_name_for,
    build_tutor_prompt,
)
from google.adk.models.lite_llm import LiteLLMClient

from padi_adk.agent import RetryingLiteLLMClient, build_subject_agents
from padi_adk.tools import Grounding


def test_all_subjects_route_deterministically():
    assert {
        subject: agent_name_for(subject)
        for subject in ("tamil", "english", "maths", "science", "social")
    } == {
        "tamil": "tamil_tutor",
        "english": "english_tutor",
        "maths": "maths_tutor",
        "science": "science_tutor",
        "social": "social_tutor",
    }


def test_subject_agents_finish_each_workflow_node_after_one_answer():
    agents = build_subject_agents(model="test-model")
    assert all(agent.mode == "single_turn" for agent in agents.values())
    assert all(
        agent.generate_content_config.max_output_tokens == 500
        for agent in agents.values()
    )


def test_model_adapter_retries_temporary_provider_limits():
    client = RetryingLiteLLMClient()
    with patch.object(
        LiteLLMClient, "acompletion", new=AsyncMock(return_value="ok")
    ) as completion:
        result = asyncio.run(client.acompletion("provider/model", [], []))

    assert result == "ok"
    assert completion.await_args.kwargs["num_retries"] == 2
    assert completion.await_args.kwargs["timeout"] == 60


def test_prompt_propagates_language_medium_context_and_history():
    request = TutorRequest(
        subject="maths",
        medium="ta",
        language="ta-Latn",
        message="x solve pannu",
        session_id="browser-1",
        history=[{"role": "user", "content": "Earlier question"}],
    )
    prompt = build_tutor_prompt(
        request,
        Grounding(source="textbook", context="Page 10 algebra", references=[], diagrams=[]),
    )

    assert "Thanglish" in prompt
    assert "Tamil medium" in prompt
    assert "Page 10 algebra" in prompt
    assert "Earlier question" in prompt
    assert "x solve pannu" in prompt


def test_runtime_keeps_adk_session_and_returns_structured_output():
    calls = []

    async def answer(ctx):
        calls.append(ctx.session.id)
        return types.Content(
            role="model",
            parts=[types.Part.from_text(text=f"answer {len(calls)}")],
        )

    agents = {
        subject: Agent(
            name=agent_name_for(subject),
            model="unused",
            instruction="test",
            before_agent_callback=answer,
            rerun_on_resume=True,
        )
        for subject in ("tamil", "english", "maths", "science", "social")
    }
    grounding = Grounding(
        source="textbook",
        context="Textbook content",
        references=[{"page": 4, "chapter": "Algebra", "snippet": "x"}],
        diagrams=[{"id": "d1", "caption": "graph", "page_number": 4}],
    )
    runtime = TutorRuntime(agents=agents, grounding_provider=lambda *_args: grounding)

    async def run():
        first = await runtime.ask(TutorRequest(
            subject="maths", medium="en", language="en", message="First", session_id="same"
        ))
        second = await runtime.ask(TutorRequest(
            subject="maths", medium="en", language="en", message="Follow up", session_id="same"
        ))
        return first, second

    first, second = asyncio.run(run())
    assert first.reply == "answer 1"
    assert second.reply == "answer 2"
    assert first.source == "textbook"
    assert first.references[0]["page"] == 4
    assert calls == ["same", "same"]
