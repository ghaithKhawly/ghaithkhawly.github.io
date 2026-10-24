import './styles.css';
// Every module, in the order the cave is built. Each one may only use earlier ones while
// it sets up; see late.ts for calls the other way.
import './config';
import './util';
import { rockLoad } from './world/rock';
import './world/geometry';
import './paint/pigment';
import './paint/painters';
import './hands/silhouette';
import './hands/gestures';
import './world/scene';
import './art/layers';
import './art/guides';
import './art/strokes';
import './core/view';
import './play/stepout';
import './ui/panels';
import './play/secrets';
import './play/focus';
import './tracking/state';
import './fx/draw';
import './tracking/camera';
import './audio';
import './ui/tools';
import './play/input';
import * as THREE from 'three';
import { S } from './state';
import { GUIDES, guideProgress } from './art/guides';
import { PAINTINGS, artTex, baseTex, shadowMat } from './art/layers';
import { redrawArt } from './art/strokes';
import { audio } from './audio';
import { $, ART_H, ART_W, EYE_D, FIRE, HOLD_DWELL, params } from './config';
import { applyWindowCamera, bloom, composer, pan, vignette, win } from './core/view';
import { drawFx, drawShadows } from './fx/draw';
import { analyzeHand, coach } from './hands/gestures';
import { POSES, posePoints } from './hands/silhouette';
import { FILL_T, finish, focus, updateFinish } from './play/focus';
import { SECRETS, tmpV, updateSecrets, visibleFraction } from './play/secrets';
import { FLAKES, flakeGeo, flakePos, flakeVel, flakes, startStepOut, stepOut, updateStepOut } from './play/stepout';
import { detect, fireTarget, startMouse } from './tracking/camera';
import { G, eye, eyeTarget, lastFaceAt, lastHint, pointer, stats, syntheticHand, toShadowPoints, updateGestures } from './tracking/state';
import { openPanel, panel, panelKind } from './ui/panels';
import { drawDebug } from './ui/tools';
import { updateStatus } from './ui/status';
import { clamp, easeInOut, paintQueue, runPaintQueue, vnoise } from './util';
import { wallPoint } from './world/geometry';
import { camera, chamber, column, embers, fillLight, fireLight, flameUniforms, flames, halo, lampLight, logMat, mouth, props, stalactites, washLight } from './world/scene';

// Main loop
export let prev = performance.now();
export let hudTimer = 0;
export const forcedPose = params.get('pose');
export function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;
  S.clock += dt;
  stats.fps = stats.fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05;

  // Fire. Up at the wall it's behind you: it dims and the lamp in your hand takes over.
  S.fireLevel += (fireTarget - S.fireLevel) * (1 - Math.exp(-dt * 0.9));
  const fl = 0.84 + 0.08 * Math.sin(S.clock * 7.3) + 0.05 * Math.sin(S.clock * 13.1 + 1.3) + 0.12 * (vnoise(S.clock * 9, 0.5, 5) - 0.5);
  S.flickerNow = fl - 0.84;
  const behind = 1 - 0.78 * easeInOut(focus.t);
  fireLight.intensity = 24 * S.fireLevel * fl * behind;
  fillLight.intensity = 5 * S.fireLevel * (0.9 + 0.2 * vnoise(S.clock * 14, 2.5, 9)) * behind;
  washLight.intensity = 5 * S.fireLevel * (0.94 + S.flickerNow * 0.5) * behind;
  flames.visible = embers.visible = halo.visible = focus.t < 0.55;
  bloom.strength = 0.6 * (0.45 + 0.55 * behind);
  fireLight.position.x = FIRE.x + (vnoise(S.clock * 3, 1, 3) - 0.5) * 0.08;
  halo.material.opacity = 0.55 * S.fireLevel * fl;
  logMat.emissiveIntensity = 0.35 * S.fireLevel * fl;
  const lampFl = 0.85 + 0.25 * vnoise(S.clock * 6, 7.5, 13);
  chamber.userData.lamp.intensity = 2.2 * lampFl;
  chamber.userData.spill.material.opacity = 0.32 * lampFl;
  flameUniforms.uTime.value = S.clock;
  flameUniforms.uLevel.value = S.fireLevel;
  vignette.uniforms.uTime.value = S.clock;

  // Input → hand points in shadow-canvas pixels
  detect(now / 1000);
  let handPts = [], stick = false;
  if (forcedPose && POSES[forcedPose]) {
    S.hands = [syntheticHand(forcedPose, parseFloat(params.get('px') || '0.5'), parseFloat(params.get('py') || '0.45'))];
    S.analyses = S.hands.map((N) => analyzeHand(N, S.camAspect));
    handPts = S.hands.map(toShadowPoints);
    G.label = S.analyses[0].label; G.hold += dt;
  } else if (S.mode === 'camera') {
    S.analyses = S.hands.map((N) => analyzeHand(N, S.camAspect));
    handPts = S.hands.map(toShadowPoints);
    updateGestures(dt, S.clock);
  } else if (S.mode === 'mouse') {
    S.analyses = [];
    // The cursor is a fingertip, or a hand holding charcoal; while a painting is
    // being finished, a ghost hand does the work.
    const hs = 30 - 14 * easeInOut(focus.t);
    if (finish.g && finish.g.stencil && finish.hand) {
      // A stencil: the hand stays pressed flat to the rock while the ochre is blown.
      const g = finish.g;
      handPts = [posePoints('palm', (g.x + g.w * 0.5) / 2, (g.y + g.h * 0.47) / 2, g.h / 4.1, 0, 9)];
    } else if (finish.g && finish.hand) {
      const [x, y] = finish.hand;
      handPts = [posePoints('point', (finish.g.x + x) / 2, (finish.g.y + y) / 2, hs, -0.35 + Math.sin(S.clock * 9) * 0.06, 8)];
      stick = finish.t > FILL_T;
    } else if (pointer.inside) {
      handPts = [posePoints('point', pointer.ax / 2, pointer.ay / 2, hs, -0.35, 8)];
      stick = focus.active && focus.guide && focus.guide.tool === 'charcoal';
    }
  }

  // Head → window
  if (S.mode === 'camera' && S.faceDetector && S.clock - lastFaceAt > 1.2 && !S.eyeLocked) { eyeTarget.x *= 0.98; eyeTarget.y *= 0.98; eyeTarget.z += (EYE_D - eyeTarget.z) * 0.02; }
  const k = 1 - Math.exp(-dt * 5);
  if (!pointer.drawing) { eye.x += (eyeTarget.x - eye.x) * k; eye.y += (eyeTarget.y - eye.y) * k; }
  eye.z += (eyeTarget.z - eye.z) * k;
  eye.z = Math.max(1.6, eye.z);
  pan.x += (pan.target - pan.x) * k;
  // Window: blend between standing back and being up at the wall.
  focus.t = clamp(focus.t + (focus.active ? dt : -dt) / 0.9, 0, 1);
  if (!focus.active && focus.t === 0) focus.guide = null;
  const fe = easeInOut(focus.t), ft = focus.target;
  win.x = THREE.MathUtils.lerp(pan.x, ft.x, fe);
  win.y = THREE.MathUtils.lerp(0, ft.y, fe);
  win.z = THREE.MathUtils.lerp(0, ft.z, fe);
  win.s = THREE.MathUtils.lerp(1, ft.s, fe);
  applyWindowCamera(eye);
  stalactites.visible = column.visible = props.visible = fe < 0.5;
  // The cave mouth frames the window, so it travels with you when you look along the wall.
  if (mouth) { mouth.visible = fe < 0.5; mouth.position.x = pan.x; }
  stalactites.position.x = pan.x;

  // The oil lamp follows the painting hand while you're up at the wall.
  const lampAt = finish.g && finish.hand ? [finish.g.x + finish.hand[0], finish.g.y + finish.hand[1]] : [pointer.ax, pointer.ay];
  wallPoint(lampAt[0] / ART_W, lampAt[1] / ART_H, tmpV);
  lampLight.position.set(tmpV.x + 0.35, tmpV.y + 0.3, tmpV.z + 0.55);
  lampLight.intensity = fe * 3.2 * (0.9 + 0.2 * vnoise(S.clock * 11, 3.3, 17));

  // Shadows + glow
  const wantShadow = handPts.length ? (S.mode === 'mouse' ? 0.7 : 0.86) * (0.92 + S.flickerNow * 0.4) * (0.5 + 0.5 * S.fireLevel) : 0;
  S.shadowAlpha += (wantShadow - S.shadowAlpha) * (1 - Math.exp(-dt * 10));
  shadowMat.opacity = S.shadowAlpha;
  if (handPts.length || S.shadowAlpha > 0.01) drawShadows(handPts, stick);

  for (const p of PAINTINGS) {
    if (p.mesh) p.mesh.material.opacity = p.alpha * 0.94;
    let target = 0;
    if (S.clock >= p.boostFrom && S.clock <= p.boostTo) target = 0.85;
    else if ((panelKind === 'experience' && (p.group === 'herd' || p.group === 'hunt' || p.id === 'g-wolf')) || (panelKind === 'about' && (p.group === 'self' || p.id === 'g-rabbit'))) target = 0.3;
    if (G.dwell.id === p.id && stepOut.id !== p.id) target = Math.max(target, 0.2 + (G.dwell.t / HOLD_DWELL) * 0.75);
    if (S.mode === 'mouse' && p.project && stepOut.id !== p.id && !focus.active) target = Math.max(target, 0.18 + 0.12 * Math.sin(S.clock * 2.2));
    if (p.group === 'traced') target *= 0.25;   // a big, close painting needs little glow to read as alive
    p.g += (target - p.g) * (1 - Math.exp(-dt * 6));
  }
  for (const s of SECRETS) if (s.decal) (s.decal.material as THREE.MeshStandardMaterial).emissiveIntensity = s.found ? 0.25 + 0.5 * Math.max(0, 1 - (S.clock - s.foundAt) / 2.5) : 0;
  drawFx(handPts);

  updateFinish(dt);
  updateSecrets(dt);
  updateStepOut(dt, S.clock);
  if (S.flakeAge < 3) {
    S.flakeAge += dt;
    for (let i = 0; i < FLAKES; i++) {
      flakeVel[i * 3 + 1] -= 0.9 * dt;
      flakePos[i * 3] += flakeVel[i * 3] * dt; flakePos[i * 3 + 1] += flakeVel[i * 3 + 1] * dt; flakePos[i * 3 + 2] += flakeVel[i * 3 + 2] * dt;
    }
    flakeGeo.attributes.position.needsUpdate = true;
    flakes.material.opacity = clamp(1 - S.flakeAge / 2.2, 0, 1);
  }
  if (S.artRect) { redrawArt(...S.artRect); S.artRect = null; }
  if (S.artUploadPending && now - S.artUploadAt > 40) { artTex.needsUpdate = true; S.artUploadPending = false; S.artUploadAt = now; }
  if (S.baseDirty && now - S.baseUploadAt > 500) { baseTex.needsUpdate = true; S.baseDirty = false; S.baseUploadAt = now; }

  composer.render();

  hudTimer += dt;
  if (hudTimer > 0.12) {
    hudTimer = 0;
    const tracked = S.mode === 'camera' && S.headOn && S.faceRef && S.clock - lastFaceAt < 1.2;
    updateStatus(!!tracked);
    drawDebug();
  }
  requestAnimationFrame(frame);
}
redrawArt();
requestAnimationFrame(frame);
setTimeout(runPaintQueue, 0);

// Test hooks (used by the automated check; harmless for visitors).
export function artToClient(ax, ay) {
  const v = wallPoint(ax / ART_W, ay / ART_H).project(camera);
  return [((v.x + 1) / 2) * window.innerWidth, ((1 - v.y) / 2) * window.innerHeight];
}
declare global { interface Window { __cave: Record<string, any> } }
window.__cave = {
  get mode() { return S.mode; },
  get label() { return G.label; },
  get analyses() { return S.analyses.map((a) => ({ label: a.label, ext: a.ext, thumbOut: a.thumbOut, up: a.up, sideways: a.sideways, tipsTogether: a.tipsTogether, spread: a.spread })); },
  get panel() { return panelKind; },
  get stepOut() { return stepOut.id; },
  get stepOutState() { return stepOut.device ? { t: stepOut.t, dir: stepOut.dir, pos: stepOut.device.position.toArray().map((v) => +v.toFixed(2)) } : null; },
  get stats() { return { ...stats, eye: { ...eye }, faceRef: S.faceRef, faceSamples: S.faceCal.length }; },
  get guides() { return GUIDES.map((g) => ({ id: g.id, done: g.done, progress: +guideProgress(g).toFixed(2), precision: g.inBox ? +(g.near / g.inBox).toFixed(2) : null })); },
  get focus() { return { active: focus.active, t: +focus.t.toFixed(2), guide: focus.guide && focus.guide.id, finishing: !!finish.g }; },
  get secrets() { return SECRETS.map((s) => ({ id: s.id, found: s.found, visible: +visibleFraction(s).toFixed(2) })); },
  get audio() { return audio ? { state: audio.ac.state, fire: audio.fire } : null; },
  get hint() { return lastHint; },
  get pending() { return paintQueue.length + rockLoad.pending; },
  setEye: (x, y, z = EYE_D, snap = false) => { S.eyeLocked = true; eyeTarget.x = x; eyeTarget.y = y; eyeTarget.z = z; if (snap) Object.assign(eye, eyeTarget); },
  guidePath: (id) => GUIDES.find((g) => g.id === id).samples.map(([x, y]) => artToClient(x, y)),
  guideCenter: (id) => { const g = GUIDES.find((q) => q.id === id); return artToClient(g.x + g.w / 2, g.y + g.h / 2); },
  analyzePose: (name) => analyzeHand(syntheticHand(name, 0.5, 0.5), S.camAspect).label,
  coachPose: (name) => { const c = coach(analyzeHand(syntheticHand(name, 0.5, 0.5), S.camAspect)); return c ? `${c.name}: ${c.miss[1]}` : null; },
  openPanel, startStepOut: (id) => startStepOut(PAINTINGS.find((p) => p.id === id)),
};
if (params.get('start') === 'mouse') startMouse();
