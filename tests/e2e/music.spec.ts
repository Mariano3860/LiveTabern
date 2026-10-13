import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { createWorld } from '../../packages/simulation/engine';
import { WorldStore } from '../../packages/persistence/store';

test('follows a consented duet from the journey to the visible shared performance', async ({ page }) => {
  test.setTimeout(90000);
  const folder = mkdtempSync(join(tmpdir(), 'livetabern-duet-browser-'));
  const database = join(folder, 'world.sqlite');
  const world = createWorld(Date.now());
  world.directorEnabled = false;
  world.musicNext = world.time;
  world.inhabitants[1].position = [0, -2.5];
  world.inhabitants[2].position = [5, 1];
  for (const npc of world.inhabitants.slice(1, 3)) {
    npc.creativity = 1;
    npc.sociability = 1;
  }
  const store = new WorldStore(database);
  store.save(world, world.events);
  store.close();
  const children: ChildProcess[] = [];
  let logs = '';
  function start(args: string[], env: NodeJS.ProcessEnv) {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(child);
    child.stdout?.on('data', (chunk) => {
      logs += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      logs += String(chunk);
    });
  }
  try {
    start(['--import', 'tsx', 'apps/server/index.ts'], {
      PORT: '33118',
      WORLD_DB: database,
      AI_MODE: 'off',
      DIRECTOR_MODE: 'off',
    });
    start(['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5174', '--strictPort'], {
      VITE_WORLD_URL: 'http://127.0.0.1:33118',
    });
    await expect
      .poll(
        async () => {
          try {
            return (await fetch('http://127.0.0.1:5174')).status;
          } catch {
            return 0;
          }
        },
        { timeout: 15000, message: logs },
      )
      .toBe(200);
    await page.goto('http://127.0.0.1:5174');
    await expect(page.locator('.people button')).toHaveCount(15);
    await expect(page.getByRole('status', { name: 'Shared performance' })).toContainText('Elena & Finch');
    await expect
      .poll(() => page.evaluate(() => window.__TAVERN__?.snapshot()?.world.musicGroups[0]?.status), {
        timeout: 30000,
      })
      .toBe('performing');
    const snapshot = await page.evaluate(() => window.__TAVERN__!.snapshot()!);
    expect(
      snapshot.world.inhabitants
        .filter((npc) => ['npc-2', 'npc-3'].includes(npc.id))
        .every((npc) => npc.phase === 'performing'),
    ).toBe(true);
    expect(snapshot.world.musicGroups[0].performances).toBe(1);
    await page.getByRole('button', { name: 'The stage', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => window.__TAVERN__?.rendering?.frames ?? 0), { timeout: 20000 })
      .toBeGreaterThanOrEqual(30);
    await page.getByRole('button', { name: /Elena.*Singer/ }).click();
    await expect(page.getByRole('region', { name: "Elena's profile" })).toContainText('Elena & Finch');
    await page.getByRole('button', { name: 'Close profile' }).click();
    await page.getByRole('button', { name: 'Under the roof', exact: true }).click();
    await expect(page.locator('.music-group')).toContainText('Elena & Finch');
    await page.screenshot({ path: 'test-results/shared-duet.png', fullPage: true });
  } finally {
    await Promise.all(
      children.map(async (child) => {
        if (child.exitCode !== null) return;
        const exited = once(child, 'exit');
        child.kill();
        await exited;
      }),
    );
    rmSync(folder, { recursive: true, force: true });
  }
});
