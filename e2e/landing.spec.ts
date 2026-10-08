import { test, expect, type Page } from '@playwright/test';

/** Task 3 landing page: time-of-day theme, lights-out entrance, playable ember
 * dot, reactive avatars, and the 3-step line. */

const getTime = (page: Page) =>
  page.evaluate(() => document.documentElement.getAttribute('data-time'));
const getLights = (page: Page) =>
  page.evaluate(() => document.body.getAttribute('data-lights'));

// Landing sets data-lights="on" from an effect, so this also gates on hydration
// (clicking before React wires up handlers is the main source of flakiness).
const hydrated = (page: Page) =>
  page.waitForFunction(() => document.body.getAttribute('data-lights') === 'on', null, {
    timeout: 15000,
  });

test.describe('time-of-day theme', () => {
  const cases = [
    { time: 'morning', tagline: 'Morning playlist, anyone?' },
    { time: 'day', tagline: null },
    { time: 'evening', tagline: 'Golden hour. Pick a song.' },
    { time: 'night', tagline: 'Still up? Come sit by the fire.' },
  ] as const;

  for (const c of cases) {
    test(`?time=${c.time} sets data-time + tagline on first paint`, async ({ page }) => {
      await page.goto(`/?time=${c.time}`, { waitUntil: 'domcontentloaded' });
      // Set by the inline <head> script before paint — no flash (read first).
      expect(await getTime(page)).toBe(c.time);
      await hydrated(page);
      const tagline = page.getByTestId('time-tagline');
      if (c.tagline === null) await expect(tagline).toHaveCount(0);
      else await expect(tagline).toHaveText(c.tagline);
    });
  }

  test('local clock drives the theme (23:30 night, 09:00 morning)', async ({ page }) => {
    await page.clock.install({ time: new Date('2024-01-01T23:30:00') });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await getTime(page)).toBe('night');

    await page.clock.setFixedTime(new Date('2024-01-01T09:00:00'));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await getTime(page)).toBe('morning');
  });
});

test('lights-out entrance: dimming -> out -> room', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await hydrated(page);
  await page.getByTestId('create-room').click();
  await page.waitForFunction(() => document.body.getAttribute('data-lights') === 'dimming', null, {
    timeout: 8000,
  });
  await page.waitForFunction(() => document.body.getAttribute('data-lights') === 'out', null, {
    timeout: 8000,
  });
  await page.waitForURL(/\/room\/[a-z0-9]+/i, { timeout: 10000 });
});

test('room creation failure brings the lights back up with an error', async ({ page }) => {
  await page.route('**/rooms', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await hydrated(page);
  await page.getByTestId('create-room').click();
  await expect.poll(() => getLights(page), { timeout: 8000 }).toBe('on');
  await expect(page.getByTestId('create-error')).toBeVisible();
  await expect(page.getByTestId('create-room')).toBeEnabled();
});

test('low tier + reduced motion: no particle canvas, transition still completes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?quality=low', { waitUntil: 'domcontentloaded' });
  await hydrated(page);
  expect(await page.getByTestId('landing-embers').count()).toBe(0);
  await page.getByTestId('create-room').click();
  await page.waitForURL(/\/room\/[a-z0-9]+/i, { timeout: 10000 });
});

test('ember dot: 5 stokes -> night + announce, 5 more -> back; keyboard works', async ({
  page,
}) => {
  // quality=low keeps the dot stationary (no firefly follow) for reliable clicks.
  await page.goto('/?time=day&quality=low', { waitUntil: 'domcontentloaded' });
  await hydrated(page);
  const dot = page.getByTestId('ember-dot');
  for (let i = 0; i < 5; i += 1) await dot.click();
  await expect.poll(() => getTime(page)).toBe('night');
  await expect(page.getByTestId('fire-announce')).toHaveText('You found the fire.');

  for (let i = 0; i < 5; i += 1) await dot.click();
  await expect.poll(() => getTime(page)).toBe('day');
  await expect(page.getByTestId('fire-announce')).toHaveText('');

  // Keyboard-operable.
  await dot.focus();
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('Enter');
  await expect.poll(() => getTime(page)).toBe('night');
});

test('avatars play a pentatonic note on click (and never before a gesture)', async ({ page }) => {
  await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });
  await hydrated(page);
  expect(await page.evaluate(() => window.__emberNotes)).toBeUndefined();
  await page.getByTestId('avatar-0').click();
  await page.getByTestId('avatar-4').click();
  expect(await page.evaluate(() => window.__emberNotes)).toEqual(['C', 'A']);
});

test('speech bubbles: at most one at a time, aria-hidden; off under reduced motion', async ({
  page,
}) => {
  await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });
  const bubble = page.getByTestId('avatar-bubble');
  await expect(bubble).toHaveCount(1, { timeout: 10000 });
  await expect(bubble).toHaveAttribute('aria-hidden', 'true');

  const reduced = await page.context().newPage();
  await reduced.emulateMedia({ reducedMotion: 'reduce' });
  await reduced.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });
  await reduced.waitForTimeout(3000);
  expect(await reduced.getByTestId('avatar-bubble').count()).toBe(0);
  await reduced.close();
});

test('3-step line: one row on desktop, stacked on phones, no orphan arrow', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const steps = page.getByTestId('steps');
  await expect(steps).toBeVisible();
  const text = (await steps.textContent()) ?? '';
  expect((text.match(/→/g) ?? []).length).toBe(2); // arrows between steps only

  const li = steps.locator('> li');
  await expect(li).toHaveCount(3);
  const rowY = await li.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)));
  expect(Math.max(...rowY) - Math.min(...rowY)).toBeLessThan(6); // same row

  await page.setViewportSize({ width: 375, height: 800 });
  const stackY = await li.evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().y)),
  );
  expect(Math.max(...stackY) - Math.min(...stackY)).toBeGreaterThan(20); // stacked
});
