import { test, expect } from '@playwright/test';

test('renders the tavern, profiles, camera views, sound controls, and story filtering', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.status')).toContainText('Live world');
  await expect(page.locator('.people button')).toHaveCount(15);
  await expect(page.locator('canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__TAVERN__?.rendering?.frames ?? 0), { timeout: 20000 })
    .toBeGreaterThanOrEqual(30);
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
  await page.getByLabel('Quality').selectOption('low');
  await page.getByRole('button', { name: 'Under the roof', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A world in motion' })).toBeVisible();
  await page.getByRole('button', { name: 'The chronicle', exact: true }).click();
  await page.screenshot({ path: 'test-results/tavern-desktop.png', fullPage: true });
  await page.locator('.scene-panel').screenshot({ path: 'test-results/tavern-preview.png' });
  expect(errors).toEqual([]);
});

test('two browsers see the same identities and recover after network loss', async ({ browser }) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  const one = await a.newPage(),
    two = await b.newPage();
  await one.goto('/');
  await two.goto('/');
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
  await expect(one.locator('.status')).toContainText('Live world', { timeout: 15000 });
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
