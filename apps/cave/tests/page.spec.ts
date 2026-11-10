import { test, expect, open } from './cave';

// The CV as a plain page: the site where the cave can't be drawn, and what screen
// readers read while it is.
const SECTIONS = ['About', 'Experience', 'Projects', 'Education', 'Certifications', 'Languages', 'Contact'];

test('?flat shows the whole CV as a page, and nothing of the cave', async ({ page }) => {
  await page.goto('/?flat');
  await expect(page.locator('#page')).toBeVisible();
  await expect(page.locator('#scene')).toBeHidden();
  await expect(page.locator('#intro')).toBeHidden();
  for (const name of SECTIONS) await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Rakeb' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enter the cave' })).toHaveAttribute('href', './');
  // Its links are in the tab order, and nothing scrolls sideways.
  await expect(page.locator('#page a').first()).not.toHaveAttribute('tabindex', '-1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // The cave's script never loaded.
  expect(await page.evaluate(() => 'pending' in (window.__cave ?? {}))).toBe(false);
});

test('without WebGL 2 the page is the site', async ({ page }) => {
  await page.addInitScript(() => { delete (window as any).WebGL2RenderingContext; });
  await page.goto('/');
  await expect(page.locator('#page')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Experience' })).toBeVisible();
  await expect(page.locator('#intro')).toBeHidden();
});

test('in the cave, the page is there for screen readers only', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (r) => requested.push(r.url()));
  await open(page);
  // In the accessibility tree, out of sight, out of the tab order, and none of its pictures loaded.
  await expect(page.getByRole('heading', { level: 2, name: 'Experience' })).toHaveCount(1);
  expect(await page.locator('#page').evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
  await expect(page.locator('#page a').first()).toHaveAttribute('tabindex', '-1');
  expect(requested.filter((u) => /\/assets\/\d-[\w-]+\.webp/.test(u))).toEqual([]);
  // The first Tab reaches the way to the plain page.
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await expect(page.locator('.skip')).toBeInViewport();
});

test('if the cave loses its graphics for good, the page takes over', async ({ page }) => {
  await open(page);
  await page.evaluate(() => (document.getElementById('scene') as HTMLCanvasElement).getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForURL(/\?flat&lost/, { timeout: 30_000 });
  await expect(page.locator('#page')).toBeVisible();
  await expect(page.locator('#page-why')).toContainText('stopped drawing');
});
