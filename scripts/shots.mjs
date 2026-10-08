// Headed, self-driven screenshot run for Ember. One browser window, two tabs
// (so the captured tab is always the visible/active one — a second OS window
// would be occlusion-throttled by Chrome, pausing rAF/visibility-gated effects
// like embers, tilt springs, and the idle timer). The background tab keeps its
// socket presence, so "2 listening" still holds.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const WEB = 'http://localhost:3000';
const SERVER = 'http://localhost:4000';
const OUT = 'scripts/shots';
const VIDEO_A = 'dQw4w9WgXcQ';
const VIDEO_B = '9bZkp7q19f0';

mkdirSync(OUT, { recursive: true });

const createRoom = async () => {
  const res = await fetch(`${SERVER}/rooms`, { method: 'POST' });
  const { id } = await res.json();
  return id;
};

const pinFps = (page) => page.evaluate(() => (window.__emberSimulateFps = 60));

const open = async (ctx, id, query) => {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${WEB}/room/${id}?e2e=1&${query}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.querySelector('[data-testid="listeners"]')?.textContent !== '0 listening',
    { timeout: 20000 },
  );
  return page;
};

const addVideo = async (page, v) => {
  await page.getByTestId('add-input').fill(v);
  await page.getByTestId('add-submit').click();
};

// Make this tab the active (visible) one + settle so effects render.
const front = async (page, settle = 1200) => {
  await page.bringToFront();
  await page.waitForTimeout(settle);
};

const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
};

const browser = await chromium.launch({
  headless: false,
  args: ['--enable-unsafe-swiftshader'],
});

try {
  const id = await createRoom();
  const ctx = await browser.newContext();
  const a = await open(ctx, id, 'quality=high');
  const b = await open(ctx, id, 'quality=high'); // second listener (background tab)
  await pinFps(a);
  await pinFps(b);
  await a.bringToFront();
  await a.waitForFunction(
    () => document.querySelector('[data-testid="listeners"]')?.textContent === '2 listening',
    { timeout: 20000 },
  );

  await addVideo(a, VIDEO_A);
  await a.getByTestId('current-video').waitFor({ state: 'attached' });
  await addVideo(a, VIDEO_B);

  // 01 room @ high.
  await front(a, 1600);
  await shot(a, '01-room-high');

  // 02 queue-card tilt (hover center).
  const box = await a.getByTestId('queue-card').first().boundingBox();
  if (box) {
    await a.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await a.waitForTimeout(600);
    await shot(a, '02-queue-tilt');
    await a.mouse.move(10, 10);
  }

  // 03 skip-vote fuse spark (one of two votes).
  await a.evaluate(() => window.__emberVoteSkip?.());
  await a.waitForTimeout(500);
  await shot(a, '03-skip-spark');

  // 04 tomato: B throws at A, A throws at B; capture the arc then the stain.
  const selfA = await a.evaluate(() => window.__emberSelfId);
  const selfB = await b.evaluate(() => window.__emberSelfId);
  await a.bringToFront();
  await b.evaluate((to) => window.__emberThrow?.(to), selfA);
  await a.evaluate((to) => window.__emberThrow?.(to), selfB);
  await a.waitForTimeout(170);
  await shot(a, '04-tomato-fly');
  await a.waitForTimeout(500);
  await shot(a, '04b-tomato-stain');

  // 05 shortcut hint panel.
  await a.keyboard.press('?');
  await a.waitForTimeout(300);
  await shot(a, '05-shortcuts');
  await a.keyboard.press('Escape');

  // 06 cinema: wait for the idle state to actually flip (A is the active tab,
  // so its 20s idle timer runs), rather than a flaky fixed sleep.
  await a.bringToFront();
  await a.waitForFunction(
    () =>
      document.querySelector('[data-testid="room-stage"]')?.getAttribute('data-cinema') === 'true',
    { timeout: 45000 },
  );
  await a.waitForTimeout(700); // let the chrome finish its opacity fade
  await shot(a, '06-cinema');
  await a.mouse.move(700, 450);

  // 07 low tier.
  const low = await open(ctx, id, 'quality=low');
  await front(low, 1200);
  await shot(low, '07-low');

  // 08 reduced motion (same context, per-page emulation).
  const reduced = await ctx.newPage();
  await reduced.setViewportSize({ width: 1440, height: 900 });
  await reduced.emulateMedia({ reducedMotion: 'reduce' });
  await reduced.goto(`${WEB}/room/${id}?e2e=1&quality=high`, { waitUntil: 'domcontentloaded' });
  await reduced.waitForFunction(
    () => document.querySelector('[data-testid="listeners"]')?.textContent !== '0 listening',
    { timeout: 20000 },
  );
  await pinFps(reduced);
  await front(reduced, 1200);
  await shot(reduced, '08-reduced');

  // 09 home (create-room entry).
  const home = await ctx.newPage();
  await home.setViewportSize({ width: 1440, height: 900 });
  await home.goto(`${WEB}/?e2e=1`, { waitUntil: 'domcontentloaded' });
  await front(home, 600);
  await shot(home, '09-home');

  console.log('DONE');
} catch (err) {
  console.error('SHOT_ERROR', err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
