import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorldStore } from '../packages/persistence/store';
import { createWorld, tickWorld } from '../packages/simulation/engine';
import { restoreWorld, MAX_CATCHUP_MS } from '../packages/simulation/recovery';
import { createNavigation } from '../packages/navigation/recast';
let navigation: Awaited<ReturnType<typeof createNavigation>>;
const folders: string[] = [];
beforeAll(async () => {
  navigation = await createNavigation();
});
afterEach(() => {
  for (const path of folders.splice(0)) rmSync(path, { recursive: true, force: true });
});
function database() {
  const folder = mkdtempSync(join(tmpdir(), 'livetabern-test-'));
  folders.push(folder);
  return join(folder, 'world.sqlite');
}
describe('transactional world recovery', () => {
  it('preserves IDs, plans, money, memories, and unique events on reopening', () => {
    const path = database(),
      store = new WorldStore(path),
      w = createWorld(0);
    store.save(w, w.events);
    for (let i = 1; i <= 400; i++) {
      const events = tickWorld(w, i * 250, navigation);
      store.save(w, events);
    }
    const history = store.history();
    store.save(w, w.events);
    expect(store.history()).toEqual(history);
    store.close();
    const reopened = new WorldStore(path);
    expect(reopened.load()).toEqual(w);
    reopened.close();
  });
  it('catches up without viewers and caps extended downtime explicitly', () => {
    const store = new WorldStore(database());
    const first = restoreWorld(store, 0, navigation);
    const ids = first.inhabitants.map((n) => n.id);
    const recovered = restoreWorld(store, MAX_CATCHUP_MS + 600000, navigation);
    expect(recovered.time).toBe(MAX_CATCHUP_MS + 600000);
    expect(recovered.version).toBe(1201);
    expect(recovered.inhabitants.map((n) => n.id)).toEqual(ids);
    expect(recovered.events.at(-1)?.detail).toContain('remaining downtime skipped');
    store.close();
  });
  it('rejects stale writers and invalid snapshots without corrupting saved state', () => {
    const path = database(),
      one = new WorldStore(path),
      w = createWorld(0);
    one.load();
    one.save(w, w.events);
    const two = new WorldStore(path),
      stale = two.load()!;
    tickWorld(w, 250, navigation);
    one.save(w, []);
    tickWorld(stale, 250, navigation);
    expect(() => two.save(stale, [])).toThrow('Another world writer');
    const invalid = structuredClone(w);
    invalid.stock = -1;
    expect(() => one.save(invalid, [])).toThrow();
    expect(one.load()).toEqual(w);
    one.close();
    two.close();
  });
});
