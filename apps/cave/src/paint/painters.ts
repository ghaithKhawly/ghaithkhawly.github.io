import { atRes, engrave, fillShape, fingerDots, jit, line, seedOf, wash, weather } from './pigment';
import { makeCanvas, mulberry, smooth } from '../util';

export const PAINTERS = {
  // Altamira: red ochre body, black head, beard and hump, a charcoal contour.
  bison(ctx, w, h, r) {
    const s = seedOf(r);
    wash(ctx, (x) => fillShape(x, jit([[0.14, 0.42], [0.2, 0.22], [0.32, 0.08], [0.44, 0.06], [0.56, 0.16], [0.72, 0.2], [0.86, 0.26], [0.94, 0.38], [0.93, 0.55], [0.84, 0.66], [0.66, 0.68], [0.46, 0.7], [0.3, 0.72], [0.18, 0.66], [0.1, 0.56]], r, 0.02), w, h),
      { col: 'red', seed: s, shade: (u, v) => smooth(0.55, 0.75, v) * 0.4 + smooth(0.3, 0.08, v) * 0.3 });
    wash(ctx, (x) => { fillShape(x, [[0.02, 0.42], [0.06, 0.29], [0.15, 0.26], [0.22, 0.36], [0.21, 0.56], [0.12, 0.66], [0.04, 0.62]], w, h); fillShape(x, [[0.07, 0.6], [0.17, 0.6], [0.12, 0.82]], w, h); },
      { col: 'black', seed: s + 1, alpha: 0.9 });
    wash(ctx, (x) => fillShape(x, [[0.2, 0.24], [0.31, 0.09], [0.44, 0.05], [0.52, 0.14], [0.42, 0.26], [0.31, 0.36], [0.23, 0.42]], w, h), { col: 'black', seed: s + 2, alpha: 0.5, rim: 0.2 });
    line(ctx, [
      [[0.16, 0.27], [0.3, 0.09], [0.44, 0.05], [0.58, 0.15], [0.74, 0.19], [0.88, 0.26], [0.95, 0.4]],
      [[0.94, 0.38], [0.99, 0.5], [0.96, 0.66]],
      [[0.11, 0.3], [0.08, 0.19], [0.14, 0.11]],
      [[0.17, 0.29], [0.19, 0.18], [0.26, 0.13]],
    ], { w: 3.4, seed: s + 3 });
    line(ctx, [[0.2, 0.68], [0.44, 0.72], [0.66, 0.69], [0.86, 0.65]], { w: 2.4, seed: s + 4, alpha: 0.65 });
    line(ctx, [[[0.24, 0.64], [0.22, 0.8], [0.25, 0.95]], [[0.34, 0.68], [0.35, 0.82], [0.37, 0.94]], [[0.76, 0.62], [0.78, 0.8], [0.76, 0.95]]], { w: 6.5, profile: 'down', seed: s + 5 });
    line(ctx, [[0.86, 0.6], [0.9, 0.76], [0.9, 0.88]], { w: 6, profile: 'down', seed: s + 6, alpha: 0.5 });
  },
  // Lascaux: a yellow horse, darker along the back, with black mane, head and legs.
  horse(ctx, w, h, r) {
    const s = seedOf(r);
    wash(ctx, (x) => fillShape(x, jit([[0.12, 0.44], [0.24, 0.33], [0.46, 0.3], [0.62, 0.27], [0.7, 0.18], [0.78, 0.08], [0.88, 0.06], [0.96, 0.14], [0.95, 0.24], [0.86, 0.26], [0.8, 0.36], [0.78, 0.52], [0.64, 0.62], [0.4, 0.64], [0.2, 0.6], [0.1, 0.52]], r, 0.015), w, h),
      { col: 'yellow', seed: s, rim: 0.45, shade: (u, v) => smooth(0.45, 0.22, v) * 0.5 });
    wash(ctx, (x) => fillShape(x, [[0.78, 0.08], [0.88, 0.05], [0.97, 0.13], [0.96, 0.24], [0.88, 0.26], [0.83, 0.2]], w, h), { col: 'black', seed: s + 1, alpha: 0.85 });
    const mane = [];
    for (let i = 0; i < 11; i++) { const t = i / 10, bx = 0.6 + t * 0.2, by = 0.28 - t * 0.21; mane.push([[bx, by], [bx - 0.025, by - 0.08]]); }
    line(ctx, mane, { w: 3.2, profile: 'down', seed: s + 2 });
    line(ctx, [[0.12, 0.42], [0.25, 0.31], [0.46, 0.29], [0.62, 0.26]], { w: 2.6, seed: s + 3, alpha: 0.75 });
    line(ctx, [[0.12, 0.43], [0.05, 0.54], [0.03, 0.74]], { w: 8, profile: 'down', seed: s + 4 });
    line(ctx, [[[0.2, 0.56], [0.16, 0.76], [0.14, 0.95]], [[0.3, 0.6], [0.32, 0.78], [0.33, 0.94]], [[0.64, 0.58], [0.62, 0.78], [0.6, 0.94]], [[0.72, 0.54], [0.77, 0.74], [0.79, 0.92]]], { w: 5.5, profile: 'down', seed: s + 5 });
  },
  // A Lascaux stag: red body and neck, a darker head, a crown of charcoal antlers.
  deer(ctx, w, h, r) {
    const s = seedOf(r);
    wash(ctx, (x) => { fillShape(x, jit([[0.22, 0.52], [0.32, 0.44], [0.6, 0.43], [0.78, 0.46], [0.86, 0.55], [0.78, 0.66], [0.5, 0.68], [0.3, 0.66], [0.23, 0.6]], r, 0.015), w, h); fillShape(x, [[0.24, 0.53], [0.13, 0.3], [0.2, 0.24], [0.36, 0.47]], w, h); },
      { col: 'red', seed: s, shade: (u, v) => smooth(0.52, 0.68, v) * 0.35 });
    wash(ctx, (x) => fillShape(x, [[0.04, 0.27], [0.12, 0.18], [0.22, 0.21], [0.22, 0.31], [0.11, 0.33]], w, h), { col: 'brown', seed: s + 1 });
    line(ctx, [[[0.16, 0.19], [0.13, 0.08], [0.18, 0.0]], [[0.14, 0.12], [0.06, 0.06]], [[0.19, 0.18], [0.27, 0.06], [0.33, 0.02]], [[0.24, 0.1], [0.24, 0.0]], [[0.29, 0.05], [0.36, 0.08]]], { w: 2.6, seed: s + 2 });
    line(ctx, [[0.2, 0.25], [0.3, 0.42], [0.6, 0.42], [0.8, 0.46]], { w: 2.2, seed: s + 3, alpha: 0.7 });
    line(ctx, [[[0.32, 0.63], [0.28, 0.8], [0.28, 0.98]], [[0.4, 0.64], [0.43, 0.8], [0.43, 0.98]], [[0.72, 0.62], [0.7, 0.8], [0.7, 0.98]], [[0.8, 0.6], [0.86, 0.78], [0.86, 0.97]]], { w: 3.8, profile: 'down', seed: s + 4 });
    fingerDots(ctx, [[0.1, 0.24, 1.6]], { col: 'black', seed: s + 5 });
  },
  // Levantine hunters: long-legged figures in mid-stride with spears.
  hunters(ctx, w, h, r) {
    const s = seedOf(r), bodies = [], limbs = [], spears = [], heads = [];
    for (let k = 0; k < 3; k++) {
      const ox = 0.08 + k * 0.3 + (r() - 0.5) * 0.04, sc = 0.9 + r() * 0.2;
      const P = (x, y) => [ox + x * 0.28 * sc, y];
      heads.push([...P(0.5, 0.13), h * 0.065]);
      bodies.push([P(0.5, 0.22), P(0.47, 0.42), P(0.46, 0.6)]);
      limbs.push([P(0.46, 0.6), P(0.36, 0.78), P(0.28, 0.95)], [P(0.46, 0.6), P(0.58, 0.76), P(0.66, 0.94)], [P(0.49, 0.32), P(0.66, 0.38), P(0.82, 0.36)], [P(0.49, 0.32), P(0.34, 0.4), P(0.22, 0.45)]);
      spears.push([P(0.12, 0.5), P(1.15, 0.18)]);
    }
    line(ctx, bodies, { w: h * 0.06, profile: 'down', seed: s });
    line(ctx, limbs, { w: h * 0.04, profile: 'down', seed: s + 1 });
    line(ctx, spears, { w: 1.8, seed: s + 2, alpha: 0.8 });
    fingerDots(ctx, heads, { col: 'black', seed: s + 3 });
  },
  // An orant figure in red ochre, arms raised, under an arc of yellow finger dots.
  self(ctx, w, h, r) {
    const s = seedOf(r), arc = [];
    line(ctx, [[[0.5, 0.4], [0.5, 0.55], [0.5, 0.7]], [[0.5, 0.47], [0.3, 0.36], [0.24, 0.3], [0.2, 0.14]], [[0.5, 0.47], [0.7, 0.36], [0.76, 0.3], [0.8, 0.14]], [[0.5, 0.7], [0.42, 0.84], [0.34, 0.97]], [[0.5, 0.7], [0.58, 0.84], [0.66, 0.97]]],
      { col: 'red', w: w * 0.075, grain: 0.25, soft: 0.8, seed: s });
    fingerDots(ctx, [[0.5, 0.3, w * 0.09]], { col: 'red', seed: s + 1 });
    for (let i = 0; i < 14; i++) { const a = Math.PI * (1.05 + (i / 13) * 0.9), R = 0.42 + r() * 0.04; arc.push([0.5 + Math.cos(a) * R, 0.32 + (Math.sin(a) * R * 0.75 * w) / h, w * 0.032]); }
    fingerDots(ctx, arc, { col: 'yellow', seed: s + 2 });
  },
  phone(ctx, w, h, r) {
    const s = seedOf(r), d = [], ring = [];
    line(ctx, jit([[0.14, 0.06], [0.5, 0.05], [0.86, 0.05], [0.9, 0.5], [0.87, 0.95], [0.5, 0.96], [0.13, 0.95], [0.1, 0.5]], r, 0.025), { col: 'red', w: w * 0.1, closed: true, grain: 0.25, soft: 0.8, seed: s });
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) d.push([0.3 + col * 0.2 + (r() - 0.5) * 0.03, 0.2 + row * 0.13 + (r() - 0.5) * 0.02, w * 0.055]);
    fingerDots(ctx, d, { col: 'red', seed: s + 1 });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ring.push([0.5 + Math.cos(a) * 0.07, 0.84 + (Math.sin(a) * 0.07 * w) / h]); }
    line(ctx, ring, { col: 'red', w: w * 0.05, closed: true, grain: 0.25, seed: s + 2 });
  },
  laptop(ctx, w, h, r) {
    const s = seedOf(r), rows = [];
    line(ctx, jit([[0.2, 0.05], [0.5, 0.055], [0.8, 0.06], [0.805, 0.33], [0.81, 0.6], [0.5, 0.6], [0.19, 0.6], [0.195, 0.33]], r, 0.015), { col: 'red', w: h * 0.065, closed: true, grain: 0.25, soft: 0.8, seed: s });
    wash(ctx, (x) => { x.beginPath(); x.moveTo(w * 0.12, h * 0.68); x.lineTo(w * 0.88, h * 0.68); x.lineTo(w * 0.98, h * 0.9); x.lineTo(w * 0.02, h * 0.9); x.closePath(); x.fill(); }, { col: 'red', seed: s + 1 });
    for (let i = 0; i < 4; i++) { const y = 0.16 + i * 0.1, len = 0.25 + r() * 0.3, ind = i % 2 ? 0.08 : 0; rows.push([[0.28 + ind, y], [0.28 + ind + len, y + (r() - 0.5) * 0.02]]); }
    line(ctx, rows, { w: h * 0.04, seed: s + 2 });
  },
  dots(ctx, w, h, r) {
    const d = [];
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) d.push([0.06 + i * 0.11 + (r() - 0.5) * 0.02, 0.3 + row * 0.4 + (r() - 0.5) * 0.08, h * 0.13]);
    fingerDots(ctx, d, { col: 'red', seed: seedOf(r) });
  },
  tally(ctx, w, h, r) {
    const marks = [];
    for (let i = 0; i < 9; i++) { const x = 0.08 + i * 0.105; marks.push([[x + (r() - 0.5) * 0.05, 0.1], [x + (r() - 0.5) * 0.05, 0.9]]); }
    line(ctx, marks, { w: w * 0.045, seed: seedOf(r) });
  },
  // Hidden paintings.
  // Education. Chauvet has an owl; this one is yellow ochre, outlined, with engraved feathers.
  owl(ctx, w, h, r) {
    const s = seedOf(r), body = jit([[0.5, 0.12], [0.78, 0.22], [0.86, 0.55], [0.74, 0.88], [0.5, 0.96], [0.26, 0.88], [0.14, 0.55], [0.22, 0.22]], r, 0.02);
    wash(ctx, (x) => fillShape(x, body, w, h), { col: 'yellow', seed: s, shade: (u, v) => smooth(0.6, 0.95, v) * 0.3 });
    wash(ctx, (x) => { fillShape(x, [[0.2, 0.26], [0.15, 0.03], [0.36, 0.17]], w, h); fillShape(x, [[0.8, 0.26], [0.85, 0.03], [0.64, 0.17]], w, h); }, { col: 'black', seed: s + 1 });
    line(ctx, body, { closed: true, w: 3, seed: s + 2, alpha: 0.8 });
    fingerDots(ctx, [[0.36, 0.38, w * 0.13], [0.64, 0.38, w * 0.13]], { col: 'black', seed: s + 3 });
    fingerDots(ctx, [[0.36, 0.38, w * 0.045], [0.64, 0.38, w * 0.045], [0.5, 0.54, w * 0.04]], { col: 'red', seed: s + 4 });
    for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) engrave(ctx, [[0.33 + k * 0.12, 0.62 + i * 0.07], [0.38 + k * 0.12, 0.67 + i * 0.07], [0.43 + k * 0.12, 0.62 + i * 0.07]], { seed: s + i * 3 + k, alpha: 0.6 });
  },
  cloud(ctx, w, h, r) {  // Certifications: six suns under a cloud
    const s = seedOf(r), suns = [], rays = [];
    line(ctx, [[0.18, 0.46], [0.1, 0.36], [0.24, 0.27], [0.36, 0.1], [0.54, 0.2], [0.7, 0.12], [0.8, 0.32], [0.92, 0.4], [0.8, 0.47], [0.5, 0.48]], { closed: true, w: h * 0.05, seed: s });
    for (let i = 0; i < 6; i++) {
      const x = 0.14 + (i % 3) * 0.36, y = 0.66 + Math.floor(i / 3) * 0.2;
      suns.push([x, y, h * 0.055]);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; rays.push([[x + (Math.cos(a) * 0.075 * h) / w, y + Math.sin(a) * 0.075], [x + (Math.cos(a) * 0.115 * h) / w, y + Math.sin(a) * 0.115]]); }
    }
    fingerDots(ctx, suns, { col: 'red', seed: s + 1 });
    line(ctx, rays, { col: 'red', w: h * 0.022, grain: 0.3, profile: 'down', seed: s + 2 });
  },
  talk(ctx, w, h, r) {  // Languages: two figures, words passing between them
    const s = seedOf(r), figs = [], heads = [];
    for (const [cx, dir] of [[0.18, 1], [0.82, -1]]) {
      heads.push([cx, 0.3, w * 0.06]);
      figs.push([[cx, 0.38], [cx, 0.68]], [[cx, 0.68], [cx - 0.06, 0.95]], [[cx, 0.68], [cx + 0.06, 0.95]], [[cx, 0.46], [cx + dir * 0.12, 0.36]]);
    }
    line(ctx, figs, { col: 'red', w: w * 0.04, grain: 0.25, soft: 0.8, seed: s });
    fingerDots(ctx, heads, { col: 'red', seed: s + 1 });
    fingerDots(ctx, [...Array(7)].map((_, i) => [0.3 + i * 0.065, 0.24 + Math.sin(i * 0.9) * 0.04, w * 0.018]), { col: 'yellow', seed: s + 2 });
    fingerDots(ctx, [...Array(7)].map((_, i) => [0.7 - i * 0.065, 0.4 + Math.sin(i * 0.9) * 0.04, w * 0.018]), { col: 'black', seed: s + 3 });
  },
};


export const PAINT_RES = 2;
export function paintedCanvas(kind, w, h, seed, age = {}, res = PAINT_RES, into = null) {
  return atRes(res, () => {
    const c = into || makeCanvas(w * res, h * res);
    PAINTERS[kind](c.getContext('2d'), w, h, mulberry(seed));
    if (age) weather(c, seed, age);
    return c;
  });
}
