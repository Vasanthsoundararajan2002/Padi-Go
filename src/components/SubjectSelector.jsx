import React from 'react';
import { Check } from 'lucide-react';
import { getText, subjects } from '../data.js';

export default function SubjectSelector({ language, selectedId, onChange, label = 'Choose a subject', className = 'subjects' }) {
  return <div className={className} aria-label={label}>{subjects.map((subject) =>
    <button key={subject.id} type="button" aria-pressed={selectedId === subject.id} onClick={() => onChange(subject.id)} style={{ '--swatch': subject.color }}>
      <span style={{ '--subject': subject.color }}><span className="subject-dot" /></span>{getText(subject.name, language)}{selectedId === subject.id && <Check size={12} />}
    </button>
  )}</div>;
}
