import { S } from '../state';
import { GUIDES } from './guides';
import { artCtx, baseCanvas, baseJob } from './layers';
import { ART_H, ART_W } from '../config';
import { paintedCanvas } from '../paint/painters';
import { engrave, fingerDots, line } from '../paint/pigment';
import { bakedJob, clamp, fbm, hash2, makeCanvas, mulberry, smooth, supportsFilter, vnoise } from '../util';
import { crackPath, rockHeight } from '../world/scene';

// Pigment: dabs that catch on the rock, thicken when slow, and run dry
export const TOOLS = {
  charcoal: { base: 4.2, catchLo: 0.32, catchHi: 0.62, flecks: 0.6 },
  ochre: { base: 7.5, catchLo: 0.18, catchHi: 0.55, flecks: 0.25 },
};
// Stamps: charcoal leaves speckled grains, a fingertip of ochre a blotch with a darker rim.
export const STAMP_N = 48;
export function makeStamp(tool, seed) {
  const c = makeCanvas(STAMP_N, STAMP_N), x = c.getContext('2d'), img = x.createImageData(STAMP_N, STAMP_N);
  for (let j = 0; j < STAMP_N; j++) for (let i = 0; i < STAMP_N; i++) {
    const dx = ((i + 0.5) / STAMP_N) * 2 - 1, dy = ((j + 0.5) / STAMP_N) * 2 - 1;
    const d = Math.hypot(dx, dy) * (0.9 + 0.22 * vnoise(Math.atan2(dy, dx) * 1.6 + 4, 0.5, seed));
    if (d >= 1) continue;
    const a = tool === 'charcoal'
      ? (1 - d * d * d) * (hash2(i, j, seed) < 0.62 - d * 0.3 ? 0.95 : 0.18) * (0.65 + 0.35 * vnoise(i * 0.35, j * 0.35, seed + 1))
      : smooth(1, 0.78, d) * (0.55 + 0.35 * fbm(i / 8, j / 8, 2, seed)) + 0.22 * smooth(0.5, 0.88, d) * smooth(1, 0.9, d);
    const k = (j * STAMP_N + i) * 4;
    img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = clamp(a, 0, 1) * 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}
export const STAMPS = { charcoal: [0, 1, 2, 3].map((k) => makeStamp('charcoal', 900 + k)), ochre: [0, 1, 2, 3].map((k) => makeStamp('ochre', 910 + k)) };
export const tintedStamps = new Map();
export function stampOf(tool, k, color) {
  const key = tool + k + color;
  let c = tintedStamps.get(key);
  if (!c) {
    c = makeCanvas(STAMP_N, STAMP_N);
    const x = c.getContext('2d');
    x.drawImage(STAMPS[tool][k], 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, STAMP_N, STAMP_N);
    tintedStamps.set(key, c);
  }
  return c;
}
// One touch of pigment. It catches on the bumps of the rock and thins as the stroke runs dry.
export function dab(ctx, ax, ay, r, color, load, seed, tool) {
  const T = TOOLS[tool], rr = mulberry(seed);
  const stick = 0.3 + 0.7 * smooth(T.catchLo, T.catchHi, rockHeight(ax, ay));
  const R = r * (0.85 + rr() * 0.35);
  ctx.globalAlpha = clamp(load * stick * (tool === 'charcoal' ? 0.5 + rr() * 0.3 : 0.38 + rr() * 0.22), 0, 1);
  ctx.drawImage(stampOf(tool, (rr() * 4) | 0, color), ax - R + (rr() - 0.5) * r * 0.5, ay - R + (rr() - 0.5) * r * 0.5, R * 2, R * 2);
  if (rr() < T.flecks) {
    ctx.globalAlpha = 0.5 * load; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(ax + (rr() - 0.5) * r * 2.4, ay + (rr() - 0.5) * r * 2.4, 0.6 + rr() * 1.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Visitor strokes. Each point stores [x, y, radius, load] so a stroke replays exactly;
// finished strokes are kept on their own layer.
export const strokesCanvas = makeCanvas(ART_W, ART_H), strokesCtx = strokesCanvas.getContext('2d');
export function renderStroke(ctx, s) { s.pts.forEach(([x, y, r, l], i) => dab(ctx, x, y, r, s.color, l, s.seed + i, s.tool)); }

// Marks older than the paintings (the base layer, under them), and the calcite veil
// grown over them since (on the paint layer, over them). Both are made once.
export const VEIL_S = 4, veilCanvas = makeCanvas(ART_W / VEIL_S, ART_H / VEIL_S);
{
  const ctx = baseCanvas.getContext('2d');
  const patch = (x, y, w, h, fn) => { const c = makeCanvas(w, h); fn(c.getContext('2d'), w, h); ctx.drawImage(c, x, y); };
  // Soot round the crack, so it reads as an opening from across the cave.
  ctx.save(); ctx.scale(2, 2);
  if (supportsFilter) ctx.filter = 'blur(5px)';
  ctx.strokeStyle = 'rgba(16,9,5,0.85)'; ctx.lineWidth = 9; ctx.stroke(crackPath);
  ctx.filter = 'none';
  ctx.strokeStyle = 'rgba(12,7,4,0.9)'; ctx.lineWidth = 2.5; ctx.stroke(crackPath);
  ctx.restore();
  S.baseDirty = true;
  // Older figures, faded and half painted over by later ones.
  for (const [kind, x, y, w, h, a, seed] of [['bison', 610, 395, 300, 175, 0.2, 61], ['horse', 960, 300, 170, 100, 0.16, 62], ['deer', 330, 250, 180, 140, 0.22, 63]] as [string, number, number, number, number, number, number][]) {
    baseJob(2, () => { ctx.globalAlpha = a; ctx.drawImage(paintedCanvas(kind, w, h, seed, { fade: 0.7, flakes: 4, pits: 0.15 }, 1), x, y); ctx.globalAlpha = 1; S.baseDirty = true; });
  }
  baseJob(2, () => {
  // Finger flutings: fingers drawn down through the soft film on the rock.
  const flute = (x, y, len, ang, n, seed) => {
    for (let f = 0; f < n; f++) {
      const pts = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([x + Math.cos(ang) * len * t + Math.sin(t * 5 + seed) * 6 - Math.sin(ang) * f * 9, y + Math.sin(ang) * len * t + Math.cos(ang) * f * 9]); }
      engrave(ctx, pts, { px: true, alpha: 0.28, width: 3.4, seed: seed + f });
    }
  };
  flute(330, 470, 130, 1.2, 4, 71);
  flute(1590, 360, 120, 1.9, 3, 72);
  // A mammoth scratched with a flint, long before anyone painted here.
  const mam = (pts) => pts.map(([u, v]) => [1490 + u * 190, 585 + v * 120]);
  for (const st of [[[0.02, 0.52], [0.12, 0.36], [0.4, 0.2], [0.6, 0.08], [0.7, 0.12], [0.8, 0.02], [0.9, 0.16], [0.95, 0.45], [0.93, 0.8], [0.98, 0.92]], [[0.14, 0.62], [0.45, 0.68], [0.72, 0.64]],
    [[0.18, 0.6], [0.17, 1.0]], [[0.3, 0.66], [0.31, 1.0]], [[0.62, 0.66], [0.6, 1.0]], [[0.74, 0.62], [0.76, 1.0]], [[0.86, 0.42], [0.76, 0.58], [0.68, 0.52]],
    [[0.3, 0.68], [0.29, 0.78]], [[0.4, 0.69], [0.39, 0.8]], [[0.5, 0.68], [0.5, 0.79]]]) engrave(ctx, mam(st), { px: true, alpha: 0.42, seed: 74 });
  // Red dots and a black sign, the kind found near cave entrances.
  patch(370, 380, 70, 50, (c) => fingerDots(c, [[0.2, 0.3, 5], [0.5, 0.25, 5], [0.8, 0.35, 5], [0.35, 0.7, 5], [0.65, 0.72, 5]], { col: 'red', seed: 81 }));
  patch(1370, 262, 46, 70, (c) => line(c, [[[0.5, 0.05], [0.5, 0.95]], [[0.5, 0.35], [0.85, 0.45]]], { w: 5, seed: 82 }));
  // The shapes waiting to be painted, scratched in first, as painters often did.
  for (const g of GUIDES) engrave(ctx, g.samples, { px: true, closed: true, alpha: 0.4, seed: 90 });
  S.baseDirty = true;
  });
}
bakedJob('veil', veilCanvas, 2, () => {
  const ctx = veilCanvas.getContext('2d'), w = veilCanvas.width, h = veilCanvas.height, img = ctx.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = i / w, v = j / h;
    const film = smooth(0.56, 0.78, fbm(u * 7 + 11, v * 3.5, 4, 501));
    const drip = smooth(0.62, 0.9, vnoise(u * 90, v * 2.2, 503)) * smooth(0.6, 0, v) * smooth(0.4, 0.75, fbm(u * 5, v * 2, 2, 505));
    const ax = i * VEIL_S, ay = j * VEIL_S;
    // The veil thins out round the shapes still to paint: those paintings will be fresh.
    let keep = 1;
    for (const g of GUIDES) keep = Math.min(keep, smooth(20, 110, Math.hypot(Math.max(g.x - ax, 0, ax - g.x - g.w), Math.max(g.y - ay, 0, ay - g.y - g.h))));
    const k = (j * w + i) * 4;
    img.data[k] = 236; img.data[k + 1] = 226; img.data[k + 2] = 210; img.data[k + 3] = clamp(film * 0.3 + drip * 0.22, 0, 0.45) * keep * 255;
  }
  ctx.putImageData(img, 0, 0);
}, () => markArt());

// Ask for part of the paint layer (veil + strokes) to be recomposited on the next frame.
export function markArt(x = 0, y = 0, w = ART_W, h = ART_H) {
  const r = [x - 1, y - 1, x + w + 1, y + h + 1];
  S.artRect = S.artRect ? [Math.min(S.artRect[0], r[0]), Math.min(S.artRect[1], r[1]), Math.max(S.artRect[2], r[2]), Math.max(S.artRect[3], r[3])] : r;
}
export function redrawArt(x0 = 0, y0 = 0, x1 = ART_W, y1 = ART_H) {
  x0 = clamp(Math.floor(x0), 0, ART_W); y0 = clamp(Math.floor(y0), 0, ART_H);
  x1 = clamp(Math.ceil(x1), 0, ART_W); y1 = clamp(Math.ceil(y1), 0, ART_H);
  const w = x1 - x0, h = y1 - y0;
  if (w <= 0 || h <= 0) return;
  artCtx.save();
  artCtx.beginPath(); artCtx.rect(x0, y0, w, h); artCtx.clip();
  artCtx.clearRect(x0, y0, w, h);
  artCtx.drawImage(veilCanvas, x0 / VEIL_S, y0 / VEIL_S, w / VEIL_S, h / VEIL_S, x0, y0, w, h);
  artCtx.drawImage(strokesCanvas, x0, y0, w, h, x0, y0, w, h);
  if (S.currentStroke) renderStroke(artCtx, S.currentStroke);
  artCtx.restore();
  S.artUploadPending = true;
}
