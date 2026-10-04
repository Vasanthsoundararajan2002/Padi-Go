import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3 } from 'lucide-react';
import { getText, mockTests, questions, subjects } from './data.js';
import { getRemainingSeconds, getUnanswered, shouldAutoSubmit, submitMockSession } from './state.js';
import copy from './mockTestsCopy.js';
import './mock-tests.css';

const questionById = new Map(questions.map((question) => [question.id, question]));
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function MockTestsView({ lang = 'ta-Latn', testState, onTestStateChange, onComplete = () => {} }) {
  const text = copy[lang] ?? copy['ta-Latn'];
  const [subjectId, setSubjectId] = useState('maths');
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [localSession, setLocalSession] = useState(null);
  const session = testState === undefined ? localSession : testState;
  const setSession = onTestStateChange ?? setLocalSession;
  const [now, setNow] = useState(Date.now());
  const reported = useRef(new Set());
  const dialogRef = useRef(null);
  const submitButtonRef = useRef(null);
  const restoreSubmitFocus = useRef(false);
  const subject = subjects.find((item) => item.id === subjectId) ?? subjects[0];
  const availableTests = useMemo(() => mockTests.filter((test) => test.subjectId === subjectId), [subjectId]);
  const selectedTest = mockTests.find((test) => test.id === selectedTestId);
  const activeTest = session && mockTests.find((test) => test.id === session.testId);

  function startSession(test) {
    const startedAt = Date.now();
    setNow(startedAt);
    setSession({ testId: test.id, startedAt, deadline: startedAt + test.durationMinutes * 60_000, currentIndex: 0, answers: {}, confirmSubmit: false, attempt: null });
  }
  function submit(reason) {
    setSession((current) => current?.attempt || !activeTest ? current : submitMockSession(current, activeTest, reason, Date.now()));
  }
  function closeConfirmation(changes = {}) {
    restoreSubmitFocus.current = true;
    setSession((current) => current?.confirmSubmit ? { ...current, ...changes, confirmSubmit: false } : current);
  }

  useEffect(() => {
    if (!session || session.attempt) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [session?.deadline, session?.attempt]);
  useEffect(() => {
    if (session && activeTest && shouldAutoSubmit(session, now)) submit('time-expired');
  }, [now, session, activeTest]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (session?.confirmSubmit) {
      if (dialog && !dialog.open) dialog.showModal();
      return;
    }
    if (dialog?.open) dialog.close();
    if (restoreSubmitFocus.current) {
      restoreSubmitFocus.current = false;
      submitButtonRef.current?.focus();
    }
  }, [session?.confirmSubmit]);
  useEffect(() => {
    const attempt = session?.attempt;
    if (attempt && !reported.current.has(attempt.id)) { reported.current.add(attempt.id); onComplete(attempt); }
  }, [session?.attempt, onComplete]);

  if (session && activeTest) {
    const remaining = getRemainingSeconds(session.deadline, now);
    if (session.attempt) return <Results attempt={session.attempt} test={activeTest} lang={lang} text={text} onBack={() => { setSession(null); setSelectedTestId(null); }} />;
    const question = questionById.get(activeTest.questionIds[session.currentIndex]);
    const unanswered = getUnanswered(activeTest.questionIds, session.answers);
    const answeredCount = activeTest.questionIds.length - unanswered.length;
    return <section className="mock-tests-view mock-runner" aria-labelledby="mock-tests-title">
      <header className="mock-runner-head"><div><span className="mock-tests-label">{text.question} {session.currentIndex + 1} {text.of} {activeTest.questionIds.length}</span><h1 id="mock-tests-title">{getText(activeTest.title, lang)}</h1></div><div className="mock-timer" role="timer" aria-live="off"><Clock3 size={18}/><span>{text.timeLeft}</span><strong>{formatTime(remaining)}</strong></div></header>
      <div className="mock-runner-layout"><nav className="mock-question-nav" aria-label={text.question}><p>{answeredCount} / {activeTest.questionIds.length} {text.answered}</p><div>{activeTest.questionIds.map((id, index) => <button type="button" key={id} className={session.answers[id] ? 'answered' : ''} aria-current={index === session.currentIndex ? 'step' : undefined} aria-label={`${text.question} ${index + 1}`} onClick={() => setSession((current) => ({ ...current, currentIndex: index }))}>{index + 1}</button>)}</div></nav>
        <section className="mock-question-card"><span className="mock-tests-label">{text.question} {session.currentIndex + 1}</span><h2>{getText(question.prompt, lang)}</h2><div className="mock-choices">{question.choices.map((choice) => <label key={choice.id} className={session.answers[question.id] === choice.id ? 'selected' : ''}><input type="radio" name={question.id} value={choice.id} checked={session.answers[question.id] === choice.id} onChange={() => setSession((current) => ({ ...current, answers: { ...current.answers, [question.id]: choice.id } }))}/><span>{getText(choice.label, lang)}</span></label>)}</div><div className="mock-question-actions"><button type="button" disabled={!session.currentIndex} onClick={() => setSession((current) => ({ ...current, currentIndex: current.currentIndex - 1 }))}><ArrowLeft size={16}/>{text.previous}</button>{session.currentIndex < activeTest.questionIds.length - 1 && <button type="button" onClick={() => setSession((current) => ({ ...current, currentIndex: current.currentIndex + 1 }))}>{text.next}<ArrowRight size={16}/></button>}<button ref={submitButtonRef} className="mock-submit" type="button" onClick={() => setSession((current) => ({ ...current, confirmSubmit: true }))}>{text.submit}</button></div></section>
      </div>
      {session.confirmSubmit && <dialog ref={dialogRef} className="mock-dialog" aria-labelledby="mock-confirm-title" onCancel={(event) => { event.preventDefault(); closeConfirmation(); }}><h2 id="mock-confirm-title">{text.confirmTitle}</h2><p>{text.confirmBody}</p><strong>{unanswered.length ? `${text.unanswered}:` : text.noneUnanswered}</strong>{unanswered.length > 0 && <div className="mock-unanswered">{unanswered.map((id) => { const index = activeTest.questionIds.indexOf(id); return <button type="button" key={id} onClick={() => closeConfirmation({ currentIndex: index })}>{index + 1}</button>; })}</div>}<div className="mock-dialog-actions"><button autoFocus type="button" onClick={() => closeConfirmation()}>{text.cancel}</button><button className="mock-submit" type="button" onClick={() => submit('manual')}>{text.confirm}</button></div></dialog>}
    </section>;
  }

  return <section className="mock-tests-view" aria-labelledby="mock-tests-title"><div className="mock-tests-heading"><div><span className="eyebrow">{text.level}</span><h1 id="mock-tests-title">{text.title}</h1></div><span className="mock-tests-progress">3 / 4</span></div><div className="mock-tests-layout"><aside className="mock-tests-subjects" aria-label={text.chooseSubject}><p className="mock-tests-label">{text.chooseSubject}</p><div>{subjects.map((item) => <button key={item.id} type="button" aria-pressed={subjectId === item.id} onClick={() => { setSubjectId(item.id); setSelectedTestId(null); }} style={{ '--subject-color': item.color }}><span className="mock-subject-dot" />{getText(item.name, lang)}{subjectId === item.id && <Check size={15} />}</button>)}</div></aside><section className="mock-tests-panel">{selectedTest ? <div className="mock-test-instructions"><button className="mock-back" type="button" onClick={() => setSelectedTestId(null)}><ArrowLeft size={16}/>{text.back}</button><span className="mock-tests-label">{text.instructions}</span><h2>{getText(selectedTest.title, lang)}</h2><ul>{text.instructionItems.map((item) => <li key={item}>{item}</li>)}</ul><button className="mock-start" type="button" onClick={() => startSession(selectedTest)}>{text.start}<ArrowRight size={16}/></button></div> : availableTests.length ? <div className="mock-test-list"><span className="mock-tests-label">{text.available}</span><h2>{getText(subject.name, lang)}</h2>{availableTests.map((test) => <button className="mock-test-card" type="button" key={test.id} onClick={() => setSelectedTestId(test.id)}><span>{getText(test.title, lang)}</span><small><span>{test.questionIds.length} {text.questions}</span><span><Clock3 size={14}/>{test.durationMinutes} {text.minutes}</span></small><ArrowRight size={18}/></button>)}</div> : <div className="mock-tests-empty" role="status"><span className="mock-tests-label">{text.empty}</span><h2>{getText(subject.name, lang)}</h2><p>{text.empty}</p></div>}</section></div></section>;
}

function Results({ attempt, test, lang, text, onBack }) {
  return <section className="mock-tests-view mock-results" aria-labelledby="mock-results-title">{attempt.submissionReason === 'time-expired' ? <p className="mock-expired" role="status" aria-live="polite">{text.expired}</p> : <p className="mock-tests-label" role="status" aria-live="polite">{text.submitted}</p>}<span className="mock-tests-label">{text.results}</span><h1 id="mock-results-title">{getText(test.title, lang)}</h1><div className="mock-score"><strong>{attempt.result.score} / {attempt.result.total}</strong><span>{text.score}</span></div><ol>{test.questionIds.map((id, index) => { const question = questionById.get(id); const selected = question.choices.find((choice) => choice.id === attempt.answers[id]); const correct = question.choices.find((choice) => choice.id === question.correctChoiceId); const isCorrect = selected?.id === correct.id; return <li key={id} className={isCorrect ? 'correct' : 'incorrect'}><h2>{index + 1}. {getText(question.prompt, lang)}</h2><p><strong>{text.yourAnswer}:</strong> {selected ? getText(selected.label, lang) : text.notAnswered}</p>{!isCorrect && <p><strong>{text.correctAnswer}:</strong> {getText(correct.label, lang)}</p>}<p><strong>{text.explanation}:</strong> {getText(question.explanation, lang)}</p></li>; })}</ol><button className="mock-start" type="button" onClick={onBack}><ArrowLeft size={16}/>{text.backToTests}</button></section>;
}
