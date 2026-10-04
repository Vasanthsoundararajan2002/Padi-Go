/**
 * API client for the Padi And Go AI backend.
 * Replaces the old hardcoded getTutorReply with real AI agent calls.
 */

const API_BASE = '/api';

/**
 * Send a message to a subject AI agent.
 *
 * @param {string} subject  - Subject id: tamil, english, maths, science, social
 * @param {string} medium   - Textbook medium: 'en' or 'ta'
 * @param {string} language - UI language: 'ta-Latn', 'en', or 'ta'
 * @param {string} message  - The student's question
 * @param {Array}  history  - Conversation history [{role, content}, ...]
 * @param {string} sessionId - Volatile browser-session identifier for ADK memory
 * @returns {Promise<{reply, source, references, diagrams, error}>}
 */
export async function sendMessage(subject, medium, language, message, history = [], sessionId = 'preview') {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, medium, language, message, history, session_id: sessionId }),
  });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error || result.detail || `Server error: ${response.status}`);
  return result;
}

/**
 * Get the URL for a textbook diagram image.
 */
export function getDiagramUrl(subject, medium, imageId) {
  return `${API_BASE}/diagram/${subject}/${medium}/${imageId}`;
}

/**
 * Fetch the list of available subjects and their mediums.
 */
export async function fetchSubjects() {
  try {
    const response = await fetch(`${API_BASE}/subjects`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Check if the backend server is running.
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
