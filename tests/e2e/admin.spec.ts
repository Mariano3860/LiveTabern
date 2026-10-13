import { test, expect } from '@playwright/test';

test('inspects protected administration and previews a bounded local annotation', async ({ page }) => {
  // Mock the administrator API for UI coverage; the isolated server test covers real authorization and quotas.
  await page.route('**/api/capabilities', (route) =>
    route.fulfill({ json: { available: [{ id: 'trade', enabled: true }] } }),
  );
  await page.route('**/api/metrics', async (route) => {
    expect(route.request().headers().authorization).toBe('Bearer browser-test-token');
    await route.fulfill({
      json: {
        ticks: 42,
        lastTickMs: 1,
        worldVersion: 50,
        viewers: 2,
        events: 8,
        aiMode: 'mock',
        aiCalls: 0,
        aiReservedUsd: 0,
        aiDailyCalls: 0,
        aiDailyLimit: 20,
        aiMonthlyLimit: 200,
        aiLastStatus: 'off',
        aiCircuitOpen: false,
        directorEnabled: true,
        persistence: 'sqlite-local',
      },
    });
  });
  await page.route('**/api/admin/ai/preview', async (route) => {
    expect(route.request().headers().authorization).toBe('Bearer browser-test-token');
    expect(route.request().postDataJSON()).toEqual({});
    await route.fulfill({
      json: {
        status: 'ok',
        annotation: {
          sourceEventId: 'event-1',
          caption: 'From the chronicler’s notebook: Borin lights the hearth.',
        },
        source: { id: 'event-1', text: 'Borin lights the hearth.' },
      },
    });
  });
  await page.goto('/admin');
  await page.getByLabel('Administrator token').fill('browser-test-token');
  await page.getByRole('button', { name: 'Inspect world' }).click();
  await page.getByRole('button', { name: 'Preview annotation' }).click();
  await expect(page.locator('.narrative-preview')).toContainText('Preview status: ok');
  await expect(page.locator('.narrative-preview')).toContainText(
    'Confirmed source: Borin lights the hearth.',
  );
  expect(await page.evaluate(() => Object.values(localStorage).join(' '))).not.toContain(
    'browser-test-token',
  );
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(page.url()).not.toContain('browser-test-token');
  await page.screenshot({ path: 'test-results/admin-preview.png', fullPage: true });
});
