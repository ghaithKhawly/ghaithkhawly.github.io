
// Noise + small helpers
// ---------------------------------------------------------------------------
export function hash2(x, y, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function vnoise(x, y, s, period = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  let x0 = xi, y0 = yi, x1 = xi + 1, y1 = yi + 1;
  if (period) { x0 = ((x0 % period) + period) % period; y0 = ((y0 % period) + period) % period; x1 = ((x1 % period) + period) % period; y1 = ((y1 % period) + period) % period; }
  const a = hash2(x0, y0, s), b = hash2(x1, y0, s);
  const c = hash2(x0, y1, s), d = hash2(x1, y1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, oct, s, period = 0) {
  let f = 0, amp = 0.5, fr = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    f += amp * vnoise(x * fr, y * fr, s + i * 17, period ? period * fr : 0);
    norm += amp; amp *= 0.5; fr *= 2;
  }
  return f / norm;
}
export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
export const supportsFilter = 'filter' in makeCanvas(1, 1).getContext('2d');
// Pigment work is slow (about a second in all), so it runs in the background, a piece at
// a time, while the intro is up: the paintings on the wall first.
export const paintQueue = [];
export function queuePaint(prio, fn) { paintQueue.push({ prio, fn }); }
export function runPaintQueue() {
  const t0 = performance.now();
  while (paintQueue.length && performance.now() - t0 < 12) {
    let k = 0;
    for (let i = 1; i < paintQueue.length; i++) if (paintQueue[i].prio < paintQueue[k].prio) k = i;
    paintQueue.splice(k, 1)[0].fn();
  }
  if (paintQueue.length) setTimeout(runPaintQueue, 0);
}

// Painted once at build time, loaded at run time. `npm run bake` runs every job below in
// a browser and saves its canvas to src/assets/baked/<key>.webp; a job whose image is
// there just draws it, and the pigment engine only runs for jobs that haven't been baked
// (and everything, when the page is opened with ?bake).
const BAKED = import.meta.glob('./assets/baked/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const baking = new URLSearchParams(location.search).has('bake');
export const bakeTargets = new Map<string, HTMLCanvasElement>();
export const bakeLoad = { pending: 0 };
const bakedUrl = (key: string) => (baking ? null : BAKED[`./assets/baked/${key}.webp`] || null);
function drawBaked(url: string, canvas: HTMLCanvasElement, done?: () => void) {
  bakeLoad.pending++;
  const img = new Image();
  img.src = url;
  img.decode().then(() => {
    if (canvas.width !== img.width || canvas.height !== img.height) { canvas.width = img.width; canvas.height = img.height; }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    done?.();
  }).catch((e) => console.error(`Baked image ${url} failed to load`, e)).finally(() => { bakeLoad.pending--; });
}
// One canvas, painted by one job.
export function bakedJob(key: string, canvas: HTMLCanvasElement, prio: number, paint: () => void, done?: () => void) {
  if (baking) bakeTargets.set(key, canvas);
  const url = bakedUrl(key);
  if (url) drawBaked(url, canvas, done);
  else queuePaint(prio, () => { paint(); done?.(); });
}
// One canvas built up by several jobs: returns a queuePaint that does nothing once the
// canvas has been baked.
export function bakedLayer(key: string, canvas: HTMLCanvasElement, done?: () => void) {
  if (baking) bakeTargets.set(key, canvas);
  const url = bakedUrl(key);
  if (url) drawBaked(url, canvas, done);
  return (prio: number, fn: () => void) => { if (!url) queuePaint(prio, fn); };
}

// One Euro filter: heavy smoothing while still, responsive while moving.
export class OneEuro {
  minCutoff: number; beta: number; dCutoff: number; x: number | null; dx: number; t: number;
  constructor(minCutoff, beta, dCutoff = 1) { this.minCutoff = minCutoff; this.beta = beta; this.dCutoff = dCutoff; this.x = null; this.dx = 0; this.t = 0; }
  reset() { this.x = null; this.dx = 0; }
  filter(x, t) {
    if (this.x === null) { this.x = x; this.t = t; return x; }
    const dt = Math.max(1e-3, t - this.t); this.t = t;
    const alpha = (c) => { const r = 2 * Math.PI * c * dt; return r / (r + 1); };
    this.dx += alpha(this.dCutoff) * ((x - this.x) / dt - this.dx);
    this.x += alpha(this.minCutoff + this.beta * Math.abs(this.dx)) * (x - this.x);
    return this.x;
  }
}
export const deadzone = (prev, v, dz) => { const d = v - prev; return Math.abs(d) <= dz ? prev : v - Math.sign(d) * dz; };
