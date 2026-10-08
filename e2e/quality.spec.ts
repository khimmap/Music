import { test, expect, type Page } from '@playwright/test';

const SERVER = 'http://localhost:4000';

async function createRoom(request: Page['request']): Promise<string> {
  const { id } = (await (await request.post(`${SERVER}/rooms`)).json()) as { id: string };
  return id;
}

test('sustained low FPS auto-downgrades one tier and toasts once', async ({ page, request }) => {
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1&quality=high`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('quality-menu')).toHaveAttribute('data-tier', 'high');

  await page.evaluate(() => {
    window.__emberSimulateFps = 20;
  });
  await expect(page.getByTestId('quality-menu')).toHaveAttribute('data-tier', 'medium', {
    timeout: 12_000,
  });
  // Pin here so it does not cascade to low before we assert the toast.
  await page.evaluate(() => {
    window.__emberSimulateFps = 60;
  });
  await expect(page.getByTestId('quality-toast')).toBeVisible();
});

test('manual quality setting persists after reload', async ({ page, request }) => {
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('quality-menu').click();
  await page.getByTestId('quality-low').click();
  await expect(page.getByTestId('quality-menu')).toHaveAttribute('data-tier', 'low');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('quality-menu')).toHaveAttribute('data-tier', 'low');
});

test('reduced motion disables grain and background drift', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const id = await createRoom(request);
  await page.goto(`/room/${id}?e2e=1&quality=high`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('ambient-bg')).toHaveAttribute('data-mode', 'css');
  expect(await page.getByTestId('film-grain').count()).toBe(0);
});
