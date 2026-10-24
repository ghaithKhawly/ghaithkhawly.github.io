import { late, provide } from '../late';
import type { Guide, Painting } from '../types';
import { S } from '../state';
import { GUIDES, guideProgress } from '../art/guides';
import { PAINTINGS, addPaintingDecal, makeGlowSprite } from '../art/layers';
import { $, ART_H, ART_W, EYE_D, SCREEN_H, WALL_H, WALL_W } from '../config';
import { screenW } from '../core/view';
import { PAINT_RES } from '../paint/painters';
import { atRes, fingerDots, line, shapePath, sprayAround, wash } from '../paint/pigment';
import { boost, openPanel } from '../ui/panels';
import { bakedJob, makeCanvas } from '../util';
import { wallPoint } from '../world/geometry';
import { canvas } from '../world/scene';

// Earlier modules reach these through `late` (see late.ts). The getters are lazy, so
// registering before the declarations below is safe.
provide({ get focus() { return focus; }, get startFinish() { return startFinish; } });

// Zooming in to paint, and the ghost hand that finishes a painting
export const focus = { active: false, t: 0, guide: null, target: { x: 0, y: 0, z: 0, s: 1 } };
export function startFocus(g) {
  const P = wallPoint((g.x + g.w / 2) / ART_W, (g.y + g.h / 2) / ART_H);
  // Close enough to fill the view with the shape, but never so close it doesn't fit (narrow phones).
  const gw = (g.w / ART_W) * WALL_W, gh = (g.h / ART_H) * WALL_H;
  const s = 0.42, dist = Math.max(1.9, (1.35 * gw * EYE_D) / screenW, (1.45 * gh * EYE_D) / SCREEN_H);
  focus.target = { x: P.x, y: P.y + 0.06, z: P.z + dist - EYE_D * s, s };
  focus.active = true; focus.guide = g;
  $('step-back').hidden = false;
  late.setGestureUI(`Trace ${g.title} with ${g.tool === 'charcoal' ? 'charcoal' : 'red ochre'}`, guideProgress(g) / 0.68);
}
export function endFocus() {
  focus.active = false;
  $('step-back').hidden = true;
  if (S.mode === 'mouse') late.setGestureUI(late.paintingHint(), 0);
}
$('step-back').addEventListener('click', () => { if (!finish.g) endFocus(); });

// The ghost hand finishes a traced shape the way a cave painter would: an animal is
// rubbed in with ochre and outlined in charcoal; the hand is pressed to the rock and
// ochre blown round it. The finished painting is rendered up front, and the ghost
// reveals it dab by dab.
export const SOFT = (() => {
  const c = makeCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.6, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return c;
})();
export const finish: {
  g: Guide | null; p: Painting | null; t: number; plan: number[][]; drawn: number; outlined: number; done: boolean; hand: number[] | null;
  pad?: number; fill?: HTMLCanvasElement; line?: HTMLCanvasElement; fillMask?: HTMLCanvasElement; lineMask?: HTMLCanvasElement; tmp?: HTMLCanvasElement;
} = { g: null, p: null, t: 0, plan: [], drawn: 0, outlined: 0, done: false, hand: null };
export function renderGuide(g) {
  const { pad, W, H, path, fill, line: line_ } = g.final, K = PAINT_RES, sd = 4000 + g.x;
  atRes(K, () => {
    if (g.stencil) { const s = sprayAround(W, H, (x) => x.fill(path), 'red', sd, { reach: 22, alpha: 1.3 }); fill.width = s.width; fill.height = s.height; fill.getContext('2d').drawImage(s, 0, 0); return; }
    const c = fill, lc = line_.getContext('2d');
    wash(c.getContext('2d'), (x) => x.fill(path), { col: g.fillCol, seed: sd, shade: g.shade, spray: 0.12, alpha: 0.9 });
    line(lc, g.samples.map(([x, y]) => [x - g.x + pad, y - g.y + pad]), { px: true, closed: true, w: 4.4, seed: sd + 1 });
    if (g.details) line(lc, g.details.map((st) => st.map(([u, v]) => [pad + u * g.w, pad + v * g.h])), { px: true, w: 3, seed: sd + 2 });
    fingerDots(lc, [[(pad + g.eye[0] * g.w) / W, (pad + g.eye[1] * g.h) / H, 3]], { col: 'black', seed: sd + 3 });
  });
  return g.final;
}
for (const g of GUIDES) {
  const pad = g.stencil ? 44 : 14, W = g.w + pad * 2, H = g.h + pad * 2;
  g.final = { pad, W, H, path: shapePath(g.pts, g.w, g.h, pad, pad), fill: makeCanvas(W * PAINT_RES, H * PAINT_RES), line: makeCanvas(W * PAINT_RES, H * PAINT_RES) };
  bakedJob(`guide-${g.id}-line`, g.final.line, 4, () => {});   // painted along with the fill
  bakedJob(`guide-${g.id}-fill`, g.final.fill, 4, () => renderGuide(g));
}
export function startFinish(g) {
  if (finish.g) return;
  g.done = true;
  if (!focus.active || focus.guide !== g) startFocus(g);
  const { pad, W, H, path, fill, line: lineC } = g.final, K = PAINT_RES;
  const p = { id: `g-${g.id}`, kind: 'traced', x: g.x - pad, y: g.y - pad, w: W, h: H, group: 'traced', guide: g, canvas: makeCanvas(W * K, H * K), alpha: 1, g: 0, boostFrom: 0, boostTo: 0, glow: null };
  PAINTINGS.push(p);
  addPaintingDecal(p);
  const plan = [];
  if (g.stencil) {
    // Round the hand in a slow circle and a half, the way you'd turn while blowing.
    for (let a = 0; a < Math.PI * 3; a += 0.11) {
      const R = 0.36 + 0.08 * Math.sin(a * 3);
      plan.push([W / 2 + Math.cos(a - Math.PI / 2) * R * W, H / 2 + Math.sin(a - Math.PI / 2) * R * H]);
    }
  } else {
    // Rubbed in row by row, back and forth.
    const probe = makeCanvas(1, 1).getContext('2d');
    let row = 0;
    for (let y = pad + 5; y < H - pad; y += 10, row++) {
      const xs = [];
      for (let x = pad + 3; x < W - pad; x += 9) if (probe.isPointInPath(path, x, y)) xs.push(x);
      if (row % 2) xs.reverse();
      for (const x of xs) plan.push([x, y]);
    }
  }
  Object.assign(finish, { g, p, t: 0, plan, drawn: 0, outlined: 0, done: false, hand: null, pad, fill, line: lineC, fillMask: makeCanvas(W * K, H * K), lineMask: makeCanvas(W * K, H * K), tmp: makeCanvas(W * K, H * K) });
}
export const FILL_T = 1.7, LINE_T = 0.7, HOLD_T = 0.9, SPRAY_T = 2.2;
export function updateFinish(dt) {
  if (!finish.g) return;
  // Wait until the camera has arrived at the wall.
  if (focus.t < 0.98 && finish.t === 0) return;
  finish.t += dt;
  const { g, p, pad } = finish;
  const fillT = g.stencil ? SPRAY_T : FILL_T, lineT = g.stencil ? 0 : LINE_T;
  let changed = false;
  // 1. Rub the ochre in, or blow it round the hand.
  const fillTo = Math.min(finish.plan.length, Math.floor((finish.t / fillT) * finish.plan.length));
  if (fillTo > finish.drawn) {
    const m = finish.fillMask.getContext('2d'), K = PAINT_RES, R = (g.stencil ? 34 : 13) * K;
    for (let i = finish.drawn; i < fillTo; i++) { const [x, y] = finish.plan[i]; m.drawImage(SOFT, x * K - R, y * K - R, R * 2, R * 2); }
    if (fillTo === finish.plan.length) { m.fillStyle = '#fff'; m.fillRect(0, 0, p.w * K, p.h * K); }
    const [hx, hy] = finish.plan[fillTo - 1];
    finish.drawn = fillTo; finish.hand = [hx - pad, hy - pad]; changed = true;
  }
  // 2. Charcoal round the outline; the eye and the last details come with it.
  if (lineT && finish.t > fillT) {
    const n = g.samples.length, k = Math.min(n, Math.floor(((finish.t - fillT) / lineT) * n));
    if (k > finish.outlined) {
      const m = finish.lineMask.getContext('2d'), K = PAINT_RES;
      for (let i = finish.outlined; i < k; i++) { const [x, y] = g.samples[i]; m.drawImage(SOFT, (x - g.x + pad - 11) * K, (y - g.y + pad - 11) * K, 22 * K, 22 * K); finish.hand = [x - g.x, y - g.y]; }
      if (k === n) { m.fillStyle = '#fff'; m.fillRect(0, 0, p.w * K, p.h * K); }
      finish.outlined = k; changed = true;
    }
  }
  if (changed) {
    const t = finish.tmp.getContext('2d'), c = p.canvas.getContext('2d');
    t.globalCompositeOperation = 'copy'; t.drawImage(finish.line, 0, 0);
    t.globalCompositeOperation = 'destination-in'; t.drawImage(finish.lineMask, 0, 0);
    c.globalCompositeOperation = 'copy'; c.drawImage(finish.fill, 0, 0);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(finish.fillMask, 0, 0);
    c.globalCompositeOperation = 'source-over'; c.drawImage(finish.tmp, 0, 0);
    p.mesh.material.map.needsUpdate = true;
  }
  // 3. It comes alive, then the camera steps back and the section opens.
  if (finish.t > fillT + lineT && !finish.done) {
    finish.done = true;
    finish.hand = null;
    p.glow = makeGlowSprite(p.canvas, p.w / 2, p.h / 2);
    boost([p.id]);
    late.playChime(g.id);
  }
  if (finish.t > fillT + lineT + HOLD_T) {
    const section = g.section;
    finish.g = null;
    endFocus();
    setTimeout(() => openPanel(section), 500);
  }
}
