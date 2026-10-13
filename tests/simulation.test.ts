import { beforeAll, describe, expect, it } from 'vitest';
import {
  createWorld,
  tickWorld,
  executeAction,
  offerOpportunity,
  respondToOpportunity,
  chooseAction,
  executeIntent,
} from '../packages/simulation/engine';
import { createNavigation } from '../packages/navigation/recast';
import { isWalkable, distance } from '../packages/shared/layout';
import { publicWorld } from '../packages/shared/world';
let navigation: Awaited<ReturnType<typeof createNavigation>>;
beforeAll(async () => {
  navigation = await createNavigation();
});

describe('authoritative simulation', () => {
  it('creates stable identities and advances headlessly', () => {
    const world = createWorld(1000),
      ids = world.inhabitants.map((n) => n.id);
    for (let i = 1; i <= 600; i++) tickWorld(world, 1000 + i * 250, navigation);
    expect(world.inhabitants).toHaveLength(15);
    expect(world.inhabitants.map((n) => n.id)).toEqual(ids);
    expect(world.sequence).toBeGreaterThan(10);
    expect(world.version).toBe(600);
    expect(world.events.some((e) => e.category === 'drink')).toBe(true);
  });
  it('replays a seed while preserving economic and movement invariants', () => {
    const a = createWorld(0),
      b = createWorld(0),
      money = a.inhabitants.reduce((sum, n) => sum + n.coins, 0);
    for (let i = 1; i <= 2400; i++) {
      tickWorld(a, i * 250, navigation);
      tickWorld(b, i * 250, navigation);
      const blocked = a.inhabitants.filter((n) => n.id !== 'npc-1' && !isWalkable(n.position, 0.2));
      expect(blocked.map((n) => ({ id: n.id, position: n.position, plan: n.plan }))).toEqual([]);
    }
    expect(a).toEqual(b);
    expect(a.inhabitants.reduce((sum, n) => sum + n.coins, 0)).toBe(money);
    expect(a.stock + a.consumedAle).toBe(a.suppliedAle);
    expect(a.inhabitants.reduce((sum, n) => sum + n.inventory.tonic, 0)).toBe(24);
    expect(a.inhabitants.every((n) => n.coins >= 0)).toBe(true);
  });
  it('checks location, balance, stock, and duplicate execution before selling ale', () => {
    const w = createWorld(0),
      n = w.inhabitants[4],
      coins = n.coins;
    expect(executeAction(w, n.id, 'drink', 'sale')).toBe(false);
    n.position = [1.5, -3.2];
    expect(executeAction(w, n.id, 'drink', 'sale')).toBe(true);
    expect(executeAction(w, n.id, 'drink', 'sale')).toBe(false);
    expect(n.coins).toBe(coins - 1);
    expect(w.stock).toBe(239);
    n.coins = 0;
    expect(executeAction(w, n.id, 'drink', 'poor')).toBe(false);
  });
  it('transfers an item and payment, and creates only participant memories', () => {
    const w = createWorld(0),
      buyer = w.inhabitants[4],
      seller = w.inhabitants[3];
    buyer.position = [5, 2.8];
    seller.position = [5.8, 2.8];
    expect(executeAction(w, buyer.id, 'trade', 'trade-1', seller.id)).toBe(true);
    expect(buyer.inventory.tonic).toBe(1);
    expect(seller.inventory.tonic).toBe(23);
    seller.plan = null;
    expect(executeAction(w, buyer.id, 'chat', 'chat-1', seller.id)).toBe(true);
    expect(buyer.relationships[seller.id]).toBe(3);
    expect(seller.relationships[buyer.id]).toBe(3);
    expect(w.inhabitants[7].memories).toEqual([]);
    expect(publicWorld(w).inhabitants[4]).not.toHaveProperty('memories');
  });
  it('respects rejection and records unavailable capabilities without creating items', () => {
    const w = createWorld(0),
      o = offerOpportunity(w, 'music');
    expect(respondToOpportunity(w, o.id, 'npc-2', false)).toBe(true);
    expect(o.status).toBe('declined');
    const inventory = structuredClone(w.inhabitants[10].inventory);
    expect(executeIntent(w, 'npc-11', 'craft_instrument', 'missing-action')).toBe(false);
    expect(w.demands[0].count).toBe(1);
    expect(w.inhabitants[10].inventory).toEqual(inventory);
  });
  it('keeps old commands idempotent after the duplicate cache is trimmed and respects disabled actions', () => {
    const w = createWorld(0),
      npc = w.inhabitants[4];
    npc.position = [1.5, -3.2];
    expect(executeAction(w, npc.id, 'drink', 'command:1')).toBe(true);
    const coins = npc.coins;
    w.completedCommands = [];
    expect(executeAction(w, npc.id, 'drink', 'command:1')).toBe(false);
    expect(npc.coins).toBe(coins);
    expect(chooseAction(npc, 0, ['wander', 'rest', 'drink', 'chat', 'play_music', 'dance'])).toBe('trade');
    w.disabledActions = ['drink'];
    expect(executeAction(w, npc.id, 'drink', 'command:2')).toBe(false);
  });
  it('finds a path around a table instead of walking through it', () => {
    const route = navigation.path([-4.5, 0], [-0.8, 0]);
    expect(route.length).toBeGreaterThan(1);
    let previous: [number, number] = [-4.5, 0];
    for (const point of route) {
      const steps = Math.ceil(distance(previous, point) / 0.1);
      for (let i = 0; i <= steps; i++)
        expect(
          isWalkable(
            [
              previous[0] + ((point[0] - previous[0]) * i) / steps,
              previous[1] + ((point[1] - previous[1]) * i) / steps,
            ],
            0.2,
          ),
        ).toBe(true);
      previous = point;
    }
  });
  it('stays idle when every capability is disabled and cancels unavailable movement', () => {
    const world = createWorld(0),
      positions = world.inhabitants.map((npc) => [...npc.position]);
    world.disabledActions = ['wander', 'rest', 'drink', 'chat', 'trade', 'play_music', 'dance'];
    for (let now = 250; now <= 10000; now += 250) tickWorld(world, now, navigation);
    expect(world.inhabitants.every((npc) => npc.plan === null)).toBe(true);
    expect(world.inhabitants.map((npc) => npc.position)).toEqual(positions);
    expect(world.events).toHaveLength(1);
  });
});
