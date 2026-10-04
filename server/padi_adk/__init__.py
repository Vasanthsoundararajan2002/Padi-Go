"""Google ADK 2 tutor runtime for Padi and Go."""

from .runtime import TutorRequest, TutorResponse, TutorRuntime, get_runtime

# ADK CLI/Web discovers this exported workflow. FastAPI uses the same singleton.
root_agent = get_runtime().workflow

__all__ = ["TutorRequest", "TutorResponse", "TutorRuntime", "root_agent"]
