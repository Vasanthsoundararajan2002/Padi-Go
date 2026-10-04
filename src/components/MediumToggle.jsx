import React from 'react';

const copy = {
  'ta-Latn': { tamil: 'Tamil vazhi', english: 'English vazhi' },
  en: { tamil: 'Tamil medium', english: 'English medium' },
  ta: { tamil: 'தமிழ் வழி', english: 'ஆங்கில வழி' },
};

/**
 * Toggle between Tamil and English medium.
 * Only shown for subjects with dual-medium textbooks (maths, science, social).
 */
export default function MediumToggle({ medium, onChange, language = 'ta-Latn' }) {
  const text = copy[language] || copy['ta-Latn'];

  return (
    <div className="medium-toggle" role="radiogroup" aria-label={text.tamil}>
      <button
        type="button"
        role="radio"
        aria-checked={medium === 'ta'}
        className={medium === 'ta' ? 'active' : ''}
        onClick={() => onChange('ta')}
      >
        {text.tamil}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={medium === 'en'}
        className={medium === 'en' ? 'active' : ''}
        onClick={() => onChange('en')}
      >
        {text.english}
      </button>
    </div>
  );
}
