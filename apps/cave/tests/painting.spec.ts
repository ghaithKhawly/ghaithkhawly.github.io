import { test, expect, open, startPainting, waitForPanel } from './cave';

test('tracing the wolf finishes it and opens Experience', async ({ page }) => {
  await open(page);
  await startPainting(page);
  const [cx, cy] = await page.evaluate(() => window.__cave.guideCenter('wolf'));
  await page.mouse.click(cx, cy);
  await page.waitForFunction(() => window.__cave.focus.t >= 0.99, null, { timeout: 120_000 });

  // Trace the outline as it sits on screen once zoomed in.
  const path: number[][] = await page.evaluate(() => window.__cave.guidePath('wolf'));
  await page.mouse.move(path[0][0], path[0][1]);
  await page.mouse.down();
  for (const [x, y] of [...path.filter((_, i) => i % 2 === 0), path[0]]) await page.mouse.move(x, y);
  await page.mouse.up();

  await page.waitForFunction(() => window.__cave.focus.finishing || window.__cave.panel, null, { timeout: 30_000 });
  await waitForPanel(page, 'experience');
  const wolf = (await page.evaluate(() => window.__cave.guides)).find((g: { id: string }) => g.id === 'wolf');
  expect(wolf.done).toBe(true);
});

test('the Contact shortcut stencils the hand', async ({ page }) => {
  await open(page);
  await startPainting(page);
  await page.click('#t-shortcuts');
  await page.click('#chips button[data-section="contact"]');
  await waitForPanel(page, 'contact');
  const hand = (await page.evaluate(() => window.__cave.guides)).find((g: { id: string }) => g.id === 'hand');
  expect(hand.done).toBe(true);
});
