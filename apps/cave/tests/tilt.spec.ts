import { devices } from '@playwright/test';
import { test, expect, open, startPainting } from './cave';

// Tilting a phone leans the view, the way moving your head does with the camera. The
// phone reports its tilt fixed to the phone, so turned sideways the axes swap; both ways
// round, tilting to the right should lean right.
test.use({ ...devices['Pixel 7'] });

const tilt = (page, beta: number, gamma: number) => page.evaluate(([b, g]) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: b, gamma: g })), [beta, gamma]);
const eyeX = (page) => page.evaluate(() => window.__cave.stats.eye.x as number);

test('tilting the phone leans the view, upright and sideways', async ({ page, context }) => {
  await open(page);
  await startPainting(page);

  // Upright: held at 40° from flat is straight ahead; rolling it right leans right.
  await tilt(page, 40, 0);
  await tilt(page, 40, 15);
  await page.waitForFunction(() => window.__cave.stats.eye.x > 0.4, null, { timeout: 60_000 });
  await tilt(page, 40, -15);
  await page.waitForFunction(() => window.__cave.stats.eye.x < -0.4, null, { timeout: 60_000 });

  // Turned sideways (screen rotated 90°): rolling right is now a change in beta.
  const cdp = await context.newCDPSession(page);
  const vp = page.viewportSize();
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.height, height: vp.width, deviceScaleFactor: 2.625, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
  await page.waitForFunction(() => (screen.orientation?.angle ?? 0) === 90);
  await page.evaluate(() => screen.orientation.dispatchEvent(new Event('change')));   // the override doesn't fire it
  await tilt(page, 0, -40);
  await tilt(page, 15, -40);
  await page.waitForFunction(() => window.__cave.stats.eye.x > 0.4, null, { timeout: 60_000 });
  // ...and changing gamma alone (tipping it toward you) doesn't lean sideways.
  await tilt(page, 0, -40);
  await page.waitForFunction(() => Math.abs(window.__cave.stats.eye.x) < 0.15, null, { timeout: 60_000 });
  await tilt(page, 0, -25);
  await page.waitForTimeout(3_000);
  expect(Math.abs(await eyeX(page))).toBeLessThan(0.15);
});
