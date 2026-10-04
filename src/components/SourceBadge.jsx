import React from 'react';
import { BookOpen, Globe } from 'lucide-react';

const copy = {
  'ta-Latn': { textbook: 'Textbook-ilirundhu', web: 'Internet-ilirundhu', page: 'Pakkam' },
  en: { textbook: 'From textbook', web: 'From web search', page: 'Page' },
  ta: { textbook: 'பாடப்புத்தகத்திலிருந்து', web: 'இணையத் தேடலிலிருந்து', page: 'பக்கம்' },
};

/**
 * Shows the source of an AI response (textbook or web search) with page references.
 */
export default function SourceBadge({ source, references = [], language = 'ta-Latn' }) {
  const text = copy[language] || copy['ta-Latn'];

  if (source === 'error') return null;

  const isTextbook = source === 'textbook';
  const label = isTextbook ? text.textbook : source === 'web_search' ? text.web : null;

  if (!label) return null;

  return (
    <div className={`source-badge ${isTextbook ? 'source-textbook' : 'source-web'}`}>
      {isTextbook ? <BookOpen size={14} /> : <Globe size={14} />}
      <span>{label}</span>
      {isTextbook && references.length > 0 && (
        <span className="source-pages">
          · {text.page} {references.map((r) => r.page).join(', ')}
        </span>
      )}
    </div>
  );
}
