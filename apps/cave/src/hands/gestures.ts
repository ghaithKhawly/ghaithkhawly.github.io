// Gesture analysis + coaching
export const FINGERS = { thumb: [1, 2, 3, 4], index: [5, 6, 7, 8], middle: [9, 10, 11, 12], ring: [13, 14, 15, 16], pinky: [17, 18, 19, 20] };

// Thresholds, tuned on real hands: 150 people per gesture from the HaGRID dataset, run
// through the same hand model the site uses, and (the wolf, which HaGRID lacks) on the
// site's wolf pose varied the way real hands vary. See docs/m3-gestures.md. Each has a value
// for entering a shape and a looser one for staying in it, so a shape that's being held
// doesn't flicker out when one measurement wavers.
export const T = {
  straight: [0.8, 0.74],        // a finger counts as extended above this straightness
  reach: [1.12, 1.06],          // ...and when its tip is this much further from the wrist than its knuckle
  thumbOut: [0.65, 0.55],       // thumb tip to middle knuckle, in hand lengths: out for the wolf's ear
  thumbIn: [0.6, 0.7],          // ...and folded for the hare (real hares: under 0.43; "three": over 0.78)
  spread: [0.32, 0.27],         // average gap between fingertips, open palm
  together: [0.8, 0.9],         // widest gap between the wolf's three fingertips
  sideways: [1.1, 0.9],         // the wolf points sideways: |dx| over |dy|
  up: [0.9, 0.7],               // the palm points up: |dy| over |dx|
};
const th = (k: keyof typeof T, held: boolean) => T[k][held ? 1 : 0];

// N: 21 points in mirrored, normalized camera space. aspect: camera width / height.
// held: the shape currently held, if any; its checks use the looser thresholds.
export function analyzeHand(N, aspect, held: string | null = null) {
  const P = N.map((p) => ({ x: p.x * aspect, y: p.y }));
  const d = (a, b) => Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y);
  const scale = d(0, 9) || 1e-3;
  const straight = (f) => { const [a, b, c, e] = FINGERS[f]; return d(a, e) / (d(a, b) + d(b, c) + d(c, e) || 1e-6); };
  const ext: Record<string, boolean> = {}, str: Record<string, number> = {};
  for (const f of ['index', 'middle', 'ring', 'pinky']) {
    const [, p, , t] = FINGERS[f];
    str[f] = straight(f);
    // A finger the held shape needs extended keeps the looser test; one it needs folded the stricter.
    const loose = (held === 'wolf' && f !== 'pinky') || held === 'palm' || (held === 'rabbit' && (f === 'index' || f === 'middle'));
    const looseFold = held === 'rabbit' && (f === 'ring' || f === 'pinky');
    const s = looseFold ? T.straight[0] + 0.06 : th('straight', loose), r = looseFold ? T.reach[0] + 0.06 : th('reach', loose);
    ext[f] = str[f] > s && d(0, t) > d(0, p) * r;
  }
  const thumb = d(4, 9) / scale;
  const thumbOut = thumb > th('thumbOut', held === 'wolf') && d(4, 5) > 0.45 * scale;
  const thumbIn = thumb < th('thumbIn', held === 'rabbit');
  const dir = { x: P[12].x - P[0].x, y: P[12].y - P[0].y };
  const up = dir.y < 0 && Math.abs(dir.y) > Math.abs(dir.x) * th('up', held === 'palm');
  const sideways = Math.abs(dir.x) > Math.abs(dir.y) * th('sideways', held === 'wolf');
  const tipsTogether = Math.max(d(8, 12), d(12, 16), d(8, 16)) < th('together', held === 'wolf') * scale;
  const spread = (d(8, 12) + d(12, 16) + d(16, 20)) / 3 / scale;
  let label = 'hand';
  // An open palm: four fingers up and spread. The thumb is free: most people keep it close.
  if (ext.index && ext.middle && ext.ring && ext.pinky && up && spread > th('spread', held === 'palm')) label = 'palm';
  else if (ext.index && ext.middle && ext.ring && thumbOut && sideways && tipsTogether) label = 'wolf';
  else if (ext.index && ext.middle && !ext.ring && !ext.pinky && thumbIn) label = 'rabbit';
  return { label, scale, ext, str, thumb, thumbOut, thumbIn, up, sideways, tipsTogether, spread, N };
}
// Which shape is the hand closest to, and what single change would get it there?
export function coach(a) {
  const checks = {
    wolf: [[a.ext.index && a.ext.middle && a.ext.ring, 'stretch three fingers out'], [a.thumbOut, 'lift your thumb like an ear'], [a.sideways, 'turn your hand sideways'], [a.tipsTogether, 'keep those three fingers together']],
    rabbit: [[a.ext.index && a.ext.middle, 'raise two fingers'], [!a.ext.ring && !a.ext.pinky, 'fold your ring and little fingers'], [a.thumbIn, 'fold your thumb over them']],
    palm: [[a.ext.index && a.ext.middle && a.ext.ring && a.ext.pinky, 'open all your fingers'], [a.up, 'point your fingers up'], [a.spread > T.spread[0], 'spread your fingers']],
  };
  let best = null;
  for (const [name, cs] of Object.entries(checks)) {
    const ok = cs.filter((c) => c[0]).length / cs.length;
    if (!best || ok > best.ok) best = { name, ok, miss: cs.find((c) => !c[0]) };
  }
  return best && best.ok >= 0.5 && best.miss ? best : null;
}
