// Paints everything the pigment engine makes at load (the paintings, the base layer of
// handprints and older figures, the calcite veil, the chamber paintings, the finished
// art behind each shape to trace) once, in a browser, and saves each canvas to
// src/assets/baked/<key>.webp. Visitors then load images instead of running the engine.
//
// Run it after changing anything those are made from (paint/, art/, the guides, seeds):
//   npm run bake
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = fileURLToPath(new URL('../src/assets/baked/', import.meta.url));

const server = await createServer({ root, logLevel: 'warn', server: { host: '127.0.0.1', port: 5199 } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${server.resolvedUrls.local[0]}?bake`);
  await page.waitForFunction(() => window.__cave && window.__cave.pending === 0, null, { timeout: 300_000 });
  if (errors.length) throw new Error(`The page failed while painting:\n${errors.join('\n')}`);
  const images = await page.evaluate(() => window.__cave.bakeExport());

  await mkdir(out, { recursive: true });
  for (const f of await readdir(out)) if (f.endsWith('.webp')) await rm(out + f);
  let total = 0;
  for (const [key, dataUrl] of Object.entries(images)) {
    const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
    await writeFile(`${out}${key}.webp`, bytes);
    total += bytes.length;
  }
  console.log(`Baked ${Object.keys(images).length} images (${Math.round(total / 1024)} KB) into src/assets/baked/`);
} finally {
  await browser.close();
  await server.close();
}
