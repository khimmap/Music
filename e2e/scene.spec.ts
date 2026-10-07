import { test, expect } from '@playwright/test';

test('/scene-test loads and shows a visible 3D canvas', async ({ page }) => {
  await page.goto('/scene-test');
  // RoomCanvas is loaded client-side (dynamic, ssr: false); allow it to mount.
  const canvas = page.locator('canvas');
  await expect(canvas.first()).toBeVisible({ timeout: 20_000 });
});
