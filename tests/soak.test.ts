import { beforeAll, expect, it } from 'vitest';
import { createNavigation } from '../packages/navigation/recast';
import { createWorld, tickWorld } from '../packages/simulation/engine';
let navigation: Awaited<ReturnType<typeof createNavigation>>;
beforeAll(async () => {
  navigation = await createNavigation();
});
it('survives seven simulated days with bounded state and conserved resources', () => {
  const world = createWorld(0),
    money = world.inhabitants.reduce((s, n) => s + n.coins, 0);
  const actionTypes = new Set<string>();
  for (let second = 1; second <= 7 * 86400; second++) {
    for (const event of tickWorld(world, second * 1000, navigation)) actionTypes.add(event.category);
    if (second % 3600 === 0) {
      expect(
        world.inhabitants.every(
          (n) =>
            Number.isFinite(n.position[0]) &&
            n.coins >= 0 &&
            n.energy >= 0 &&
            n.energy <= 100 &&
            n.memories.length <= 12,
        ),
      ).toBe(true);
      expect(world.inhabitants.reduce((s, n) => s + n.coins, 0)).toBe(money);
      expect(world.stock + world.consumedAle).toBe(world.suppliedAle);
      expect(world.inhabitants.reduce((s, n) => s + n.inventory.tonic, 0)).toBe(24);
      expect(world.events.length).toBeLessThanOrEqual(240);
    }
  }
  expect(actionTypes.has('chat')).toBe(true);
  expect(actionTypes.has('trade')).toBe(true);
  expect(actionTypes.has('play_music')).toBe(true);
  expect(actionTypes.has('dance')).toBe(true);
  expect(new Set(world.events.map((e) => e.id)).size).toBe(world.events.length);
}, 120000);
