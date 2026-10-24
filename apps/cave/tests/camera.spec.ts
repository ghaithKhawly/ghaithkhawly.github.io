import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { test, expect, open, waitForPanel } from './cave';

// A fake webcam that shows a face and a hand making the rabbit shape. Chromium wants a
// raw .y4m file; it is made from the PNG with ffmpeg, so the repo only holds the PNG.
const here = path.dirname(fileURLToPath(import.meta.url));
const png = path.join(here, 'fixtures', 'fake_rabbit.png');
const y4m = path.join(here, '..', 'test-results', 'fake_rabbit.y4m');
let hasFfmpeg = true;
try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch { hasFfmpeg = false; }
if (hasFfmpeg && !existsSync(y4m)) {
  mkdirSync(path.dirname(y4m), { recursive: true });
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-loop', '1', '-i', png, '-t', '1', '-r', '30', '-vf', 'scale=640:480', '-pix_fmt', 'yuv420p', y4m]);
}

test.use({
  permissions: ['camera'],
  launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${y4m}`] },
});

test('a rabbit shadow opens About', async ({ page }) => {
  test.skip(!hasFfmpeg, 'needs ffmpeg to make the fake webcam video');
  // The ghost hand paints the hare before About opens: slow at a software frame a second.
  test.setTimeout(600_000);
  const fetched: string[] = [];
  page.on('request', (r) => fetched.push(r.url()));
  await open(page);
  await page.click('#start-cam');
  await page.waitForFunction(() => window.__cave.mode === 'camera', null, { timeout: 180_000 });
  // Hand tracking comes from the site's own copy, not the CDN.
  expect(fetched.filter((u) => /jsdelivr|googleapis/.test(u))).toEqual([]);
  expect(fetched.some((u) => u.endsWith('/mediapipe/hand_landmarker.task.gz'))).toBe(true);
  await waitForPanel(page, 'about', 400_000);
});
