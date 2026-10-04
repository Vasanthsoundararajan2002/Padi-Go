import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, Eye, EyeOff, LockKeyhole, Mail, User, X } from 'lucide-react';
import { shellCopy } from '../content.js';

export default function LoginView({ language, learningMedium, onMediumChange }) {
  const copy = shellCopy[language];
  const [signup, setSignup] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [notice, setNotice] = useState(false);

  function chooseMode(nextSignup) {
    setSignup(nextSignup);
    setNotice(false);
  }

  return <section className="auth" aria-labelledby="login-title">
    <div className="auth-inner">
      <a className="preview-link" href="#/chat">{copy.directAccess}<ArrowUpRight size={15}/></a>
      <div className="auth-kicker"><span className="little-spark">✳</span>{copy.loginKicker}</div>
      <h1 id="login-title">{signup ? copy.signupTitle : copy.loginTitle}</h1>
      <p className="auth-subtitle">{signup ? copy.signupSubtitle : copy.loginSubtitle}</p>
      <div className="auth-tabs">
        <button type="button" aria-pressed={!signup} onClick={() => chooseMode(false)}>{copy.login}</button>
        <button type="button" aria-pressed={signup} onClick={() => chooseMode(true)}>{copy.signup}</button>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); setNotice(true); }}>
        {signup && <label className="field-label">{copy.name}<div className="input-wrap"><User size={17}/><input name="name" autoComplete="name" placeholder={copy.namePlaceholder} maxLength={80} required/></div></label>}
        <label className="field-label">{copy.email}<div className="input-wrap"><Mail size={17}/><input type="email" name="email" autoComplete="email" placeholder="you@example.com" required/></div></label>
        <label className="field-label">{copy.password}<div className="input-wrap"><LockKeyhole size={17}/><input name="password" type={passwordVisible ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? copy.passwordNew : copy.passwordPlaceholder} minLength={signup ? 12 : 1} maxLength={128} required/><button className="eye-button" type="button" onClick={() => setPasswordVisible(!passwordVisible)} aria-label={passwordVisible ? copy.hidePassword : copy.showPassword}>{passwordVisible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        {signup && <label className="field-label">{copy.medium}<select name="medium" value={learningMedium} onChange={(event) => onMediumChange(event.target.value)}><option value="ta">{copy.tamilMedium}</option><option value="en">{copy.englishMedium}</option></select></label>}
        <button className="submit-button" type="submit"><span>{signup ? copy.submitSignup : copy.submitLogin}</span><ArrowRight size={19}/></button>
        {notice && <div className="notice" role="status"><span>{copy.noSave}</span><button type="button" onClick={() => setNotice(false)} aria-label={copy.dismiss}><X size={16}/></button></div>}
      </form>
      <p className="switch-copy">{signup ? copy.existing : copy.newHere} <button type="button" onClick={() => chooseMode(!signup)}>{signup ? copy.login : copy.freshStart}<ArrowUpRight size={13}/></button></p>
      <div className="auth-note"><span className="note-symbol">அ</span><div><strong>{copy.ownPace}</strong><p>{copy.classLine}</p></div></div>
    </div>
  </section>;
}
