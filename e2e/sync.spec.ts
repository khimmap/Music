import { test, expect, type Browser, type Page } from '@playwright/test';

const SERVER = 'http://localhost:4000';
const VIDEO_A = 'dQw4w9WgXcQ';
const VIDEO_B = '9bZkp7q19f0';

async function createRoom(request: Page['request']): Promise<string> {
  const res = await request.post(`${SERVER}/rooms`);
  const { id } = (await res.json()) as { id: string };
  return id;
}

/** Open a joined room page (waits until the socket has joined). */
async function joinRoom(browser: Browser, roomId: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  // ?e2e=1 → deterministic stub player (gate hidden); ?lite=1 → lighter scene.
  await page.goto(`/room/${roomId}?lite=1&e2e=1`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('listeners')).not.toHaveText('0 listening', { timeout: 20_000 });
  return page;
}

/**
 * Confirm both listeners are in the room and receiving broadcasts before acting
 * (both see "2 listening"), so playback events are reliably delivered to both.
 */
async function bothPresent(a: Page, b: Page): Promise<void> {
  await expect(a.getByTestId('listeners')).toHaveText('2 listening', { timeout: 20_000 });
  await expect(b.getByTestId('listeners')).toHaveText('2 listening', { timeout: 20_000 });
}

async function addVideo(page: Page, input: string): Promise<void> {
  await page.getByTestId('add-input').fill(input);
  await page.getByTestId('add-submit').click();
}

test('a video added by one listener appears for another', async ({ browser, request }) => {
  const roomId = await createRoom(request);
  const a = await joinRoom(browser, roomId);
  const b = await joinRoom(browser, roomId);
  await bothPresent(a, b);

  await addVideo(a, `https://youtu.be/${VIDEO_A}`);

  await expect(a.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 15_000 });
  await expect(b.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 15_000 });

  await a.context().close();
  await b.context().close();
});

test('pause and seek stay in sync across listeners', async ({ browser, request }) => {
  const roomId = await createRoom(request);
  const a = await joinRoom(browser, roomId);
  const b = await joinRoom(browser, roomId);
  await bothPresent(a, b);

  await addVideo(a, VIDEO_A);
  await expect(a.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 15_000 });
  await expect(b.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 15_000 });
  await expect(a.getByTestId('playback-state')).toHaveText('playing', { timeout: 5_000 });
  await expect(b.getByTestId('playback-state')).toHaveText('playing', { timeout: 5_000 });

  // A pauses -> B pauses.
  await a.getByTestId('toggle-play').click();
  await expect(a.getByTestId('playback-state')).toHaveText('paused');
  await expect(b.getByTestId('playback-state')).toHaveText('paused', { timeout: 5_000 });

  // A seeks to 60s (routed through the server) -> B lands within +/- 2s.
  await a.evaluate((sec) => window.__emberSeek?.(sec), 60);

  await expect
    .poll(async () => Number(await b.getByTestId('position-sec').textContent()), { timeout: 10_000 })
    .toBeGreaterThan(57);
  const bPos = Number(await b.getByTestId('position-sec').textContent());
  expect(Math.abs(bPos - 60)).toBeLessThanOrEqual(2);

  await a.context().close();
  await b.context().close();
});

test('queue advances to the next track when the current one ends', async ({ browser, request }) => {
  const roomId = await createRoom(request);
  const a = await joinRoom(browser, roomId);
  const b = await joinRoom(browser, roomId);
  await bothPresent(a, b);

  await addVideo(a, VIDEO_A);
  await expect(b.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 15_000 });

  await addVideo(a, VIDEO_B);
  await expect(b.getByTestId('queue-list')).toContainText(VIDEO_B, { timeout: 15_000 });

  // The current video ends on A.
  await a.evaluate(() => window.__emberStubEnd?.());

  await expect(a.getByTestId('current-video')).toHaveText(VIDEO_B, { timeout: 15_000 });
  await expect(b.getByTestId('current-video')).toHaveText(VIDEO_B, { timeout: 15_000 });

  await a.context().close();
  await b.context().close();
});
