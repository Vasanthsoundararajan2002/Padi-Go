import React, { useRef } from 'react';
import { ArrowUpRight, BookOpen, Menu, X } from 'lucide-react';
import { shellCopy } from '../content.js';
import LanguageSelector from './LanguageSelector.jsx';

const levelRoutes = ['chat', 'practice', 'tests', 'progress'];

export default function AppShell({ state, dispatch, children }) {
  const copy = shellCopy[state.language];
  const currentRoute = state.route.slice(2).split(/[/?]/)[0];
  const menuButton = useRef(null);
  const closeDrawer = () => { dispatch({ type: 'drawer/close' }); requestAnimationFrame(() => menuButton.current?.focus()); };
  const navigation = <nav className="level-nav" aria-label={copy.navigation}>
    {levelRoutes.map((route, index) => <a key={route} href={`#/${route}`} aria-current={currentRoute === route ? 'page' : undefined} onClick={closeDrawer}>
      <span className="level-number">{index + 1}</span><span><strong>{copy.routes[route]}</strong><small>{copy.routeNotes[route]}</small></span>
    </a>)}
    <a className="login-link" href="#/login" aria-current={currentRoute === 'login' ? 'page' : undefined} onClick={closeDrawer}>{copy.routes.login}<ArrowUpRight size={14} /></a>
  </nav>;

  return <div className="platform app platform-app">
    <header className="topbar header platform-header">
      <button ref={menuButton} className="mobile-menu" type="button" aria-label={state.drawerOpen ? copy.closeMenu : copy.menu} aria-expanded={state.drawerOpen} aria-controls="platform-navigation" onClick={() => dispatch({ type: 'drawer/toggle' })}>{state.drawerOpen ? <X /> : <Menu />}</button>
      <a className="brand" href="#/chat" aria-label={copy.homeLabel}><span className="brand-icon" aria-hidden="true"><BookOpen size={27}/><ArrowUpRight className="brand-arrow" size={18}/><i/></span><span className="brand-type">padi<span className="brand-and">&</span>go<span className="brand-dot">.</span><small>{copy.tagline}</small></span></a>
      <div className="top-actions header-right"><span className="board board-label"><span className="status-dot"/>{copy.board}</span><LanguageSelector language={state.language} label={copy.languageLabel} onChange={(language) => dispatch({ type: 'language/set', language })}/></div>
    </header>
    <div className="workspace">
      {state.drawerOpen && <button className="drawer-scrim" type="button" aria-label={copy.closeMenu} onClick={closeDrawer}/>}
      <aside className={`sidebar ${state.drawerOpen ? 'open' : ''}`} id="platform-navigation"><div className="sidebar-head"><span>{copy.navigation}</span><button type="button" onClick={closeDrawer} aria-label={copy.closeMenu}><X size={19}/></button></div>{navigation}</aside>
      <main className="content" id="main-content">{children}</main>
    </div>
  </div>;
}
