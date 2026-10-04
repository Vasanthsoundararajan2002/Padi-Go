import test from 'node:test';
import assert from 'node:assert/strict';

import { mockTests, questions, subjects, topics } from './data.js';
import {
  appReducer,
  createInitialSession,
  createAttemptSnapshot,
  createMockAttempt,
  deriveProgress,
  getRemainingSeconds,
  getUnanswered,
  normalizeRoute,
  shouldAutoSubmit,
  scoreAnswers,
  submitMockSession,
} from './state.js';

const questionIds = [
  'maths.algebra.linear-equations.q01',
  'maths.algebra.linear-equations.q02',
  'maths.algebra.linear-equations.q03',
  'maths.algebra.linear-equations.q04',
  'maths.algebra.linear-equations.q05',
];

test('initial chat has no saved scroll position', () => {
  assert.equal(createInitialSession().chat.scrollTop, undefined);
});

test('attempt/add records a completed attempt ID only once after a route remount', () => {
  const attempt = { id: 'attempt-1', submittedAt: 100, result: { score: 1, total: 1 } };
  const once = appReducer(createInitialSession(), { type: 'attempt/add', attempt });
  const twice = appReducer(once, { type: 'attempt/add', attempt: { id: 'attempt-1' } });
  assert.deepEqual(twice.attempts, [attempt]);
});

test('manual mock confirmation at or after deadline records time expiry atomically', () => {
  const session = { testId: mockTests[0].id, startedAt: 0, deadline: 100, answers: {}, confirmSubmit: true, attempt: null };
  const submitted = submitMockSession(session, mockTests[0], 'manual', 100, 'attempt-expired-at-confirm');
  assert.equal(submitted.attempt.submissionReason, 'time-expired');
});

test('route changes preserve chat, practice, and in-progress test state', () => {
  const activity = {
    chat: { messages: [{ id: 'message-1', role: 'student', text: 'Help' }], scrollTop: 240 },
    practice: { subjectId: 'maths', questionId: questionIds[0], answerId: 'a', hintVisible: true },
    test: { testId: 'maths.sample-01', answers: { [questionIds[0]]: 'b' }, questionIndex: 2 },
  };
  const state = { ...createInitialSession(), ...activity };

  const next = appReducer(state, { type: 'route/set', route: '#/progress' });

  assert.equal(next.route, '#/progress');
  assert.deepEqual(next.chat, activity.chat);
  assert.deepEqual(next.practice, activity.practice);
  assert.deepEqual(next.test, activity.test);
});

test('language changes preserve learning activity and use a supported language', () => {
  const state = {
    ...createInitialSession(),
    chat: { messages: [{ id: 'message-1', role: 'student', text: '2x + 4 = 10' }], scrollTop: 80 },
    practice: { answerId: 'c', hintVisible: true },
    test: { answers: { [questionIds[1]]: 'a' }, questionIndex: 1 },
  };

  const translated = appReducer(state, { type: 'language/set', language: 'ta' });
  const unsupported = appReducer(translated, { type: 'language/set', language: 'fr' });

  assert.equal(translated.language, 'ta');
  assert.equal(unsupported.language, 'ta');
  assert.deepEqual(translated.chat, state.chat);
  assert.deepEqual(translated.practice, state.practice);
  assert.deepEqual(translated.test, state.test);
});

test('normalizeRoute falls back to chat for empty and unknown hashes', () => {
  assert.equal(normalizeRoute(''), '#/chat');
  assert.equal(normalizeRoute('#/not-a-view'), '#/chat');
  assert.equal(normalizeRoute('#/practice?subject=maths'), '#/practice?subject=maths');
});

test('scoreAnswers objectively scores all five sample questions', () => {
  const answers = { q01: 'b', q02: 'a', q03: 'c', q04: 'b', q05: 'a' };
  const byStableId = Object.fromEntries(questionIds.map((id, index) => [id, answers[`q0${index + 1}`]]));

  assert.deepEqual(scoreAnswers(questionIds, byStableId), {
    score: 5,
    total: 5,
    correctQuestionIds: questionIds,
    incorrectQuestionIds: [],
    unansweredQuestionIds: [],
  });
});

test('scoreAnswers uses the final changed answer', () => {
  const answers = { [questionIds[0]]: 'a' };
  answers[questionIds[0]] = 'b';

  assert.equal(scoreAnswers([questionIds[0]], answers).score, 1);
});

test('getUnanswered returns stable IDs with no selected answer', () => {
  assert.deepEqual(getUnanswered(questionIds, {
    [questionIds[0]]: 'b',
    [questionIds[2]]: null,
    [questionIds[4]]: '',
  }), questionIds.slice(1));
});

test('scoreAnswers keeps unanswered questions out of mistakes', () => {
  assert.deepEqual(scoreAnswers(questionIds.slice(0, 3), {
    [questionIds[0]]: 'a',
    [questionIds[1]]: 'a',
  }), {
    score: 1,
    total: 3,
    correctQuestionIds: [questionIds[1]],
    incorrectQuestionIds: [questionIds[0]],
    unansweredQuestionIds: [questionIds[2]],
  });
});

test('createAttemptSnapshot records manual and automatic submission reasons', () => {
  const base = { id: 'attempt-1', type: 'mock', testId: 'maths.sample-01', questionIds, answers: {}, submittedAt: 100 };
  assert.equal(createAttemptSnapshot({ ...base, submissionReason: 'manual' }).submissionReason, 'manual');
  assert.equal(createAttemptSnapshot({ ...base, id: 'attempt-2', submissionReason: 'time-expired' }).submissionReason, 'time-expired');
  assert.throws(() => createAttemptSnapshot({ ...base, submissionReason: 'cancelled' }), /submission reason/i);
});

test('createAttemptSnapshot validates its stable references and completion fields', () => {
  const base = { id: 'attempt-1', type: 'mock', questionIds: [questionIds[0]], answers: {}, submittedAt: 100, submissionReason: 'manual' };
  assert.throws(() => createAttemptSnapshot({ ...base, questionIds: ['unknown.question'] }), /question ID/i);
  assert.throws(() => createAttemptSnapshot({ ...base, submittedAt: null }), /submittedAt/i);
  assert.throws(() => createAttemptSnapshot({ ...base, type: 'lesson' }), /attempt type/i);
  assert.throws(() => createAttemptSnapshot({ ...base, type: 'practice', submissionReason: 'time-expired' }), /submission reason/i);
});

test('createAttemptSnapshot rejects an unknown selected choice ID', () => {
  assert.throws(() => createAttemptSnapshot({
    id: 'attempt-1',
    type: 'practice',
    questionIds: [questionIds[0]],
    answers: { [questionIds[0]]: 'not-a-choice' },
    submittedAt: 100,
    submissionReason: 'manual',
  }), /choice ID/i);
});

test('createAttemptSnapshot copies and freezes answers and result arrays', () => {
  const answers = { [questionIds[0]]: 'b' };
  const snapshot = createAttemptSnapshot({ id: 'attempt-1', type: 'practice', questionIds: [questionIds[0]], answers, submittedAt: 100, submissionReason: 'manual' });
  answers[questionIds[0]] = 'a';

  assert.equal(snapshot.answers[questionIds[0]], 'b');
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.answers), true);
  assert.equal(Object.isFrozen(snapshot.questionIds), true);
  assert.equal(Object.isFrozen(snapshot.result), true);
  assert.equal(Object.isFrozen(snapshot.result.correctQuestionIds), true);
  assert.equal(Object.isFrozen(snapshot.result.incorrectQuestionIds), true);
  assert.equal(Object.isFrozen(snapshot.result.unansweredQuestionIds), true);
});

test('deriveProgress aggregates repeated mistakes by stable question ID', () => {
  const attempts = [
    createAttemptSnapshot({ id: 'attempt-1', type: 'mock', testId: 'maths.sample-01', questionIds: questionIds.slice(0, 2), answers: { [questionIds[0]]: 'a', [questionIds[1]]: 'a' }, submittedAt: 100, submissionReason: 'manual' }),
    createAttemptSnapshot({ id: 'attempt-2', type: 'practice', questionIds: [questionIds[0]], answers: { [questionIds[0]]: 'c' }, submittedAt: 200, submissionReason: 'manual' }),
  ];

  assert.deepEqual(deriveProgress(attempts), {
    completedAttempts: 2,
    correctAnswers: 1,
    totalQuestions: 3,
    percentage: 33,
    mistakes: [{ questionId: questionIds[0], count: 2 }],
  });
});

test('deriveProgress excludes incomplete attempts and unanswered questions from mistakes', () => {
  const completed = createAttemptSnapshot({ id: 'attempt-1', type: 'mock', questionIds: questionIds.slice(0, 2), answers: { [questionIds[0]]: 'a' }, submittedAt: 100, submissionReason: 'manual' });
  const incomplete = { ...completed, id: 'attempt-2', submittedAt: null };

  assert.deepEqual(deriveProgress([completed, incomplete]), {
    completedAttempts: 1,
    correctAnswers: 0,
    totalQuestions: 2,
    percentage: 0,
    mistakes: [{ questionId: questionIds[0], count: 1 }],
  });
});

test('the sample mock test references the five stable question IDs', () => {
  assert.deepEqual(mockTests.find(({ id }) => id === 'maths.sample-01').questionIds, questionIds);
});

test('getRemainingSeconds rounds up and clamps expired deadlines', () => {
  assert.equal(getRemainingSeconds(2501, 0), 3);
  assert.equal(getRemainingSeconds(2500, 0), 3);
  assert.equal(getRemainingSeconds(2000, 0), 2);
  assert.equal(getRemainingSeconds(-1, 0), 0);
});

test('shouldAutoSubmit only expires an unsubmitted attempt', () => {
  assert.equal(shouldAutoSubmit({ deadline: 1000, submittedAt: null }, 1000), true);
  assert.equal(shouldAutoSubmit({ deadline: 1000, submittedAt: 100 }, 1000), false);
  assert.equal(shouldAutoSubmit({ deadline: 1000, submittedAt: 100 }, 999), false);
});

test('createMockAttempt records immutable copied answers and an objective score', () => {
  const answers = { [questionIds[0]]: 'a' };
  const attempt = createMockAttempt({
    id: 'mock-1', test: mockTests[0], answers, startedAt: 10, submittedAt: 20, submissionReason: 'manual',
  });
  answers[questionIds[0]] = 'b';

  assert.deepEqual(attempt, {
    id: 'mock-1',
    type: 'mock',
    testId: mockTests[0].id,
    topicId: 'maths.algebra.linear-equations',
    questionIds,
    answers: { [questionIds[0]]: 'a' },
    startedAt: 10,
    submittedAt: 20,
    submissionReason: 'manual',
    unansweredQuestionIds: questionIds.slice(1),
    result: {
      score: 0,
      total: 5,
      correctQuestionIds: [],
      incorrectQuestionIds: [questionIds[0]],
      unansweredQuestionIds: questionIds.slice(1),
    },
  });
  assert.equal(Object.isFrozen(attempt), true);
  assert.equal(Object.isFrozen(attempt.answers), true);
  assert.equal(Object.isFrozen(attempt.questionIds), true);
  assert.equal(Object.isFrozen(attempt.unansweredQuestionIds), true);
});

test('createMockAttempt uses the final changed answer and preserves unanswered order', () => {
  const answers = { [questionIds[0]]: 'a', [questionIds[2]]: 'a' };
  answers[questionIds[0]] = 'b';
  const attempt = createMockAttempt({
    id: 'mock-2', test: mockTests[0], answers, startedAt: 10, submittedAt: 20, submissionReason: 'time-expired',
  });

  assert.equal(attempt.result.score, 1);
  assert.deepEqual(attempt.unansweredQuestionIds, [questionIds[1], questionIds[3], questionIds[4]]);
});

test('all topic, question, choice, and mock-test references resolve', () => {
  const subjectIds = new Set(subjects.map(({ id }) => id));
  const topicIds = new Set(topics.map(({ id }) => id));
  const knownQuestionIds = new Set(questions.map(({ id }) => id));

  assert.equal(topics.every(({ subjectId }) => subjectIds.has(subjectId)), true);
  assert.equal(questions.every(({ subjectId, topicId, choices, correctChoiceId }) =>
    subjectIds.has(subjectId) && topicIds.has(topicId) && choices.some(({ id }) => id === correctChoiceId)), true);
  assert.equal(mockTests.every(({ subjectId, questionIds: ids }) =>
    subjectIds.has(subjectId) && ids.every((id) => knownQuestionIds.has(id))), true);
});
