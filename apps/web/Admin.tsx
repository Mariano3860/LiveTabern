import { useState } from 'react';
interface Metrics {
  ticks: number;
  lastTickMs: number;
  worldVersion: number;
  viewers: number;
  events: number;
  aiMode: string;
  aiCalls: number;
  aiCost: number;
  directorEnabled: boolean;
  persistence: string;
}
export default function Admin() {
  const [capabilities, setCapabilities] = useState<{ id: string; enabled: boolean }[]>([]);
  const [token, setToken] = useState(''),
    [metrics, setMetrics] = useState<Metrics | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/metrics', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok)
        throw new Error('Access denied. Configure ADMIN_TOKEN on the server and enter it here.');
      setMetrics(await response.json());
      const catalogue = await (await fetch('/api/capabilities')).json();
      setCapabilities(catalogue.available);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Server unavailable');
    } finally {
      setBusy(false);
    }
  }
  async function toggleDirector() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/director', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !metrics?.directorEnabled }),
      });
      if (!response.ok) throw new Error('Could not save director settings.');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Server unavailable');
    } finally {
      setBusy(false);
    }
  }
  async function toggleCapability(id: string, enabled: boolean) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/capabilities/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error('Could not save capability settings.');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Server unavailable');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin">
      <header>
        <a className="brand" href="/">
          ◈ LiveTabern
        </a>
        <span>World administration</span>
      </header>
      <section className="intro">
        <div>
          <h1>Behind the hearth</h1>
          <p>Inspect the world and its health. The token stays in this page's memory.</p>
        </div>
      </section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void refresh();
        }}
      >
        <label>
          Administrator token
          <input
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </label>
        <button className="archive-button" disabled={busy}>
          {busy ? 'Checking…' : 'Inspect world'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {metrics && (
        <>
          <div className="admin-grid">
            {Object.entries(metrics).map(([key, value]) => (
              <article key={key}>
                <small>{key.replace(/([A-Z])/g, ' $1')}</small>
                <strong>
                  {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : String(value)}
                </strong>
              </article>
            ))}
          </div>
          <button className="archive-button" disabled={busy} onClick={() => void toggleDirector()}>
            {metrics.directorEnabled ? 'Pause narrative director' : 'Resume narrative director'}
          </button>
          <h2>Enabled capabilities</h2>
          <div className="admin-grid">
            {capabilities.map((c) => (
              <article key={c.id}>
                <strong>{c.id.replaceAll('_', ' ')}</strong>
                <button
                  className="archive-button"
                  disabled={busy}
                  onClick={() => void toggleCapability(c.id, !c.enabled)}
                >
                  {c.enabled ? 'Disable' : 'Enable'}
                </button>
              </article>
            ))}
          </div>
          <p className="quiet">
            Pausing opportunities leaves the autonomous simulation running. External AI remains disabled.
          </p>
        </>
      )}
    </main>
  );
}
