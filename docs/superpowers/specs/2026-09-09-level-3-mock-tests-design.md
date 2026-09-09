# Level 3 Mock Tests Design

## Scope

Implement only Level 3, Test - Mock Tests, for the existing Padi and Go React frontend. Other agents own Chat, Practice, Progress, and shared navigation. Level 3 must expose a small integration surface for those modules without implementing their views.

The feature is a frontend-only sample. It has no backend, authentication, database, or AI integration. Learning activity remains in React session memory. The existing language preference is the only value persisted to local storage.

## Architecture

Level 3 is a self-contained view backed by shared sample data and framework-free test helpers:

- `sampleLearningData.js` defines stable subject, topic, test, and question identifiers. It includes all five subjects, one Maths Algebra topic, and one five-question objective mock test.
- `mockTestState.js` contains pure functions for answer updates, unanswered-question detection, objective scoring, and completed-attempt creation.
- `MockTestsView.jsx` presents subject selection, available tests, and accurate empty states.
- `MockTestRunner.jsx` owns the instructions, timer, question navigation, answer controls, submission confirmation, and result presentation.
- `mock-tests.css` provides Level 3 styles using the existing visual system.

`MockTestsView` receives the current language and session attempt data through props. It reports a completed attempt through an `onComplete` callback. This keeps attempt ownership outside Level 3 so the Progress module can consume the same records.

No router or state-management dependency is added. The parent navigation can render the Level 3 view for its mock-test hash route.

## Data Model

Each entity has a stable identifier:

- Subject: `maths`, `tamil`, `english`, `science`, `social`
- Topic: for example, `maths-algebra-linear-equations`
- Test: for example, `maths-algebra-sample-01`
- Question: for example, `maths-algebra-q01`

Each question contains localized prompt, answer options, correct option identifier, and localized explanation. A completed attempt contains the test identifier, submitted answers keyed by question identifier, unanswered question identifiers, score, total, submission reason, and completion timestamp.

The submission reason is either `manual` or `expired`. Answers are copied into the completed attempt so a later reset cannot mutate attempt history.

## Interaction Flow

### Test List

All five subjects remain visible. Maths displays the Algebra sample test with question count and duration. Other subjects display a clear message that a sample test is not available yet. Empty states do not imply hidden or locked content.

### Instructions

Selecting the Maths test opens instructions before timing begins. The student can return to the list or start the test. Starting creates a deadline and initializes the first question without clearing unrelated session activity.

### Active Test

The active view shows the remaining time, current question, answer options, previous and next controls, and numbered question navigation. Answered and unanswered questions have distinct visual states. Selecting another answer replaces the previous choice.

The timer derives remaining time from a fixed deadline rather than repeatedly decrementing stored seconds. This keeps expiry accurate when browser updates are delayed. Reaching zero automatically submits exactly once.

Manual submission opens a confirmation dialog. The dialog states how many questions are unanswered and offers return-to-test and submit actions. Submission locks the attempt.

### Results

Results show score and total, the submission reason when time expired, and a per-question review. Each item displays the student's answer, the correct answer, and the explanation. The result record is sent through `onComplete` once.

The view provides a return-to-tests action. It does not implement Progress navigation; the shared navigation owner can add that link using the completed-attempt callback.

## Language Behavior

All Level 3 interface labels and sample question content exist in Thanglish, English, and Tamil. Thanglish is the default inherited from the parent app.

Changing language replaces only rendered copy. The active test, current question, chosen answers, deadline, confirmation state, and completed result remain unchanged. Learning medium remains outside Level 3.

## Accessibility And Responsive Behavior

Controls use native buttons, radio inputs, and dialog semantics where applicable. Every interactive control has an accessible name. Focus remains visibly outlined using the existing gold focus treatment. Status updates for expiry and completion use live-region semantics without continuously announcing every timer tick.

Desktop uses a compact test workspace with question navigation beside the active question. Mobile stacks the navigation and question content, keeps actions reachable above the viewport edge, and avoids fixed positioning that could conflict with the on-screen keyboard. Text may wrap but must not clip in any language.

The styling reuses DM Sans, Manrope, Noto Sans Tamil, the existing green surfaces, Maths coral, pale green correct feedback, and pale gold review feedback. Cards use the existing maximum eight-pixel radius.

## Error And Boundary Handling

- Unknown subject or test identifiers return the user to the test list with an honest unavailable state.
- Missing answers count as unanswered and score zero.
- Repeated submit signals are ignored after the first completed attempt.
- A timer that resumes after its deadline submits immediately.
- Empty subjects remain selectable and do not start a test.
- No network or authentication errors exist because Level 3 performs no external requests.

## Testing

Use Node's built-in test runner so no dependency is added. Tests exercise the real pure helpers and use hand-derived expected results.

Focused tests cover:

- replacing a previously selected answer;
- detecting unanswered questions in stable question order;
- scoring correct, incorrect, and unanswered responses;
- creating immutable completed-attempt data for manual submission;
- creating an expired result when the deadline has passed;
- preventing repeated completion from producing duplicate attempt records.

Verification also includes the production Vite build and manual browser checks at desktop and mobile widths for test start, answer changes, unanswered confirmation, manual submission, automatic expiry, language changes, focus visibility, and text clipping.

## Integration Contract

The expected component boundary is conceptually:

```jsx
<MockTestsView
  lang={lang}
  attempts={attempts}
  onComplete={(attempt) => setAttempts((items) => [...items, attempt])}
/>
```

The exact prop names may follow any shared application shell introduced by the other agents, but Level 3 will not store attempts in local storage or introduce a competing navigation system.
