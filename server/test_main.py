"""Small integration checks for the local AI API."""

import asyncio
import time
import unittest
from unittest.mock import patch

import httpx

from agents import AgentResponse
from main import app


class ChatConcurrencyTest(unittest.TestCase):
    def test_health_stays_responsive_while_chat_runs(self):
        def slow_answer(**_kwargs):
            time.sleep(1.2)
            return AgentResponse(reply="An answer")

        async def run():
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                started = time.monotonic()
                chat = asyncio.create_task(client.post("/api/chat", json={
                    "subject": "maths", "medium": "en", "message": "quadratic equation"
                }))
                await asyncio.sleep(0.05)
                health = await client.get("/api/health")
                elapsed = time.monotonic() - started
                self.assertEqual(health.status_code, 200)
                self.assertLess(elapsed, 0.9)
                self.assertEqual((await chat).json()["reply"], "An answer")

        with patch("agents.ask_agent", slow_answer):
            asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
