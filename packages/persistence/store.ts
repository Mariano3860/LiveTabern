import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { World, WorldEvent } from '../shared/world';
import { worldSchema, eventSchema } from './schema';
export class WorldStore {
  private db: DatabaseSync;
  private expectedVersion: number | null = null;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      'PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY, version INTEGER NOT NULL, state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, sequence INTEGER UNIQUE NOT NULL, time REAL NOT NULL, category TEXT NOT NULL, actors TEXT NOT NULL, data TEXT NOT NULL);',
    );
  }
  load(): World | null {
    const row = this.db.prepare('SELECT version, state FROM snapshots WHERE id = ?').get('wandering-ember');
    this.expectedVersion = row ? Number(row.version) : null;
    return row ? worldSchema.parse(JSON.parse(String(row.state))) : null;
  }
  save(world: World, events: WorldEvent[]) {
    const valid = worldSchema.parse(world);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const current = this.db.prepare('SELECT version FROM snapshots WHERE id = ?').get(world.id);
      if ((current ? Number(current.version) : null) !== this.expectedVersion)
        throw new Error('Another world writer committed progress. Refusing to overwrite it.');
      const insert = this.db.prepare(
        'INSERT OR IGNORE INTO events (id, sequence, time, category, actors, data) VALUES (?, ?, ?, ?, ?, ?)',
      );
      for (const event of events) {
        const e = eventSchema.parse(event);
        insert.run(e.id, e.sequence, e.time, e.category, JSON.stringify(e.actors), JSON.stringify(e));
      }
      this.db
        .prepare(
          'INSERT INTO snapshots (id, version, state) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET version=excluded.version, state=excluded.state',
        )
        .run(valid.id, valid.version, JSON.stringify(valid));
      this.db.exec('COMMIT');
      this.expectedVersion = world.version;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  history(before = Number.MAX_SAFE_INTEGER, actorId?: string, category?: string, limit = 40): WorldEvent[] {
    const rows = this.db
      .prepare(
        'SELECT data FROM events WHERE sequence < ? AND (? IS NULL OR EXISTS (SELECT 1 FROM json_each(events.actors) WHERE value = ?)) AND (? IS NULL OR category = ?) ORDER BY sequence DESC LIMIT ?',
      )
      .all(
        before,
        actorId ?? null,
        actorId ?? null,
        category ?? null,
        category ?? null,
        Math.min(100, Math.max(1, limit)),
      );
    return rows.map((row) => eventSchema.parse(JSON.parse(String(row.data))));
  }
  close() {
    this.db.close();
  }
}
