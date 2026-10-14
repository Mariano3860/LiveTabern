import { test, expect } from '@playwright/test';

test('shows confirmed action phases, follows participants, and keeps the catalogue usable offline and on mobile', async ({
  page,
  context,
}) => {
  // Exercise spectator UI against the real world without a second software-rendered 3D scene.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = new Proxy(original, {
      apply(target, thisArg, args: unknown[]) {
        if (String(args[0]).startsWith('webgl')) return null;
        return Reflect.apply(target, thisArg, args);
      },
    }) as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('.status')).toContainText('Live world');
  await page.getByRole('button', { name: 'Actions & motion', exact: true }).click();
  const catalogue = page.getByRole('region', { name: 'Traveler actions', exact: true });
  await expect(catalogue.locator('details')).toHaveCount(8);
  await catalogue.locator('summary').first().focus();
  await page.keyboard.press('Enter');
  await expect(catalogue.locator('details').first()).toHaveAttribute('open', '');
  for (let index = 1; index < 8; index++) await catalogue.locator('summary').nth(index).click();
  await expect(catalogue).toContainText('three pieces of wood');
  await expect(catalogue).toContainText('two coins');
  await expect(catalogue).toContainText('stand up before leaving');

  async function confirmedCounts() {
    await expect
      .poll(() =>
        page.evaluate(() => {
          const world = window.__TAVERN__?.snapshot()?.world;
          const panel = document.querySelector<HTMLElement>('.action-catalogue');
          if (!world || panel?.dataset.worldVersion !== String(world.version)) return false;
          return [...panel.querySelectorAll<HTMLElement>('.action-card')].every((card) => {
            const active = world.inhabitants.filter(
              (npc) => npc.action === card.dataset.action && npc.phase === 'performing',
            ).length;
            const approaching = world.inhabitants.filter(
              (npc) => npc.action === card.dataset.action && npc.phase === 'walking',
            ).length;
            return (
              Number(card.dataset.active) === active &&
              Number(card.dataset.approaching) === approaching &&
              card.querySelectorAll('button').length === active + approaching
            );
          });
        }),
      )
      .toBe(true);
  }
  await confirmedCounts();
  const firstVersion = await page.evaluate(() => window.__TAVERN__!.snapshot()!.world.version);
  await expect
    .poll(() => page.evaluate(() => window.__TAVERN__!.snapshot()!.world.version))
    .toBeGreaterThan(firstVersion);
  await confirmedCounts();
  const watch = catalogue.getByRole('button', { name: /^Watch / }).first();
  await expect(watch).toBeVisible();
  const name = (await watch.getAttribute('aria-label'))!.slice('Watch '.length);
  await watch.click();
  await expect(page.getByRole('region', { name: name + "'s profile", exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Follow ' + name, exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Close profile' }).click();

  await context.setOffline(true);
  await expect(page.locator('.status')).toContainText('Reconnecting', { timeout: 15000 });
  await expect(catalogue).toContainText('LAST CONFIRMED ACTIVITY');
  await confirmedCounts();
  await context.setOffline(false);
  await expect(page.locator('.status')).toContainText('Live world', { timeout: 30000 });
  await expect(catalogue).toContainText('LIVE ACTIVITY');
  await confirmedCounts();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Actions & motion', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await catalogue.locator('[data-action="craft_instrument"] summary').scrollIntoViewIfNeeded();
  await expect(catalogue.locator('[data-action="craft_instrument"]')).toContainText('twelve seconds');
  await page.screenshot({ path: 'test-results/action-catalogue-mobile.png', fullPage: true });
});
