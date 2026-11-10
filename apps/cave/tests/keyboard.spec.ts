import { test, expect, open, waitForPanel } from './cave';

// Everything in the cave can be reached from a keyboard; with "reduce motion" on, walking
// up to the wall is a cut and the painting finishes at once.
test.use({ reducedMotion: 'reduce' });

const focused = (page) => page.evaluate(() => { const a = document.activeElement as HTMLElement; return a.id || a.dataset.section || a.className || a.tagName; });
async function tabTo(page, want: string) {
  for (let i = 0; i < 15; i++) {
    if (await focused(page) === want) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab never reached ${want}; stuck at ${await focused(page)}`);
}

test('a keyboard reaches a section and comes back, without the walk-up', async ({ page }) => {
  await open(page);
  await tabTo(page, 'start-mouse');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__cave.mode === 'mouse');
  // The keyboard carries on from the tools, and the shortcuts open from there.
  await expect(page.locator('#t-shortcuts')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#t-shortcuts')).toHaveAttribute('aria-expanded', 'true');
  await tabTo(page, 'experience');
  await page.keyboard.press('Enter');
  await waitForPanel(page, 'experience', 60_000);
  // A cut, not a walk: the camera is at the wall the moment the section opens.
  expect((await page.evaluate(() => window.__cave.focus)).t).toBe(1);
  await expect(page.locator('#panel-title')).toBeFocused();
  await expect(page.locator('#panel-title')).toHaveText('Experience');
  await page.keyboard.press('Escape');
  await expect(page.locator('#panel')).toBeHidden();
  await expect(page.locator('.chip[data-section="experience"]')).toBeFocused();
});
