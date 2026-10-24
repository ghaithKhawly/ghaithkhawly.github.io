import { test, expect, open, startPainting } from './cave';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('a phone starts on the hare, and its zoom fits the screen', async ({ page }) => {
  await open(page);
  await startPainting(page);
  await page.waitForTimeout(2_000);
  const [cx, cy] = await page.evaluate(() => window.__cave.guideCenter('rabbit'));
  expect(cx).toBeGreaterThan(80);
  expect(cx).toBeLessThan(310);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await page.touchscreen.tap(cx, cy);
  await page.waitForFunction(() => window.__cave.focus.t >= 0.99, null, { timeout: 120_000 });
  const path: number[][] = await page.evaluate(() => window.__cave.guidePath('rabbit'));
  for (const [x, y] of path) {
    expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(390);
    expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(844);
  }
});
