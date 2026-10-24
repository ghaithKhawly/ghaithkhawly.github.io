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

  // Stepping through the screens.
  await page.click('#panel .screen-step[aria-label="Next screen"]');
  await page.waitForFunction(() => window.__cave.screen?.index === 1);
  await expect(page.locator('#screen-caption')).toHaveText(/^2 of 3/);

  // Closing sends the device back into the wall.
  await closePanel(page);
  await page.waitForFunction(() => window.__cave.stepOut === null, null, { timeout: 120_000 });

  // A project with no screens yet opens its words alone, from the shortcuts.
  await page.click('#t-shortcuts');
  await page.click('#chips button[data-project="gym"]');
  await waitForPanel(page, 'project');
  await expect(page.locator('#panel-title')).toHaveText('Gym Management System');
  expect(await page.evaluate(() => window.__cave.stepOut)).toBe(null);
});
