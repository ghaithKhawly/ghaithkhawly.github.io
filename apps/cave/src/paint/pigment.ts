import type { PigmentOpts } from '../types';
import { clamp, fbm, hash2, makeCanvas, mulberry, smooth, vnoise } from '../util';

// Paintings
export const PIG = { red: 'rgb(150,52,31)', deep: 'rgb(108,36,23)', yellow: 'rgb(196,136,58)', char: 'rgb(32,25,22)' };
// Each pigment as [light, dark]; washes and lines shade between the two.
export const OCHRE = {
  red: [[178, 72, 42], [108, 34, 20]],
  brown: [[142, 76, 46], [78, 38, 24]],
  yellow: [[214, 156, 76], [146, 88, 36]],
  black: [[52, 41, 35], [16, 12, 10]],
};

export function shapePath(pts, w, h, ox = 0, oy = 0) {
  const P = pts.map(([x, y]) => [ox + x * w, oy + y * h]);
  const n = P.length;
  const path = new Path2D();
  path.moveTo((P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2);
  for (let i = 1; i <= n; i++) {
    const p = P[i % n], q = P[(i + 1) % n];
    path.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  path.closePath();
  return path;
}
export const jit = (pts, r, a) => pts.map(([x, y]) => [x + (r() - 0.5) * a, y + (r() - 0.5) * a]);
export const fillShape = (ctx, pts, w, h) => ctx.fill(shapePath(pts, w, h));
export const seedOf = (r) => (r() * 9973) | 0;

// ---------------------------------------------------------------------------
// Stone-age pigment. Paintings are built from the marks cave painters made:
// ochre rubbed or blown into the rock, charcoal contours that swell and taper,
// finger dots, and lines scratched with a flint. Rendered once, per pixel.
// ---------------------------------------------------------------------------
// Pixels per paint-layer pixel for whatever is being painted right now. Paintings are
// rendered denser than the wall's paint layer so they stay crisp up close; callers
// always work in paint-layer pixels.
export let RES = 1;
export function atRes(k, fn) { const prev = RES; RES = k; try { return fn(); } finally { RES = prev; } }
// Smooth points about 1 px apart through control points (scaled by w, h).
export function curve(pts, w, h, closed = false) {
  const P = pts.map(([x, y]) => [x * w, y * h]);
  const n = P.length, out = [];
  const at = (i) => (closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const steps = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1])));
    for (let k = 0; k < steps; k++) {
      const t = k / steps, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(P[n - 1]);
  return out;
}
// The alpha of a drawing, as floats.
export function maskOf(w, h, draw) {
  const c = makeCanvas(w, h), x = c.getContext('2d');
  x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
  x.scale(RES, RES);
  draw(x);
  const d = x.getImageData(0, 0, w, h).data, m = new Float32Array(w * h);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] / 255;
  return m;
}
// Three box blurs make a gaussian; done in JS so it works without canvas filters.
export function blurMask(m, w, h, r) {
  r = Math.max(1, Math.round(r));
  const a = Float32Array.from(m), b = new Float32Array(m.length), k = 1 / (2 * r + 1);
  for (let pass = 0; pass < 3; pass++) {
    for (let j = 0; j < h; j++) {
      const row = j * w;
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += a[row + clamp(i, 0, w - 1)];
      for (let i = 0; i < w; i++) { b[row + i] = acc * k; acc += a[row + Math.min(w - 1, i + r + 1)] - a[row + Math.max(0, i - r)]; }
    }
    for (let i = 0; i < w; i++) {
      let acc = 0;
      for (let j = -r; j <= r; j++) acc += b[clamp(j, 0, h - 1) * w + i];
      for (let j = 0; j < h; j++) { a[j * w + i] = acc * k; acc += b[Math.min(h - 1, j + r + 1) * w + i] - b[Math.max(0, j - r) * w + i]; }
    }
  }
  return a;
}
export function blit(ctx, img) { const t = makeCanvas(img.width, img.height); t.getContext('2d').putImageData(img, 0, 0); ctx.drawImage(t, 0, 0); }
export const tone = (out, k, col, dk, al) => {
  const [L, D] = col;
  out[k] = L[0] + (D[0] - L[0]) * dk; out[k + 1] = L[1] + (D[1] - L[1]) * dk; out[k + 2] = L[2] + (D[2] - L[2]) * dk;
  out[k + 3] = clamp(al, 0, 1) * 255;
};

// Ochre rubbed into the rock: blotchy, darker in a band inside the contour (and
// wherever `shade` models the form), feathered at the edge. `spray` adds the fine
// halo of pigment blown through a tube.
export function wash(ctx, draw, o: PigmentOpts = {}) {
  const { width: w, height: h } = ctx.canvas;
  const col = OCHRE[o.col || 'red'], seed = o.seed || 1;
  const A = blurMask(maskOf(w, h, draw), w, h, (o.soft ?? 1) * RES);
  const B = blurMask(A, w, h, (o.depth ?? Math.max(3, (Math.min(w, h) / RES) * 0.07)) * RES);
  const img = ctx.createImageData(w, h), out = img.data;
  const f = 1 / ((o.scale ?? 14) * RES), fq = 0.45 / RES, rimK = o.rim ?? 0.6, alphaK = o.alpha ?? 0.95, spray = o.spray || 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const p = j * w + i, a = A[p], b = B[p];
    let al = 0, dk = 0;
    if (a > 0.004) {
      const blot = smooth(0.28, 0.75, fbm(i * f, j * f, 3, seed));
      const rim = clamp((a - b) * 2.4, 0, 1);
      dk = clamp(rim * rimK + (o.shade ? o.shade(i / w, j / h) : 0) + (1 - blot) * 0.3, 0, 1);
      al = a * alphaK * (0.62 + 0.38 * blot) * (0.82 + 0.36 * vnoise(i * fq, j * fq, seed + 5)) * (0.9 + 0.2 * hash2(i, j, seed + 7)) + rim * a * 0.12;
    }
    if (spray && a < 0.5 && b > 0.01 && hash2((i / RES) | 0, (j / RES) | 0, seed + 9) < smooth(0, 0.4, b) * (1 - 2 * a) * spray) {
      al = Math.max(al, 0.3 + 0.45 * hash2(j, i, seed + 11)); dk = Math.max(dk, 0.3);
    }
    if (al > 0.002) tone(out, p * 4, col, dk, al);
  }
  blit(ctx, img);
}

// Charcoal, or a finger loaded with ochre: one or more lines that swell and taper,
// with the stick skipping over the grain of the rock. `profile: 'down'` thins
// towards the end, for legs, tails and hair.
export function line(ctx, strokes, o: PigmentOpts = {}) {
  const { width: w, height: h } = ctx.canvas;
  if (typeof strokes[0][0] === 'number') strokes = [strokes];
  const col = OCHRE[o.col || 'black'], seed = o.seed || 1, W = o.w ?? 3;
  const sx = o.px ? 1 : w / RES, sy = o.px ? 1 : h / RES;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  const M = maskOf(w, h, (x) => strokes.forEach((st, si) => {
    const P = curve(st, sx, sy, o.closed), n = P.length;
    P.forEach(([cx, cy], k) => {
      const t = n > 1 ? k / (n - 1) : 0.5;
      const prof = o.closed ? 1 : o.profile === 'down' ? 1 - 0.75 * t : Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * t)), 0.55);
      const R = Math.max(0.45, (W / 2) * prof * (0.72 + 0.56 * vnoise(k * 0.04, si * 3.1, seed)));
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
      x0 = Math.min(x0, (cx - R) * RES); y0 = Math.min(y0, (cy - R) * RES); x1 = Math.max(x1, (cx + R) * RES); y1 = Math.max(y1, (cy + R) * RES);
    });
  }));
  const A = o.soft ? blurMask(M, w, h, o.soft * RES) : M;
  const grain = o.grain ?? (o.col && o.col !== 'black' ? 0.3 : 0.55), alphaK = o.alpha ?? 0.92;
  const img = ctx.createImageData(w, h), out = img.data;
  const pad = ((o.soft || 0) * 3 + 2) * RES, gq = 0.55 / RES, cq = 0.2 / RES;
  for (let j = Math.max(0, Math.floor(y0 - pad)); j < Math.min(h, Math.ceil(y1 + pad)); j++) {
    for (let i = Math.max(0, Math.floor(x0 - pad)); i < Math.min(w, Math.ceil(x1 + pad)); i++) {
      const p = j * w + i, a = A[p];
      if (a < 0.004) continue;
      // Grains of charcoal: clumps at paint-layer scale, plus single grains at full resolution.
      const g = smooth(0.18, 0.6, 0.45 * vnoise(i * gq, j * gq, seed + 3) + 0.25 * hash2((i / RES) | 0, (j / RES) | 0, seed + 4) + 0.3 * hash2(i, j, seed + 8));
      tone(out, p * 4, col, 0.35 + 0.65 * vnoise(i * cq, j * cq, seed + 6), a * alphaK * (1 - grain + grain * g));
    }
  }
  blit(ctx, img);
}

// Finger dots: [u, v, radius in px]. Ochre gathers at the rim of a fingertip.
export function fingerDots(ctx, list, o: PigmentOpts = {}) {
  const w = ctx.canvas.width / RES, h = ctx.canvas.height / RES, seed = o.seed || 1;
  wash(ctx, (x) => list.forEach(([u, v, R], d) => {
    x.beginPath();
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2, rr = R * (0.8 + 0.35 * hash2(k, d, seed));
      const px = u * w + Math.cos(a) * rr, py = v * h + Math.sin(a) * rr;
      k ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.closePath(); x.fill();
  }), { col: o.col || 'red', seed, depth: 2, rim: 0.8, soft: 1, alpha: o.alpha ?? 0.9, scale: 6 });
}

// A line scratched with a flint: a pale groove with a dark lip on one side.
export function engrave(ctx, pts, o: PigmentOpts = {}) {
  const w = ctx.canvas.width / RES, h = ctx.canvas.height / RES, r = mulberry(o.seed || 1);
  const P = curve(pts, o.px ? 1 : w, o.px ? 1 : h, o.closed), a = o.alpha ?? 0.5, lw = o.width ?? 1.1;
  const pass = (d, col, wd) => {
    ctx.strokeStyle = col; ctx.lineWidth = wd;
    ctx.beginPath();
    P.forEach(([x, y], i) => { const jx = x + d + (r() - 0.5) * 0.6, jy = y + d + (r() - 0.5) * 0.6; i ? ctx.lineTo(jx, jy) : ctx.moveTo(jx, jy); });
    if (o.closed) ctx.closePath();
    ctx.stroke();
  };
  ctx.save(); ctx.scale(RES, RES); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  pass(0.5 + lw * 0.4, `rgba(30,20,14,${a * 0.6})`, lw + 0.6);
  pass(0, `rgba(246,234,214,${a})`, lw);
  ctx.restore();
}

// Age: uneven fading, pits where the pigment never took, and flakes where the
// rock surface spalled off and took the paint with it.
export function weather(canvas, seed, o: PigmentOpts = {}) {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h), D = img.data;
  const fade = o.fade ?? 0.3, pits = o.pits ?? 0.025;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j * w + i) * 4;
    if (!D[k + 3]) continue;
    D[k + 3] *= (1 - fade + fade * smooth(0.25, 0.7, fbm(i / (45 * RES) + 3, j / (45 * RES), 3, seed + 21))) * (hash2((i / RES) | 0, (j / RES) | 0, seed + 23) < pits ? 0.55 : 1);
  }
  ctx.putImageData(img, 0, 0);
  const r = mulberry(seed + 29);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 0.85;
  for (let n = 0; n < (o.flakes ?? 2); n++) {
    const cx = r() * w, cy = r() * h, R = 3 + r() * Math.min(w, h) * 0.06;
    ctx.beginPath();
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, rr = R * (0.5 + r() * 0.7); k ? ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

// Negative hands: pigment blown around a hand pressed to the rock leaves the hand
// bare. Thickest right at the hand's edge, thinning out with the breath.
export function sprayAround(lw, lh, drawShape, col, seed, o: PigmentOpts = {}) {
  const w = Math.ceil(lw * RES), h = Math.ceil(lh * RES);
  const c = makeCanvas(w, h), ctx = c.getContext('2d');
  const M = blurMask(maskOf(w, h, drawShape), w, h, (o.soft ?? 1.2) * RES);
  const B = blurMask(M, w, h, (o.reach ?? 12) * RES);
  const img = ctx.createImageData(w, h), out = img.data, C = OCHRE[col];
  const cx = w / 2, cy = h / 2, R = Math.hypot(cx, cy);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const p = j * w + i, bare = M[p];
    if (bare > 0.98) continue;
    const cone = clamp(1 - Math.hypot(i - cx, j - cy) / R, 0, 1);
    const dens = clamp(smooth(0, 0.45, B[p]) * 1.1 + cone * cone * 0.55, 0, 1);
    const al = dens * (hash2(i, j, seed) < dens ? 1 : 0.3) * (0.55 + 0.45 * vnoise(i * 0.25 / RES, j * 0.25 / RES, seed + 1)) * (1 - bare) * (o.alpha ?? 1) * 0.88;
    if (al > 0.01) tone(out, p * 4, C, 0.25 + 0.5 * vnoise(i * 0.08 / RES, j * 0.08 / RES, seed + 2), al);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
