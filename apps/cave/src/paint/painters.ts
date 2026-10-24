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
  // The projects. Each is a picture of what the project does.
  // Rakeb: trails of finger dots between camps, following six of Damascus's real bus routes.
  routes(ctx, w, h, r) {
    const s = seedOf(r), red = [], yellow = [], camps = [], rings = [];
    RAKEB_ROUTES.forEach((route, k) => {
      const dots = alongPath(route, w, h, 13 + (k % 2) * 2).map(([u, v]) => [u + (r() - 0.5) * 0.006, v + (r() - 0.5) * 0.01, 4.4 + r() * 1.1]);
      (k % 2 ? yellow : red).push(...dots);
      for (const [u, v] of [route[0], route[route.length - 1]]) if (u > 0.04 && u < 0.96 && v > 0.06 && v < 0.94) camps.push([u, v]);
    });
    camps.push([0.52, 0.45]);   // the hub where the trails meet
    for (const [u, v] of camps) { rings.push(circle(u, v, 0.034, 0.034 * w / h)); }
    fingerDots(ctx, red, { col: 'red', seed: s });
    fingerDots(ctx, yellow, { col: 'yellow', seed: s + 1 });
    line(ctx, rings, { closed: true, w: 3.6, seed: s + 2 });
    fingerDots(ctx, camps.map(([u, v]) => [u, v, 3.6]), { col: 'black', seed: s + 3 });
  },
  // Office Order: hunters sharing out a kill, each taking a portion.
  feast(ctx, w, h, r) {
    const s = seedOf(r);
    const body = jit([[0.3, 0.52], [0.36, 0.42], [0.5, 0.39], [0.64, 0.41], [0.72, 0.47], [0.7, 0.58], [0.58, 0.63], [0.42, 0.63], [0.32, 0.6]], r, 0.012);
    wash(ctx, (x) => { fillShape(x, body, w, h); fillShape(x, [[0.71, 0.46], [0.79, 0.4], [0.84, 0.44], [0.8, 0.52], [0.72, 0.55]], w, h); },
      { col: 'red', seed: s, shade: (u, v) => smooth(0.5, 0.64, v) * 0.35 });
    line(ctx, [body.concat([body[0]])], { w: 2.2, seed: s + 1, alpha: 0.75 });
    line(ctx, [[[0.4, 0.62], [0.38, 0.74]], [[0.47, 0.63], [0.47, 0.75]], [[0.6, 0.62], [0.62, 0.74]], [[0.66, 0.6], [0.69, 0.72]]], { w: 3, profile: 'down', seed: s + 2 });
    // Six figures round it, arms out to it; four already carry a portion away.
    const figs = [], limbs = [], heads = [], portions = [];
    [[0.08, 0.2, 1], [0.2, 0.08, 1], [0.86, 0.12, -1], [0.95, 0.42, -1], [0.12, 0.72, 1], [0.86, 0.72, -1]].forEach(([fx, fy, d], i) => {
      const sc = 0.32, P = (x, y) => [fx + x * sc * 0.5 * d, fy + y * sc];
      heads.push([...P(0, 0.08), h * 0.032]);
      figs.push([P(0, 0.14), P(0, 0.52)]);
      limbs.push([P(0, 0.52), P(-0.18, 0.95)], [P(0, 0.52), P(0.16, 0.95)], [P(0, 0.24), P(0.34, 0.32), P(0.52, 0.28)], [P(0, 0.24), P(-0.24, 0.36)]);
      if (i % 3 !== 1) portions.push([...P(0.56, 0.26), h * 0.028]);
    });
    line(ctx, figs, { w: h * 0.042, profile: 'down', seed: s + 3 });
    line(ctx, limbs, { w: h * 0.028, profile: 'down', seed: s + 4 });
    fingerDots(ctx, heads, { col: 'black', seed: s + 5 });
    fingerDots(ctx, portions.map(([u, v, R]) => [u, v, R * 1.3]), { col: 'red', seed: s + 6 });
  },
  // Aquarium: two fish and a shark, in yellow, red and charcoal.
  fish(ctx, w, h, r) {
    const s = seedOf(r), k = w / h;
    // A fish d = 1 faces left; L is its length in painting widths.
    const fishAt = (cx, cy, L, d) => [[-1, 0], [-0.55, -0.42], [0, -0.48], [0.45, -0.3], [0.62, -0.06], [0.95, -0.42], [0.86, 0], [0.95, 0.42], [0.62, 0.06], [0.45, 0.3], [0, 0.46], [-0.55, 0.38]]
      .map(([x, y]) => [cx + x * L * 0.5 * d, cy + y * L * 0.5 * k]);
    const f1 = jit(fishAt(0.22, 0.28, 0.26, 1), r, 0.006), f2 = jit(fishAt(0.76, 0.8, 0.22, -1), r, 0.006);
    wash(ctx, (x) => fillShape(x, f1, w, h), { col: 'yellow', seed: s, rim: 0.5 });
    wash(ctx, (x) => fillShape(x, f2, w, h), { col: 'red', seed: s + 1, rim: 0.5 });
    line(ctx, [f1.concat([f1[0]]), f2.concat([f2[0]])], { w: 2, seed: s + 2, alpha: 0.8 });
    line(ctx, [[[0.15, 0.2], [0.15, 0.36]], [[0.82, 0.73], [0.82, 0.87]]], { w: 1.4, seed: s + 7, alpha: 0.6 });   // gill lines
    fingerDots(ctx, [[0.13, 0.27, 2.2], [0.84, 0.79, 2]], { col: 'black', seed: s + 3 });
    // The shark: long body, tall dorsal fin, a pectoral fin, a forked tail.
    const shark = jit([[0.2, 0.56], [0.28, 0.47], [0.44, 0.42], [0.5, 0.26], [0.57, 0.41], [0.76, 0.44], [0.88, 0.3], [0.86, 0.5], [0.92, 0.66], [0.78, 0.56], [0.6, 0.6], [0.5, 0.74], [0.44, 0.61], [0.3, 0.62]], r, 0.006);
    wash(ctx, (x) => fillShape(x, shark, w, h), { col: 'black', seed: s + 4, alpha: 0.85, rim: 0.3 });
    line(ctx, [[0.22, 0.58], [0.3, 0.58]], { w: 1.4, col: 'yellow', seed: s + 8, alpha: 0.7 });   // the mouth
    fingerDots(ctx, [[0.27, 0.51, 1.8]], { col: 'yellow', seed: s + 5 });
    const bubbles = [];
    for (let i = 0; i < 7; i++) bubbles.push([0.36 + r() * 0.22, 0.06 + i * 0.045 + r() * 0.02, 1.4 + r() * 1.4]);
    fingerDots(ctx, bubbles, { col: 'red', seed: s + 6 });
  },
  // Savings Tracker: a hoard of gold and silver, and tally marks counting it.
  hoard(ctx, w, h, r) {
    const s = seedOf(r), gold = [], silver = [];
    const rows = [5, 4, 3, 2, 1];
    rows.forEach((n, row) => {
      for (let i = 0; i < n; i++) {
        const u = 0.32 + (i - (n - 1) / 2) * 0.115 + (r() - 0.5) * 0.015, v = 0.88 - row * 0.12 + (r() - 0.5) * 0.015;
        ((i + row) % 3 === 2 ? silver : gold).push([u, v, w * 0.055]);
      }
    });
    fingerDots(ctx, gold, { col: 'yellow', seed: s });
    fingerDots(ctx, silver, { col: 'brown', seed: s + 1 });
    const marks = [];
    for (let g = 0; g < 3; g++) {
      const x0 = 0.66 + (g % 2) * 0.16, y0 = 0.14 + Math.floor(g / 2) * 0.34 + (g === 2 ? 0 : 0);
      for (let i = 0; i < 4; i++) marks.push([[x0 + i * 0.035, y0], [x0 + i * 0.035 + (r() - 0.5) * 0.01, y0 + 0.24]]);
      marks.push([[x0 - 0.02, y0 + 0.2], [x0 + 0.14, y0 + 0.04]]);
    }
    line(ctx, marks, { w: 2.6, seed: s + 2 });
  },
  // justacalc: a counting bone like the one from Ishango, notched in groups of 3, 5 and 7,
  // with red dots counted out beside it.
  counting(ctx, w, h, r) {
    const s = seedOf(r);
    const bone = jit([[0.04, 0.42], [0.08, 0.32], [0.16, 0.36], [0.3, 0.4], [0.7, 0.39], [0.84, 0.35], [0.94, 0.32], [0.97, 0.44], [0.93, 0.56], [0.84, 0.54], [0.7, 0.5], [0.3, 0.51], [0.16, 0.55], [0.07, 0.56]], r, 0.006);
    wash(ctx, (x) => fillShape(x, bone, w, h), { col: 'yellow', seed: s, rim: 0.55, shade: (u, v) => smooth(0.44, 0.54, v) * 0.4 });
    line(ctx, [bone.concat([bone[0]])], { w: 1.8, seed: s + 1, alpha: 0.7 });
    const notches = [];
    let u = 0.2;
    for (const n of [3, 5, 7]) {
      for (let i = 0; i < n; i++) { notches.push([[u, 0.405], [u + (r() - 0.5) * 0.01, 0.5]]); u += 0.034; }
      u += 0.05;
    }
    line(ctx, notches, { w: 1.6, seed: s + 2, alpha: 0.9 });
    const dots = [];
    [3, 5, 7].forEach((n, k) => { for (let i = 0; i < n; i++) dots.push([0.12 + i * 0.075 + k * 0.03, 0.66 + k * 0.11, 3.4]); });
    for (let i = 0; i < 4; i++) dots.push([0.3 + i * 0.12, 0.16, 3.4]);
    fingerDots(ctx, dots, { col: 'red', seed: s + 3 });
  },
  // Taza: the day's bread and fruit in a basket.
  bread(ctx, w, h, r) {
    const s = seedOf(r), loaves = [], fruit = [], scores = [];
    [[0.28, 0.5, 0.15], [0.52, 0.42, 0.17], [0.74, 0.52, 0.13]].forEach(([u, v, R]) => {
      loaves.push(jit(circle(u, v, R, R * 0.7 * w / h, 16), r, 0.006));
      for (let k = -1; k <= 1; k++) scores.push([[u + k * R * 0.45 - R * 0.12, v - R * 0.25 * w / h], [u + k * R * 0.45 + R * 0.12, v + R * 0.25 * w / h]]);
    });
    wash(ctx, (x) => loaves.forEach((l) => fillShape(x, l, w, h)), { col: 'yellow', seed: s, rim: 0.5, shade: (u, v) => smooth(0.45, 0.62, v) * 0.35 });
    line(ctx, scores, { w: 2, seed: s + 1, alpha: 0.7 });
    for (const [u, v] of [[0.16, 0.66], [0.38, 0.7], [0.62, 0.71], [0.86, 0.67], [0.5, 0.66]]) fruit.push([u, v, h * 0.07]);
    fingerDots(ctx, fruit, { col: 'red', seed: s + 2 });
    line(ctx, fruit.map(([u, v]) => [[u, v - 0.07], [u + 0.02, v - 0.13]]), { w: 1.6, seed: s + 3 });
    // The basket: a woven bowl under it all.
    line(ctx, [[[0.04, 0.62], [0.12, 0.88], [0.5, 0.96], [0.88, 0.88], [0.96, 0.62]]], { w: 3.4, seed: s + 4 });
    const weave = [];
    for (let i = 0; i < 9; i++) { const u = 0.12 + i * 0.095; weave.push([[u, 0.78], [u + 0.04, 0.9]]); }
    line(ctx, weave, { w: 1.4, seed: s + 5, alpha: 0.7 });
  },
  // Gym Management System: figures lifting stones.
  lifters(ctx, w, h, r) {
    const s = seedOf(r), bodies = [], limbs = [], heads = [], stones = [];
    // One presses a stone overhead, one holds it at the chest, one carries it on a shoulder.
    const fig = (ox, pose) => {
      const P = (x, y) => [ox + (x * 0.6 * h) / w, y];
      heads.push([...P(0, 0.32), h * 0.042]);
      bodies.push([P(0, 0.38), P(0.01, 0.66)]);
      limbs.push([P(0.01, 0.66), P(-0.08, 0.8), P(-0.12, 0.96)], [P(0.01, 0.66), P(0.09, 0.8), P(0.12, 0.96)]);
      if (pose === 0) { limbs.push([P(0, 0.42), P(-0.12, 0.3), P(-0.1, 0.17)], [P(0, 0.42), P(0.12, 0.3), P(0.1, 0.17)]); stones.push([P(0, 0.12), 0.07]); }
      if (pose === 1) { limbs.push([P(0, 0.42), P(-0.13, 0.5), P(-0.05, 0.47)], [P(0, 0.42), P(0.13, 0.5), P(0.05, 0.47)]); stones.push([P(0, 0.5), 0.065]); }
      if (pose === 2) { limbs.push([P(0, 0.42), P(0.1, 0.36), P(0.08, 0.26)], [P(0, 0.42), P(-0.1, 0.54)]); stones.push([P(0.1, 0.24), 0.06]); }
    };
    fig(0.18, 0), fig(0.5, 1), fig(0.8, 2);
    line(ctx, bodies, { col: 'red', w: h * 0.045, profile: 'down', grain: 0.25, seed: s });
    line(ctx, limbs, { col: 'red', w: h * 0.03, profile: 'down', grain: 0.25, seed: s + 1 });
    fingerDots(ctx, heads, { col: 'red', seed: s + 2 });
    wash(ctx, (x) => stones.forEach(([[u, v], R]) => fillShape(x, circle(u, v, (R * h * 1.3) / w, R * 0.8, 14), w, h)), { col: 'black', seed: s + 3, alpha: 0.85 });
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

// Six of Rakeb's real routes through central Damascus, simplified, in painting units
// (from the project's own route file).
const RAKEB_ROUTES: number[][][] = [[[0.623,1.014],[0.672,1.01],[0.685,0.697],[0.667,0.637],[0.616,0.668],[0.533,0.645],[0.54,0.478],[0.522,0.431],[0.502,0.431],[0.492,0.47],[0.415,0.473],[0.382,0.411],[0.307,0.378],[0.308,0.4],[0.005,0.763]],[[0.264,0.162],[0.426,0.105],[0.462,0.07],[0.484,0.101],[0.427,0.18],[0.49,0.318],[0.498,0.468],[0.539,0.48],[0.533,0.65],[0.612,0.673],[0.653,0.707],[0.803,0.566],[0.866,0.782]],[[-0.018,0.658],[0.003,0.664],[0.032,0.635],[0.145,0.476],[0.134,0.525],[0.181,0.424],[0.22,0.394],[0.278,0.383],[0.381,0.418],[0.5,0.429],[0.499,0.391],[0.517,0.382],[0.501,0.382],[0.502,0.347],[0.623,0.317],[0.639,0.076],[0.695,0.052],[0.745,0.003]],[[0.868,-0.018],[0.811,0.108],[0.837,0.269],[0.807,0.342],[0.813,0.449],[0.762,0.529],[0.801,0.56],[0.68,0.683],[0.672,1.006],[0.736,1.014],[0.833,0.988],[0.865,1.018]],[[0.513,-0.019],[0.523,0.043],[0.487,0.103],[0.529,0.253],[0.488,0.311],[0.501,0.472],[0.538,0.485],[0.521,0.744],[0.488,0.849],[0.472,0.844],[0.487,0.828],[0.629,0.828],[0.619,1.016]],[[0.901,0.879],[0.712,0.838],[0.679,0.863],[0.681,0.682],[0.765,0.587],[0.764,0.547],[0.792,0.542],[0.904,0.884],[1.0,0.973]]];
// Points every `gap` painting pixels along a polyline given in painting units.
function alongPath(pts: number[][], w: number, h: number, gap: number) {
  const out = [];
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [u0, v0] = pts[i], [u1, v1] = pts[i + 1], L = Math.hypot((u1 - u0) * w, (v1 - v0) * h);
    let d = carry;
    for (; d < L; d += gap) out.push([u0 + ((u1 - u0) * d) / L, v0 + ((v1 - v0) * d) / L]);
    carry = d - L;
  }
  return out.filter(([u, v]) => u > 0.02 && u < 0.98 && v > 0.03 && v < 0.97);
}
// A ring of points round (u, v), with radii in painting units.
function circle(u: number, v: number, ru: number, rv: number, n = 12) {
  return [...Array(n)].map((_, k) => { const a = (k / n) * Math.PI * 2; return [u + Math.cos(a) * ru, v + Math.sin(a) * rv]; });
}

export const PAINT_RES = 2;
export function paintedCanvas(kind, w, h, seed, age = {}, res = PAINT_RES, into = null) {
  return atRes(res, () => {
    const c = into || makeCanvas(w * res, h * res);
    PAINTERS[kind](c.getContext('2d'), w, h, mulberry(seed));
    if (age) weather(c, seed, age);
    return c;
  });
}
