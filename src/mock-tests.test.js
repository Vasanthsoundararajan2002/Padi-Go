import test from 'node:test';
import assert from 'node:assert/strict';

import { mockTests } from './data.js';
import { getRemainingSeconds, shouldAutoSubmit, submitMockSession } from './state.js';

const testData = mockTests[0];

test('remaining time is derived from the deadline and rounds partial seconds up', () => {
  assert.equal(getRemainingSeconds(61_001, 1_000), 61);
  assert.equal(getRemainingSeconds(1_001, 1_000), 1);
  assert.equal(getRemainingSeconds(999, 1_000), 0);
});

test('automatic submission respects session wrappers and unfinished attempt records', () => {
  const session = { deadline: 5_000, attempt: null };
  assert.equal(shouldAutoSubmit(session, 4_999), false);
  assert.equal(shouldAutoSubmit(session, 5_000), true);
  assert.equal(shouldAutoSubmit({ ...session, attempt: {} }, 5_000), false);
  assert.equal(shouldAutoSubmit({ ...session, attempt: { submittedAt: null } }, 5_000), false);
  assert.equal(shouldAutoSubmit({ deadline: 5_000, submittedAt: null }, 5_000), true);
});

test('manual submission snapshots the final changed answers exactly once', () => {
  const questionId = testData.questionIds[0];
  const session = { startedAt: 100, deadline: 300_100, answers: { [questionId]: 'b' }, attempt: null };
  const submitted = submitMockSession(session, testData, 'manual', 200, 'attempt-1');
  const repeated = submitMockSession(submitted, testData, 'manual', 300, 'attempt-2');

  assert.equal(submitted.attempt.answers[questionId], 'b');
  assert.equal(submitted.attempt.result.score, 1);
  assert.equal(submitted.attempt.submissionReason, 'manual');
  assert.strictEqual(repeated, submitted);
});

test('expiry submission keeps unanswered questions and is exactly once', () => {
  const session = { startedAt: 100, deadline: 200, answers: {}, attempt: null };
  const submitted = submitMockSession(session, testData, 'time-expired', 200, 'attempt-expired');
  const repeated = submitMockSession(submitted, testData, 'time-expired', 250, 'attempt-late');

  assert.deepEqual(submitted.attempt.result.unansweredQuestionIds, testData.questionIds);
  assert.equal(submitted.attempt.submissionReason, 'time-expired');
  assert.strictEqual(repeated, submitted);
});
