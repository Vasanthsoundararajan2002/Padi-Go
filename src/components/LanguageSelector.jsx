import React from 'react';
import { languages } from '../data.js';

export default function LanguageSelector({ language, onChange, label = 'Language' }) {
  return <div className="language" aria-label={label}>{languages.map(({ id, label: languageName }) =>
    <button key={id} type="button" lang={id} aria-pressed={language === id} onClick={() => onChange(id)}>{languageName}</button>
  )}</div>;
}
