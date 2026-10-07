import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Ember smoke tests.
 *
 * `webServer` boots both apps automatically: the Socket.io/HTTP server
 * (port 4000) and the Next.js web app (port 3000). Tests wait until each
 * server's readiness URL responds before running.
 */
const WEB_URL = 'http://localhost:3000';
const SERVER_HEALTH_URL = 'http://localhost:4000/health';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    // Allow software WebGL (SwiftShader) so the 3D canvas renders headlessly.
    launchOptions: {
      args: ['--enable-unsafe-swiftshader'],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @ember/server run dev',
      url: SERVER_HEALTH_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @ember/web run dev',
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
