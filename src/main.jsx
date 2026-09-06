import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, ArrowUpRight, BookOpen, Check, Eye, EyeOff, LockKeyhole, Mail, Pause, Play, Sparkles, User, X } from 'lucide-react';
import './style.css';
import { thanglish, learningCopy } from './content';
import LearningPreview from './LearningPreview';

const subjects = [
  { name: 'Tamil', tamil: 'தமிழ்', color: '#ecb764', mark: 'அ', title: 'Every word, a world.', lines: ['அகர முதல எழுத்தெல்லாம்', 'ஆதி பகவன் முதற்றே உலகு.'], label: 'திருக்குறள்' },
  { name: 'English', tamil: 'ஆங்கிலம்', color: '#a9b9ee', mark: 'Aa', title: 'Find your voice.', lines: ['A little curiosity.', 'A whole new perspective.'], label: 'WORDS & WORLDS' },
  { name: 'Maths', tamil: 'கணிதம்', color: '#ed9687', mark: 'π', title: 'It all adds up.', lines: ['a² + b² = c²', 'One step. Then the next.'], label: 'THE JOY OF SOLVING' },
  { name: 'Science', tamil: 'அறிவியல்', color: '#9bcdb5', mark: '↗', title: 'Stay curious.', lines: ['Ask why. Explore how.', 'Discover something new.'], label: 'A WORLD TO DISCOVER' },
  { name: 'Social', tamil: 'சமூக அறிவியல்', color: '#91bdd1', mark: '◎', title: 'See the bigger picture.', lines: ['Our past. Our planet.', 'Our place in the world.'], label: 'PEOPLE & PLACES' },
];

function App() {
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState('login');
  const [visible, setVisible] = useState(false);
  const [focus, setFocus] = useState('');
  const [paused, setPaused] = useState(false);
  const [lang, setLang] = useState(() => {
    try { const saved = localStorage.getItem('padi-language'); return ['ta-Latn', 'ta', 'en'].includes(saved) ? saved : 'ta-Latn'; }
    catch { return 'ta-Latn'; }
  });
  const [notice, setNotice] = useState(false);
  const tamil = lang === 'ta';
  const subject = subjects[active];
  const signup = mode === 'signup';
  const t = (en, ta) => tamil ? ta : lang === 'ta-Latn' ? (thanglish[en] || en) : en;
  const copy = learningCopy[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('padi-language', lang); } catch { /* Preference storage is optional. */ }
  }, [lang]);

  function submit(event) { event.preventDefault(); setNotice(true); }

  return <div className={`app ${paused ? 'paused' : ''}`}>
    <header className="header">
      <a className="brand" href="#" aria-label="Padi and Go home"><span className="brand-icon" aria-hidden="true"><BookOpen size={27}/><ArrowUpRight className="brand-arrow" size={18}/><i/></span><span className="brand-type">padi<span className="brand-and">&</span>go<span className="brand-dot">.</span><small>{t('Made for the way you learn.', 'உன் கற்றலுக்காக உருவாக்கப்பட்டது.')}</small></span></a>
      <div className="header-right"><span className="board-label"><span className="status-dot"/>{tamil ? 'தமிழ்நாடு மாநிலப் பாடத்திட்டம்' : 'TAMIL NADU STATE BOARD'}</span><div className="language" aria-label="Language"><button aria-pressed={lang==='ta-Latn'} onClick={() => setLang('ta-Latn')}>Thanglish</button><button aria-pressed={tamil} onClick={() => setLang('ta')}>தமிழ்</button><button aria-pressed={lang==='en'} onClick={() => setLang('en')}>English</button></div></div>
    </header>

    <main className="main">
      <section className="story" aria-label="Tamil Nadu Class 10 subjects">
        <div className="story-top"><span className="eyebrow"><span className="tiny-line"/>{t('A LITTLE EVERY DAY. A LONG WAY AHEAD.', 'தினமும் கொஞ்சம். தொடர்ந்து முன்னேற்றம்.')}</span><span className="class-chip">CLASS <strong>10</strong></span></div>
        <h1>{t('Your next chapter', 'உன் அடுத்த அத்தியாயம்')}<br/><span>{t('starts here.', 'இங்கே தொடங்குகிறது.')}</span><span className="heading-star" aria-hidden="true">✳</span></h1>
        <p className="story-description">{t('Big dreams begin with small discoveries.', 'பெரிய கனவுகள் சிறிய தேடல்களில் தொடங்கும்.')}<br/>{t('Make a little room for learning today.', 'இன்று கற்றலுக்காகக் கொஞ்சம் நேரம் ஒதுக்கு.')}</p>
        <a className="preview-link" href="#learning-preview"><Sparkles size={15}/>{lang==='ta-Latn' ? 'AI tutor, tests & revision — oru preview' : tamil ? 'AI ஆசிரியர், தேர்வுகள், மீள்பார்வை — முன்னோட்டம்' : 'AI tutor, tests & revision — explore the preview'}<ArrowUpRight size={15}/></a>

        <div className={`book-scene focus-${focus}`} style={{'--subject-color': subject.color}}>
          <span className="scene-word word-one" aria-hidden="true">அ</span><span className="scene-word word-two" aria-hidden="true">a²+b²</span><span className="scene-star star-one" aria-hidden="true">✧</span><span className="scene-star star-two" aria-hidden="true">✳</span>
          <div className="orbit-label"><span className="orbit-icon"><Sparkles size={14}/></span>{t('A fresh page. A fresh start.', 'புதிய பக்கம். புதிய தொடக்கம்.')}</div>
          <div className="book-stack" aria-hidden="true"><div className="stack-book stack-three"><span>SCIENCE</span><i/></div><div className="stack-book stack-two"><span>MATHEMATICS</span><i/></div><div className="stack-book stack-one"><span>TAMIL NADU · CLASS 10</span><i/></div></div>
          <div className="open-book" key={active}>
            <div className="book-cover"/><div className="page page-left"><div className="page-top">PADI & GO <span>01</span></div><div className="page-mark">{subject.mark}</div><div className="page-label">{t(subject.name,subject.tamil)}</div><div className="page-rule"/><div className="page-small">{copy.noTimer}<br/>{copy.repeat}</div></div>
            <div className="page page-right"><div className="page-top">{tamil ? 'வகுப்பு 10' : 'CLASS 10'} <span>02</span></div><span className="bookmark"/><h3>{lang==='en' ? subject.title : tamil ? 'சேர்ந்து கற்கலாம்.' : 'Serndhu kathukkalaam.'}</h3><div className="book-copy">{(lang==='en' ? subject.lines : tamil ? ['ஒரு நேரத்தில் ஒரு படி.', 'உன் வேகத்தில் முன்னேறு.'] : ['Oru nerathil oru step.', 'Un vegathil munneru.']).map(line => <p key={line}>{line}</p>)}</div><div className="ink-lines"><i/><i/><i/></div><div className="page-footer">{t(subject.name,subject.tamil)}<ArrowUpRight size={13}/></div></div><div className="page-turn" aria-hidden="true"/>
          </div>
          <div className="scene-bottom"><span><span className="status-dot"/>{t('FIVE SUBJECTS. ENDLESS POSSIBILITIES.', 'ஐந்து பாடங்கள். எல்லையற்ற வாய்ப்புகள்.')}</span><button className="motion-button" onClick={() => setPaused(!paused)} aria-label={paused ? (tamil?'அசைவைத் தொடங்கு':lang==='ta-Latn'?'Animation thodangu':'Play animation') : (tamil?'அசைவை நிறுத்து':lang==='ta-Latn'?'Animation niruthu':'Pause animation')} title={paused ? 'Play animation' : 'Pause animation'}>{paused ? <Play size={13}/> : <Pause size={13}/>}</button></div>
        </div>
        <div className="subjects" aria-label="Choose a subject">{subjects.map((item, i) => <button key={item.name} onClick={() => setActive(i)} aria-pressed={active === i} style={{'--swatch':item.color}}><span className="subject-dot"/>{t(item.name, item.tamil)}{active === i && <Check size={12}/>}</button>)}</div>
        <div className="story-foot"><BookOpen size={15}/><span>{t('Rooted in Tamil Nadu. Ready for your tomorrow.', 'தமிழ்நாட்டின் பாடங்கள். உனக்கான புதிய பாதைகள்.')}</span></div>
      </section>

      <section className="auth" aria-label={signup ? 'Create account' : 'Log in'}>
        <div className="auth-inner"><div className="auth-kicker"><span className="little-spark">✳</span>{t('YOUR SPACE TO GROW', 'நீ வளர்வதற்கான இடம்')}</div>
          <h2>{signup ? t('A new beginning.', 'புதிய தொடக்கம்.') : t('Welcome back.', 'மீண்டும் வருக.')}</h2>
          <p className="auth-subtitle">{signup ? t('Your learning journey starts with you.', 'உன் கற்றல் பயணம் உன்னிடம் தொடங்குகிறது.') : t('Good to see you. Let’s turn a new page.', 'உன்னைப் பார்ப்பதில் மகிழ்ச்சி. அடுத்த பக்கம் செல்லலாம்.')}</p>
          <div className="auth-tabs"><button type="button" aria-pressed={!signup} onClick={() => {setMode('login');setNotice(false);}}>{t('Log in', 'உள்நுழை')}</button><button type="button" aria-pressed={signup} onClick={() => {setMode('signup');setNotice(false);}}>{t('Create account', 'கணக்கு உருவாக்கு')}</button></div>
          <form onSubmit={submit} key={mode}>
            {signup && <label className="field-label">{t('Your name', 'உன் பெயர்')}<div className="input-wrap"><User size={17}/><input name="name" autoComplete="name" placeholder={t('What should we call you?', 'உன் பெயர்')} required maxLength={80} onFocus={() => setFocus('name')} onBlur={() => setFocus('')}/></div></label>}
            <label className="field-label">{t('Email address', 'மின்னஞ்சல் முகவரி')}<div className="input-wrap"><Mail size={17}/><input type="email" name="email" autoComplete="email" placeholder="you@example.com" required onFocus={() => setFocus('email')} onBlur={() => setFocus('')}/></div></label>
            <label className="field-label">{t('Password', 'கடவுச்சொல்')}<div className="input-wrap"><LockKeyhole size={17}/><input name="password" type={visible ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? t('At least 12 characters', 'குறைந்தது 12 எழுத்துகள்') : t('Enter your password', 'உன் கடவுச்சொல்')} minLength={signup ? 12 : 1} maxLength={128} required onFocus={() => setFocus('password')} onBlur={() => setFocus('')}/><button className="eye-button" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} title={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
            {signup ? <label className="field-label">{t('Study medium', 'பயிற்று மொழி')}<select name="medium"><option value="ta">தமிழ் வழி / Tamil medium</option><option value="en">English medium / ஆங்கில வழி</option></select></label> : <div className="form-meta"><span><LockKeyhole size={12}/>{t('Your own little learning space', 'உனக்கான கற்றல் வெளி')}</span><span>CLASS 10</span></div>}
            <button className="submit-button" type="submit"><span>{signup ? t('Start my chapter', 'என் பயணத்தைத் தொடங்கு') : t('Let’s get learning', 'கற்கத் தொடங்கலாம்')}</span><ArrowRight size={19}/></button>
            {notice && <div className="notice" role="status"><span>{t('The page is ready. Account connection is coming next; no details have been sent or saved.', 'பக்கம் தயாராக உள்ளது. கணக்கு இணைப்பு அடுத்த கட்டத்தில் வரும்; விவரங்கள் அனுப்பப்படவோ சேமிக்கப்படவோ இல்லை.')}</span><button type="button" onClick={() => setNotice(false)} aria-label="Dismiss message"><X size={16}/></button></div>}
          </form>
          <p className="switch-copy">{signup ? t('Already have an account?', 'ஏற்கனவே கணக்கு உள்ளதா?') : t('New around here?', 'இங்கு புதிதா?')} <button onClick={() => {setMode(signup ? 'login' : 'signup');setNotice(false);}}>{signup ? t('Log in', 'உள்நுழை') : t('Make a fresh start', 'புதிதாகத் தொடங்கு')}<ArrowUpRight size={13}/></button></p>
          <div className="auth-note"><span className="note-symbol">அ</span><div><strong>{t('One syllabus. Your own pace.', 'ஒரே பாடத்திட்டம். உன் சொந்த வேகம்.')}</strong><p>{t('Tamil & English medium · Tamil Nadu Class 10', 'தமிழ் & ஆங்கில வழி · தமிழ்நாடு 10ஆம் வகுப்பு')}</p></div></div>
        </div>
      </section>
    </main>
    <LearningPreview lang={lang}/>
    <footer><span>© {new Date().getFullYear()} Padi and Go</span><span>{t('Made for the way you learn.', 'உன் கற்றலுக்காக உருவாக்கப்பட்டது.')}<span className="footer-star">✳</span></span><span>Independent learning project · Tamil Nadu</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
