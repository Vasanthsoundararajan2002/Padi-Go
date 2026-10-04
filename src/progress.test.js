import test from 'node:test';
import assert from 'node:assert/strict';

import { getText, questions } from './data.js';
import { createAttemptSnapshot, deriveProgress } from './state.js';

const q1 = 'maths.algebra.linear-equations.q01';
const q2 = 'maths.algebra.linear-equations.q02';

test('progress is empty until an attempt is completed', () => {
  assert.deepEqual(deriveProgress([{ id: 'draft', submittedAt: null }]), {
    completedAttempts: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    percentage: 0,
    mistakes: [],
  });
});

test('completed history summary and repeated mistakes come from snapshots', () => {
  const attempts = [
    createAttemptSnapshot({ id: 'practice-1', type: 'practice', questionIds: [q1], answers: { [q1]: 'a' }, submittedAt: 100, submissionReason: 'manual' }),
    createAttemptSnapshot({ id: 'mock-1', type: 'mock', testId: 'maths.sample-01', questionIds: [q1, q2], answers: { [q1]: 'c', [q2]: 'a' }, submittedAt: 200, submissionReason: 'manual' }),
  ];

  assert.deepEqual(deriveProgress(attempts), {
    completedAttempts: 2,
    correctAnswers: 1,
    totalQuestions: 3,
    percentage: 33,
    mistakes: [{ questionId: q1, count: 2 }],
  });
});

test('mistake data supports all languages and an exact related-practice link', () => {
  const question = questions.find(({ id }) => id === q1);
  assert.equal(getText(question.explanation, 'ta-Latn').length > 0, true);
  assert.equal(getText(question.explanation, 'en').length > 0, true);
  assert.equal(getText(question.explanation, 'ta').length > 0, true);
  assert.equal(
    `#/practice?subject=${question.subjectId}&topic=${question.topicId}&question=${question.id}`,
    '#/practice?subject=maths&topic=maths.algebra.linear-equations&question=maths.algebra.linear-equations.q01',
  );
});
