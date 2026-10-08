import { test, expect, type Page } from '@playwright/test';

const SERVER = 'http://localhost:4000';

async function createRoom(request: Page['request']): Promise<string> {
  const { id } = (await (await request.post(`${SERVER}/rooms`)).json()) as { id: string };
  return id;
}

test('empty room shows the breathing-ember empty state', async ({ page, request }) => {
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1&quality=low`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('room-empty')).toBeVisible({ timeout: 15_000 });
});

test('click-to-listen gate shows when audio is locked', async ({ page, request }) => {
  const id = await createRoom(request);
  // No ?e2e → real player path → audio starts locked → the gate shows.
  await page.goto(`/room/${id}?quality=low`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('click-to-listen')).toBeVisible({ timeout: 15_000 });
});

test('reconnecting state renders', async ({ page, request }) => {
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1&quality=low`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('room-stage')).toBeVisible();
  await page.evaluate(() => window.__emberForceReconnecting?.(true));
  await expect(page.getByTestId('reconnecting')).toBeVisible({ timeout: 5_000 });
});
