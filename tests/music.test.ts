import { beforeAll, describe, expect, it } from 'vitest';
import { createNavigation } from '../packages/navigation/recast';
import { createWorld, inviteDuet, tickWorld, canExecute } from '../packages/simulation/engine';
import { publicWorld } from '../packages/shared/world';
import { stageSpots, distance } from '../packages/shared/layout';
import { WorldStore } from '../packages/persistence/store';
import { worldSchema } from '../packages/persistence/schema';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { restoreWorld } from '../packages/simulation/recovery';
let navigation: Awaited<ReturnType<typeof createNavigation>>;
beforeAll(async () => {
  navigation = await createNavigation();
});
function willingWorld() {
  const world = createWorld(0);
  world.directorEnabled = false;
  world.musicNext = 0;
  for (const n of world.inhabitants.slice(1, 3)) {
    n.creativity = 1;
    n.sociability = 1;
  }
  return world;
}
describe('persistent musical duets', () => {
  it('reopens and recovers an active duet without replaying its confirmed beginning', () => {
    const folder = mkdtempSync(join(tmpdir(), 'livetabern-duet-recovery-'));
    let store: WorldStore | undefined;
    try {
      const world = willingWorld(),
        path = join(folder, 'world.sqlite');
      expect(inviteDuet(world, 'npc-2', 'npc-3', navigation)).toBe(true);
      tickWorld(world, 250, navigation);
      store = new WorldStore(path);
      store.save(world, world.events);
      store.close();
      store = new WorldStore(path);
      const recovered = restoreWorld(store, 5250, navigation);
      expect(recovered.musicGroups[0].status).toBe('performing');
      expect(recovered.musicGroups[0].performances).toBe(1);
      expect(recovered.musicGroups[0].startedAt).toBe(world.musicGroups[0].startedAt);
      expect(
        recovered.events.filter((event) => event.category === 'play_music' && event.actors.length === 2),
      ).toHaveLength(1);
      expect(recovered.inhabitants[1].memories).toEqual(world.inhabitants[1].memories);
    } finally {
      store?.close();
      rmSync(folder, { recursive: true, force: true });
    }
  });
  it('requires two willing, available musicians and respects rejection and cooldown', () => {
    const world = willingWorld(),
      coins = world.inhabitants.map((n) => n.coins);
    const reluctant = world.inhabitants[2];
    reluctant.creativity = 0;
    reluctant.sociability = 0;
    expect(inviteDuet(world, 'npc-2', 'npc-3', navigation)).toBe(false);
    expect(world.musicGroups).toEqual([]);
    expect(world.events.at(-1)?.text).toContain('declines');
    expect(reluctant.plan).toBeNull();
    expect(world.inhabitants.map((n) => n.coins)).toEqual(coins);
    expect(inviteDuet(world, 'npc-2', 'npc-3', navigation)).toBe(false);
    const other = willingWorld();
    expect(inviteDuet(other, 'npc-2', 'npc-11', navigation)).toBe(false);
    other.inhabitants[2].energy = 20;
    expect(inviteDuet(other, 'npc-2', 'npc-3', navigation)).toBe(false);
  });
  it('waits for both actual journeys before shared music and remembers the performance', () => {
    const world = willingWorld(),
      singer = world.inhabitants[1],
      lute = world.inhabitants[2];
    singer.position = [0, -2.5];
    lute.position = [5, 1];
    expect(inviteDuet(world, singer.id, lute.id, navigation)).toBe(true);
    expect(world.musicGroups[0].status).toBe('gathering');
    let waited = false;
    for (let i = 1; i <= 160; i++) {
      tickWorld(world, i * 250, navigation);
      const group = world.musicGroups[0];
      if (group.status === 'gathering') {
        expect(group.performances).toBe(0);
        if (singer.plan?.phase === 'performing') {
          waited = true;
          expect(singer.plan.applied).toBe(false);
          expect(publicWorld(world).inhabitants[1].phase).toBe('idle');
          expect(canExecute(world, world.inhabitants[13], 'dance')).not.toBeNull();
        }
      }
      if (group.status === 'performing') break;
    }
    expect(waited).toBe(true);
    expect(world.musicGroups[0].status).toBe('performing');
    expect(world.musicGroups[0].performances).toBe(1);
    expect(stageSpots.some((point) => distance(point, singer.position) < 0.65)).toBe(true);
    expect(stageSpots.some((point) => distance(point, lute.position) < 0.65)).toBe(true);
    expect(singer.plan?.until).toBe(lute.plan?.until);
    const shared = world.events.find(
      (event) => event.category === 'play_music' && event.actors.length === 2,
    )!;
    expect(shared).toBeDefined();
    expect(singer.memories.some((memory) => memory.eventId === shared.id)).toBe(true);
    expect(lute.memories.some((memory) => memory.eventId === shared.id)).toBe(true);
    expect(singer.relationships[lute.id]).toBe(4);
    expect(world.inhabitants[7].memories.some((memory) => memory.eventId === shared.id)).toBe(false);
    expect(publicWorld(world).musicGroups[0]).not.toHaveProperty('commandIds');
    const end = world.musicGroups[0].until;
    for (let now = world.time + 250; now <= end; now += 250) tickWorld(world, now, navigation);
    expect(world.musicGroups[0].status).toBe('resting');
    expect(world.events.at(-1)?.text).toContain('final notes');
  });
  it('cancels a gathering or a live duet when music becomes unavailable', () => {
    for (const perform of [false, true]) {
      const world = willingWorld();
      expect(inviteDuet(world, 'npc-2', 'npc-3', navigation)).toBe(true);
      if (perform) tickWorld(world, 250, navigation);
      world.disabledActions = ['play_music'];
      tickWorld(world, 500, navigation);
      expect(world.musicGroups[0].status).toBe('resting');
      expect(world.inhabitants[1].plan).toBeNull();
      expect(world.inhabitants[2].plan).toBeNull();
      expect(publicWorld(world).inhabitants[1].phase).toBe('idle');
    }
  });
  it('revalidates energy and position on arrival without creating a phantom duet', () => {
    const world = willingWorld();
    expect(inviteDuet(world, 'npc-2', 'npc-3', navigation)).toBe(true);
    world.inhabitants[2].energy = 10;
    tickWorld(world, 250, navigation);
    expect(world.musicGroups[0].status).toBe('resting');
    expect(world.musicGroups[0].performances).toBe(0);
    expect(world.events.some((event) => event.category === 'play_music')).toBe(false);
  });
  it('does not count a duplicate command as a new shared performance', () => {
    const world = willingWorld();
    expect(inviteDuet(world, 'npc-2', 'npc-3', navigation)).toBe(true);
    world.inhabitants[2].lastCommand = Number(world.musicGroups[0].commandIds[1].slice(8));
    tickWorld(world, 250, navigation);
    expect(world.musicGroups[0].performances).toBe(0);
    expect(world.musicGroups[0].status).toBe('resting');
    expect(world.events.some((event) => event.category === 'play_music')).toBe(false);
  });
  it('keeps the same group identity for a later consented performance', () => {
    const world = willingWorld();
    expect(inviteDuet(world, 'npc-2', 'npc-3', navigation)).toBe(true);
    tickWorld(world, 250, navigation);
    const id = world.musicGroups[0].id;
    for (let now = 500; now <= 32250; now += 250) tickWorld(world, now, navigation);
    world.time = world.musicNext;
    for (const npc of world.inhabitants.slice(1, 3)) {
      npc.plan = null;
      npc.thirst = 20;
      npc.energy = 80;
    }
    expect(inviteDuet(world, 'npc-2', 'npc-3', navigation)).toBe(true);
    tickWorld(world, world.time + 250, navigation);
    expect(world.musicGroups).toHaveLength(1);
    expect(world.musicGroups[0].id).toBe(id);
    expect(world.musicGroups[0].performances).toBe(2);
  });
  it('preserves groups and shared memories in a snapshot, and migrates older worlds', () => {
    const world = willingWorld(),
      store = new WorldStore(':memory:');
    expect(inviteDuet(world, 'npc-2', 'npc-3', navigation)).toBe(true);
    tickWorld(world, 250, navigation);
    store.save(world, world.events);
    expect(store.load()).toEqual(world);
    const legacy = { ...world, musicGroups: undefined, musicNext: undefined };
    const migrated = worldSchema.parse(legacy);
    expect(migrated.musicGroups).toEqual([]);
    expect(migrated.musicNext).toBe(0);
    const corrupt = structuredClone(world);
    corrupt.musicGroups[0].members = ['npc-2', 'npc-2'];
    expect(() => store.save(corrupt, [])).toThrow();
    expect(store.load()).toEqual(world);
    store.close();
  });
});
