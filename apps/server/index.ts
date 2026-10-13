import { Server, Room, ServerError, matchMaker } from '@colyseus/core';
import { Encoder } from '@colyseus/schema';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { AiLedger } from '../../packages/ai/ledger';
import { NarrativeGateway, configFromEnvironment } from '../../packages/ai/gateway';
import { mockProvider, narrativeContext } from '../../packages/ai/contracts';
import { createNavigation } from '../../packages/navigation/recast';
import { tickWorld, emit } from '../../packages/simulation/engine';
import { restoreWorld, STEP_MS } from '../../packages/simulation/recovery';
import { WorldStore } from '../../packages/persistence/store';
import { publicWorld, capabilityCatalogue } from '../../packages/shared/world';
import { PersonState, TavernState } from '../../packages/networking/schema';

const aiConfig = configFromEnvironment(process.env);
// The bounded public chronicle and fifteen profiles exceed the encoder's small default allocation.
Encoder.BUFFER_SIZE = 128 * 1024;
const navigation = await createNavigation();
const aiLedger = new AiLedger(resolve(process.env.WORLD_DB ?? '.local/world.sqlite'));
const ai = new NarrativeGateway(aiConfig, aiLedger, mockProvider);
const store = new WorldStore(resolve(process.env.WORLD_DB ?? '.local/world.sqlite'));
const world = restoreWorld(store, Date.now(), navigation);
if (process.env.DIRECTOR_MODE === 'off') world.directorEnabled = false;
let projection: { roomId: string; project(): void; viewers(): number } | undefined;
let ticks = 0,
  lastTickMs = 0;
class TavernRoom extends Room<{ state: TavernState }> {
  state = new TavernState();
  onCreate() {
    if (projection) throw new ServerError(409, 'The shared tavern already exists; join the existing room.');
    this.autoDispose = false;
    this.patchRate = STEP_MS;
    this.maxClients = 150;
    this.maxMessagesPerSecond = 5;
    projection = { roomId: this.roomId, project: () => this.project(), viewers: () => this.clients.length };
    this.project();
  }
  onJoin() {
    this.project();
  }
  onLeave() {
    queueMicrotask(() => this.project());
  }
  project() {
    const view = publicWorld(world);
    this.state.id = view.id;
    this.state.version = view.version;
    this.state.time = view.time;
    this.state.startedAt = view.startedAt;
    this.state.stock = view.stock;
    this.state.viewers = this.clients.length;
    for (const n of view.inhabitants) {
      let p = this.state.inhabitants.get(n.id);
      if (!p) {
        p = new PersonState();
        this.state.inhabitants.set(n.id, p);
      }
      p.id = n.id;
      p.name = n.name;
      p.role = n.role;
      p.description = n.description;
      p.color = n.color;
      p.x = n.position[0];
      p.z = n.position[1];
      p.tx = n.target[0];
      p.tz = n.target[1];
      p.action = n.action;
      p.phase = n.phase;
      p.coins = n.coins;
      p.energy = n.energy;
      p.mood = n.mood;
      p.instrument = n.instrument;
      p.partnerId = n.partnerId ?? '';
      p.until = n.until;
    }
    this.state.events = JSON.stringify(view.events.slice(-80));
    this.state.opportunities = JSON.stringify(view.opportunities);
    this.state.demands = JSON.stringify(view.demands);
    this.state.musicGroups = JSON.stringify(view.musicGroups);
  }
}
function authorized(header?: string) {
  const token = process.env.ADMIN_TOKEN;
  if (!token || !header?.startsWith('Bearer ')) return false;
  const supplied = Buffer.from(header.slice(7)),
    expected = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
const game = new Server({
  greet: false,
  gracefullyShutdown: false,
  transport: new WebSocketTransport({ maxPayload: 4096 }),
  express: (app) => {
    app.disable('x-powered-by');
    app.use(express.json({ limit: '2kb' }));
    app.get('/health', (_req, res) => res.json({ status: 'ok', ai: aiConfig.mode, persistent: true }));
    app.get('/api/world', (_req, res) => res.json(publicWorld(world)));
    app.get('/api/room', (_req, res) => res.json({ roomId: projection?.roomId }));
    app.get('/api/npcs/:id', (req, res) => {
      const n = publicWorld(world).inhabitants.find((npc) => npc.id === req.params.id);
      if (!n) res.status(404).json({ error: 'Not found' });
      else res.json(n);
    });
    app.get('/api/capabilities', (_req, res) =>
      res.json({
        available: capabilityCatalogue.map((c) => ({ ...c, enabled: !world.disabledActions.includes(c.id) })),
        demands: world.demands,
      }),
    );
    app.get('/api/history', (req, res) => {
      const before = Number(req.query.before ?? Number.MAX_SAFE_INTEGER);
      if (!Number.isFinite(before)) {
        res.status(400).json({ error: 'Invalid cursor' });
        return;
      }
      const actor = typeof req.query.actor === 'string' ? req.query.actor : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const events = store.history(before, actor, category);
      res.json({ events, nextCursor: events.at(-1)?.sequence ?? null });
    });
    app.get('/api/metrics', (req, res) => {
      if (!authorized(req.headers.authorization)) {
        res.status(401).json({ error: 'Administrator token required' });
        return;
      }
      const aiMetrics = ai.metrics();
      res.json({
        ticks,
        lastTickMs,
        worldVersion: world.version,
        viewers: projection?.viewers() ?? 0,
        events: world.sequence,
        aiCalls: aiMetrics.monthly.calls,
        aiReservedUsd: aiMetrics.monthly.reservedMicroUsd / 1_000_000,
        aiMode: aiConfig.mode,
        aiDailyCalls: aiMetrics.daily.calls,
        aiDailyLimit: aiConfig.dailyCalls,
        aiMonthlyLimit: aiConfig.monthlyCalls,
        aiLastStatus: aiMetrics.lastStatus,
        aiCircuitOpen: aiMetrics.circuitOpen,
        snapshotAgeMs: Math.max(0, Date.now() - world.time),
        publicSnapshotBytes: Buffer.byteLength(JSON.stringify(publicWorld(world))),
        directorEnabled: world.directorEnabled,
        persistence: 'sqlite-local',
      });
    });
    app.post('/api/admin/ai/preview', async (req, res) => {
      if (!authorized(req.headers.authorization)) {
        res.status(401).json({ error: 'Administrator token required' });
        return;
      }
      if (!z.object({}).strict().safeParse(req.body).success) {
        res.status(400).json({ error: 'Preview requests do not accept prompts or world mutations' });
        return;
      }
      const context = narrativeContext(publicWorld(world));
      if (!context) {
        res.json({ status: 'no-context' });
        return;
      }
      const result = await ai.annotate(context);
      res.json({
        ...result,
        source:
          'annotation' in result
            ? context.events.find((event) => event.id === result.annotation.sourceEventId)
            : undefined,
      });
    });
    app.post('/api/admin/director', (req, res) => {
      if (!authorized(req.headers.authorization)) {
        res.status(401).json({ error: 'Administrator token required' });
        return;
      }
      const parsed = z.object({ enabled: z.boolean() }).strict().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid director settings' });
        return;
      }
      const candidate = structuredClone(world);
      candidate.directorEnabled = parsed.data.enabled;
      candidate.version++;
      const event = emit(
        candidate,
        'system',
        [],
        candidate.directorEnabled
          ? 'The narrative director resumes observing opportunities.'
          : 'The narrative director is paused. The travelers continue their own evening.',
      );
      try {
        store.save(candidate, [event]);
        Object.assign(world, candidate);
        projection?.project();
        res.json({ enabled: world.directorEnabled });
      } catch {
        res.status(503).json({ error: 'Could not commit settings' });
      }
    });
    app.post('/api/admin/capabilities/:id', (req, res) => {
      if (!authorized(req.headers.authorization)) {
        res.status(401).json({ error: 'Administrator token required' });
        return;
      }
      const definition = capabilityCatalogue.find((c) => c.id === req.params.id);
      const parsed = z.object({ enabled: z.boolean() }).strict().safeParse(req.body);
      if (!definition || !parsed.success) {
        res.status(400).json({ error: 'Unknown capability or invalid settings' });
        return;
      }
      const candidate = structuredClone(world);
      candidate.version++;
      candidate.disabledActions = candidate.disabledActions.filter((id) => id !== definition.id);
      if (!parsed.data.enabled) candidate.disabledActions.push(definition.id);
      const event = emit(
        candidate,
        'system',
        [],
        `${definition.id.replaceAll('_', ' ')} is ${parsed.data.enabled ? 'enabled' : 'disabled'} by the administrator.`,
      );
      try {
        store.save(candidate, [event]);
        Object.assign(world, candidate);
        projection?.project();
        res.json({ enabled: parsed.data.enabled });
      } catch {
        res.status(503).json({ error: 'Could not commit settings' });
      }
    });
    if (existsSync(resolve('dist/index.html'))) {
      app.use(express.static(resolve('dist')));
      app.get(['/', '/admin'], (_req, res) => res.sendFile(resolve('dist/index.html')));
    }
  },
});
game.define('tavern', TavernRoom);
const port = Number(process.env.PORT ?? 3001);
await game.listen(port, '127.0.0.1');
await matchMaker.createRoom('tavern', {});
const timer = setInterval(() => {
  const started = performance.now();
  try {
    const wallNow = Date.now();
    let steps = 0;
    while (world.time + STEP_MS <= wallNow && steps++ < 20) {
      const events = tickWorld(world, world.time + STEP_MS, navigation);
      store.save(world, events);
      ticks++;
    }
    projection?.project();
    lastTickMs = performance.now() - started;
  } catch (error) {
    console.error('World commit failed; stopping before publishing unconfirmed state.', error);
    void shutdown(1);
  }
}, STEP_MS);
console.log(`LiveTabern world: http://127.0.0.1:${port} (persistent, AI off)`);
let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  await game.gracefullyShutdown(false);
  store.close();
  aiLedger.close();
  navigation.dispose();
  process.exit(code);
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
