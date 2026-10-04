import test from 'node:test';
import assert from 'node:assert/strict';
import { sendMessage } from './chat.js';

test('chat returns a textbook answer from the API', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.subject, 'science');
    return { ok: true, json: async () => ({ reply: 'Newton explained motion.', source: 'textbook', references: [{ page: 12 }] }) };
  };
  try {
    const result = await sendMessage('science', 'en', 'en', 'Newton law?');
    assert.equal(result.reply, 'Newton explained motion.');
    assert.equal(result.references[0].page, 12);
  } finally { globalThis.fetch = original; }
});

test('chat rejects an API failure so the UI can show the error', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({ detail: 'AI unavailable' }) });
  try {
    await assert.rejects(sendMessage('maths', 'en', 'en', 'Solve x'), /AI unavailable/);
  } finally { globalThis.fetch = original; }
});

test('chat rejects an AI failure in an otherwise successful API response', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ reply: '', error: 'Model unavailable' }) });
  try {
    await assert.rejects(sendMessage('maths', 'en', 'en', 'Solve x'), /Model unavailable/);
  } finally { globalThis.fetch = original; }
});
