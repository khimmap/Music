import { test, expect } from '@playwright/test';

test('home page shows the workspace-ready placeholder', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /workspace ready/i })).toBeVisible();
});

test('server /health endpoint returns ok', async ({ request }) => {
  const response = await request.get('http://localhost:4000/health');
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toBe('ok');
});
