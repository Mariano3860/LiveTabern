import { createWorld, emit, tickWorld, type Navigation } from './engine';
import { WorldStore } from '../persistence/store';
import type { World } from '../shared/world';
export const STEP_MS = 250;
export const MAX_CATCHUP_MS = 5 * 60 * 1000;
export function restoreWorld(store: WorldStore, now: number, navigation: Navigation): World {
  const previous = store.load();
  if (!previous) {
    const fresh = createWorld(now);
    store.save(fresh, fresh.events);
    return fresh;
  }
  if (now <= previous.time) return previous;
  const from = previous.time,
    startSequence = previous.sequence;
  const end = Math.min(now, from + MAX_CATCHUP_MS);
  for (let time = from + STEP_MS; time <= end; time += STEP_MS) {
    const events = tickWorld(previous, time, navigation);
    // Commit catch-up in bounded batches so the full durable history is retained.
    if (events.length) store.save(previous, events);
  }
  if (now - from > MAX_CATCHUP_MS) {
    const skipped = now - end;
    previous.time = now;
    previous.version++;
    for (const npc of previous.inhabitants) {
      if (npc.plan && npc.plan.until > 0) npc.plan.until += skipped;
      if (npc.plan?.blockedSince) npc.plan.blockedSince += skipped;
      npc.nextDecision += skipped;
    }
    previous.directorNext += skipped;
    previous.musicNext += skipped;
    for (const group of previous.musicGroups)
      if (group.status !== 'resting') {
        group.until += skipped;
        if (group.status === 'performing') group.startedAt += skipped;
      }
    emit(
      previous,
      'system',
      [],
      'The tavern returns after a long absence.',
      'Five minutes replayed; remaining downtime skipped explicitly. Identities and possessions preserved.',
    );
  }
  store.save(
    previous,
    previous.events.filter((e) => e.sequence > startSequence),
  );
  return previous;
}
