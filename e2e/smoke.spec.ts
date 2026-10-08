import { test, expect } from '@playwright/test';

const SERVER = 'http://localhost:4000';

test('server /health endpoint returns ok', async ({ request }) => {
  const response = await request.get(`${SERVER}/health`);
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toBe('ok');
});

test('creating a room lands on /room/[id] and renders', async ({ page }) => {
  await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('create-room').click();
  await page.waitForURL(/\/room\/[a-z0-9]+/i, { timeout: 20_000, waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('room-stage')).toBeVisible({ timeout: 15_000 });
});

test('low quality renders with no WebGL canvas', async ({ page, request }) => {
  const { id } = (await (await request.post(`${SERVER}/rooms`)).json()) as { id: string };
  await page.goto(`/room/${id}?e2e=1&quality=low`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('room-stage')).toHaveAttribute('data-tier', 'low');
  await expect(page.getByTestId('ambient-bg')).toHaveAttribute('data-mode', 'css');
  expect(await page.locator('canvas').count()).toBe(0);
});
