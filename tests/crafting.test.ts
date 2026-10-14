import { beforeAll, expect, it } from 'vitest';
import { createNavigation } from '../packages/navigation/recast';
import {
  createWorld,
  tickWorld,
  executeAction,
  CRAFT_DURATION,
  demand,
  inviteDuet,
} from '../packages/simulation/engine';
import { publicWorld, actions } from '../packages/shared/world';
import { workbenchSpot, distance } from '../packages/shared/layout';
import { worldSchema } from '../packages/persistence/schema';
import { WorldStore } from '../packages/persistence/store';
import { restoreWorld, MAX_CATCHUP_MS } from '../packages/simulation/recovery';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let navigation: Awaited<ReturnType<typeof createNavigation>>;
beforeAll(async () => {
  navigation = await createNavigation();
});
it('detours around two stationary travelers after crafting and reaches the stage', () => {
  const world = createWorld(0);
  world.directorEnabled = false;
  world.musicNext = 120000;
  for (const npc of world.inhabitants) npc.nextDecision = 120000;
  world.inhabitants[1].position = [0, -2.5];
  world.inhabitants[2].position = [5, 1];
  const pip = world.inhabitants[10];
  pip.position = [3.5, 1.5];
  pip.nextDecision = 10000;
  pip.energy = 95;
  pip.thirst = 0;
  pip.socialNeed = 0;
  pip.creativity = 1;
  for (let now = 250; now <= 50000; now += 250) {
    tickWorld(world, now, navigation);
    for (const blocker of [world.inhabitants[2], world.inhabitants[9]])
      expect(distance(pip.position, blocker.position)).toBeGreaterThanOrEqual(0.45);
  }
  expect(pip.instrument).toBe('lute');
  expect(pip.plan?.phase).toBe('performing');
  expect(pip.action).toBe('play_music');
});
function fixture() {
  const world = createWorld(0);
  world.directorEnabled = false;
  world.musicNext = 1e9;
  for (const npc of world.inhabitants) npc.nextDecision = 1e9;
  const pip = world.inhabitants[10];
  pip.nextDecision = 0;
  pip.energy = 90;
  pip.thirst = 0;
  pip.socialNeed = 0;
  return { world, pip };
}
function begin() {
  const state = fixture();
  for (let now = 250; now <= 30000 && !state.pip.plan?.until; now += 250)
    tickWorld(state.world, now, navigation);
  expect(state.pip.plan?.action).toBe('craft_instrument');
  expect(state.pip.plan?.until).toBeGreaterThan(state.world.time);
  return state;
}
it('walks to the bench, works before consuming materials, and remembers one completed instrument', () => {
  const { world, pip } = begin();
  demand(world, pip.id, 'craft_instrument', 'An old wish to join the musicians.');
  const started = world.time,
    command = pip.plan!.id;
  expect(distance(pip.position, workbenchSpot)).toBeLessThan(0.55);
  expect(publicWorld(world).inhabitants[10].phase).toBe('performing');
  expect(pip.instrument).toBe('none');
  expect(world.workshop.wood).toBe(3);
  expect(executeAction(world, pip.id, 'craft_instrument', command)).toBe(false);
  tickWorld(world, started + CRAFT_DURATION - 250, navigation);
  expect(pip.instrument).toBe('none');
  tickWorld(world, started + CRAFT_DURATION, navigation);
  expect(pip.instrument).toBe('lute');
  expect(world.workshop).toMatchObject({
    wood: 0,
    strings: 0,
    craftedLutes: 1,
    suppliedWood: 3,
    suppliedStrings: 1,
  });
  expect(world.demands[0].fulfilled).toBe(true);
  const completion = world.events.find((e) => e.text.includes('finishes a handmade lute'))!;
  expect(pip.memories.some((m) => m.eventId === completion.id)).toBe(true);
  world.completedCommands = [];
  expect(executeAction(world, pip.id, 'craft_instrument', command)).toBe(false);
  expect(world.workshop.craftedLutes).toBe(1);
  pip.position = [-5.7, -4.35];
  expect(executeAction(world, pip.id, 'play_music', `command:${++world.commandSequence}`)).toBe(true);
});
it('cancels disabled work and rechecks missing materials and energy without inventing instruments', () => {
  for (const interruption of ['disabled', 'materials', 'energy', 'location'] as const) {
    const { world, pip } = begin();
    if (interruption === 'disabled') world.disabledActions = ['craft_instrument'];
    if (interruption === 'materials') {
      world.workshop.strings = 0;
      world.workshop.suppliedStrings = 0;
    }
    if (interruption === 'energy') pip.energy = 20;
    if (interruption === 'location') pip.position = [3, 1];
    tickWorld(world, world.time + CRAFT_DURATION, navigation);
    expect(pip.instrument).toBe('none');
    expect(world.workshop.craftedLutes).toBe(0);
    expect(world.workshop.wood).toBe(3);
    expect(pip.plan).toBeNull();
  }
  const { world } = begin();
  const impostor = world.inhabitants[6];
  impostor.position = [...workbenchSpot];
  expect(executeAction(world, impostor.id, 'craft_instrument', 'forged')).toBe(false);
  expect(executeAction(world, world.inhabitants[10].id, 'craft_instrument', 'forged')).toBe(false);
});
it('uses a crafted instrument in a consented shared performance', () => {
  const { world, pip } = begin();
  tickWorld(world, pip.plan!.until, navigation);
  const finch = world.inhabitants[2];
  for (const npc of [pip, finch]) {
    npc.creativity = 1;
    npc.sociability = 1;
  }
  world.musicNext = world.time;
  expect(inviteDuet(world, pip.id, finch.id, navigation)).toBe(true);
  const end = world.time + 30000;
  for (let now = world.time + 250; now <= end && world.musicGroups[0].status !== 'performing'; now += 250)
    tickWorld(world, now, navigation);
  expect(world.musicGroups[0]).toMatchObject({
    status: 'performing',
    members: [pip.id, finch.id],
    performances: 1,
  });
  expect(pip.plan?.applied).toBe(true);
  expect(world.workshop.craftedLutes).toBe(1);
});
it('reopens unfinished work and finishes exactly once using its persisted deadline', () => {
  const folder = mkdtempSync(join(tmpdir(), 'livetabern-craft-'));
  try {
    const database = join(folder, 'world.sqlite');
    const { world, pip } = begin();
    const deadline = pip.plan!.until;
    const store = new WorldStore(database);
    try {
      store.save(world, world.events);
    } finally {
      store.close();
    }
    const reopened = new WorldStore(database);
    try {
      const loaded = reopened.load()!;
      expect(loaded.inhabitants[10].plan!.until).toBe(deadline);
      const events = tickWorld(loaded, deadline, navigation);
      reopened.save(loaded, events);
      expect(loaded.inhabitants[10].instrument).toBe('lute');
      expect(
        reopened.history(undefined, pip.id, 'craft_instrument').filter((e) => e.text.includes('finishes')),
      ).toHaveLength(1);
    } finally {
      reopened.close();
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
it('migrates old worlds with one auditable kit and rejects unbalanced provenance', () => {
  const old = createWorld(0) as Partial<ReturnType<typeof createWorld>>;
  delete old.workshop;
  const world = worldSchema.parse(old);
  world.disabledActions = [...actions];
  tickWorld(world, 250, navigation);
  tickWorld(world, 500, navigation);
  expect(world.events.filter((e) => e.text.includes('workshop receives'))).toHaveLength(1);
  expect(world.workshop.wood).toBe(3);
  for (const kits of [0, 2]) {
    const invalid = structuredClone(world);
    Object.assign(invalid.workshop, {
      wood: kits * 3,
      strings: kits,
      suppliedWood: kits * 3,
      suppliedStrings: kits,
    });
    expect(worldSchema.safeParse(invalid).success).toBe(false);
  }
  const undelivered = structuredClone(world);
  undelivered.workshop.delivered = false;
  expect(worldSchema.safeParse(undelivered).success).toBe(false);
  world.workshop.wood++;
  expect(worldSchema.safeParse(world).success).toBe(false);
  world.workshop.wood--;
  world.inhabitants[10].instrument = 'lute';
  expect(worldSchema.safeParse(world).success).toBe(false);
});
it('keeps unstarted work unstarted when extended downtime skips a walking plan', () => {
  const { world, pip } = fixture();
  pip.nextDecision = MAX_CATCHUP_MS;
  const store = new WorldStore(':memory:');
  try {
    store.save(world, world.events);
    const loaded = restoreWorld(store, MAX_CATCHUP_MS + 600000, navigation);
    expect(loaded.inhabitants[10].plan?.phase).toBe('walking');
    expect(loaded.inhabitants[10].plan?.until).toBe(0);
    for (
      let now = loaded.time + 250;
      !loaded.inhabitants[10].plan?.until && now < MAX_CATCHUP_MS + 630000;
      now += 250
    )
      tickWorld(loaded, now, navigation);
    expect(loaded.inhabitants[10].plan?.until).toBe(loaded.time + CRAFT_DURATION);
    expect(loaded.inhabitants[10].instrument).toBe('none');
  } finally {
    store.close();
  }
});
