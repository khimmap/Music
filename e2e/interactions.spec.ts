import { test, expect, type Browser, type Page } from '@playwright/test';

/**
 * Two-context realtime tests for the Part-2 social micro-interactions:
 * chat bubbles over avatars, the tomato throw (server cooldown + opt-out), and
 * the majority skip vote. All run with the deterministic stub player
 * (`?e2e=1`) at `quality=low` so no WebGL/particle work is needed.
 */

const SERVER = 'http://localhost:4000';
const VIDEO_A = 'dQw4w9WgXcQ';
const VIDEO_B = '9bZkp7q19f0';

type ThrowResult = { ok: boolean; reason?: string };

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

test("a sender's chat appears as a bubble over their avatar and clears after ~5s", async ({
  browser,
  request,
}) => {
  const roomId = await createRoom(request);
  const a = await joinRoom(browser, roomId);
  const b = await joinRoom(browser, roomId);
  await bothPresent(a, b);

  await a.evaluate((text) => window.__emberChat?.(text), 'hey everyone');

  // B sees A's bubble anchored to A's avatar.
  await expect(b.getByTestId('chat-bubble')).toHaveText('hey everyone', { timeout: 8_000 });
  // It fades out after the 5s lifetime.
  await expect(b.getByTestId('chat-bubble')).toHaveCount(0, { timeout: 8_000 });

  await a.context().close();
  await b.context().close();
});

test('a tomato throw lands once, then is rejected by cooldown, then by opt-out', async ({
  browser,
  request,
}) => {
  const roomId = await createRoom(request);
  const a = await joinRoom(browser, roomId);
  const b = await joinRoom(browser, roomId);
  await bothPresent(a, b);

  const bId = await b.evaluate(() => window.__emberSelfId ?? '');
  expect(bId).toBeTruthy();

  // First throw lands: B shows a tomato stain + the ack is ok.
  const first = (await a.evaluate((id) => window.__emberThrow?.(id), bId)) as ThrowResult;
  expect(first.ok).toBe(true);
  await expect(b.getByTestId('tomato-stain')).toBeVisible({ timeout: 5_000 });

  // Immediate second throw hits the 5s server cooldown.
  const second = (await a.evaluate((id) => window.__emberThrow?.(id), bId)) as ThrowResult;
  expect(second.ok).toBe(false);
  expect(second.reason).toBe('cooldown');

  // B opts out of throws; after the cooldown passes, the throw is refused.
  await b.evaluate(() => window.__emberSetOptOut?.(true));
  await a.waitForTimeout(5_200);
  const third = (await a.evaluate((id) => window.__emberThrow?.(id), bId)) as ThrowResult;
  expect(third.ok).toBe(false);
  expect(third.reason).toBe('opted-out');

  await a.context().close();
  await b.context().close();
});

test('a majority skip vote advances everyone to the next track', async ({ browser, request }) => {
  const roomId = await createRoom(request);
  const a = await joinRoom(browser, roomId);
  const b = await joinRoom(browser, roomId);
  await bothPresent(a, b);

  await addVideo(a, VIDEO_A);
  await expect(b.getByTestId('current-video')).toHaveText(VIDEO_A, { timeout: 15_000 });
  await addVideo(a, VIDEO_B);
  await expect(a.getByTestId('queue-list')).toContainText(VIDEO_B, { timeout: 15_000 });

  // needed = floor(2/2)+1 = 2. One vote is not enough; the track stays.
  await a.evaluate(() => window.__emberVoteSkip?.());
  await expect(a.getByTestId('current-video')).toHaveText(VIDEO_A);

  // The second vote reaches the majority and promotes the next track for all.
  await b.evaluate(() => window.__emberVoteSkip?.());
  await expect(b.getByTestId('current-video')).toHaveText(VIDEO_B, { timeout: 10_000 });
  await expect(a.getByTestId('current-video')).toHaveText(VIDEO_B, { timeout: 10_000 });

  await a.context().close();
  await b.context().close();
});
