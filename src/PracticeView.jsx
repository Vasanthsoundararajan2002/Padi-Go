import React, { useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Lightbulb, RotateCcw } from 'lucide-react';
import { getText, questions, subjects, topics } from './data.js';
import { createAttemptSnapshot, getPracticeTarget } from './state.js';

const topicById = new Map(topics.map((topic) => [topic.id, topic]));
const questionsByTopic = questions.reduce((map, question) => {
  const list = map.get(question.topicId) ?? [];
  list.push(question);
  map.set(question.topicId, list);
  return map;
}, new Map());

const copy = {
  'ta-Latn': {
    eyebrow: 'PRACTISE · LEVEL 2', title: 'Konjam konjama practice pannalaam.', subtitle: 'Timer illa. Hint eduthu, thirumba muyarchi sei.', topics: 'Topics', choose: 'Oru paadathai therndhedu', sample: 'Sample practice', untimed: 'Timer illa', hint: 'Oru hint venum', hideHint: 'Hint-ai mara', retry: 'Thirumba muyarchi sei', next: 'Adutha kelvi', correct: 'Sariyaana badhil! Nalla velai.', wrong: 'Nalla muyarchi. Hint-ai paarthu thirumba sei.', empty: 'Indha paadam innum sample-la illai. Maths algebra-va try pannalaam.', question: 'Kelvi', of: 'il', done: 'Indha kelvi mudindhadhu.'
  },
  en: {
    eyebrow: 'PRACTISE · LEVEL 2', title: 'Build confidence, one question at a time.', subtitle: 'There is no timer. Use a hint, then try again.', topics: 'Topics', choose: 'Choose a subject', sample: 'Sample practice', untimed: 'Untimed', hint: 'Show a hint', hideHint: 'Hide hint', retry: 'Try again', next: 'Next question', correct: 'Correct. Nice work.', wrong: 'Good try. Use the hint and try again.', empty: 'There is no sample for this subject yet. Try Maths algebra.', question: 'Question', of: 'of', done: 'Question complete.'
  },
  ta: {
    eyebrow: '\u0baa\u0baf\u0bbf\u0bb1\u0bcd\u0b9a\u0bbf \u00b7 \u0ba8\u0bbf\u0bb2\u0bc8 2', title: '\u0b92\u0bb0\u0bc1 \u0b95\u0bc7\u0bb3\u0bcd\u0bb5\u0bbf\u0baf\u0bbe\u0b95 \u0ba8\u0bae\u0bcd\u0baa\u0bbf\u0b95\u0bcd\u0b95\u0bc8.', subtitle: '\u0ba8\u0bc7\u0bb0 \u0bb5\u0bb0\u0bae\u0bcd\u0baa\u0bc1 \u0b87\u0bb2\u0bcd\u0bb2\u0bc8. \u0b95\u0bc1\u0bb1\u0bbf\u0baa\u0bcd\u0baa\u0bc1 \u0baa\u0bbe\u0bb0\u0bcd\u0ba4\u0bcd\u0ba4\u0bc1 \u0bae\u0bc0\u0ba3\u0bcd\u0b9f\u0bc1\u0bae\u0bcd \u0bae\u0bc1\u0baf\u0bb1\u0bcd\u0b9a\u0bbf.', topics: '\u0ba4\u0bb2\u0bc8\u0baa\u0bcd\u0baa\u0bc1\u0b95\u0bb3\u0bcd', choose: '\u0baa\u0bbe\u0b9f\u0ba4\u0bcd\u0ba4\u0bc8\u0ba4\u0bcd \u0ba4\u0bc7\u0bb0\u0bcd\u0ba8\u0bcd\u0ba4\u0bc6\u0b9f\u0bc1', sample: '\u0bae\u0bbe\u0ba4\u0bbf\u0bb0\u0bbf \u0baa\u0baf\u0bbf\u0bb1\u0bcd\u0b9a\u0bbf', untimed: '\u0ba8\u0bc7\u0bb0 \u0bb5\u0bb0\u0bae\u0bcd\u0baa\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8', hint: '\u0b95\u0bc1\u0bb1\u0bbf\u0baa\u0bcd\u0baa\u0bc1 \u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bc1', hideHint: '\u0b95\u0bc1\u0bb1\u0bbf\u0baa\u0bcd\u0baa\u0bc8 \u0bae\u0bb1\u0bc8', retry: '\u0bae\u0bc0\u0ba3\u0bcd\u0b9f\u0bc1\u0bae\u0bcd \u0bae\u0bc1\u0baf\u0bb1\u0bcd\u0b9a\u0bbf', next: '\u0b85\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4 \u0b95\u0bc7\u0bb3\u0bcd\u0bb5\u0bbf', correct: '\u0b9a\u0bb0\u0bbf\u0baf\u0bbe\u0ba9 \u0bb5\u0bbf\u0b9f\u0bc8.', wrong: '\u0ba8\u0bb2\u0bcd\u0bb2 \u0bae\u0bc1\u0baf\u0bb1\u0bcd\u0b9a\u0bbf. \u0b95\u0bc1\u0bb1\u0bbf\u0baa\u0bcd\u0baa\u0bc8\u0baa\u0bcd \u0baa\u0bbe\u0bb0\u0bcd.', empty: '\u0b87\u0ba8\u0bcd\u0ba4 \u0baa\u0bbe\u0b9f\u0ba4\u0bcd\u0ba4\u0bbf\u0bb1\u0bcd\u0b95\u0bc1 \u0bae\u0bbe\u0ba4\u0bbf\u0bb0\u0bbf \u0b87\u0ba9\u0bcd\u0ba9\u0bc1\u0bae\u0bcd \u0b87\u0bb2\u0bcd\u0bb2\u0bc8. \u0b95\u0ba3\u0b95\u0bcd\u0b95\u0bc1 algebra-\u0bb5\u0bc8 \u0bae\u0bc1\u0baf\u0bb1\u0bcd\u0b9a\u0bbf \u0b9a\u0bc6\u0baf\u0bcd.', question: '\u0b95\u0bc7\u0bb3\u0bcd\u0bb5\u0bbf', of: '/', done: '\u0b87\u0ba8\u0bcd\u0ba4 \u0b95\u0bc7\u0bb3\u0bcd\u0bb5\u0bbf \u0bae\u0bc1\u0b9f\u0bbf\u0ba8\u0bcd\u0ba4\u0ba4\u0bc1.'
  }
};

export default function PracticeView({ lang = 'ta-Latn', practiceState = {}, setPracticeState = () => {}, onComplete = () => {} }) {
  const text = copy[lang] ?? copy['ta-Latn'];
  const revisionTarget = getPracticeTarget(globalThis.location?.hash ?? '');
  const [subjectId, setSubjectId] = useState(revisionTarget?.subjectId ?? practiceState.subjectId ?? 'maths');
  const [topicId, setTopicId] = useState(revisionTarget?.topicId ?? practiceState.topicId ?? topics[0]?.id);
  const [questionIndex, setQuestionIndex] = useState(revisionTarget?.questionIndex ?? practiceState.questionIndex ?? 0);
  const [hintVisible, setHintVisible] = useState(Boolean(practiceState.hintVisible));
  const attemptSequence = useRef(0);
  const answers = practiceState.answers ?? {};
  const subject = subjects.find((item) => item.id === subjectId) ?? subjects[0];
  const topic = topicById.get(topicId);
  const topicQuestions = useMemo(() => questionsByTopic.get(topicId) ?? [], [topicId]);
  const question = topicQuestions[questionIndex];
  const selected = question ? answers[question.id] : null;
  const answeredCorrectly = question && selected === question.correctChoiceId;

  function update(next) { setPracticeState({ ...practiceState, ...next }); }
  function selectSubject(id) {
    setSubjectId(id);
    const firstTopic = topics.find((item) => item.subjectId === id);
    setTopicId(firstTopic?.id ?? null);
    setQuestionIndex(0);
    setHintVisible(false);
    update({ subjectId: id, topicId: firstTopic?.id ?? null, questionIndex: 0, hintVisible: false });
  }
  function chooseAnswer(choiceId) {
    const nextAnswers = { ...answers, [question.id]: choiceId };
    const submittedAt = Date.now();
    attemptSequence.current += 1;
    onComplete(createAttemptSnapshot({ id: `practice-${question.id}-${submittedAt}-${attemptSequence.current}`, type: 'practice', topicId, questionIds: [question.id], answers: nextAnswers, submittedAt, submissionReason: 'manual' }));
    update({ subjectId, topicId, questionIndex, hintVisible, answers: nextAnswers });
  }
  function retry() {
    const nextAnswers = { ...answers };
    delete nextAnswers[question.id];
    setHintVisible(false);
    update({ answers: nextAnswers, hintVisible: false });
  }

  return <section className="practice-view" aria-labelledby="practice-title">
    <div className="practice-heading"><div><span className="eyebrow">{text.eyebrow}</span><h1 id="practice-title">{text.title}</h1><p>{text.subtitle}</p></div><span className="practice-level">2 / 4</span></div>
    <div className="practice-layout">
      <aside className="practice-sidebar" aria-label={text.choose}><p className="practice-label">{text.choose}</p><div className="practice-subjects">{subjects.map((item) => <button key={item.id} type="button" aria-pressed={subjectId === item.id} onClick={() => selectSubject(item.id)} style={{ '--subject-color': item.color }}><span className="subject-dot"/>{getText(item.name, lang)}{subjectId === item.id && <Check size={14}/>}</button>)}</div></aside>
      <section className="practice-panel"><div className="practice-panel-top"><div><span className="practice-label">{text.topics}</span><h2>{topic ? getText(topic.name, lang) : text.sample}</h2></div><span className="untimed-badge">{text.untimed}</span></div>
        {!question ? <div className="practice-empty" role="status"><h3>{getText(subject.name, lang)}</h3><p>{text.empty}</p><a href="#/practice" onClick={() => selectSubject('maths')}>{text.sample}<ArrowRight size={16}/></a></div> : <><div className="practice-question-meta"><span>{text.question} {questionIndex + 1} {text.of} {topicQuestions.length}</span><span>{getText(topic.name, lang)}</span></div><h3 className="practice-question">{getText(question.prompt, lang)}</h3><div className="practice-options" role="group" aria-label={getText(question.prompt, lang)}>{question.choices.map((choice) => <button key={choice.id} type="button" disabled={Boolean(selected)} aria-pressed={selected === choice.id} className={selected === choice.id ? (choice.id === question.correctChoiceId ? 'is-correct' : 'is-wrong') : ''} onClick={() => chooseAnswer(choice.id)}>{getText(choice.label, lang)}{selected === choice.id && choice.id === question.correctChoiceId && <Check size={17}/>}</button>)}</div>{selected && <p className={`practice-feedback ${answeredCorrectly ? 'success' : ''}`} role="status">{answeredCorrectly ? text.correct : text.wrong}</p>}{hintVisible && <p className="practice-hint"><Lightbulb size={16}/>{getText(question.hint, lang)}</p>}<div className="practice-actions"><button type="button" onClick={() => { const nextHint = !hintVisible; setHintVisible(nextHint); update({ hintVisible: nextHint }); }} aria-expanded={hintVisible}><Lightbulb size={16}/>{hintVisible ? text.hideHint : text.hint}</button>{selected && <button type="button" onClick={retry}><RotateCcw size={16}/>{text.retry}</button>}{answeredCorrectly && questionIndex < topicQuestions.length - 1 && <button type="button" className="practice-next" onClick={() => { setQuestionIndex(questionIndex + 1); setHintVisible(false); update({ questionIndex: questionIndex + 1, hintVisible: false }); }}>{text.next}<ArrowRight size={16}/></button>}</div></>}
      </section>
    </div>
  </section>;
}
