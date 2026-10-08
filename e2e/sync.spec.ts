import { test, expect, type Browser, type Page } from '@playwright/test';

const SERVER = 'http://localhost:4000';
const VIDEO_A = 'dQw4w9WgXcQ';

async function createRoom(request: Page['request']): Promise<string> {
  const { id } = (await (await request.post(`${SERVER}/rooms`)).json()) as { id: string };
  return id;
}

async function joinRoom(browser: Browser, roomId: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/room/${roomId}?e2e=1&quality=low`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('listeners')).not.toHaveText('0 listening', { timeout: 20_000 });
  return page;
}

async function bothPresent(a: Page, b: Page): Promise<void> {
  await expect(a.getByTestId('listeners')).toHaveText('2 listening', { timeout: 20_000 });
  await expect(b.getByTestId('listeners')).toHaveText('2 listening', { timeout: 20_000 });
}

async function addVideo(page: Page, input: string): Promise<void> {
  await page.getByTestId('add-input').fill(input);
  await page.getByTestId('add-submit').click();
}

test('a video and its palette propagate to other listeners', async ({ browser, request }) => {
  const roomId = await createRoom(request);
  const a = await joinRoom(browser, roomId);
  const b = await joinRoom(browser, roomId);
  await bothPresent(a, b);

  await addVideo(a, VIDEO_A);

  await expect(a.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 15_000 });
  await expect(b.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 15_000 });

  const paletteA = await a.getByTestId('room-stage').getAttribute('data-palette');
  const paletteB = await b.getByTestId('room-stage').getAttribute('data-palette');
  expect(paletteA).toBeTruthy();
  expect(paletteB).toBe(paletteA);

  await a.context().close();
  await b.context().close();
});

test('pause and seek stay in sync across listeners', async ({ browser, request }) => {
  const roomId = await createRoom(request);
  const a = await joinRoom(browser, roomId);
  const b = await joinRoom(browser, roomId);
  await bothPresent(a, b);

  await addVideo(a, VIDEO_A);
  await expect(b.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 15_000 });
  await expect(a.getByTestId('playback-state')).toHaveText('playing', { timeout: 5_000 });
  await expect(b.getByTestId('playback-state')).toHaveText('playing', { timeout: 5_000 });

  await a.getByTestId('toggle-play').click();
  await expect(a.getByTestId('playback-state')).toHaveText('paused');
  await expect(b.getByTestId('playback-state')).toHaveText('paused', { timeout: 5_000 });

  await a.evaluate((sec) => window.__emberSeek?.(sec), 60);

  await expect
    .poll(async () => Number(await b.getByTestId('position-sec').textContent()), { timeout: 10_000 })
    .toBeGreaterThan(57);
  const bPos = Number(await b.getByTestId('position-sec').textContent());
  expect(Math.abs(bPos - 60)).toBeLessThanOrEqual(2);

  await a.context().close();
  await b.context().close();
});
