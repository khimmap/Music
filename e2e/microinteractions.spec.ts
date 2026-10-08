import { test, expect, type Browser, type Page } from '@playwright/test';

/**
 * Task 2b micro-interaction tests: tilt/magnetic gated by the `tiltMagnetic`
 * quality flag, the listener-count odometer settling on the correct value, and
 * the `?` shortcut hint panel.
 */

const SERVER = 'http://localhost:4000';
const VIDEO_A = 'dQw4w9WgXcQ';
const VIDEO_B = '9bZkp7q19f0';

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

async function addVideo(page: Page, input: string): Promise<void> {
  await page.getByTestId('add-input').fill(input);
  await page.getByTestId('add-submit').click();
}

test('tilt and magnetic are disabled at the low tier', async ({ page, request }) => {
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1&quality=low`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('listeners')).not.toHaveText('0 listening', { timeout: 20_000 });

  // First video becomes current; second stays queued so a queue card renders.
  await addVideo(page, VIDEO_A);
  await expect(page.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 10_000 });
  await addVideo(page, VIDEO_B);
  await expect(page.getByTestId('queue-card').first()).toHaveAttribute('data-tilt', 'false');
  await expect(page.getByTestId('toggle-play')).toHaveAttribute('data-magnetic', 'false');
});

test('tilt and magnetic are enabled at the high tier', async ({ page, request }) => {
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1&quality=high`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('listeners')).not.toHaveText('0 listening', { timeout: 20_000 });
  // Pin FPS so headless software-WebGL does not auto-downgrade the tier.
  await page.evaluate(() => {
    window.__emberSimulateFps = 60;
  });

  await addVideo(page, VIDEO_A);
  await expect(page.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 10_000 });
  await addVideo(page, VIDEO_B);
  await expect(page.getByTestId('queue-card').first()).toHaveAttribute('data-tilt', 'true');
  await expect(page.getByTestId('toggle-play')).toHaveAttribute('data-magnetic', 'true');
});

test('the listener-count odometer settles on the correct value as people come and go', async ({
  browser,
  request,
}) => {
  const id = await createRoom(request);
  const a = await joinRoom(browser, id, 'quality=low');
  await expect(a.getByTestId('listeners')).toHaveText('1 listening');

  const b = await joinRoom(browser, id, 'quality=low');
  await expect(a.getByTestId('listeners')).toHaveText('2 listening', { timeout: 10_000 });

  await b.context().close();
  await expect(a.getByTestId('listeners')).toHaveText('1 listening', { timeout: 10_000 });

  await a.context().close();
});

test('the ? key opens the shortcut hint panel and Escape closes it', async ({ page, request }) => {
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1&quality=low`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('room-stage')).toBeVisible({ timeout: 15_000 });

  await expect(page.getByTestId('shortcut-hint')).toHaveCount(0);
  await page.keyboard.press('?');
  await expect(page.getByTestId('shortcut-hint')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('shortcut-hint')).toHaveCount(0);
});
