import { test, expect } from '@playwright/test';

const SERVER = 'http://localhost:4000';

test('server /health endpoint returns ok', async ({ request }) => {
  const response = await request.get(`${SERVER}/health`);
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toBe('ok');
});

test('creating a room lands on /room/[id] with a visible 3D canvas', async ({ page }) => {
  await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('create-room').click();
  await page.waitForURL(/\/room\/[a-z0-9]+/i, { timeout: 20_000, waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('room-stage')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
});

test('lite mode (?lite=1) loads the room without page errors', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const res = await request.post(`${SERVER}/rooms`);
  const { id } = (await res.json()) as { id: string };

  await page.goto(`/room/${id}?lite=1&e2e=1`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('room-stage')).toHaveAttribute('data-lite', 'true');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  expect(errors).toEqual([]);
});
