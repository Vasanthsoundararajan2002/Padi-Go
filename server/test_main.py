"""Integration checks for the FastAPI-to-ADK adapter."""

import asyncio
import time
from types import SimpleNamespace
from unittest.mock import patch

import httpx

from main import app
from padi_adk.runtime import TutorResponse


def _payload(**overrides):
    return {
        "subject": "maths",
        "medium": "en",
        "language": "en",
        "message": "quadratic equation",
        "session_id": "browser-session",
        **overrides,
    }


def test_health_stays_responsive_while_adk_chat_runs():
    class SlowRuntime:
        async def ask(self, request):
            assert request.session_id == "browser-session"
            await asyncio.sleep(1.2)
            return TutorResponse(reply="An answer")

    async def run():
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            started = time.monotonic()
            chat = asyncio.create_task(client.post("/api/chat", json=_payload()))
            await asyncio.sleep(0.05)
            health = await client.get("/api/health")
            elapsed = time.monotonic() - started
            assert health.status_code == 200
            assert elapsed < 0.9
            assert (await chat).json()["reply"] == "An answer"

    with patch("main.GROQ_API_KEY", "test-key"), patch(
        "main.get_runtime", return_value=SlowRuntime()
    ):
        asyncio.run(run())


def test_missing_model_credentials_returns_safe_503():
    async def run():
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.post("/api/chat", json=_payload())

    with patch("main.GROQ_API_KEY", ""):
        response = asyncio.run(run())
    assert response.status_code == 503
    assert response.json()["detail"] == "Tutor model credentials are not configured."


def test_provider_failure_is_not_exposed_to_the_browser():
    runtime = SimpleNamespace()

    async def fail(_request):
        raise RuntimeError("secret provider payload")

    runtime.ask = fail

    async def run():
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.post("/api/chat", json=_payload())

    with patch("main.GROQ_API_KEY", "test-key"), patch(
        "main.get_runtime", return_value=runtime
    ):
        response = asyncio.run(run())
    assert response.status_code == 503
    assert response.json()["detail"] == "Tutor is temporarily unavailable. Please try again."
    assert "secret" not in response.text


def test_invalid_subject_medium_and_language_are_422():
    async def run():
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            return [
                await client.post("/api/chat", json=_payload(subject="geography")),
                await client.post("/api/chat", json=_payload(medium="fr")),
                await client.post("/api/chat", json=_payload(language="mixed")),
            ]

    assert [response.status_code for response in asyncio.run(run())] == [422, 422, 422]
