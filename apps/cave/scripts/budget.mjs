// Checks the built site against the budgets in docs/v1-plan.md:
//   JS on first load (gzip, not counting hand tracking)  ≤ 250 kB
//   everything before the intro is usable                ≤ 1.5 MB
// "First load" is what dist/index.html pulls in before anything is clicked: its scripts
// and everything they import statically, the stylesheet and the fonts it names. Rock,
// paintings and screens load after the intro is up, and hand tracking only once the
// camera is on; those are listed, not budgeted.
//
//   npm run build && npm run budget
import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const JS_BUDGET = 250_000, FIRST_BUDGET = 1_500_000;

const gz = async (f) => gzipSync(await readFile(f), { level: 9 }).length;
const kb = (n) => `${(n / 1000).toFixed(1)} kB`;
const html = await readFile(dist + 'index.html', 'utf8');
const refs = (re) => [...html.matchAll(re)].map((m) => path.join(dist, m[1]));

// Scripts, and what they import statically (not import(), which loads later).
const js = new Set();
const walk = async (f) => {
  if (js.has(f)) return;
  js.add(f);
  const code = await readFile(f, 'utf8');
  for (const m of code.matchAll(/(?:^|[;}\s])(?:import|export)\s*(?:[\w${},*\s]+from\s*)?["'](\.{1,2}\/[^"']+\.js)["']/g)) await walk(path.join(path.dirname(f), m[1]));
};
for (const f of refs(/<script[^>]+src="([^"]+)"/g)) await walk(f);
for (const f of refs(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) await walk(f);

const css = refs(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g);
const fonts = [];
for (const f of css) {
  for (const m of (await readFile(f, 'utf8')).matchAll(/url\((?!#|data:)["']?([^)"']+)["']?\)/g)) fonts.push(path.join(path.dirname(f), m[1]));
}

const rows = [];
let jsTotal = 0, first = await gz(dist + 'index.html');
rows.push(['index.html', first]);
for (const f of js) { const n = await gz(f); jsTotal += n; first += n; rows.push([path.relative(dist, f), n]); }
for (const f of css) { const n = await gz(f); first += n; rows.push([path.relative(dist, f), n]); }
for (const f of fonts) { const n = (await stat(f)).size; first += n; rows.push([path.relative(dist, f), n]); }

let later = 0;
const loaded = new Set([...js, ...css, ...fonts]);
for (const f of await readdir(dist + 'assets')) {
  const p = dist + 'assets/' + f;
  if (!loaded.has(p) && !f.endsWith('.map')) later += /\.(js|css|svg)$/.test(f) ? await gz(p) : (await stat(p)).size;
}
let tracking = 0;
for (const f of await readdir(dist + 'mediapipe')) tracking += /\.js$/.test(f) ? await gz(dist + 'mediapipe/' + f) : (await stat(dist + 'mediapipe/' + f)).size;

const width = Math.max(...rows.map(([n]) => n.length));
for (const [n, s] of rows) console.log(`  ${n.padEnd(width)}  ${kb(s).padStart(9)}`);
const line = (label, n, budget) => console.log(`${label.padEnd(44)} ${kb(n).padStart(10)}${budget ? `  of ${kb(budget)}  ${n <= budget ? 'ok' : 'OVER'}` : ''}`);
console.log('');
line('JS on first load (gzip)', jsTotal, JS_BUDGET);
line('Everything before the intro is usable', first, FIRST_BUDGET);
line('After the intro (rock, paintings, screens)', later);
line('Hand tracking, once the camera is on', tracking);
if (jsTotal > JS_BUDGET || first > FIRST_BUDGET) { console.error('\nOver budget.'); process.exit(1); }
