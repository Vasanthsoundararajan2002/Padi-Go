import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Loader2, Send, Sparkles } from 'lucide-react';
import { sendMessage } from '../chat.js';
import { getText, subjects, topics } from '../data.js';
import SubjectSelector from '../components/SubjectSelector.jsx';
import MediumToggle from '../components/MediumToggle.jsx';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import SourceBadge from '../components/SourceBadge.jsx';
import DiagramViewer from '../components/DiagramViewer.jsx';

// Subjects with dual-medium textbooks (Tamil + English)
const DUAL_MEDIUM_SUBJECTS = new Set(['maths', 'science', 'social']);

// Default medium per subject
const DEFAULT_MEDIUM = {
  tamil: 'ta',
  english: 'en',
  maths: 'en',
  science: 'en',
  social: 'en',
};

const copy = {
  'ta-Latn': {
    level: 'LEARN · LEVEL 1',
    welcome: 'Vanakkam! Innaikku enna kathukkanum?',
    subtitle: 'Un textbook-ai vachirukkum AI aasiriyar. Enna venaalum kelu!',
    connected: 'AI Tutor · Textbook RAG',
    ask: 'Oru kelvi kelu…',
    send: 'Anuppu',
    subject: 'Oru paadathai therndhedu',
    thinking: 'Yosikkiren…',
    suggestions: {
      tamil: 'Kurinjipattu pattrin vilakku',
      english: 'Explain the poem "Life" by Henry Van Dyke',
      maths: 'Quadratic equation-ai eppadi solve panradhu?',
      science: 'Newton-oda moondraavadhu vilakkam enna?',
      social: 'Quit India movement-in mukkiyathuvam enna?',
    },
    error: 'AI server-la pirachhanai. Backend run aagudha nu paaru.',
  },
  en: {
    level: 'LEARN · LEVEL 1',
    welcome: 'Hello! What would you like to learn today?',
    subtitle: 'AI tutor powered by your textbook. Ask anything!',
    connected: 'AI Tutor · Textbook RAG',
    ask: 'Ask a question…',
    send: 'Send',
    subject: 'Choose a subject',
    thinking: 'Thinking…',
    suggestions: {
      tamil: 'Explain Kurinjipattu poem',
      english: 'Explain the poem "Life" by Henry Van Dyke',
      maths: 'How to solve quadratic equations?',
      science: 'What is Newton\'s third law of motion?',
      social: 'What is the significance of the Quit India Movement?',
    },
    error: 'AI server error. Make sure the backend is running.',
  },
  ta: {
    level: 'கற்போம் · நிலை 1',
    welcome: 'வணக்கம்! இன்று என்ன கற்க வேண்டும்?',
    subtitle: 'உன் பாடப்புத்தகத்தை அடிப்படையாகக் கொண்ட AI ஆசிரியர்.',
    connected: 'AI ஆசிரியர் · பாடப்புத்தக RAG',
    ask: 'ஒரு கேள்வியைக் கேள்…',
    send: 'அனுப்பு',
    subject: 'ஒரு பாடத்தைத் தேர்ந்தெடு',
    thinking: 'யோசிக்கிறேன்…',
    suggestions: {
      tamil: 'குறிஞ்சிப்பாட்டு பற்றி விளக்கவும்',
      english: 'Explain the poem "Life" by Henry Van Dyke',
      maths: 'வர்க்கச் சமன்பாட்டை எப்படி தீர்ப்பது?',
      science: 'நியூட்டனின் மூன்றாவது விதி என்ன?',
      social: 'வெள்ளையனே வெளியேறு இயக்கத்தின் முக்கியத்துவம் என்ன?',
    },
    error: 'AI சேவையகப் பிழை. பின்தளம் இயங்குகிறதா என்று சரிபார்க்கவும்.',
  },
};

export default function ChatView({ lang, subjectId, onSubjectChange, chat, setChat, learningMedium, onMediumChange }) {
  const text = copy[lang] || copy['ta-Latn'];
  const messages = chat.messages ?? [];
  const draft = chat.draft ?? '';
  const loading = chat.loading ?? false;
  const transcript = useRef(null);
  const inputRef = useRef(null);
  const subject = subjects.find(({ id }) => id === subjectId);
  const hasDualMedium = DUAL_MEDIUM_SUBJECTS.has(subjectId);
  const medium = hasDualMedium ? (learningMedium || 'en') : DEFAULT_MEDIUM[subjectId] || 'en';

  const update = useCallback((next) => setChat({ ...chat, ...next }), [chat, setChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (transcript.current) {
      transcript.current.scrollTop = transcript.current.scrollHeight;
    }
  }, [messages.length, loading]);

  // Build conversation history for the API
  function buildHistory() {
    const history = [];
    for (const msg of messages) {
      history.push({ role: 'user', content: msg.question });
      if (msg.reply) {
        history.push({ role: 'assistant', content: msg.reply });
      }
    }
    return history;
  }

  async function send(question = draft) {
    const value = question.trim();
    if (!value || loading) return;

    const msgId = `${Date.now()}-${messages.length}`;
    const newMessages = [
      ...messages,
      { id: msgId, question: value, reply: null, source: null, references: [], diagrams: [], error: null },
    ];

    update({ draft: '', messages: newMessages, loading: true });

    try {
      const history = buildHistory();
      const result = await sendMessage(subjectId, medium, lang, value, history);

      // Update the last message with the AI response
      const updated = newMessages.map((msg) =>
        msg.id === msgId
          ? {
              ...msg,
              reply: result.reply || '',
              source: result.source || 'general',
              references: result.references || [],
              diagrams: result.diagrams || [],
              error: result.error || null,
            }
          : msg,
      );

      setChat({ ...chat, draft: '', messages: updated, loading: false });
    } catch (error) {
      const updated = newMessages.map((msg) =>
        msg.id === msgId ? { ...msg, error: error.message || text.error } : msg,
      );
      setChat({ ...chat, draft: '', messages: updated, loading: false });
    }
  }

  return (
    <section className="chat-layout" aria-labelledby="chat-title">
      <aside className="subjects-panel">
        <span className="panel-label">{text.level}</span>
        <SubjectSelector
          className="subject-list"
          language={lang}
          selectedId={subjectId}
          onChange={onSubjectChange}
          label={text.subject}
        />
      </aside>

      <section className="chat-panel">
        <header className="chat-head">
          <div>
            <span className="panel-label">{text.connected}</span>
            <h1 id="chat-title">{getText(subject?.name, lang)}</h1>
          </div>
          <div className="chat-head-right">
            {hasDualMedium && (
              <MediumToggle medium={medium} onChange={onMediumChange} language={lang} />
            )}
            <span className="sample-badge connected-badge">
              <span />
              {text.connected}
            </span>
          </div>
        </header>

        <div className="messages" ref={transcript} aria-live="polite">
          {/* Welcome message */}
          <div className="welcome">
            <span className="tutor-avatar">
              <Sparkles size={20} />
            </span>
            <div>
              <h2>{text.welcome}</h2>
              <p>{text.subtitle}</p>
              <button
                type="button"
                onClick={() => send(text.suggestions[subjectId] || text.suggestions.maths)}
              >
                {text.suggestions[subjectId] || text.suggestions.maths}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Message history */}
          {messages.map((message) => (
            <div className="exchange" key={message.id}>
              <div className="student-message">{message.question}</div>

              {message.reply != null ? (
                <div className="tutor-message">
                  <span className="tutor-avatar">
                    <Sparkles size={17} />
                  </span>
                  <div className="tutor-content">
                    {message.diagrams?.length > 0 && (
                      <div className="diagram-gallery">
                        {message.diagrams.map((diagram) => (
                          <DiagramViewer
                            key={diagram.id}
                            diagram={diagram}
                            subject={subjectId}
                            medium={medium}
                          />
                        ))}
                      </div>
                    )}
                    <MarkdownRenderer text={message.reply} />
                    <SourceBadge
                      source={message.source}
                      references={message.references}
                      language={lang}
                    />
                  </div>
                </div>
              ) : message.error ? (
                <div className="tutor-message error-message">
                  <span className="tutor-avatar error-avatar">
                    <Sparkles size={17} />
                  </span>
                  <p>{message.error}</p>
                </div>
              ) : null}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="tutor-message typing-indicator">
              <span className="tutor-avatar">
                <Sparkles size={17} />
              </span>
              <div className="typing-dots">
                <Loader2 size={16} className="spin" />
                <span>{text.thinking}</span>
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label htmlFor="chat-question">{text.connected}</label>
          <div>
            <textarea
              ref={inputRef}
              id="chat-question"
              rows="1"
              value={draft}
              onChange={(event) => update({ draft: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={text.ask}
              disabled={loading}
            />
            <button type="submit" disabled={!draft.trim() || loading} aria-label={text.send}>
              <Send size={19} />
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
