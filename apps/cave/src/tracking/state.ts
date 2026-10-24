import { late, provide } from '../late';
import { S } from '../state';
import { CV } from '../content';
import { PAINTINGS, STENCILS, baseCanvas, makeGlowSprite } from '../art/layers';
import { $, ART_H, ART_W, EYE_D, HEAD_GAIN, HOLD_DWELL, HOLD_GESTURE, HOLD_PALM, SCREEN_H, SHADOW_MAG, SH_H, SH_W, WALL_H, WALL_W } from '../config';
import { coach } from '../hands/gestures';
import { POSES, makeStencil } from '../hands/silhouette';
import { startStepOut, stepOut } from '../play/stepout';
import { openPanel, toast } from '../ui/panels';
import { OneEuro, clamp, deadzone } from '../util';

// Earlier modules reach these through `late` (see late.ts). The getters are lazy, so
// registering before the declarations below is safe.
provide({ get setGestureUI() { return setGestureUI; } });

// Tracking state
// 'idle' | 'camera' | 'mouse'
export const video = $('cam');
// arrays of 21 mirrored normalized points (camera mode)
export const eye = { x: 0, y: 0, z: EYE_D }, eyeTarget = { x: 0, y: 0, z: EYE_D };
export let lastFaceAt = -10;
export const faceF = { cx: new OneEuro(0.5, 4), cy: new OneEuro(0.5, 4), fw: new OneEuro(0.4, 2) };
export const faceHeld = { cx: 0.5, cy: 0.5, fw: 0.2 };
export const pointer = { inside: false, ax: 1024, ay: 470, down: false, drawing: false, panning: false, lastX: 0, moved: 0, lastT: 0, strokeLen: 0 };
export const G = { label: 'none', history: [], hold: 0, latched: null, wrist: [], dwell: { id: null, t: 0 } };
export const stats = { fps: 0, detectMs: 0, delegate: '—' };
export let hintShown = false;

export function onFace(det, t) {
  const vw = video.videoWidth, vh = video.videoHeight;
  const b = det.boundingBox;
  const rcx = (b.originX + b.width / 2) / vw, rcy = (b.originY + b.height / 2) / vh, rfw = b.width / vw;
  // Filter, then ignore movements smaller than detection noise.
  faceHeld.cx = deadzone(faceHeld.cx, faceF.cx.filter(rcx, t), 0.004);
  faceHeld.cy = deadzone(faceHeld.cy, faceF.cy.filter(rcy, t), 0.004);
  faceHeld.fw = deadzone(faceHeld.fw, faceF.fw.filter(rfw, t), 0.003);
  lastFaceAt = t;
  if (!S.faceRef) {
    S.faceCal.push({ ...faceHeld });
    if (S.faceCal.length >= 12) {
      const avg = (k) => S.faceCal.reduce((a, f) => a + f[k], 0) / S.faceCal.length;
      S.faceRef = { cx: avg('cx'), cy: avg('cy'), fw: avg('fw') };
      S.faceCal = [];
      showSecretsHint();
    }
    return;
  }
  if (!S.headOn || S.eyeLocked) return;
  eyeTarget.x = clamp((S.faceRef.cx - faceHeld.cx) * SCREEN_H * HEAD_GAIN, -1.7, 1.7);
  eyeTarget.y = clamp((S.faceRef.cy - faceHeld.cy) * SCREEN_H * HEAD_GAIN * 0.7, -0.9, 0.9);
  eyeTarget.z = EYE_D * clamp(S.faceRef.fw / faceHeld.fw, 0.6, 1.6);
}
export function showSecretsHint() {
  if (hintShown) return;
  hintShown = true;
  toast(S.mode === 'camera'
    ? 'Three things are hidden. Lean to peek behind the stone column, and lean left and right to look inside the glowing crack.'
    : late.tiltOn
      ? 'Three things are hidden. Drag along the wall, then tilt your phone to peek behind the column and into the glowing crack.'
      : matchMedia('(pointer: coarse)').matches
        ? 'Three things are hidden. Drag along the wall to look past the stone column and into the glowing crack.'
        : 'Three things are hidden. Move to the edges of the screen to lean: peek behind the column and into the glowing crack.', 7);
}

// Light smoothing of hand landmarks so shadows don't shiver.
export let smoothHands = [];
export function smoothLandmarks(next) {
  const out = next.map((h) => {
    const prev = smoothHands.find((p) => Math.hypot(p[0].x - h[0].x, p[0].y - h[0].y) < 0.15);
    return prev ? h.map((pt, i) => ({ x: prev[i].x + (pt.x - prev[i].x) * 0.6, y: prev[i].y + (pt.y - prev[i].y) * 0.6 })) : h;
  });
  smoothHands = out;
  return out;
}

export function toShadowPoints(N) {
  const c = N[9];
  const cu = 0.5 + (c.x - 0.5) * 0.66, cv = 0.44 + (c.y - 0.5) * 0.7;
  // Hands held close to the camera would cast a wall-sized shadow; compress large hands.
  const handSize = Math.hypot((N[0].x - N[9].x) * S.camAspect, N[0].y - N[9].y);
  const tame = handSize > 0.12 ? Math.pow(0.12 / handSize, 0.8) : 1;
  const k = 3.0 * SHADOW_MAG * tame * (1 + S.flickerNow * 0.025);
  return N.map((p) => ({
    x: cu * SH_W + (p.x - c.x) * S.camAspect * k * (SH_W / WALL_W),
    y: cv * SH_H + (p.y - c.y) * k * (SH_H / WALL_H),
  }));
}
export function syntheticHand(name, nx, ny) {
  const pose = POSES[name];
  const [px, py] = pose[9];
  const s = 0.11;
  return pose.map(([x, y]) => ({ x: nx + ((x - px) * s) / S.camAspect, y: ny + (y - py) * s }));
}

export function updateGestures(dt, now) {
  const main = S.analyses.find((a) => a.label !== 'hand') || S.analyses[0] || null;
  const raw = main ? main.label : 'none';
  G.history.push(raw);
  if (G.history.length > 10) G.history.shift();
  const counts = {};
  for (const l of G.history) counts[l] = (counts[l] || 0) + 1;
  let stable = 'hand', best = 0;
  for (const [l, c] of Object.entries(counts) as [string, number][]) if (c > best) { best = c; stable = l; }
  if (best < 6) stable = main ? 'hand' : 'none';
  if (stable !== G.label) {
    G.label = stable; G.hold = 0;
    if (stable === 'hand' || stable === 'none') G.latched = null;
  } else G.hold += dt;

  if (main) {
    G.wrist.push({ t: now, x: main.N[0].x, y: main.N[0].y });
    while (G.wrist.length && now - G.wrist[0].t > 0.8) G.wrist.shift();
  } else G.wrist.length = 0;
  const lastW = G.wrist[G.wrist.length - 1];
  const still = G.wrist.length > 5 && G.wrist.every((w) => Math.hypot(w.x - lastW.x, w.y - lastW.y) < 0.03);

  let progress = 0, hint = 'Raise a hand into the firelight', near = null;
  if (G.label === 'wolf') { progress = G.hold / HOLD_GESTURE; hint = 'A wolf. Hold it still.'; }
  else if (G.label === 'rabbit') { progress = G.hold / HOLD_GESTURE; hint = 'A hare. Hold it still.'; }
  else if (G.label === 'palm') { progress = still ? G.hold / HOLD_PALM : 0; hint = still ? 'An open palm. Hold it still.' : 'An open palm. Hold still to leave a print.'; }
  else if (G.label === 'hand' && main) {
    const c = coach(main);
    if (c) { near = c.name; hint = `Almost ${SHAPE_NAME[c.name]}: ${c.miss[1]}`; }
    else hint = 'Make a wolf, a hare or an open palm';
  }

  if (G.latched !== G.label) {
    if (G.label === 'wolf' && G.hold >= HOLD_GESTURE) { G.latched = 'wolf'; late.playChime('wolf'); openPanel('experience'); }
    else if (G.label === 'rabbit' && G.hold >= HOLD_GESTURE) { G.latched = 'rabbit'; late.playChime('rabbit'); openPanel('about'); }
    else if (G.label === 'palm' && G.hold >= HOLD_PALM && still && main) { G.latched = 'palm'; leaveHandprint(toShadowPoints(main.N)); late.playChime('palm'); openPanel('contact'); }
  }
  if (G.latched === G.label && G.label !== 'hand' && G.label !== 'none') progress = 1;

  // Dwell: the shadow's index fingertip touching a project painting.
  let dwellTarget = null;
  if (main && G.label !== 'palm') {
    const tip = toShadowPoints(main.N)[8];
    const ax = (tip.x / SH_W) * ART_W, ay = (tip.y / SH_H) * ART_H;
    dwellTarget = PAINTINGS.find((p) => p.project && ax > p.x - p.w * 0.15 && ax < p.x + p.w * 1.15 && ay > p.y - p.h * 0.15 && ay < p.y + p.h * 1.15) || null;
  }
  if (dwellTarget && dwellTarget.id === G.dwell.id) G.dwell.t += dt; else G.dwell = { id: dwellTarget ? dwellTarget.id : null, t: 0 };
  if (dwellTarget && stepOut.id !== dwellTarget.id) {
    progress = G.dwell.t / HOLD_DWELL;
    hint = `Touching ${CV.projects[dwellTarget.project].title}. Hold it there.`;
    if (G.dwell.t >= HOLD_DWELL) startStepOut(dwellTarget);
  }
  setGestureUI(hint, clamp(progress, 0, 1));
  for (const node of document.querySelectorAll('.shape')) {
    node.classList.toggle('active', (node as HTMLElement).dataset.shape === G.label);
    node.classList.toggle('near', (node as HTMLElement).dataset.shape === near);
  }
}

export let lastHint = '';
const SHAPE_NAME = { wolf: 'a wolf', rabbit: 'a hare', palm: 'an open palm' };
export function setGestureUI(text, progress) {
  if (text !== lastHint) { $('gesture-label').textContent = text; lastHint = text; }
  $('gesture').style.setProperty('--p', clamp(progress, 0, 1).toFixed(2));   // fills the hand stencil
}

// pts: 21 points in shadow-canvas pixels.
export function leaveHandprint(pts) {
  const art = pts.map((p) => ({ x: p.x * (ART_W / SH_W), y: p.y * (ART_H / SH_H) }));
  const s = Math.hypot(art[0].x - art[9].x, art[0].y - art[9].y) * 0.95;
  const st = makeStencil(art, s, 'red', (Math.random() * 1e6) | 0, 1);
  STENCILS.push({ ...st, alpha: 1, glowUntil: S.clock + 4, born: S.clock, glow: makeGlowSprite(st.canvas, st.canvas.width / 2, st.canvas.height / 2) });
  baseCanvas.getContext('2d').drawImage(st.canvas, st.x, st.y);
  S.baseDirty = true; S.baseUploadAt = 0;
}
