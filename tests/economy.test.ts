import { describe, expect, it } from 'vitest';
import { createWorld, tickWorld } from '../packages/simulation/engine';
import { actions } from '../packages/shared/world';
import { worldSchema } from '../packages/persistence/schema';
import { WorldStore } from '../packages/persistence/store';
const hour = 3600000;
const navigation = { path: (_from: [number, number], to: [number, number]) => [to] };
function idleWorld() {
  const world = createWorld(0);
  world.disabledActions = [...actions];
  world.directorEnabled = false;
  return world;
}
describe('sustainable closed tavern economy', () => {
  it('redistributes only existing host funds once per UTC hour and keeps a reserve', () => {
    const world = idleWorld();
    world.inhabitants[0].coins = 45;
    const total = world.inhabitants.reduce((sum, npc) => sum + npc.coins, 0);
    const before = world.inhabitants.slice(1).map((npc) => npc.coins);
    tickWorld(world, hour, navigation);
    expect(world.inhabitants[0].coins).toBe(17);
    expect(world.inhabitants.slice(1).map((npc) => npc.coins)).toEqual(before.map((coins) => coins + 2));
    expect(world.inhabitants.reduce((sum, npc) => sum + npc.coins, 0)).toBe(total);
    const after = world.inhabitants.map((npc) => npc.coins),
      sequence = world.sequence;
    tickWorld(world, hour + 250, navigation);
    expect(world.inhabitants.map((npc) => npc.coins)).toEqual(after);
    expect(world.sequence).toBe(sequence);
    expect(world.events.at(-1)?.detail).toContain('no new money');
  });
  it('does not overdraw a poor host or accumulate unneeded ale', () => {
    const world = idleWorld();
    world.inhabitants[0].coins = 4;
    for (let now = hour; now <= hour * 24; now += hour) tickWorld(world, now, navigation);
    expect(world.inhabitants[0].coins).toBe(4);
    expect(world.stock).toBe(240);
    expect(world.suppliedAle).toBe(240);
    expect(world.events).toHaveLength(2);
    expect(world.events[1].text).toContain('workshop receives');
  });
  it('tops up exactly the consumed stock and does not delete oversized legacy reserves', () => {
    const world = idleWorld();
    world.stock = 90;
    world.consumedAle = 150;
    tickWorld(world, hour, navigation);
    expect(world.stock).toBe(240);
    expect(world.suppliedAle).toBe(390);
    expect(world.stock + world.consumedAle).toBe(world.suppliedAle);
    expect(world.events.some((event) => event.text.includes('150 servings'))).toBe(true);
    const legacy = idleWorld();
    legacy.stock = 500;
    legacy.suppliedAle = 500;
    tickWorld(legacy, hour, navigation);
    expect(legacy.stock).toBe(500);
    expect(legacy.suppliedAle).toBe(500);
  });
  it('preserves the hourly watermark in snapshots and avoids retroactive payments for skipped hours', () => {
    const world = idleWorld(),
      store = new WorldStore(':memory:');
    world.inhabitants[0].coins = 200;
    tickWorld(world, hour * 8, navigation);
    expect(world.inhabitants[0].coins).toBe(158);
    store.save(world, world.events);
    const restored = store.load()!;
    const coins = restored.inhabitants.map((npc) => npc.coins);
    tickWorld(restored, hour * 8 + 250, navigation);
    expect(restored.inhabitants.map((npc) => npc.coins)).toEqual(coins);
    const legacy = worldSchema.parse({ ...restored, economyHour: undefined });
    expect(legacy.economyHour).toBe(-1);
    store.close();
  });
});
