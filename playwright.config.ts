import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  // Browser worlds share one isolated SQLite store; serial runs keep simulation and software WebGL deterministic.
  workers: 1,
  webServer: {
    command: 'npm run dev:e2e',
    url: 'http://127.0.0.1:5177',
    reuseExistingServer: false,
    timeout: 30000,
    env: { DIRECTOR_MODE: 'off' },
  },
  use: {
    baseURL: 'http://127.0.0.1:5177',
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      // Current headless Chromium requires an explicit local opt-in for software WebGL.
      args: ['--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'],
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
        : {}),
    },
  },
});
