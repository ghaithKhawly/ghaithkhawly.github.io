

// Gesture analysis + coaching
export const FINGERS = { thumb: [1, 2, 3, 4], index: [5, 6, 7, 8], middle: [9, 10, 11, 12], ring: [13, 14, 15, 16], pinky: [17, 18, 19, 20] };
// N: 21 points in mirrored, normalized camera space. aspect: camera width / height.
export function analyzeHand(N, aspect) {
  const P = N.map((p) => ({ x: p.x * aspect, y: p.y }));
  const d = (a, b) => Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y);
  const scale = d(0, 9) || 1e-3;
  const straight = (f) => { const [a, b, c, e] = FINGERS[f]; return d(a, e) / (d(a, b) + d(b, c) + d(c, e) || 1e-6); };
  const ext: Record<string, boolean> = {}, str: Record<string, number> = {};
  for (const f of ['index', 'middle', 'ring', 'pinky']) {
    const [, p, , t] = FINGERS[f];
    str[f] = straight(f);
    ext[f] = str[f] > 0.8 && d(0, t) > d(0, p) * 1.12;
  }
  const thumbOut = d(4, 9) > 0.85 * scale && d(4, 5) > 0.45 * scale;
  const dir = { x: P[12].x - P[0].x, y: P[12].y - P[0].y };
  const up = dir.y < 0 && Math.abs(dir.y) > Math.abs(dir.x) * 0.9;
  const sideways = Math.abs(dir.x) > Math.abs(dir.y) * 1.1;
  const tipsTogether = Math.max(d(8, 12), d(12, 16), d(8, 16)) < 0.62 * scale;
  const spread = (d(8, 12) + d(12, 16) + d(16, 20)) / 3 / scale;
  let label = 'hand';
  if (ext.index && ext.middle && ext.ring && ext.pinky && thumbOut && up && spread > 0.3) label = 'palm';
  else if (ext.index && ext.middle && ext.ring && thumbOut && sideways && tipsTogether) label = 'wolf';
  else if (ext.index && ext.middle && !ext.ring && !ext.pinky) label = 'rabbit';
  return { label, scale, ext, str, thumbOut, up, sideways, tipsTogether, spread, N };
}
// Which shape is the hand closest to, and what single change would get it there?
export function coach(a) {
  const checks = {
    wolf: [[a.ext.index && a.ext.middle && a.ext.ring, 'stretch three fingers out'], [a.thumbOut, 'lift your thumb like an ear'], [a.sideways, 'turn your hand sideways'], [a.tipsTogether, 'keep those three fingers together']],
    rabbit: [[a.ext.index && a.ext.middle, 'raise two fingers'], [!a.ext.ring && !a.ext.pinky, 'fold your ring and little fingers']],
    palm: [[a.ext.index && a.ext.middle && a.ext.ring && a.ext.pinky, 'open all your fingers'], [a.thumbOut, 'open your thumb'], [a.up, 'point your fingers up'], [a.spread > 0.3, 'spread your fingers']],
  };
  let best = null;
  for (const [name, cs] of Object.entries(checks)) {
    const ok = cs.filter((c) => c[0]).length / cs.length;
    if (!best || ok > best.ok) best = { name, ok, miss: cs.find((c) => !c[0]) };
  }
  return best && best.ok >= 0.5 && best.miss ? best : null;
}
