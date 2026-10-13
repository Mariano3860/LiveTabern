import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { createWorld } from '../../packages/simulation/engine';
import { WorldStore } from '../../packages/persistence/store';

test('follows Pip from the workshop journey to a finished lute and live music', async ({ page }) => {
  test.setTimeout(90000);
  const folder = mkdtempSync(join(tmpdir(), 'livetabern-crafting-browser-'));
  const database = join(folder, 'world.sqlite');
  const world = createWorld(Date.now());
  world.directorEnabled = false;
  world.musicNext = world.time + 120000;
  for (const npc of world.inhabitants) npc.nextDecision = world.time + 120000;
  world.inhabitants[1].position = [0, -2.5];
  world.inhabitants[2].position = [5, 1];
  const pip = world.inhabitants[10];
  pip.position = [3.5, 1.5];
  pip.nextDecision = world.time + 10000;
  pip.energy = 95;
  pip.thirst = 0;
  pip.socialNeed = 0;
  pip.creativity = 1;
  const store = new WorldStore(database);
  store.save(world, world.events);
  store.close();
  const children: ChildProcess[] = [];
  function start(args: string[], env: NodeJS.ProcessEnv) {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: 'ignore',
    });
    children.push(child);
  }
  try {
    start(['--import', 'tsx', 'apps/server/index.ts'], {
      PORT: '33119',
      WORLD_DB: database,
      AI_MODE: 'off',
      DIRECTOR_MODE: 'off',
    });
    start(['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5175', '--strictPort'], {
      VITE_WORLD_URL: 'http://127.0.0.1:33119',
    });
    await expect
      .poll(
        async () => {
          try {
            return (await fetch('http://127.0.0.1:5175')).status;
          } catch {
            return 0;
          }
        },
        { timeout: 15000 },
      )
      .toBe(200);
    await page.goto('http://127.0.0.1:5175');
    await expect(page.locator('.people button')).toHaveCount(15);
    await page.getByRole('button', { name: /Pip.*Apprentice/ }).click();
    await page.getByRole('button', { name: 'Follow Pip', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => window.__TAVERN__?.snapshot()?.world.inhabitants[10].phase), {
        timeout: 20000,
      })
      .toBe('walking');
    await expect
      .poll(() => page.evaluate(() => window.__TAVERN__?.snapshot()?.world.inhabitants[10].phase), {
        timeout: 15000,
      })
      .toBe('performing');
    const unfinished = await page.evaluate(() => window.__TAVERN__!.snapshot()!.world);
    expect(unfinished.inhabitants[10].action).toBe('craft_instrument');
    expect(unfinished.inhabitants[10].instrument).toBe('none');
    expect(unfinished.workshop.wood).toBe(3);
    await expect(page.getByRole('region', { name: "Pip's profile" })).toContainText('craft instrument');
    await expect
      .poll(() => page.evaluate(() => window.__TAVERN__?.rendering?.frames ?? 0), { timeout: 15000 })
      .toBeGreaterThanOrEqual(30);
    await page.screenshot({ path: 'test-results/pip-workshop.png', fullPage: true });
    await expect
      .poll(() => page.evaluate(() => window.__TAVERN__?.snapshot()?.world.inhabitants[10].instrument), {
        timeout: 20000,
      })
      .toBe('lute');
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const npc = window.__TAVERN__?.snapshot()?.world.inhabitants[10];
            return npc?.action === 'play_music' && npc.phase === 'performing';
          }),
        { timeout: 35000 },
      )
      .toBe(true);
    await expect(page.getByRole('region', { name: "Pip's profile" })).toContainText('lute');
    await page.getByRole('button', { name: 'Under the roof', exact: true }).click();
    await expect(page.locator('.workshop')).toContainText('1 lute crafted');
    await page.screenshot({ path: 'test-results/pip-handmade-lute.png', fullPage: true });
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
