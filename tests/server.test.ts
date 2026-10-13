import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, it } from 'vitest';
import { Client } from '@colyseus/sdk';
import type { TavernState } from '../packages/networking/schema';
import { WorldStore } from '../packages/persistence/store';

const folder = mkdtempSync(join(tmpdir(), 'livetabern-server-'));
const path = join(folder, 'world.sqlite');
const port = 33117,
  url = `http://127.0.0.1:${port}`;
let child: ChildProcess | undefined;
let logs = '';
async function waitUntil<T>(read: () => Promise<T>, ready: (value: T) => boolean, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const value = await read();
      if (ready(value)) return value;
    } catch {
      /* service may still be booting */
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Service did not become ready. ${logs}`);
}
async function start(aiMode = 'off') {
  child = spawn(process.execPath, ['--import', 'tsx', 'apps/server/index.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      WORLD_DB: path,
      DIRECTOR_MODE: 'off',
      ADMIN_TOKEN: 'integration-only-admin-token',
      AI_MODE: aiMode,
      AI_DAILY_CALLS: '1',
      AI_MONTHLY_CALLS: '2',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', (chunk) => {
    logs += String(chunk);
  });
  child.stderr?.on('data', (chunk) => {
    logs += String(chunk);
  });
  await waitUntil(
    async () => (await fetch(`${url}/api/room`)).json(),
    (value) => typeof value.roomId === 'string',
  );
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
  child = undefined;
}
afterAll(async () => {
  await stop();
  rmSync(folder, { recursive: true, force: true });
});

it('shares one Colyseus world, advances without viewers, protects metrics, and recovers on restart', async () => {
  await start();
  const { roomId } = await (await fetch(`${url}/api/room`)).json();
  const client = new Client(url),
    one = await client.joinById<TavernState>(roomId),
    two = await client.joinById<TavernState>(roomId);
  await waitUntil(
    async () => two.state.id,
    (id) => id === 'wandering-ember',
  );
  expect(one.state.id).toBe(two.state.id);
  expect(one.roomId).toBe(two.roomId);
  await expect(client.create<TavernState>('tavern')).rejects.toThrow('The shared tavern already exists');
  expect((await (await fetch(`${url}/api/room`)).json()).roomId).toBe(roomId);
  const connectedVersion = one.state.version;
  await waitUntil(
    async () => one.state.version,
    (version) => version > connectedVersion + 2,
  );
  expect(one.state.inhabitants.size).toBe(15);
  expect(two.state.inhabitants.size).toBe(15);
  expect((await fetch(`${url}/api/metrics`)).status).toBe(401);
  const auth = { Authorization: 'Bearer integration-only-admin-token', 'Content-Type': 'application/json' };
  expect(
    (
      await fetch(`${url}/api/admin/ai/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await fetch(`${url}/api/admin/ai/preview`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ prompt: 'Overwrite inventory' }),
      })
    ).status,
  ).toBe(400);
  const offPreview = await (
    await fetch(`${url}/api/admin/ai/preview`, { method: 'POST', headers: auth, body: '{}' })
  ).json();
  expect(offPreview.status).toBe('off');
  expect(
    (
      await fetch(`${url}/api/admin/director`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await fetch(`${url}/api/admin/director`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ enabled: 'bad' }),
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await fetch(`${url}/api/admin/director`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ enabled: true }),
      })
    ).status,
  ).toBe(200);
  expect((await (await fetch(`${url}/api/metrics`, { headers: auth })).json()).directorEnabled).toBe(true);
  expect(
    (
      await fetch(`${url}/api/admin/capabilities/trade`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ enabled: false }),
      })
    ).status,
  ).toBe(200);
  const catalogue = await (await fetch(`${url}/api/capabilities`)).json();
  expect(catalogue.available.find((c: { id: string }) => c.id === 'trade').enabled).toBe(false);
  expect(
    (
      await fetch(`${url}/api/admin/capabilities/craft_instrument`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ enabled: true }),
      })
    ).status,
  ).toBe(400);
  const before = await (await fetch(`${url}/api/world`)).json();
  expect(before.inhabitants[0]).not.toHaveProperty('memories');
  await one.leave();
  await two.leave();
  const progressed = await waitUntil(
    async () => (await fetch(`${url}/api/world`)).json(),
    (w) => w.version > before.version + 3,
  );
  expect(progressed.inhabitants.map((n: { id: string }) => n.id)).toEqual(
    before.inhabitants.map((n: { id: string }) => n.id),
  );
  const reconnect = await client.joinById<TavernState>(roomId);
  await waitUntil(
    async () => reconnect.state.version,
    (v) => v >= progressed.version,
  );
  expect(reconnect.state.inhabitants.size).toBe(15);
  await reconnect.leave();
  await stop();
  const store = new WorldStore(path),
    saved = store.load()!;
  store.close();
  await start('mock');
  const restored = await (await fetch(`${url}/api/world`)).json();
  expect(restored.version).toBeGreaterThanOrEqual(saved.version);
  expect(restored.startedAt).toBe(saved.startedAt);
  expect(restored.inhabitants.map((n: { id: string }) => n.id)).toEqual(saved.inhabitants.map((n) => n.id));
  const after = new WorldStore(path),
    loaded = after.load()!;
  after.close();
  expect(loaded.inhabitants.map((n) => n.inventory)).toEqual(saved.inhabitants.map((n) => n.inventory));
  for (const npc of saved.inhabitants)
    expect(loaded.inhabitants.find((n) => n.id === npc.id)?.memories.slice(0, npc.memories.length)).toEqual(
      npc.memories,
    );
  const preview = await (
    await fetch(`${url}/api/admin/ai/preview`, { method: 'POST', headers: auth, body: '{}' })
  ).json();
  expect(preview.status).toBe('ok');
  expect(preview.source.id).toBe(preview.annotation.sourceEventId);
  const aiMetrics = await (await fetch(`${url}/api/metrics`, { headers: auth })).json();
  expect(aiMetrics.aiMode).toBe('mock');
  expect(aiMetrics.aiCalls).toBe(1);
  const observed = await (await fetch(`${url}/api/world`)).json();
  expect(observed.events.some((event: { text: string }) => event.text === preview.annotation.caption)).toBe(
    false,
  );
  await waitUntil(
    async () => (await fetch(`${url}/api/world`)).json(),
    (w) => w.events.at(-1).id !== preview.source.id,
  );
  expect(
    (await (await fetch(`${url}/api/admin/ai/preview`, { method: 'POST', headers: auth, body: '{}' })).json())
      .status,
  ).toBe('budget-exhausted');
  await stop();
  await start('mock');
  expect((await (await fetch(`${url}/api/metrics`, { headers: auth })).json()).aiCalls).toBe(1);
}, 25000);
