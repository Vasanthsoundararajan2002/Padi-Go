import React, { useState } from 'react';
import { ArrowRight, BookOpenCheck, Check, Lightbulb, ListChecks, MessageCircle, RotateCcw, Sprout, TrendingUp, Zap } from 'lucide-react';
import { learningCopy } from './content';

export default function LearningPreview({ lang }) {
  const copy = learningCopy[lang];
  const [pace, setPace] = useState(0);
  const [tab, setTab] = useState(0);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [hint, setHint] = useState(false);
  function choosePace(value) { setPace(value); setStep(0); setAnswer(null); setHint(false); setTab(value === 2 ? 1 : 0); }
  const icons = [Sprout, TrendingUp, Zap];
  const featureIcons = [MessageCircle, ListChecks, BookOpenCheck];
  const count = pace === 1 ? 3 : step + 1;
  return <section className="learning-preview" id="learning-preview" aria-labelledby="learning-heading">
    <div className="learning-intro"><span className="eyebrow"><span className="tiny-line"/>{copy.kicker}</span><h2 id="learning-heading">{copy.title}</h2><p>{copy.description}</p>
      <div className="learning-promises">{[copy.noTimer, copy.repeat, copy.noRank].map(text => <span key={text}><Check size={14}/>{text}</span>)}</div>
      <div className="feature-menu" role="tablist" aria-label={lang === 'ta' ? 'கற்றல் முன்னோட்டம்' : 'Learning preview'}>{copy.tabs.map((name, i) => { const Icon = featureIcons[i]; return <button type="button" role="tab" aria-selected={tab === i} aria-controls="lesson-panel" id={`feature-${i}`} key={i} onClick={() => setTab(i)}><span className={`feature-icon feature-${i}`}><Icon size={21}/></span><span><strong>{name}</strong><small>{copy.featureNotes[i]}</small></span><ArrowRight size={17}/></button>; })}</div>
      <p className="roadmap-note">{copy.roadmap}</p>
    </div>
    <div className="lesson-tool">
      <div className="demo-label"><span className="status-dot"/>{copy.preview}</div>
      <div className="pace-switch" aria-label="Learning pace">{copy.modes.map((label,i)=>{const Icon=icons[i];return <button key={i} type="button" aria-pressed={pace===i} onClick={()=>choosePace(i)}><Icon size={16}/><span>{label}</span></button>;})}</div>
      <p className="pace-note">{copy.modeNotes[pace]}</p>
      <div className="lesson-panel" role="tabpanel" id="lesson-panel" aria-labelledby={`feature-${tab}`} key={`${tab}-${pace}`}>
        <div className="lesson-topic"><span>{lang === 'ta' ? 'கணிதம் · இயற்கணிதம்' : lang === 'en' ? 'MATHS · ALGEBRA' : 'KANAKKU · ALGEBRA'}</span><span>01 / 01</span></div>
        <h3>{copy.question}</h3>
        {tab === 0 && <><div className="tutor-caption"><Lightbulb size={17}/>{copy.tutor}</div><ol className="lesson-steps" aria-live="polite">{copy.steps.slice(0,count).map((text,i)=><li key={i}><span>{i+1}</span><p>{text}</p></li>)}</ol><button className="lesson-action" onClick={()=>pace===1?setTab(1):setStep(count===3?0:step+1)}>{pace===1 ? copy.tabs[1] : count===3 ? copy.restart : copy.next}{count===3&&pace!==1 ? <RotateCcw size={15}/> : <ArrowRight size={15}/>}</button></>}
        {tab === 1 && <><p className="quiz-prompt">{copy.prompt}</p><div className="quiz-answers" aria-label={copy.prompt}>{[2,3,7].map(value=><button aria-pressed={answer===value} className={answer===value ? (value===3?'correct':'try-again'):''} key={value} onClick={()=>setAnswer(value)}>x = {value}{answer===value&&value===3&&<Check size={16}/>}</button>)}</div>{answer!==null&&<p className={`answer-feedback ${answer===3?'success':''}`} role="status">{answer===3?copy.correct:copy.wrong}</p>}<div className="quiz-actions"><button onClick={()=>setHint(!hint)} aria-expanded={hint}><Lightbulb size={15}/>{copy.hint}</button>{answer!==null&&<button onClick={()=>{setAnswer(null);setHint(false);}}><RotateCcw size={15}/>{copy.retry}</button>}</div>{hint&&<p className="hint-copy">{copy.steps[0]}</p>}</>}
        {tab === 2 && <><div className="recap-heading"><BookOpenCheck size={20}/>{copy.recap}</div><p className="recap-copy">{copy.recapText}</p><ul className="recap-list">{copy.recapItems.map(text=><li key={text}><Check size={15}/>{text}</li>)}</ul><button className="lesson-action" onClick={()=>{setTab(1);setAnswer(null);setHint(false);}}>{copy.tabs[1]}<ArrowRight size={15}/></button></>}
      </div>
      <div className="lesson-progress" aria-label={`${copy.step} ${tab===0?count:1}`}><span className={tab===0?'current':''}/><span className={tab===1?'current':''}/><span className={tab===2?'current':''}/><span>{copy.tabs[tab]}</span></div>
    </div>
  </section>;
}
