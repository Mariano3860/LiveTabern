import { test, expect } from '@playwright/test';
import { seats } from '../../packages/shared/layout';

test('renders the tavern, profiles, camera views, sound controls, and story filtering', async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  // Exercise the full spectator journey with low quality on the software WebGL runner.
  await page.getByLabel('Quality').selectOption('low');
  await expect(page.locator('.status')).toContainText('Live world');
  await expect(page.locator('.people button')).toHaveCount(15);
  await expect(page.locator('canvas')).toBeVisible();
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(
            new Set(
              performance
                .getEntriesByType('resource')
                .map((entry) => new URL(entry.name).pathname.split('/').pop())
                .filter((name) => name?.endsWith('.gltf')),
            ),
          ).sort(),
        ),
      { timeout: 30000 },
    )
    .toEqual(
      [
        'female-base.gltf',
        'female-peasant.gltf',
        'female-ranger.gltf',
        'male-base.gltf',
        'male-peasant.gltf',
        'male-ranger.gltf',
      ].sort(),
    );
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          performance
            .getEntriesByType('resource')
            .some((entry) => new URL(entry.name).pathname.endsWith('/tavern-actions.glb')),
        ),
      { timeout: 30000 },
    )
    .toBe(true);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          performance
            .getEntriesByType('resource')
            .some((entry) => entry.name.endsWith('/T_Ranger_Normal.webp')),
        ),
      { timeout: 30000 },
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__TAVERN__?.rendering?.frames ?? 0), { timeout: 20000 })
    .toBeGreaterThanOrEqual(30);
  await expect
    .poll(
      () =>
        page.evaluate(
          (points) =>
            window.__TAVERN__
              ?.snapshot()
              ?.world.inhabitants.some(
                (npc) =>
                  npc.action === 'rest' &&
                  npc.phase === 'performing' &&
                  points.some(
                    (seat) => Math.hypot(npc.position[0] - seat[0], npc.position[1] - seat[1]) < 0.02,
                  ),
              ),
          seats,
        ),
      { timeout: 40000 },
    )
    .toBe(true);
  await page.getByRole('button', { name: /Borin/ }).click();
  await expect(page.getByRole('region', { name: "Borin's profile" })).toBeVisible();
  await page.getByRole('button', { name: 'Close profile' }).click();
  await page.getByRole('button', { name: 'By the fire', exact: true }).click();
  await expect(page.getByRole('button', { name: 'By the fire', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'At the bar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'At the bar', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(
    await page.evaluate(
      () => window.__TAVERN__?.snapshot()?.world.inhabitants.find((n) => n.name === 'Borin')?.position[1],
    ),
  ).toBeLessThan(-4.8);
  await page.getByRole('button', { name: 'The room', exact: true }).click();
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sound on', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Sound on', exact: true }).click();
  await page.getByLabel('Follow traveler', { exact: true }).selectOption('npc-1');
  await page.getByLabel('Story category', { exact: true }).selectOption('drink');
  await expect(page.getByLabel('Follow traveler', { exact: true })).toHaveValue('npc-1');
  await page.getByLabel('Follow traveler', { exact: true }).selectOption('all');
  await page.getByLabel('Story category', { exact: true }).selectOption('all');
  await page.getByRole('button', { name: 'Under the roof', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A world in motion' })).toBeVisible();
  await page.getByRole('button', { name: 'Actions & motion', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Traveler actions' }).locator('details')).toHaveCount(8);
  await page.locator('[data-action="rest"] summary').click();
  await page.screenshot({ path: 'test-results/tavern-action-catalogue.png' });
  expect(errors).toEqual([]);
});

test('two browsers share the world and reconnect when WebGL is unavailable', async ({ browser }) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  const one = await a.newPage(),
    two = await b.newPage();
  await Promise.all(
    [one, two].map((page) =>
      page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = new Proxy(original, {
          apply(target, thisArg, args: unknown[]) {
            if (String(args[0]).startsWith('webgl')) return null;
            return Reflect.apply(target, thisArg, args);
          },
        }) as typeof original;
      }),
    ),
  );
  await one.goto('/');
  await two.goto('/');
  await expect(one.locator('.scene-error')).toBeVisible();
  await expect(two.locator('.scene-error')).toBeVisible();
  await expect(one.locator('.people button')).toHaveCount(15);
  await expect(two.locator('.people button')).toHaveCount(15);
  const first = await one.evaluate(() => window.__TAVERN__!.snapshot()!);
  await expect
    .poll(() => two.evaluate(() => window.__TAVERN__!.snapshot()!.world.version))
    .toBeGreaterThanOrEqual(first.world.version);
  const second = await two.evaluate(() => window.__TAVERN__!.snapshot()!);
  expect(second.world.id).toBe(first.world.id);
  expect(second.world.startedAt).toBe(first.world.startedAt);
  expect(second.world.inhabitants.map((n) => n.id)).toEqual(first.world.inhabitants.map((n) => n.id));
  await a.setOffline(true);
  await expect(one.locator('.status')).toContainText('Reconnecting', { timeout: 15000 });
  await a.setOffline(false);
  await expect(one.locator('.status')).toContainText('Live world', { timeout: 30000 });
  await expect(one.locator('.people button')).toHaveCount(15);
  await a.close();
  await b.close();
});

test('keeps the interface usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.people button')).toHaveCount(15);
  await expect(page.getByRole('heading', { name: 'The Wandering Ember' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__TAVERN__?.rendering?.frames ?? 0), { timeout: 20000 })
    .toBeGreaterThanOrEqual(30);
  await page.screenshot({ path: 'test-results/tavern-mobile.png', fullPage: true });
});
