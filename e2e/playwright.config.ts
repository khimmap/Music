import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Ember.
 *
 * The web app is served from a PRODUCTION build (built with
 * `NEXT_PUBLIC_E2E_STUB_PLAYER=1` so the YouTube player is swapped for a
 * deterministic stub). Production serving avoids Next dev's slow on-demand
 * compilation of the three.js scene. The realtime server runs via tsx with
 * `E2E_STUB_PLAYER=1` (skips the oEmbed network call).
 */
const WEB_URL = 'http://localhost:3000';
const SERVER_HEALTH_URL = 'http://localhost:4000/health';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Realtime, two-context tests can be timing-sensitive under load; allow retries.
  retries: 2,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    // Allow software WebGL (SwiftShader) so the 3D canvas renders headlessly.
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @ember/server run dev',
      url: SERVER_HEALTH_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { E2E_STUB_PLAYER: '1' },
    },
    {
      command: 'pnpm --filter @ember/web run build && pnpm --filter @ember/web run start',
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 240_000,
      env: { NEXT_PUBLIC_E2E_STUB_PLAYER: '1' },
    },
  ],
});
