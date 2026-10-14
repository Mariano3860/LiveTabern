import { test, expect } from '@playwright/test';

test('renders a close-up of the calibrated seated character and chair', async ({ page }) => {
  await page.route('**/seat-preview', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<html><body style="margin:0"><div id="root" style="height:100vh"></div><script type="module">
      import RefreshRuntime from '/@react-refresh';
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const { preview } = await import('/tests/e2e/seat-preview.tsx');
      const response = await fetch('/api/world');
      preview(await response.json());
    </script></body></html>`,
    }),
  );
  await page.goto('/seat-preview');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
  await page.screenshot({ path: 'test-results/seat-closeup.png' });
});
