import { test, expect } from '@playwright/test';

for (const filter of ['traveler', 'category'] as const) {
  test(`keeps a delayed archive response from replacing the ${filter} filter's cursor`, async ({ page }) => {
    const requests: URL[] = [];
    let releaseOld!: () => void, releaseNew!: () => void;
    const oldResponse = new Promise<void>((resolve) => {
      releaseOld = resolve;
    });
    const newResponse = new Promise<void>((resolve) => {
      releaseNew = resolve;
    });
    await page.route('**/api/history?*', async (route) => {
      const index = requests.push(new URL(route.request().url()));
      if (index === 1) {
        await oldResponse;
        await route.fulfill({
          status: filter === 'category' ? 503 : 200,
          json: { events: [], nextCursor: 7 },
        });
      } else if (index === 2) {
        await newResponse;
        await route.fulfill({
          json: {
            events: [
              {
                id: 'filtered-archive-event',
                sequence: 222,
                time: Date.now(),
                actorId: 'npc-11',
                actors: ['npc-11'],
                text: 'A remembered workshop conversation.',
                category: 'chat',
              },
            ],
            nextCursor: 222,
          },
        });
      } else await route.fulfill({ json: { events: [], nextCursor: null } });
    });
    try {
      await page.goto('/');
      await expect(page.locator('.people button')).toHaveCount(15);
      await page.getByRole('button', { name: 'Read earlier tales', exact: true }).click();
      await expect.poll(() => requests.length).toBe(1);
      if (filter === 'traveler')
        await page.getByLabel('Follow traveler', { exact: true }).selectOption('npc-11');
      else await page.getByLabel('Story category', { exact: true }).selectOption('chat');
      await page.getByRole('button', { name: 'Read earlier tales', exact: true }).click();
      await expect.poll(() => requests.length).toBe(2);
      expect(requests[1].searchParams.get('before')).not.toBe('7');
      expect(requests[1].searchParams.get(filter === 'traveler' ? 'actor' : 'category')).toBe(
        filter === 'traveler' ? 'npc-11' : 'chat',
      );
      releaseOld();
      await expect(page.getByRole('button', { name: 'Opening the archive…', exact: true })).toBeDisabled();
      await expect(page.getByRole('alert')).toHaveCount(0);
      releaseNew();
      await expect(page.getByText('A remembered workshop conversation.', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Read earlier tales', exact: true }).click();
      await expect.poll(() => requests.length).toBe(3);
      expect(requests[2].searchParams.get('before')).toBe('222');
      expect(requests[2].searchParams.get(filter === 'traveler' ? 'actor' : 'category')).toBe(
        filter === 'traveler' ? 'npc-11' : 'chat',
      );
      await expect(page.getByRole('alert')).toHaveCount(0);
    } finally {
      releaseOld();
      releaseNew();
    }
  });
}
test('shows an active archive failure and allows a successful retry', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/history?*', (route) => {
    requests++;
    return route.fulfill({ status: requests === 1 ? 503 : 200, json: { events: [], nextCursor: null } });
  });
  await page.goto('/');
  await expect(page.locator('.people button')).toHaveCount(15);
  await page.getByRole('button', { name: 'Read earlier tales', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('The archive is unavailable. Please try again.');
  await page.getByRole('button', { name: 'Read earlier tales', exact: true }).click();
  await expect.poll(() => requests).toBe(2);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Read earlier tales', exact: true })).toBeEnabled();
});
