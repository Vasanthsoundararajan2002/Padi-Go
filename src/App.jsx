import React, { useEffect, useReducer } from 'react';
import AppShell from './components/AppShell.jsx';
import LoginView from './views/LoginView.jsx';
import ChatView from './views/ChatView.jsx';
import PracticeView from './PracticeView.jsx';
import MockTestsView from './MockTestsView.jsx';
import ProgressView from './ProgressView.jsx';
import { appReducer, createInitialSession, normalizeRoute } from './state.js';

function savedLanguage() {
  try { return localStorage.getItem('padi-language') ?? 'ta-Latn'; }
  catch { return 'ta-Latn'; }
}

function initialSession() {
  const state = createInitialSession(savedLanguage());
  return { ...state, route: normalizeRoute(location.hash) };
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, initialSession);
  const route = state.route.slice(2).split(/[/?]/)[0];

  useEffect(() => {
    const syncRoute = () => {
      const route = normalizeRoute(location.hash);
      if (location.hash !== route) history.replaceState(null, '', route);
      dispatch({ type: 'route/set', route });
    };
    addEventListener('hashchange', syncRoute);
    if (location.hash !== state.route) history.replaceState(null, '', state.route);
    return () => removeEventListener('hashchange', syncRoute);
  }, []);

  useEffect(() => {
    document.documentElement.lang = state.language;
    try { localStorage.setItem('padi-language', state.language); } catch { /* Preference storage is optional. */ }
  }, [state.language]);

  let view;
  if (route === 'login') {
    view = <LoginView language={state.language} learningMedium={state.learningMedium} onMediumChange={(medium) => dispatch({ type: 'medium/set', medium })}/>;
  } else if (route === 'practice') {
    view = <PracticeView lang={state.language} practiceState={state.practice} setPracticeState={(practice) => dispatch({ type: 'practice/set', practice })} onComplete={(attempt) => dispatch({ type: 'attempt/add', attempt })}/>;
  } else if (route === 'tests') {
    view = <MockTestsView lang={state.language} testState={state.test} onTestStateChange={(next) => dispatch({ type: 'test/set', test: typeof next === 'function' ? next(state.test) : next })} onComplete={(attempt) => dispatch({ type: 'attempt/add', attempt })}/>;
  } else if (route === 'progress') {
    view = <ProgressView lang={state.language} attempts={state.attempts}/>;
  } else {
    view = <ChatView lang={state.language} subjectId={state.selectedSubjectId} onSubjectChange={(subjectId) => dispatch({ type: 'subject/set', subjectId })} chat={state.chat} setChat={(chat) => dispatch({ type: 'chat/set', chat })} learningMedium={state.learningMedium} onMediumChange={(medium) => dispatch({ type: 'medium/set', medium })} sessionId={state.sessionId}/>;
  }

  return <AppShell state={state} dispatch={dispatch}>{view}</AppShell>;
}
