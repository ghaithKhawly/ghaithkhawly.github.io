import { test, expect, open, startPainting, waitForPanel, closePanel } from './cave';

// Leaning moves the eye; the hidden things come into view one at a time.
test('leaning finds all three hidden things', async ({ page }) => {
  await open(page);
  await startPainting(page);
  const lean = (x: number) => page.evaluate((v) => window.__cave.setEye(v, 0, 3.5, true), x);

  // Standing still, or swaying a little, finds nothing.
  for (const x of [0, -0.4, 0.4]) {
    await lean(x);
    await page.waitForTimeout(3_000);
    expect((await page.evaluate(() => window.__cave.secrets)).every((s: { found: boolean }) => !s.found)).toBe(true);
  }

  await lean(1.2);
  await waitForPanel(page, 'education');
  await closePanel(page);
  await waitForPanel(page, 'languages');
  await closePanel(page);

  await lean(-1.0);
  await waitForPanel(page, 'certs');
  expect((await page.evaluate(() => window.__cave.secrets)).every((s: { found: boolean }) => s.found)).toBe(true);
});
