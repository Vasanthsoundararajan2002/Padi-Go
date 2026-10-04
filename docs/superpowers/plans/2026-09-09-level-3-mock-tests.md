# Level 3 Mock Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete five-question Maths mock-test flow with instructions, deadline timing, editable answers, unanswered review, confirmed or automatic submission, and objective results.

**Architecture:** Reuse the shared question bank in `src/data.js` and attempt helpers in `src/state.js`. Add pure mock-test lifecycle helpers first, then a self-contained `MockTestsView` that reports immutable completed attempts to the shared app shell through `onComplete`.

**Tech Stack:** React 19, Vite 6, JavaScript ES modules, Node built-in test runner, Lucide React, CSS.

**Spec:** `docs/superpowers/specs/2026-09-09-level-3-mock-tests-design.md`

## Global Constraints

- Implement only Level 3; Chat, Practice, Progress, Login, and shared navigation remain owned by their respective workers.
- Reuse `subjects`, `questions`, `mockTests`, and `getText` from `src/data.js`; do not create a second question bank.
- Use stable IDs from `src/data.js` in all answers and completed attempts.
- Default language is `ta-Latn`; render complete `ta-Latn`, `en`, and `ta` copy without resetting test state.
- Keep all learning activity in React session memory and persist only the existing `padi-language` preference.
- Add no packages, backend, authentication, database, router, state library, or AI integration.
- Preserve the existing green, gold, subject-colour, typography, focus, and reduced-motion conventions.

---

### Task 1: Mock-Test Lifecycle Helpers

**Files:**
- Modify: `src/state.js`
- Modify: `src/state.test.js`

**Interfaces:**
- Consumes: `createAttemptSnapshot(input)` and shared question IDs from `src/data.js`.
- Produces: `getRemainingSeconds(deadline, now) -> number`, `createMockAttempt({ test, answers, startedAt, submittedAt, submissionReason, id }) -> frozen attempt`, and `shouldAutoSubmit({ deadline, submittedAt }, now) -> boolean`.

- [ ] **Step 1: Write failing deadline tests**

Add tests with literal expectations:

```js
import {
  createMockAttempt,
  getRemainingSeconds,
  shouldAutoSubmit,
} from './state.js';

test('getRemainingSeconds rounds up and stops at zero', () => {
  assert.equal(getRemainingSeconds(10_001, 5_000), 6);
  assert.equal(getRemainingSeconds(5_000, 5_000), 0);
  assert.equal(getRemainingSeconds(4_000, 5_000), 0);
});

test('shouldAutoSubmit fires only for an expired unfinished attempt', () => {
  assert.equal(shouldAutoSubmit({ deadline: 5_000, submittedAt: null }, 5_000), true);
  assert.equal(shouldAutoSubmit({ deadline: 5_001, submittedAt: null }, 5_000), false);
  assert.equal(shouldAutoSubmit({ deadline: 4_000, submittedAt: 4_500 }, 5_000), false);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test`

Expected: FAIL because the three lifecycle exports do not exist.

- [ ] **Step 3: Implement minimal deadline helpers**

Add pure implementations:

```js
export function getRemainingSeconds(deadline, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function shouldAutoSubmit(attempt, now = Date.now()) {
  return attempt.submittedAt == null && getRemainingSeconds(attempt.deadline, now) === 0;
}
```

- [ ] **Step 4: Write the failing mock-attempt test**

```js
test('createMockAttempt snapshots final answers and expiry reason', () => {
  const testData = mockTests[0];
  const answers = { [testData.questionIds[0]]: 'b' };
  const attempt = createMockAttempt({
    id: 'mock-1000', test: testData, answers,
    startedAt: 100, submittedAt: 1_000, submissionReason: 'time-expired',
  });
  answers[testData.questionIds[0]] = 'a';

  assert.equal(attempt.type, 'mock');
  assert.equal(attempt.answers[testData.questionIds[0]], 'b');
  assert.equal(attempt.result.score, 1);
  assert.deepEqual(attempt.unansweredQuestionIds, testData.questionIds.slice(1));
});
```

- [ ] **Step 5: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because `createMockAttempt` is not exported.

- [ ] **Step 6: Implement `createMockAttempt` through the shared snapshot helper**

```js
export function createMockAttempt({ id, test, answers, startedAt, submittedAt, submissionReason }) {
  return Object.freeze({
    ...createAttemptSnapshot({
      id, type: 'mock', testId: test.id, topicId: test.topicId,
      questionIds: test.questionIds, answers, startedAt, submittedAt, submissionReason,
    }),
    unansweredQuestionIds: Object.freeze(getUnanswered(test.questionIds, answers)),
  });
}
```

If `mockTests[0]` lacks `topicId`, add `topicId: 'maths.algebra.linear-equations'` to that shared data record.

- [ ] **Step 7: Run all tests**

Run: `npm test`

Expected: all existing and new tests PASS.

- [ ] **Step 8: Commit the lifecycle behavior**

```bash
git add src/state.js src/state.test.js src/data.js
git commit -m "feat: add mock test lifecycle helpers"
```

---

### Task 2: Test List, Instructions, And Empty Subjects

**Files:**
- Create: `src/MockTestsView.jsx`
- Create: `src/mockTestsCopy.js`
- Create: `src/mock-tests.css`

**Interfaces:**
- Consumes: `subjects`, `questions`, `mockTests`, and `getText` from `src/data.js`.
- Produces: `<MockTestsView lang attempts onComplete />`; `attempts` defaults to `[]`, and `onComplete` defaults to a no-op.

- [ ] **Step 1: Define complete localized Level 3 copy**

Create `mockTestsCopy.js` with the same keys for `ta-Latn`, `en`, and `ta`:

```js
export const mockTestsCopy = {
  'ta-Latn': {
    level: 'NILAI 3 · TEST', title: 'Sample mock tests',
    available: 'Oru sample test ready', empty: 'Indha subject-ku sample test innum ready aagala.',
    questions: 'kelvigal', minutes: 'nimidangal', start: 'Test-ai thodangu', back: 'Tests-kku thirumbu',
    instructions: 'Test instructions', instructionItems: ['5 kelvigal', '5 nimidangal', 'Submit seyyum varai badhilai maathalaam'],
  },
  en: {
    level: 'LEVEL 3 · TEST', title: 'Sample mock tests',
    available: 'One sample test ready', empty: 'A sample test is not available for this subject yet.',
    questions: 'questions', minutes: 'minutes', start: 'Start test', back: 'Back to tests',
    instructions: 'Test instructions', instructionItems: ['5 questions', '5 minutes', 'Change answers until you submit'],
  },
  ta: {
    level: 'நிலை 3 · தேர்வு', title: 'மாதிரித் தேர்வுகள்',
    available: 'ஒரு மாதிரித் தேர்வு தயார்', empty: 'இந்தப் பாடத்திற்கான மாதிரித் தேர்வு இன்னும் தயாராகவில்லை.',
    questions: 'கேள்விகள்', minutes: 'நிமிடங்கள்', start: 'தேர்வைத் தொடங்கு', back: 'தேர்வுகளுக்குத் திரும்பு',
    instructions: 'தேர்வு வழிமுறைகள்', instructionItems: ['5 கேள்விகள்', '5 நிமிடங்கள்', 'சமர்ப்பிக்கும் வரை விடைகளை மாற்றலாம்'],
  },
};
```

- [ ] **Step 2: Build the list and instruction states**

Implement `MockTestsView` with local `subjectId`, `selectedTestId`, and `session` state. Render every shared subject as a native button. Filter tests by `subjectId`; selecting an empty subject renders `copy.empty`, while the label and selected subject name. Selecting a test renders instructions but does not create a deadline until `copy.start` is pressed.

Start-session shape:

```js
{
  testId,
  startedAt: Date.now(),
  deadline: Date.now() + test.durationMinutes * 60_000,
  currentIndex: 0,
  answers: {},
  confirmSubmit: false,
  result: null,
}
```

Use one `now` value when deriving `startedAt` and `deadline` so their duration is exact.

- [ ] **Step 3: Add compact responsive styles**

Import `./mock-tests.css` from `MockTestsView.jsx`. Define a two-column `.mock-tests-layout` on desktop, a wrapping `.mock-subjects` selector, thin bordered panels with at most `8px` radius, and green/gold/Maths-coral states. At `max-width: 760px`, switch to one column and maintain `min-width: 0` plus `overflow-wrap: anywhere` for Tamil labels.

Reuse the global `:focus-visible` treatment; do not suppress outlines. Include `@media (prefers-reduced-motion: reduce)` only if Level 3 adds transitions.

- [ ] **Step 4: Verify the static integration**

Run: `npm run build`

Expected: Vite exits 0 with no JSX or CSS errors.

- [ ] **Step 5: Commit list and instructions**

```bash
git add src/MockTestsView.jsx src/mockTestsCopy.js src/mock-tests.css
git commit -m "feat: add mock test selection and instructions"
```

---

### Task 3: Timed Runner, Confirmation, And Objective Results

**Files:**
- Create: `src/MockTestRunner.jsx`
- Modify: `src/MockTestsView.jsx`
- Modify: `src/mockTestsCopy.js`
- Modify: `src/mock-tests.css`

**Interfaces:**
- Consumes: lifecycle helpers from Task 1 and the active test/session from `MockTestsView`.
- Produces: `<MockTestRunner lang test session setSession onFinish />`; `onFinish(reason)` accepts `manual` or `time-expired` and is idempotent in the parent.

- [ ] **Step 1: Add runner and results copy for all languages**

Add matching locale keys: `timeLeft`, `questionOf`, `previous`, `next`, `submit`, `answered`, `unanswered`, `reviewTitle`, `reviewMessage`, `keepWorking`, `submitNow`, `score`, `yourAnswer`, `correctAnswer`, `notAnswered`, `explanation`, `expired`, and `tryAnother`.

- [ ] **Step 2: Implement editable answers and question navigation**

Render the current prompt and native radio inputs whose values are stable choice IDs. Update answers without resetting other fields:

```js
setSession((current) => ({
  ...current,
  answers: { ...current.answers, [question.id]: choiceId },
}));
```

Numbered buttons set `currentIndex`. Give them translated labels such as `Question 2, answered` and style answered/current states independently. Previous and next buttons clamp to the first and final question.

- [ ] **Step 3: Implement deadline timing and single automatic submission**

Use an interval only to refresh `now`; calculate visible time with `getRemainingSeconds(session.deadline, now)`. The effect calls `onFinish('time-expired')` when `shouldAutoSubmit(session, now)` becomes true. Clear the interval on unmount and after a result exists.

Format remaining seconds as `MM:SS` with `String(value).padStart(2, '0')`. Give the visual timer `aria-label`, not an assertive live region.

- [ ] **Step 4: Implement manual unanswered review and confirmation**

The Submit button sets `confirmSubmit: true`. Render a semantic modal using `<dialog open>` with a heading, `getUnanswered(test.questionIds, session.answers).length`, Return, and Submit actions. Return closes the dialog and restores focus to the Submit button. Confirm calls `onFinish('manual')`.

- [ ] **Step 5: Finish idempotently and report one immutable attempt**

In `MockTestsView`, guard completion with a ref or existing `session.result` before creating the result:

```js
const attempt = createMockAttempt({
  id: `mock-${session.startedAt}`,
  test,
  answers: session.answers,
  startedAt: session.startedAt,
  submittedAt: Date.now(),
  submissionReason: reason,
});
setSession((current) => current.result ? current : { ...current, confirmSubmit: false, result: attempt });
onComplete(attempt);
```

Ensure `onComplete` runs once even if an interval tick and click occur together; use a `finishedRef` set before building the attempt.

- [ ] **Step 6: Render objective results and explanations**

When `session.result` exists, replace the runner with a results heading, score/total, optional expiry notice, and an ordered review. Resolve each question and choice from shared data. Mark each response correct or incorrect/unanswered, and render localized explanation text. Do not allow result answers to change.

- [ ] **Step 7: Run tests and build**

Run: `npm test`

Expected: all lifecycle and shared state tests PASS.

Run: `npm run build`

Expected: Vite exits 0 with no errors.

- [ ] **Step 8: Commit the complete runner**

```bash
git add src/MockTestRunner.jsx src/MockTestsView.jsx src/mockTestsCopy.js src/mock-tests.css
git commit -m "feat: complete timed mock test flow"
```

---

### Task 4: Shared Shell Integration And Browser Verification

**Files:**
- Modify: the shared shell file that owns `#/tests`, language, and attempts (expected `src/App.jsx` after the shell worker finishes)
- Modify: shared shell CSS only if the tests view needs an existing layout hook

**Interfaces:**
- Consumes: `<MockTestsView lang={lang} attempts={attempts} onComplete={addAttempt} />`.
- Produces: an addressable `#/tests` view whose attempts are available to the Progress owner.

- [ ] **Step 1: Inspect the completed shared shell before editing**

Locate the owner of the current route, language, and attempt array. Do not recreate any of these states. Confirm its attempt-adder contract and adapt `onComplete` to it.

- [ ] **Step 2: Render Level 3 at the tests route**

Use the shell's existing route branch. The integration should be equivalent to:

```jsx
{route === 'tests' && (
  <MockTestsView
    lang={lang}
    attempts={attempts}
    onComplete={addAttempt}
  />
)}
```

Do not reset `MockTestsView` on language changes. If route switches currently unmount views, lift only the mock `session` into the existing shared reducer or keep views mounted and hidden according to the shell's established pattern.

- [ ] **Step 3: Run automated verification**

Run: `npm test`

Expected: all tests PASS with no warnings.

Run: `npm run build`

Expected: production build exits 0.

- [ ] **Step 4: Start the app and verify desktop behavior**

Run: `npm run dev -- --port 4173`

Open `http://127.0.0.1:4173/Padi-Go/#/tests` and verify: all subjects visible; empty subject copy; instructions before timing; answer replacement; numbered navigation; unanswered confirmation and cancellation; manual score; result explanations; route-away/return preservation; language changes preserve answers and current question.

- [ ] **Step 5: Verify automatic expiry without waiting five minutes**

In browser developer tools, temporarily move the active session deadline into the past through the app's exposed state/debug mechanism if one exists. If none exists, temporarily change only the sample test duration during the check, verify exactly one `time-expired` attempt, then restore the duration and rerun `npm test` and `npm run build` before committing.

- [ ] **Step 6: Verify mobile and keyboard behavior**

At widths `390x844` and `360x740`, verify no horizontal overflow or clipped Tamil labels. Navigate subjects, test list, answer radios, numbered navigation, dialog actions, and result controls using Tab, Shift+Tab, Space, Enter, and arrow keys for the radio group. Confirm focus is always visible and the layout does not use fixed controls that collide with the mobile keyboard.

- [ ] **Step 7: Commit shell integration**

```bash
git add src/MockTestsView.jsx src/MockTestRunner.jsx src/mockTestsCopy.js src/mock-tests.css src/App.jsx src/state.js src/state.test.js src/data.js
git commit -m "feat: integrate level 3 mock tests"
```
