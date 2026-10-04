import React from 'react';
import { ArrowRight, BookOpenCheck, History, RotateCcw, Target } from 'lucide-react';
import { getText, questions } from './data.js';
import { deriveProgress } from './state.js';
import './progress.css';

const copy = {
  'ta-Latn': {
    level: 'IMPROVE · LEVEL 4', title: 'Muyarchiyilirundhu munneralaam.', subtitle: 'Mudindha attempts, thavarugal, appuram enna practice seiyanum nu ingae paaru.', attempts: 'Mudindha attempts', correct: 'Sariyaana badhilgal', accuracy: 'Sariyaana vigidham', emptyTitle: 'Innum mudindha attempt illai.', emptyBody: 'Practice alladhu sample test mudithaal, un progress ingae theriyum.', practise: 'Practice thodangu', test: 'Sample test paaru', history: 'Attempt history', mistakes: 'Thirumba paarka vendiyavai', noMistakes: 'Indha attempts-la thavarugal illai. Nalla velai!', times: 'murai thavaru', review: 'Related practice', practiceAttempt: 'Practice', mockAttempt: 'Mock test', manual: 'Neeye submit seidhadhu', expired: 'Neram mudindhadhu', score: 'Score', unanswered: 'Badhil illai', explanation: 'Vilakkam',
  },
  en: {
    level: 'IMPROVE · LEVEL 4', title: 'Turn every attempt into progress.', subtitle: 'Review completed attempts, understand mistakes, and return to the exact question that needs practice.', attempts: 'Completed attempts', correct: 'Correct answers', accuracy: 'Accuracy', emptyTitle: 'No completed attempts yet.', emptyBody: 'Complete a practice question or sample test and your progress will appear here.', practise: 'Start practising', test: 'View sample test', history: 'Attempt history', mistakes: 'Questions to revisit', noMistakes: 'No mistakes in these attempts. Nice work!', times: 'mistakes', review: 'Related practice', practiceAttempt: 'Practice', mockAttempt: 'Mock test', manual: 'Submitted manually', expired: 'Time expired', score: 'Score', unanswered: 'Unanswered', explanation: 'Explanation',
  },
  ta: {
    level: '\u0bae\u0bc7\u0bae\u0bcd\u0baa\u0b9f\u0bc1 · \u0ba8\u0bbf\u0bb2\u0bc8 4', title: '\u0b92\u0bb5\u0bcd\u0bb5\u0bca\u0bb0\u0bc1 \u0bae\u0bc1\u0baf\u0bb1\u0bcd\u0b9a\u0bbf\u0baf\u0bc8\u0baf\u0bc1\u0bae\u0bcd \u0bae\u0bc1\u0ba9\u0bcd\u0ba9\u0bc7\u0bb1\u0bcd\u0bb1\u0bae\u0bbe\u0b95 \u0bae\u0bbe\u0bb1\u0bcd\u0bb1\u0bc1.', subtitle: '\u0bae\u0bc1\u0b9f\u0bbf\u0ba8\u0bcd\u0ba4 \u0bae\u0bc1\u0baf\u0bb1\u0bcd\u0b9a\u0bbf\u0b95\u0bb3\u0bc8\u0baf\u0bc1\u0bae\u0bcd \u0ba4\u0bb5\u0bb1\u0bc1\u0b95\u0bb3\u0bc8\u0baf\u0bc1\u0bae\u0bcd \u0baa\u0bbe\u0bb0\u0bcd\u0ba4\u0bcd\u0ba4\u0bc1, \u0ba4\u0bc7\u0bb5\u0bc8\u0baf\u0bbe\u0ba9 \u0baa\u0baf\u0bbf\u0bb1\u0bcd\u0b9a\u0bbf\u0b95\u0bcd\u0b95\u0bc1\u0ba4\u0bcd \u0ba4\u0bbf\u0bb0\u0bc1\u0bae\u0bcd\u0baa\u0bc1.', attempts: '\u0bae\u0bc1\u0b9f\u0bbf\u0ba8\u0bcd\u0ba4 \u0bae\u0bc1\u0baf\u0bb1\u0bcd\u0b9a\u0bbf\u0b95\u0bb3\u0bcd', correct: '\u0b9a\u0bb0\u0bbf\u0baf\u0bbe\u0ba9 \u0bb5\u0bbf\u0b9f\u0bc8\u0b95\u0bb3\u0bcd', accuracy: '\u0b9a\u0bb0\u0bbf\u0baf\u0bbe\u0ba9 \u0bb5\u0bbf\u0b95\u0bbf\u0ba4\u0bae\u0bcd', emptyTitle: '\u0b87\u0ba9\u0bcd\u0ba9\u0bc1\u0bae\u0bcd \u0bae\u0bc1\u0b9f\u0bbf\u0ba8\u0bcd\u0ba4 \u0bae\u0bc1\u0baf\u0bb1\u0bcd\u0b9a\u0bbf \u0b87\u0bb2\u0bcd\u0bb2\u0bc8.', emptyBody: '\u0baa\u0baf\u0bbf\u0bb1\u0bcd\u0b9a\u0bbf \u0b85\u0bb2\u0bcd\u0bb2\u0ba4\u0bc1 \u0bae\u0bbe\u0ba4\u0bbf\u0bb0\u0bbf\u0ba4\u0bcd \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc8 \u0bae\u0bc1\u0b9f\u0bbf\u0ba4\u0bcd\u0ba4\u0bbe\u0bb2\u0bcd, \u0b89\u0ba9\u0bcd \u0bae\u0bc1\u0ba9\u0bcd\u0ba9\u0bc7\u0bb1\u0bcd\u0bb1\u0bae\u0bcd \u0b87\u0b99\u0bcd\u0b95\u0bc7 \u0ba4\u0bc6\u0bb0\u0bbf\u0baf\u0bc1\u0bae\u0bcd.', practise: '\u0baa\u0baf\u0bbf\u0bb1\u0bcd\u0b9a\u0bbf\u0baf\u0bc8\u0ba4\u0bcd \u0ba4\u0bca\u0b9f\u0b99\u0bcd\u0b95\u0bc1', test: '\u0bae\u0bbe\u0ba4\u0bbf\u0bb0\u0bbf\u0ba4\u0bcd \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc8\u0baa\u0bcd \u0baa\u0bbe\u0bb0\u0bcd', history: '\u0bae\u0bc1\u0baf\u0bb1\u0b9a\u0bbf \u0bb5\u0bb0\u0bb2\u0bbe\u0bb1\u0bc1', mistakes: '\u0bae\u0bc0\u0ba3\u0bcd\u0b9f\u0bc1\u0bae\u0bcd \u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95 \u0bb5\u0bc7\u0ba3\u0bcd\u0b9f\u0bbf\u0baf\u0bb5\u0bc8', noMistakes: '\u0b87\u0ba8\u0bcd\u0ba4 \u0bae\u0bc1\u0baf\u0bb1\u0b9a\u0bbf\u0b95\u0bb3\u0bbf\u0bb2\u0bcd \u0ba4\u0bb5\u0bb1\u0bc1\u0b95\u0bb3\u0bcd \u0b87\u0bb2\u0bcd\u0bb2\u0bc8. \u0ba8\u0ba9\u0bcd\u0bb1\u0bbe\u0b95\u0b9a\u0bcd \u0b9a\u0bc6\u0baf\u0bcd\u0ba4\u0bbe\u0baf\u0bcd!', times: '\u0bae\u0bc1\u0bb1\u0bc8 \u0ba4\u0bb5\u0bb1\u0bc1', review: '\u0ba4\u0bca\u0b9f\u0bb0\u0bcd\u0baa\u0bc1\u0b9f\u0bc8\u0baf \u0baa\u0baf\u0bbf\u0bb1\u0b9a\u0bcd\u0b9a\u0bbf', practiceAttempt: '\u0baa\u0baf\u0bbf\u0bb1\u0b9a\u0bcd\u0b9a\u0bbf', mockAttempt: '\u0bae\u0bbe\u0ba4\u0bbf\u0bb0\u0bbf\u0ba4\u0bcd \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1', manual: '\u0b95\u0bc8\u0bae\u0bc1\u0bb1\u0bc8\u0baf\u0bbe\u0b95 \u0b9a\u0bae\u0bb0\u0bcd\u0baa\u0bcd\u0baa\u0bbf\u0ba4\u0bcd\u0ba4\u0ba4\u0bc1', expired: '\u0ba8\u0bc7\u0bb0\u0bae\u0bcd \u0bae\u0bc1\u0b9f\u0bbf\u0ba8\u0bcd\u0ba4\u0ba4\u0bc1', score: '\u0bae\u0ba4\u0bbf\u0baa\u0bcd\u0baa\u0bc6\u0ba3\u0bcd', unanswered: '\u0bb5\u0bbf\u0b9f\u0bc8\u0baf\u0bb3\u0bbf\u0b95\u0bcd\u0b95\u0bbe\u0ba4\u0bb5\u0bc8', explanation: '\u0bb5\u0bbf\u0bb3\u0b95\u0bcd\u0b95\u0bae\u0bcd',
  },
};

const questionById = new Map(questions.map((question) => [question.id, question]));

export default function ProgressView({ lang = 'ta-Latn', attempts = [] }) {
  const text = copy[lang] ?? copy['ta-Latn'];
  const progress = deriveProgress(attempts);
  const completed = attempts.filter((attempt) => attempt?.submittedAt != null && attempt.result);

  return <section className="progress-view" aria-labelledby="progress-title">
    <header className="progress-heading">
      <div><span className="eyebrow">{text.level}</span><h1 id="progress-title">{text.title}</h1><p>{text.subtitle}</p></div>
      <span className="progress-level">4 / 4</span>
    </header>

    {!progress.completedAttempts ? <div className="progress-empty" role="status">
      <BookOpenCheck size={34} aria-hidden="true"/><h2>{text.emptyTitle}</h2><p>{text.emptyBody}</p>
      <div><a href="#/practice">{text.practise}<ArrowRight size={16}/></a><a href="#/tests">{text.test}<ArrowRight size={16}/></a></div>
    </div> : <>
      <section className="progress-summary" aria-label={text.title}>
        <article><History size={20}/><span>{text.attempts}</span><strong>{progress.completedAttempts}</strong></article>
        <article><Target size={20}/><span>{text.correct}</span><strong>{progress.correctAnswers} / {progress.totalQuestions}</strong></article>
        <article><BookOpenCheck size={20}/><span>{text.accuracy}</span><strong>{progress.percentage}%</strong></article>
      </section>

      <div className="progress-columns">
        <section className="progress-history" aria-labelledby="progress-history-title"><h2 id="progress-history-title">{text.history}</h2>
          <ol>{completed.slice().reverse().map((attempt) => <li key={attempt.id}>
            <span className="progress-attempt-icon"><History size={17}/></span><div><strong>{attempt.type === 'mock' ? text.mockAttempt : text.practiceAttempt}</strong><small>{attempt.submissionReason === 'time-expired' ? text.expired : text.manual}</small></div>
            <span><small>{text.score}</small><strong>{attempt.result.score} / {attempt.result.total}</strong>{attempt.result.unansweredQuestionIds.length > 0 && <small>{attempt.result.unansweredQuestionIds.length} {text.unanswered}</small>}</span>
          </li>)}</ol>
        </section>

        <section className="progress-mistakes" aria-labelledby="progress-mistakes-title"><h2 id="progress-mistakes-title">{text.mistakes}</h2>
          {!progress.mistakes.length ? <p className="progress-clear">{text.noMistakes}</p> : <ul>{progress.mistakes.map(({ questionId, count }) => {
            const question = questionById.get(questionId);
            if (!question) return null;
            const href = `#/practice?subject=${question.subjectId}&topic=${question.topicId}&question=${question.id}`;
            return <li key={questionId}><div className="progress-mistake-top"><RotateCcw size={17}/><strong>{getText(question.prompt, lang)}</strong><span>{count} {text.times}</span></div><small>{text.explanation}</small><p>{getText(question.explanation, lang)}</p><a href={href}>{text.review}<ArrowRight size={16}/></a></li>;
          })}</ul>}
        </section>
      </div>
    </>}
  </section>;
}
