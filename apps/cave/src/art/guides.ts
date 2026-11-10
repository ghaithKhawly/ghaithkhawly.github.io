import { late } from '../late';
import type { Guide } from '../types';
import { S } from '../state';
import { PIG, line, shapePath } from '../paint/pigment';
import { smooth } from '../util';

// Tracing guides (painting mode): dotted outlines waiting to be painted in
// Stone-age shapes: an animal is outlined in charcoal and rubbed in with ochre;
// the hand is a stencil, with ochre blown round it.
export const GUIDES: Guide[] = [
  { id: 'wolf', section: 'experience', title: 'the wolf', x: 625, y: 585, w: 290, h: 165, tool: 'charcoal', line: PIG.char, fillCol: 'red', eye: [0.89, 0.29],
    shade: (u, v) => smooth(0.4, 0.15, v) * 0.35 + smooth(0.62, 0.8, v) * 0.25,
    pts: [[1.0, 0.38], [0.92, 0.3], [0.88, 0.2], [0.87, 0.12], [0.86, 0.0], [0.83, 0.12], [0.79, 0.02], [0.77, 0.15], [0.72, 0.22], [0.6, 0.26], [0.42, 0.27], [0.26, 0.28], [0.12, 0.38], [0.05, 0.55], [0.04, 0.72], [0.09, 0.74], [0.14, 0.6], [0.2, 0.48], [0.25, 0.62], [0.27, 0.8], [0.25, 0.98], [0.31, 0.98], [0.33, 0.82], [0.36, 0.66], [0.46, 0.63], [0.58, 0.61], [0.62, 0.66], [0.63, 0.98], [0.69, 0.98], [0.7, 0.66], [0.76, 0.56], [0.84, 0.47], [0.93, 0.45]],
    details: [[[0.98, 0.41], [0.9, 0.42]], [[0.855, 0.06], [0.85, 0.17]], [[0.66, 0.3], [0.69, 0.38]], [[0.71, 0.27], [0.74, 0.35]], [[0.75, 0.26], [0.78, 0.33]], [[0.3, 0.52], [0.27, 0.64]]] },
  { id: 'rabbit', section: 'about', title: 'the hare', x: 1125, y: 590, w: 180, h: 175, tool: 'charcoal', line: PIG.char, fillCol: 'yellow', eye: [0.86, 0.4],
    shade: (u, v) => smooth(0.5, 0.2, v) * 0.3 + smooth(0.75, 0.95, v) * 0.2,
    pts: [[0.99, 0.46], [0.92, 0.34], [0.84, 0.3], [0.8, 0.12], [0.72, 0.0], [0.7, 0.1], [0.74, 0.3], [0.66, 0.16], [0.56, 0.04], [0.56, 0.16], [0.64, 0.34], [0.5, 0.38], [0.3, 0.42], [0.14, 0.56], [0.04, 0.6], [0.06, 0.72], [0.14, 0.86], [0.2, 0.96], [0.48, 0.98], [0.5, 0.9], [0.62, 0.86], [0.7, 0.98], [0.8, 0.97], [0.8, 0.72], [0.86, 0.6], [0.95, 0.56]],
    details: [[[0.765, 0.08], [0.76, 0.26]], [[0.3, 0.6], [0.24, 0.78], [0.36, 0.9]]] },
  { id: 'hand', section: 'contact', title: 'the hand', x: 1360, y: 590, w: 140, h: 180, tool: 'ochre', line: PIG.deep, stencil: true,
    pts: [[0.28, 1.0], [0.14, 0.72], [0.0, 0.54], [0.02, 0.44], [0.12, 0.48], [0.22, 0.6], [0.22, 0.32], [0.24, 0.06], [0.32, 0.05], [0.34, 0.33], [0.38, 0.28], [0.42, 0.0], [0.5, 0.0], [0.52, 0.29], [0.56, 0.32], [0.6, 0.06], [0.68, 0.08], [0.68, 0.38], [0.72, 0.44], [0.78, 0.22], [0.86, 0.24], [0.84, 0.55], [0.82, 0.8], [0.72, 1.0]] },
];
export const SECTION_NAME = { experience: 'Experience', about: 'About', contact: 'Contact' };
export const TRACE_TOL = 22;
for (const g of GUIDES) {
  // Resample the closed outline evenly so coverage is measured fairly along its length.
  const raw = g.pts.map(([u, v]) => [g.x + u * g.w, g.y + v * g.h]);
  raw.push(raw[0]);
  let total = 0;
  const segs = [];
  for (let i = 1; i < raw.length; i++) { const L = Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]); segs.push(L); total += L; }
  const n = 80, samples = [];
  for (let k = 0; k < n; k++) {
    let dist = (k / n) * total, i = 0;
    while (i < segs.length - 1 && dist > segs[i]) { dist -= segs[i]; i++; }
    const t = Math.min(1, dist / segs[i]);
    samples.push([raw[i][0] + (raw[i + 1][0] - raw[i][0]) * t, raw[i][1] + (raw[i + 1][1] - raw[i][1]) * t]);
  }
  Object.assign(g, { samples, covered: new Uint8Array(n), near: 0, inBox: 0, done: false, hover: 0, artPath: shapePath(g.pts, g.w, g.h, g.x, g.y), localPath: shapePath(g.pts, g.w, g.h) });
}
export function guideAt(ax, ay, pad = 30) { return GUIDES.find((g) => ax > g.x - pad && ax < g.x + g.w + pad && ay > g.y - pad && ay < g.y + g.h + pad) || null; }
export function guideProgress(g) { let c = 0; for (const v of g.covered) c += v; return c / g.covered.length; }
export function traceGuides(ax, ay) {
  for (const g of GUIDES) {
    if (g.done || ax < g.x - 40 || ax > g.x + g.w + 40 || ay < g.y - 40 || ay > g.y + g.h + 40) continue;
    g.inBox++;
    let nearAny = false;
    g.samples.forEach(([sx, sy], i) => {
      const d = Math.hypot(sx - ax, sy - ay);
      if (d < TRACE_TOL) g.covered[i] = 1;
      if (d < TRACE_TOL * 1.8) nearAny = true;
    });
    if (nearAny) g.near++;
  }
}
export function checkGuides(final) {
  for (const g of GUIDES) {
    if (g.done || !g.inBox) continue;
    const cov = guideProgress(g), prec = g.near / g.inBox;
    if ((final && cov >= 0.68 && prec >= 0.55) || cov >= 0.9) late.startFinish(g);
  }
}
