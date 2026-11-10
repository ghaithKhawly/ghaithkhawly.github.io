import AxeBuilder from '@axe-core/playwright';
import { test, expect, open, startPainting, waitForPanel } from './cave';

// An axe check (WCAG 2.1 A and AA) of each state a visitor can be in: the intro, the
// cave, a section open on the wall, a project stepped out, and the plain page.
const audit = async (page) => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return r.violations.map((v) => `${v.id} (${v.impact}): ${v.help}; ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
};

test.use({ reducedMotion: 'reduce' });

test('every state of the cave passes axe', async ({ page }) => {
  test.setTimeout(400_000);
  await open(page);
  expect(await audit(page), 'intro').toEqual([]);
  await startPainting(page);
  expect(await audit(page), 'cave').toEqual([]);
  await page.click('#t-shortcuts');
  expect(await audit(page), 'shortcuts').toEqual([]);
  await page.click('.chip[data-section="experience"]');
  await waitForPanel(page, 'experience', 120_000);
  expect(await audit(page), 'a section').toEqual([]);
  await page.keyboard.press('Escape');   // the shortcuts are still open
  await page.click('.chip[data-project="rakeb"]');
  await waitForPanel(page, 'project', 120_000);
  expect(await audit(page), 'a project').toEqual([]);
});

test('the plain page passes axe', async ({ page }) => {
  await page.goto('/?flat');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));   // load every picture
  await page.waitForLoadState('networkidle');
  expect(await audit(page)).toEqual([]);
});
