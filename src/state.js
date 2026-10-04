import { questions } from './data.js';

const routes = new Set(['chat', 'practice', 'tests', 'progress', 'login']);
const languageIds = new Set(['ta-Latn', 'en', 'ta']);
const questionById = new Map(questions.map((question) => [question.id, question]));

function createSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `padi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createInitialSession(language = 'ta-Latn') {
  return {
    sessionId: createSessionId(),
    route: '#/chat',
    language: languageIds.has(language) ? language : 'ta-Latn',
    learningMedium: 'ta',
    drawerOpen: false,
    selectedSubjectId: 'maths',
    chat: { messages: [] },
    practice: {},
    test: null,
    attempts: [],
  };
}

export function appReducer(state, action) {
  switch (action.type) {
    case 'route/set': return { ...state, route: normalizeRoute(action.route), drawerOpen: false };
    case 'language/set': return languageIds.has(action.language) ? { ...state, language: action.language } : state;
    case 'medium/set': return ['ta', 'en'].includes(action.medium) ? { ...state, learningMedium: action.medium } : state;
    case 'drawer/toggle': return { ...state, drawerOpen: !state.drawerOpen };
    case 'drawer/close': return state.drawerOpen ? { ...state, drawerOpen: false } : state;
    case 'subject/set': return { ...state, selectedSubjectId: action.subjectId };
    case 'chat/set': return { ...state, chat: action.chat };
    case 'practice/set': return { ...state, practice: action.practice };
    case 'test/set': return { ...state, test: action.test };
    case 'attempt/add': return state.attempts.some(({ id }) => id === action.attempt?.id) ? state : { ...state, attempts: [...state.attempts, action.attempt] };
    default: return state;
  }
}

export function normalizeRoute(hash = '') {
  const value = hash.startsWith('#/') ? hash : `#/${hash.replace(/^#?\/?/, '')}`;
  const route = value.slice(2).split(/[/?]/, 1)[0];
  return routes.has(route) ? value : '#/chat';
}

export function scoreAnswers(questionIds, answers = {}) {
  const unansweredQuestionIds = getUnanswered(questionIds, answers);
  const unanswered = new Set(unansweredQuestionIds);
  const correctQuestionIds = questionIds.filter((id) => !unanswered.has(id) && questionById.get(id)?.correctChoiceId === answers[id]);
  const correct = new Set(correctQuestionIds);
  return {
    score: correctQuestionIds.length,
    total: questionIds.length,
    correctQuestionIds,
    incorrectQuestionIds: questionIds.filter((id) => !unanswered.has(id) && !correct.has(id)),
    unansweredQuestionIds,
  };
}

export function getUnanswered(questionIds, answers = {}) {
  return questionIds.filter((id) => answers[id] == null || answers[id] === '');
}

export function getPracticeTarget(hash = '') {
  const query = hash.split('?')[1];
  if (!query) return null;
  const params = new URLSearchParams(query);
  const question = questionById.get(params.get('question'));
  if (!question) return null;
  const topicQuestions = questions.filter(({ topicId }) => topicId === question.topicId);
  return {
    subjectId: question.subjectId,
    topicId: question.topicId,
    questionId: question.id,
    questionIndex: topicQuestions.findIndex(({ id }) => id === question.id),
  };
}

export function getRemainingSeconds(deadline, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function shouldAutoSubmit(session, now = Date.now()) {
  return session?.attempt == null && session?.submittedAt == null && getRemainingSeconds(session?.deadline, now) === 0;
}

export function createAttemptSnapshot(input) {
  if (!['mock', 'practice'].includes(input?.type)) {
    throw new TypeError('Invalid attempt type');
  }
  if (!['manual', 'time-expired'].includes(input.submissionReason)) {
    throw new TypeError('Invalid submission reason');
  }
  if (input.type !== 'mock' && input.submissionReason === 'time-expired') {
    throw new TypeError('Invalid submission reason for attempt type');
  }
  if (!Number.isFinite(input.submittedAt)) {
    throw new TypeError('Invalid submittedAt');
  }
  if (!Array.isArray(input.questionIds) || input.questionIds.some((id) => !questionById.has(id))) {
    throw new TypeError('Unknown question ID');
  }
  const questionIds = [...input.questionIds];
  const answers = { ...input.answers };
  for (const questionId of questionIds) {
    const selectedChoiceId = answers[questionId];
    if (selectedChoiceId != null && selectedChoiceId !== '' &&
        !questionById.get(questionId).choices.some(({ id }) => id === selectedChoiceId)) {
      throw new TypeError(`Unknown choice ID for ${questionId}`);
    }
  }
  const result = scoreAnswers(questionIds, answers);
  Object.freeze(result.correctQuestionIds);
  Object.freeze(result.incorrectQuestionIds);
  Object.freeze(result.unansweredQuestionIds);
  return Object.freeze({
    ...input,
    questionIds: Object.freeze(questionIds),
    answers: Object.freeze(answers),
    result: Object.freeze(result),
  });
}

export function createMockAttempt({ id, test, answers, startedAt, submittedAt, submissionReason }) {
  const snapshot = createAttemptSnapshot({
    id,
    type: 'mock',
    testId: test.id,
    topicId: test.topicId ?? questionById.get(test.questionIds[0])?.topicId,
    questionIds: test.questionIds,
    answers,
    startedAt,
    submittedAt,
    submissionReason,
  });
  return Object.freeze({
    ...snapshot,
    unansweredQuestionIds: snapshot.result.unansweredQuestionIds,
  });
}

export function submitMockSession(session, test, submissionReason, submittedAt = Date.now(), id = `mock-${submittedAt}`) {
  if (session.attempt) return session;
  const effectiveReason = submittedAt >= session.deadline ? 'time-expired' : submissionReason;
  return {
    ...session,
    confirmSubmit: false,
    attempt: createMockAttempt({
      id,
      test,
      answers: session.answers,
      startedAt: session.startedAt,
      submittedAt,
      submissionReason: effectiveReason,
    }),
  };
}

export function deriveProgress(attempts = []) {
  const completed = attempts.filter((attempt) => attempt?.submittedAt != null && attempt.result);
  const mistakeCounts = new Map();
  let correctAnswers = 0;
  let totalQuestions = 0;

  for (const attempt of completed) {
    correctAnswers += attempt.result.score;
    totalQuestions += attempt.result.total;
    for (const questionId of attempt.result.incorrectQuestionIds) {
      mistakeCounts.set(questionId, (mistakeCounts.get(questionId) ?? 0) + 1);
    }
  }

  return {
    completedAttempts: completed.length,
    correctAnswers,
    totalQuestions,
    percentage: totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    mistakes: [...mistakeCounts].map(([questionId, count]) => ({ questionId, count })),
  };
}
