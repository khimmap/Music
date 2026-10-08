import { test, expect, type Browser, type Page } from '@playwright/test';

/**
 * Part-2 effects tests: each effect is gated by its existing QualityProvider
 * flag, by prefers-reduced-motion, and by the hidden-tab pause. These assert
 * the quality-flag and reduced-motion gating (embers canvas, burn mode, live
 * cursors), the idle "cinema" fade, and the keyboard shortcuts.
 */

const SERVER = 'http://localhost:4000';
const VIDEO_A = 'dQw4w9WgXcQ';

async function createRoom(request: Page['request']): Promise<string> {
  const { id } = (await (await request.post(`${SERVER}/rooms`)).json()) as { id: string };
  return id;
}

async function joinRoom(browser: Browser, roomId: string, query: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/room/${roomId}?e2e=1&${query}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('listeners')).not.toHaveText('0 listening', { timeout: 20_000 });
  return page;
}

test('low tier runs no ember particle canvas and the plainest burn transition', async ({
  page,
  request,
}) => {
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1&quality=low`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('room-stage')).toHaveAttribute('data-tier', 'low');

  // embersCount is 0 at low, so the particle canvas never mounts.
  expect(await page.getByTestId('embers').count()).toBe(0);
  // The burn overlay falls back to the plain crossfade.
  await expect(page.getByTestId('burn')).toHaveAttribute('data-mode', 'crossfade');
});

test('reduced motion disables the ember particle canvas and forces the plain burn', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const id = await createRoom(request);
  // High tier would normally emit 60 embers; reduced motion must suppress them.
  await page.goto(`/room/${id}?e2e=1&quality=high`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('room-stage')).toBeVisible({ timeout: 15_000 });

  expect(await page.getByTestId('embers').count()).toBe(0);
  await expect(page.getByTestId('burn')).toHaveAttribute('data-mode', 'crossfade');
});

test('going idle enters cinema mode and any input restores the chrome', async ({
  page,
  request,
}) => {
  await page.clock.install();
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1&quality=low`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('listeners')).not.toHaveText('0 listening', { timeout: 20_000 });
  await expect(page.getByTestId('room-stage')).toHaveAttribute('data-cinema', 'false');

  // After 20s of no activity the stage drops into cinema mode.
  await page.clock.fastForward(21_000);
  await expect(page.getByTestId('room-stage')).toHaveAttribute('data-cinema', 'true');

  // Any pointer activity brings the chrome back.
  await page.mouse.move(300, 300);
  await page.mouse.move(340, 320);
  await expect(page.getByTestId('room-stage')).toHaveAttribute('data-cinema', 'false');
});

test('keyboard shortcuts drive playback but are ignored while typing in a field', async ({
  page,
  request,
}) => {
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1&quality=low`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('listeners')).not.toHaveText('0 listening', { timeout: 20_000 });

  await page.getByTestId('add-input').fill(VIDEO_A);
  await page.getByTestId('add-submit').click();
  await expect(page.getByTestId('playback-state')).toHaveText('playing', { timeout: 10_000 });

  // Move focus off the add button, then Space toggles playback.
  await page.getByTestId('track-title').click();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('playback-state')).toHaveText('paused');

  // The `?` shortcut opens the hint panel; Escape closes it.
  await page.keyboard.press('?');
  await expect(page.getByTestId('shortcut-hint')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('shortcut-hint')).toHaveCount(0);

  // Focus a text field: Space must be typed, not treated as a shortcut.
  await page.getByTestId('add-input').click();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('playback-state')).toHaveText('paused');
});

test("another listener's live cursor is visible when cursors are enabled", async ({
  browser,
  request,
}) => {
  const id = await createRoom(request);
  const a = await joinRoom(browser, id, 'quality=high');
  const b = await joinRoom(browser, id, 'quality=high');
  // Pin FPS so headless software-WebGL does not auto-downgrade the tier mid-test.
  await a.evaluate(() => {
    window.__emberSimulateFps = 60;
  });
  await b.evaluate(() => {
    window.__emberSimulateFps = 60;
  });
  await expect(a.getByTestId('listeners')).toHaveText('2 listening', { timeout: 20_000 });

  // A keeps its pointer moving; the throttled cursor broadcast shows up on B.
  // (We poll on presence rather than visibility: the cursor container is a
  // zero-size positioning anchor for its absolutely-placed dot + label, and
  // staying in motion also keeps it from being pruned after 3s idle.)
  let seen = false;
  for (let i = 0; i < 50 && !seen; i += 1) {
    await a.mouse.move(220 + (i % 8) * 40, 220 + (i % 6) * 40);
    await a.waitForTimeout(120);
    seen = (await b.getByTestId('live-cursor').count()) > 0;
  }
  expect(seen).toBe(true);

  await a.context().close();
  await b.context().close();
});

test('live cursors are off at the low tier', async ({ browser, request }) => {
  const id = await createRoom(request);
  const a = await joinRoom(browser, id, 'quality=low');
  const b = await joinRoom(browser, id, 'quality=low');
  await expect(a.getByTestId('listeners')).toHaveText('2 listening', { timeout: 20_000 });

  for (let i = 0; i < 6; i += 1) {
    await a.mouse.move(300 + i * 30, 260 + i * 20);
    await a.waitForTimeout(60);
  }
  // Give any stray broadcast time to arrive, then confirm nothing renders.
  await b.waitForTimeout(1_000);
  expect(await b.getByTestId('live-cursor').count()).toBe(0);

  await a.context().close();
  await b.context().close();
});
