"""ADK 2 workflow, routing, sessions, and structured response conversion."""

from __future__ import annotations

import asyncio
import json
from collections.abc import Callable
from typing import Literal

from google.adk import Workflow
from google.adk.runners import InMemoryRunner
from google.adk.workflow import FunctionNode, RetryConfig, START
from google.genai import types
from pydantic import BaseModel, Field

from .agent import build_subject_agents
from .tools import Grounding, prepare_grounding

SubjectId = Literal["tamil", "english", "maths", "science", "social"]
LanguageId = Literal["ta-Latn", "en", "ta"]
MediumId = Literal["en", "ta"]

LANGUAGE_RULES = {
    "ta-Latn": "Answer in natural Thanglish (Tamil written using English letters).",
    "en": "Answer in clear, simple English suitable for a Class 10 student.",
    "ta": "Answer fully in proper Tamil script.",
}


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class TutorRequest(BaseModel):
    subject: SubjectId
    medium: MediumId = "en"
    language: LanguageId = "ta-Latn"
    message: str = Field(min_length=1)
    session_id: str = Field(min_length=1, max_length=128)
    history: list[HistoryMessage] = Field(default_factory=list)


class TutorResponse(BaseModel):
    reply: str
    source: Literal["textbook", "web_search", "general"] = "textbook"
    references: list[dict] = Field(default_factory=list)
    diagrams: list[dict] = Field(default_factory=list)
    error: str | None = None


def agent_name_for(subject: SubjectId | str) -> str:
    if subject not in {"tamil", "english", "maths", "science", "social"}:
        raise ValueError(f"Unsupported subject: {subject}")
    return f"{subject}_tutor"


def build_tutor_prompt(request: TutorRequest, grounding: Grounding) -> str:
    medium = "Tamil medium" if request.medium == "ta" else "English medium"
    if grounding.source == "textbook":
        source_rule = "Use the textbook content below as the authority and cite its page numbers."
    elif grounding.source == "web_search":
        source_rule = (
            "The textbook had no relevant passage. Clearly label the answer as web-supported "
            "before using the search notes below."
        )
    else:
        source_rule = (
            "No relevant textbook or configured web result was found. Do not invent an answer; "
            "say this sample tutor cannot answer from its available sources and suggest a related "
            "Class 10 question."
        )

    history = "\n".join(
        f"{item.role}: {item.content}" for item in request.history[-10:]
    ) or "(none supplied)"
    context = grounding.context or "(no grounded content available)"
    return (
        f"INTERFACE LANGUAGE: {LANGUAGE_RULES[request.language]}\n"
        f"LEARNING MEDIUM: {medium}\n"
        f"SOURCE RULE: {source_rule}\n\n"
        "TEACHING RULES:\n"
        "1. Guide the learner step by step; explain before giving the final answer.\n"
        "2. Never claim that unavailable material came from the textbook.\n"
        "3. Keep mathematical notation readable.\n"
        "4. Preserve poetry as Markdown blockquotes with the original line breaks.\n\n"
        f"RECENT CONVERSATION:\n{history}\n\n"
        f"GROUNDING:\n{context}\n\n"
        f"STUDENT QUESTION:\n{request.message}"
    )


class TutorRuntime:
    """Own one ADK workflow and its volatile in-memory session service."""

    APP_NAME = "padi_and_go_adk"
    USER_ID = "learning_preview"

    def __init__(
        self,
        *,
        agents: dict | None = None,
        grounding_provider: Callable[[str, str, str], Grounding] = prepare_grounding,
    ):
        self.agents = agents or build_subject_agents()
        self.grounding_provider = grounding_provider
        self._session_lock = asyncio.Lock()
        self._turn_lock = asyncio.Lock()

        async def dispatch(ctx, node_input):
            request_data = ctx.state.get("request")
            if request_data is None:
                raw_message = "".join(
                    part.text or "" for part in (getattr(node_input, "parts", None) or [])
                )
                try:
                    request_data = json.loads(raw_message)
                except json.JSONDecodeError:
                    request_data = {
                        "subject": "maths",
                        "medium": "en",
                        "language": "en",
                        "message": raw_message,
                        "session_id": "adk-web-preview",
                    }
            request = TutorRequest.model_validate(request_data)
            grounding = await asyncio.to_thread(
                self.grounding_provider,
                request.message,
                request.subject,
                request.medium,
            )
            prompt = build_tutor_prompt(request, grounding)
            answer = await ctx.run_node(
                self.agents[request.subject],
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)],
                ),
            )
            if isinstance(answer, types.Content):
                answer = "".join(part.text or "" for part in answer.parts or [])
            return TutorResponse(
                reply=str(answer).strip(),
                source=grounding.source,
                references=grounding.references,
                diagrams=grounding.diagrams,
            ).model_dump()

        dispatch_node = FunctionNode(
            func=dispatch,
            name="route_and_teach",
            rerun_on_resume=True,
            retry_config=RetryConfig(
                max_attempts=3,
                initial_delay=15.0,
                max_delay=30.0,
                backoff_factor=2.0,
                jitter=0.2,
            ),
        )
        self.workflow = Workflow(
            name="padi_tutor_workflow",
            description="Retrieve, route, teach, and return a grounded Class 10 answer",
            edges=[(START, dispatch_node)],
        )
        self.runner = InMemoryRunner(node=self.workflow, app_name=self.APP_NAME)

    async def _ensure_session(self, session_id: str) -> None:
        session = await self.runner.session_service.get_session(
            app_name=self.APP_NAME,
            user_id=self.USER_ID,
            session_id=session_id,
        )
        if session is not None:
            return
        async with self._session_lock:
            session = await self.runner.session_service.get_session(
                app_name=self.APP_NAME,
                user_id=self.USER_ID,
                session_id=session_id,
            )
            if session is None:
                await self.runner.session_service.create_session(
                    app_name=self.APP_NAME,
                    user_id=self.USER_ID,
                    session_id=session_id,
                )

    async def ask(self, request: TutorRequest) -> TutorResponse:
        await self._ensure_session(request.session_id)
        async with self._turn_lock:
            output = None
            async for event in self.runner.run_async(
                user_id=self.USER_ID,
                session_id=request.session_id,
                new_message=types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=request.message)],
                ),
                state_delta={"request": request.model_dump()},
            ):
                if isinstance(event.output, dict) and "reply" in event.output:
                    output = event.output
        if output is None:
            raise RuntimeError("ADK workflow completed without a tutor response")
        return TutorResponse.model_validate(output)


_runtime: TutorRuntime | None = None


def get_runtime() -> TutorRuntime:
    global _runtime
    if _runtime is None:
        _runtime = TutorRuntime()
    return _runtime
