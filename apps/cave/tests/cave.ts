import { test as base, expect, type Page } from '@playwright/test';

// Fails the test on any uncaught page error.
export const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await use(errors);
    expect(errors, 'page errors').toEqual([]);
  }, { auto: true }],
});
export { expect };

const cave = (page: Page, fn: string) => page.evaluate(`window.__cave.${fn}`);

// Load the page and wait for the background painting to finish.
export async function open(page: Page, path = '/') {
  await page.goto(path);
  await page.waitForFunction(() => window.__cave && window.__cave.pending === 0, null, { timeout: 120_000 });
}

export async function startPainting(page: Page) {
  await page.click('#start-mouse');
  await page.waitForFunction(() => window.__cave.mode === 'mouse');
}

export const focusT = (page: Page) => cave(page, 'focus.t') as Promise<number>;
export const panel = (page: Page) => cave(page, 'panel') as Promise<string | null>;

export async function waitForPanel(page: Page, kind: string) {
  await page.waitForFunction((k) => window.__cave.panel === k, kind, { timeout: 240_000 });
}

export async function closePanel(page: Page) {
  await page.evaluate(() => (document.getElementById('panel-close') as HTMLButtonElement).click());
  await page.waitForFunction(() => window.__cave.panel === null);
}

declare global { interface Window { __cave: Record<string, any> } }
