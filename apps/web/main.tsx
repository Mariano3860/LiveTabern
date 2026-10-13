import React, { Component, Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useWorld } from './useWorld';
import { useAmbience } from './audio';
import type { Category, WorldEvent } from '../../packages/shared/world';
import './style.css';
const TavernScene = lazy(() => import('./scene'));
const Admin = lazy(() => import('./Admin'));
const label = (action: string) => action.replaceAll('_', ' ');
const time = (value: number) =>
  new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
class SceneBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-error">
        The 3D view could not start. Try a WebGL-capable browser. The live chronicle remains available.
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const { world, online, viewers } = useWorld();
  const [selected, setSelected] = useState<string | null>(null),
    [filter, setFilter] = useState('all'),
    [category, setCategory] = useState('all');
  const [quality, setQuality] = useState('high'),
    [view, setView] = useState('room'),
    [sound, setSound] = useState(false),
    [tab, setTab] = useState('chronicle');
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [older, setOlder] = useState<WorldEvent[]>([]),
    [cursor, setCursor] = useState<number | null>(null),
    [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  useAmbience(sound, world);
  useEffect(() => {
    setOlder([]);
    setCursor(null);
    setHistoryError('');
  }, [filter, category]);
  const npc = world?.inhabitants.find((n) => n.id === selected);
  const combined = [...older, ...(world?.events ?? [])];
  const events = [...new Map(combined.map((e) => [e.id, e])).values()]
    .filter(
      (e) =>
        (filter === 'all' || e.actors.includes(filter)) && (category === 'all' || e.category === category),
    )
    .sort((a, b) => b.sequence - a.sequence);
  async function loadHistory() {
    setLoadingHistory(true);
    setHistoryError('');
    try {
      const query = new URLSearchParams({
        before: String(cursor ?? world?.events[0]?.sequence ?? Number.MAX_SAFE_INTEGER),
      });
      if (filter !== 'all') query.set('actor', filter);
      if (category !== 'all') query.set('category', category);
      const response = await fetch(`/api/history?${query}`);
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { events: WorldEvent[]; nextCursor: number | null };
      setOlder((previous) => [...data.events, ...previous]);
      setCursor(data.nextCursor);
    } catch {
      setHistoryError('The archive is unavailable. Please try again.');
    } finally {
      setLoadingHistory(false);
    }
  }
  return (
    <main>
      <header>
        <a className="brand" href="/">
          ◈{' '}
          <span>
            LiveTabern<small>A WORLD THAT KEEPS LIVING</small>
          </span>
        </a>
        <div className={`status ${online ? 'online' : ''}`}>
          <i />
          {online ? 'Live world' : 'Reconnecting…'}
          <span>{viewers} watching</span>
        </div>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">AT THE EDGE OF THE OLD FOREST</p>
          <h1>The Wandering Ember</h1>
          <p>The fire is warm. The ale is amber. The evening is yours to discover.</p>
        </div>
        <div className="world-clock">
          <span>TAVERN TIME</span>
          <strong>{world ? time(world.time) : '—'}</strong>
          <small>{world?.inhabitants.length ?? 0} souls under one roof</small>
        </div>
      </section>
      <div className="layout">
        <section className="scene-panel" aria-label="Interactive 3D tavern">
          <div className="scene-label">
            <span>THE COMMON ROOM</span>
            <div className="scene-settings">
              <button aria-pressed={sound} onClick={() => setSound(!sound)}>
                {sound ? 'Sound on' : 'Enable sound'}
              </button>
              <label>
                Quality{' '}
                <select value={quality} onChange={(e) => setQuality(e.target.value)}>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </label>
            </div>
          </div>
          {world ? (
            <SceneBoundary>
              <Suspense fallback={<div className="loading">Opening the doors…</div>}>
                <TavernScene
                  world={world}
                  selected={selected}
                  select={setSelected}
                  quality={quality}
                  view={view}
                  reduced={reduced}
                />
              </Suspense>
            </SceneBoundary>
          ) : (
            <div className="loading">
              Lighting the hearth…<small>Connecting to the persistent world</small>
            </div>
          )}
          <div className="camera-controls" aria-label="Camera views">
            {['room', 'hearth', 'stage'].map((v) => (
              <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
                {v === 'room' ? 'The room' : v === 'hearth' ? 'By the fire' : 'The stage'}
              </button>
            ))}
            {npc && (
              <button aria-pressed={view === 'follow'} onClick={() => setView('follow')}>
                Follow {npc.name}
              </button>
            )}
          </div>
          <div className="scene-hint">Drag to explore · Scroll to zoom · Select a traveler</div>
        </section>
        <aside className="chronicle">
          <div className="sidebar-tabs">
            <button aria-pressed={tab === 'chronicle'} onClick={() => setTab('chronicle')}>
              The chronicle
            </button>
            <button aria-pressed={tab === 'world'} onClick={() => setTab('world')}>
              Under the roof
            </button>
          </div>
          {tab === 'chronicle' ? (
            <>
              <div className="section-title">
                <h2>The evening's tales</h2>
                <span>CONFIRMED WORLD EVENTS</span>
              </div>
              <label className="filter">
                Follow{' '}
                <select
                  aria-label="Follow traveler"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Everyone</option>
                  {world?.inhabitants.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filter category">
                Stories{' '}
                <select
                  aria-label="Story category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">All activity</option>
                  {(
                    [
                      'chat',
                      'drink',
                      'trade',
                      'play_music',
                      'dance',
                      'story',
                      'capability',
                      'system',
                    ] as Category[]
                  ).map((c) => (
                    <option key={c} value={c}>
                      {label(c)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="events" role="log" aria-label="World chronicle">
                {events.length ? (
                  events.slice(0, 100).map((e) => (
                    <article key={e.id}>
                      <time>{time(e.time)}</time>
                      <p>{e.text}</p>
                      <span>{label(e.category)}</span>
                      {e.detail && <small>{e.detail}</small>}
                    </article>
                  ))
                ) : (
                  <p className="quiet">
                    A quiet moment. Try another filter, or look further back in the archive.
                  </p>
                )}
              </div>
              <button className="archive-button" onClick={() => void loadHistory()} disabled={loadingHistory}>
                {loadingHistory ? 'Opening the archive…' : 'Read earlier tales'}
              </button>
              {historyError && <p role="alert">{historyError}</p>}
            </>
          ) : (
            <>
              <div className="section-title">
                <h2>A world in motion</h2>
              </div>
              <p className="quiet">
                Stories begin with an opportunity. The travelers choose what comes next.
              </p>
              <div className="world-stats">
                <div>
                  <strong>{world?.inhabitants.filter((n) => n.phase === 'walking').length ?? 0}</strong>
                  <span>on the move</span>
                </div>
                <div>
                  <strong>
                    {world?.inhabitants.filter((n) => n.action === 'play_music' && n.phase === 'performing')
                      .length ?? 0}
                  </strong>
                  <span>making music</span>
                </div>
                <div>
                  <strong>{world?.stock ?? 0}</strong>
                  <span>servings of ale</span>
                </div>
              </div>
              <h3>Threads of the evening</h3>
              {world?.opportunities
                .slice(-3)
                .reverse()
                .map((o) => (
                  <article className="thread" key={o.id}>
                    <strong>{o.title}</strong>
                    <p>{o.outcome ?? 'An invitation awaits a response.'}</p>
                    <small>{o.status}</small>
                  </article>
                ))}
              <h3>Ideas for tomorrow</h3>
              {world?.demands.length ? (
                world.demands.map((d) => (
                  <article className="thread" key={d.id}>
                    <strong>{label(d.id)}</strong>
                    <p>{d.reason}</p>
                    <small>Requested {d.count} time · awaiting development</small>
                  </article>
                ))
              ) : (
                <p className="quiet">
                  New wishes will appear here when travelers reach the limits of their abilities.
                </p>
              )}
            </>
          )}
        </aside>
      </div>
      <section className="residents">
        <div className="section-title">
          <h2>Familiar faces</h2>
          <span>EVERY TRAVELER HAS A STORY</span>
        </div>
        <div className="people">
          {world?.inhabitants.map((n) => (
            <button
              key={n.id}
              className={selected === n.id ? 'selected' : ''}
              onClick={() => setSelected(n.id)}
            >
              <span className="avatar" style={{ background: n.color }}>
                {n.name[0]}
              </span>
              <span>
                <strong>{n.name}</strong>
                <small>{n.role}</small>
              </span>
              <em>{n.phase === 'walking' ? 'walking' : label(n.action)}</em>
            </button>
          ))}
        </div>
      </section>
      {npc && (
        <section className="profile" aria-label={`${npc.name}'s profile`}>
          <button
            className="close"
            onClick={() => {
              setSelected(null);
              if (view === 'follow') setView('room');
            }}
            aria-label="Close profile"
          >
            ×
          </button>
          <p className="eyebrow">{npc.role}</p>
          <h2>{npc.name}</h2>
          <p>{npc.description}</p>
          <dl>
            <dt>Now</dt>
            <dd>{npc.phase === 'walking' ? `On the way to ${label(npc.action)}` : label(npc.action)}</dd>
            <dt>Spirits</dt>
            <dd>{npc.mood > 70 ? 'Cheerful' : 'Content'}</dd>
            <dt>Coins</dt>
            <dd>{npc.coins}</dd>
          </dl>
          <button
            className="archive-button"
            onClick={() => {
              setFilter(npc.id);
              setTab('chronicle');
            }}
          >
            Read {npc.name}'s story
          </button>
        </section>
      )}
      <footer>
        <span>One tavern. One shared history.</span>
        <label>
          <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} /> Reduced
          motion
        </label>
        <span>Persistent local world · AI off · Procedural art</span>
      </footer>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {location.pathname === '/admin' ? (
      <Suspense fallback={<div className="loading">Opening administration…</div>}>
        <Admin />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
