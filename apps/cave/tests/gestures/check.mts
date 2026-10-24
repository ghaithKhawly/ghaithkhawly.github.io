// Scores the gesture classifier on real hands, without a browser. Fails if recognition
// drops below what it was tuned to. Run: npm run test:gestures
//
// Real hands: 2,542 photos from HaGRID (150 people per gesture), run through the same
// hand model the site uses; the landmarks are in tests/fixtures/hagrid-hands.json.gz.
// The wolf isn't in HaGRID, so it's scored on the site's own wolf pose, varied the way
// real hands and the tracker vary it.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { analyzeHand } from '../../src/hands/gestures.ts';
import { POSES } from '../../src/hands/poses.ts';

const hands: { g: string; a: number; h: number[][][] }[] = JSON.parse(gunzipSync(readFileSync(new URL('../fixtures/hagrid-hands.json.gz', import.meta.url))).toString());

// What each HaGRID gesture should be read as. Gestures not listed must never be a shape;
// the loose ones may be a shape or a plain hand.
const WANT: Record<string, string> = { palm: 'palm', peace: 'rabbit', two_up: 'rabbit' };
const LOOSE: Record<string, string[]> = { stop: ['palm', 'hand'], stop_inverted: ['palm', 'hand'], four: ['palm', 'hand'], peace_inverted: ['rabbit', 'hand'], two_up_inverted: ['rabbit', 'hand'] };
const MIN_HIT = 0.93, MAX_FALSE = 0.03, MIN_WOLF = 0.9;

const counts: Record<string, Record<string, number>> = {};
for (const { g, a, h } of hands) {
  // The person's gesturing hand is the biggest one in the frame. The site mirrors x.
  const N = h.map((pts) => pts.map(([x, y]) => ({ x: 1 - x, y }))).sort((p, q) => Math.hypot(q[0].x - q[9].x, q[0].y - q[9].y) - Math.hypot(p[0].x - p[9].x, p[0].y - p[9].y))[0];
  const label = analyzeHand(N, a).label;
  (counts[g] ||= {})[label] = (counts[g][label] || 0) + 1;
}

const failures: string[] = [];
let wrong = 0, negatives = 0;
for (const [g, c] of Object.entries(counts)) {
  const n = Object.values(c).reduce((x, y) => x + y, 0);
  if (WANT[g]) {
    const hit = (c[WANT[g]] || 0) / n;
    console.log(`${g.padEnd(16)} read as ${WANT[g]}: ${(hit * 100).toFixed(0)}%`);
    if (hit < MIN_HIT) failures.push(`${g}: ${(hit * 100).toFixed(0)}% read as ${WANT[g]}, want ${MIN_HIT * 100}%`);
  } else if (!LOOSE[g]) {
    const bad = n - (c.hand || 0);
    wrong += bad; negatives += n;
  }
}
const falseRate = wrong / negatives;
console.log(`other gestures read as a shape: ${wrong} of ${negatives} (${(falseRate * 100).toFixed(1)}%)`);
if (falseRate > MAX_FALSE) failures.push(`other gestures read as a shape ${(falseRate * 100).toFixed(1)}% of the time, want at most ${MAX_FALSE * 100}%`);

// The wolf: rotation, finger curl and gaps, thumb angle and tracker noise, at the level
// real hands show (the hare and palm score 98-100% on the same variation).
let seed = 3;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
function vary(pose: number[][]) {
  const rot = gauss() * 0.3, s = 0.09 + rnd() * 0.06, curl = gauss() * 0.12, gap = gauss() * 0.08, thumbA = gauss() * 0.3;
  const pts = pose.map(([x, y], i) => {
    let px = x, py = y;
    if (i >= 5 && i <= 16) { const k = (i - 5) % 4; px -= curl * k * 0.25; py += gap * (Math.floor((i - 5) / 4) - 1) * (k / 3); }
    if (i >= 2 && i <= 4) { const t = (thumbA * (i - 1)) / 3, dx = px - pose[1][0], dy = py - pose[1][1]; px = pose[1][0] + dx * Math.cos(t) - dy * Math.sin(t); py = pose[1][1] + dx * Math.sin(t) + dy * Math.cos(t); }
    return [px + gauss() * 0.025, py + gauss() * 0.025];
  });
  const c = Math.cos(rot), sn = Math.sin(rot);
  return pts.map(([x, y]) => ({ x: 0.5 + ((x * c - y * sn) * s) / (4 / 3), y: 0.5 + (x * sn + y * c) * s }));
}
let wolves = 0;
for (let i = 0; i < 1000; i++) if (analyzeHand(vary(POSES.wolf), 4 / 3).label === 'wolf') wolves++;
console.log(`wolf, varied: ${(wolves / 10).toFixed(0)}%`);
if (wolves / 1000 < MIN_WOLF) failures.push(`wolf: ${(wolves / 10).toFixed(0)}%, want ${MIN_WOLF * 100}%`);

if (failures.length) { console.error(`\nGesture check failed:\n  ${failures.join('\n  ')}`); process.exit(1); }
console.log('\nGesture check passed.');
