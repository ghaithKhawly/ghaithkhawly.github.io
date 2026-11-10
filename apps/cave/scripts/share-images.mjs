// Makes the pictures other sites show for this one: public/og.jpg (the link preview, a
// still of the cave) and the favicon's PNG sizes, from public/favicon.svg.
//
// Run it after changing how the cave looks at the start, or the icon:
//   npm run share-images
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = `${root}public/`;

const server = await createServer({ root, logLevel: 'warn', server: { host: '127.0.0.1', port: 5198 } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  // The link preview: the cave as it opens, with the name, and none of the controls.
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  await page.goto(`${server.resolvedUrls.local[0]}?start=mouse&fixed`);
  await page.waitForFunction(() => window.__cave && window.__cave.pending === 0 && window.__cave.mode === 'mouse', null, { timeout: 300_000 });
  // Previews are often shown small, so the name is set large enough to read there.
  await page.addStyleTag({ content: '#tools, #finds, #gesture, #chips, #toast, #hud-status, .skip { display: none !important; } #hud { left: 44px; top: 34px; } #hud .who { font-size: 76px; line-height: 1; } #hud .role { font-size: 30px; margin-top: 8px; }' });
  await page.waitForTimeout(8000);   // the fire comes up to full
  await page.screenshot({ path: `${pub}og.jpg`, type: 'jpeg', quality: 86, scale: 'css', timeout: 300_000 });   // a software renderer at 2x is slow
  await page.close();   // stop drawing the cave, which would starve the next pages

  // The favicon at the sizes browsers and phones ask for. iOS rounds the corners itself
  // and fills transparency with black, so its icon is square and opaque.
  const svg = await readFile(`${pub}favicon.svg`, 'utf8');
  for (const [name, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180]]) {
    const p = await browser.newPage({ viewport: { width: size, height: size } });
    const art = size === 180 ? svg.replace('rx="14"', 'rx="0"') : svg;
    await p.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${art}`);
    await p.screenshot({ path: `${pub}${name}`, omitBackground: true });
  }
  console.log('Wrote public/og.jpg, public/favicon-32.png and public/apple-touch-icon.png');
} finally {
  await browser.close();
  await server.close();
}
