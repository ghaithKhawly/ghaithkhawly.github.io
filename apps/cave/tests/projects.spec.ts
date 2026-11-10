import { test, expect, open, startPainting, waitForPanel, closePanel } from './cave';

// A project painting steps out as the device it runs on, showing real screens, and its
// words are painted on the rock beside it.
test('a project steps out of its painting with real screens', async ({ page }) => {
  await open(page);
  await startPainting(page);

  // Clicking the painting itself.
  const [x, y] = await page.evaluate(() => window.__cave.paintingCenter('project-office-order'));
  await page.mouse.click(x, y);
  await waitForPanel(page, 'project');
  await expect(page.locator('#panel-title')).toHaveText('Office Order');
  await page.waitForFunction(() => window.__cave.stepOutState?.t === 1 && window.__cave.screen?.shown, null, { timeout: 120_000 });
  await expect(page.locator('#screen-caption')).toHaveText(/^1 of 3/);
  // The phone is big enough to read (over half the view's height), and all of it is in view.
  const phone = await page.evaluate(() => window.__cave.deviceRect);
  expect(phone.bottom - phone.top).toBeGreaterThan(720 * 0.5);
  expect(phone.left).toBeGreaterThan(0); expect(phone.top).toBeGreaterThan(0);
  expect(phone.right).toBeLessThan(1280); expect(phone.bottom).toBeLessThan(720);

  // Stepping through the screens.
  await page.click('#panel .screen-step[aria-label="Next screen"]');
  await page.waitForFunction(() => window.__cave.screen?.index === 1);
  await expect(page.locator('#screen-caption')).toHaveText(/^2 of 3/);

  // Closing sends the device back into the wall.
  await closePanel(page);
  await page.waitForFunction(() => window.__cave.stepOut === null, null, { timeout: 120_000 });

  // From the shortcuts too: the Gym steps out as a phone with its own screens.
  await page.click('#t-shortcuts');
  await page.click('#chips button[data-project="gym"]');
  await waitForPanel(page, 'project');
  await expect(page.locator('#panel-title')).toHaveText('Gym Management System');
  await page.waitForFunction(() => window.__cave.screen?.project === 'gym' && window.__cave.screen.shown, null, { timeout: 120_000 });
  await expect(page.locator('#screen-caption')).toHaveText(/^1 of 4/);
});

// Long sections don't fit beside their painting: the end fades and "More below" reads on.
// The laptop, the widest thing that steps out, stays inside the view.
test('a long section says there is more, and the laptop stays in view', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await startPainting(page);
  await page.click('#t-shortcuts');
  await page.click('.chip[data-section="experience"]');
  await waitForPanel(page, 'experience');
  await expect(page.locator('#panel-more')).toBeVisible();
  const before = await page.locator('#panel').evaluate((el) => el.scrollTop);
  await page.click('#panel-more');
  await page.waitForFunction((y) => document.getElementById('panel').scrollTop > y, before);
  await closePanel(page);

  await page.click('#chips button[data-project="aquarium"]');
  await waitForPanel(page, 'project');
  await page.waitForFunction(() => window.__cave.stepOutState?.t === 1 && window.__cave.screen?.shown, null, { timeout: 120_000 });
  const laptop = await page.evaluate(() => window.__cave.deviceRect);
  expect(laptop.left).toBeGreaterThan(0); expect(laptop.top).toBeGreaterThan(0);
  expect(laptop.right).toBeLessThan(1280); expect(laptop.bottom).toBeLessThan(720);
  // It doesn't sit on the words either.
  const words = await page.locator('#panel').boundingBox();
  expect(laptop.left > words.x + words.width || laptop.right < words.x).toBe(true);
});
