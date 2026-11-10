// Takes a picture of every state of the built site, at the sizes people use, into
// frames/ (not committed): the intro, the cave, the shortcuts, each section, each project,
// the plain page and the 404 page. For looking the whole site over after a change.
//
//   npm run build && npm run frames            # everything, at every size
//   npm run frames -- phone desk               # only those sizes
//
// Sizes: desk (1440×900), small (1366×650), large (1920×1080), phone (390×844), land
// (844×390). With a GPU this takes a few minutes; in a software renderer, most of an hour.
import { preview } from 'vite';
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}frames/`;
const SIZES = {
  desk: { viewport: { width: 1440, height: 900 } },
  small: { viewport: { width: 1366, height: 650 } },
  large: { viewport: { width: 1920, height: 1080 } },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  land: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const SECTIONS = ['experience', 'about', 'contact', 'education', 'certs', 'languages'];
const want = process.argv.slice(2).filter((a) => a in SIZES);
const sizes = want.length ? want : Object.keys(SIZES);

await mkdir(out, { recursive: true });
const server = await preview({ root, logLevel: 'warn', preview: { host: '127.0.0.1', port: 4179, strictPort: true } });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const shot = async (page, name, opts = {}) => { await page.screenshot({ path: `${out}${name}.png`, timeout: 300_000, ...opts }); console.log(name); };
const ready = (page) => page.waitForFunction(() => window.__cave && window.__cave.pending === 0, null, { timeout: 300_000 });

try {
  for (const size of sizes) {
    const opts = SIZES[size], press = (page, sel) => (opts.hasTouch ? page.tap(sel) : page.click(sel));
    // ?fixed: no dropping the resolution because this machine is slow.
    const cave = `${url}?fixed${opts.isMobile ? '&tier=mid' : ''}`;

    // As it opens, with everything moving.
    let ctx = await browser.newContext(opts), page = await ctx.newPage();
    await page.goto(cave); await ready(page);
    await shot(page, `${size}-01-intro`);
    await press(page, '#start-mouse');
    await page.waitForFunction(() => window.__cave.mode === 'mouse');
    await page.waitForTimeout(12_000);   // the fire comes up
    await shot(page, `${size}-02-cave`);
    await press(page, '#t-shortcuts');
    await page.waitForTimeout(1000);
    await shot(page, `${size}-03-shortcuts`);
    await ctx.close();

    // Each section and project. With "reduce motion" on, so nothing has to be waited for.
    ctx = await browser.newContext({ ...opts, reducedMotion: 'reduce' }); page = await ctx.newPage();
    await page.goto(cave); await ready(page);
    await press(page, '#start-mouse');
    await page.waitForFunction(() => window.__cave.mode === 'mouse');
    const projects = await page.locator('.chip[data-project]').evaluateAll((els) => els.map((el) => el.dataset.project));
    let n = 10;
    for (const [kind, id] of [...SECTIONS.map((s) => ['section', s]), ...projects.map((p) => ['project', p])]) {
      if (await page.isHidden('#chips')) await press(page, '#t-shortcuts');
      await press(page, `.chip[data-${kind}="${id}"]`);
      await page.waitForFunction((k) => window.__cave.panel === k, kind === 'project' ? 'project' : id, { timeout: 300_000 });
      if (kind === 'project') await page.waitForFunction(() => window.__cave.screen?.shown, null, { timeout: 300_000 });
      await page.waitForTimeout(3000);
      await shot(page, `${size}-${n++}-${id}`);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.__cave.panel === null && window.__cave.stepOut === null, null, { timeout: 300_000 });
    }
    await ctx.close();

    // The plain page, whole, and the 404 page.
    ctx = await browser.newContext(opts); page = await ctx.newPage();
    await page.goto(`${url}?flat`);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 600) { await page.evaluate((to) => window.scrollTo(0, to), y); await page.waitForTimeout(100); }   // load every picture
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForLoadState('networkidle');
    await shot(page, `${size}-40-plain-page`, { fullPage: true });
    await page.goto(`${url}404.html`);
    await shot(page, `${size}-41-404`);
    await ctx.close();
  }
  console.log(`\nFrames are in ${out}`);
} finally {
  await browser.close();
  await new Promise((done) => server.httpServer.close(done));
}
