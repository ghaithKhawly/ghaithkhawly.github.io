import { late } from '../late';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { S } from '../state';
import { ART_H, ART_W, WALL_H, WALL_W } from '../config';
import { pan, screenW } from '../core/view';
import { clamp, easeInOut, makeCanvas, mulberry, smooth } from '../util';
import { wallPoint } from '../world/geometry';
import { scene } from '../world/scene';

// Step-out objects (the painted phone and laptop become real)
export function screenTexture(draw, w, h) {
  const c = makeCanvas(w, h);
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
export const deviceMat = new THREE.MeshStandardMaterial({ color: 0x1d1c1f, metalness: 0.55, roughness: 0.38 });
export function makePhone() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.68, 0.035, 4, 0.045), deviceMat));
  const tex = screenTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#13261f'); bg.addColorStop(1, '#0b1411');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9fe0c0'; ctx.font = '600 22px system-ui, sans-serif'; ctx.fillText('Savings', 28, 64);
    ctx.fillStyle = '#ffffff'; ctx.font = '700 54px system-ui, sans-serif'; ctx.fillText('$2,480', 28, 130);
    ctx.fillStyle = '#6fa58c'; ctx.font = '500 18px system-ui, sans-serif'; ctx.fillText('Goal: new laptop · 62%', 28, 162);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(28, 182, w - 56, 14);
    ctx.fillStyle = '#5ee0a0'; ctx.fillRect(28, 182, (w - 56) * 0.62, 14);
    [0.4, 0.7, 0.55, 0.9, 0.62, 0.8, 0.5].forEach((b, i) => { ctx.fillStyle = i === 3 ? '#5ee0a0' : 'rgba(94,224,160,0.35)'; const bw = (w - 56) / 7 - 10; ctx.fillRect(28 + i * (bw + 10), 420 - b * 170, bw, b * 170); });
    ctx.fillStyle = '#6fa58c'; ctx.font = '500 16px system-ui, sans-serif'; ctx.fillText('This week', 28, 450);
    for (let i = 0; i < 3; i++) {
      const y = 490 + i * 72;
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(22, y, w - 44, 60);
      ctx.fillStyle = '#e8f5ee'; ctx.font = '500 18px system-ui, sans-serif'; ctx.fillText(['Groceries', 'Transport', 'Coffee'][i], 40, y + 37);
      ctx.fillStyle = '#ff9d7a'; ctx.textAlign = 'right'; ctx.fillText(['−$42', '−$9', '−$4'][i], w - 40, y + 37); ctx.textAlign = 'left';
    }
  }, 300, 620);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.62), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.z = 0.0185;
  g.add(screen);
  return g;
}
export function makeLaptop() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.03, 0.6, 3, 0.012), deviceMat));
  const lid = new THREE.Group();
  lid.position.set(0, 0.015, -0.3);
  lid.rotation.x = -0.22;
  const lidMesh = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.58, 0.02, 3, 0.01), deviceMat);
  lidMesh.position.y = 0.29;
  lid.add(lidMesh);
  const tex = screenTexture((ctx, w, h) => {
    ctx.fillStyle = '#0e1320'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7aa2ff'; ctx.font = '600 24px ui-monospace, monospace'; ctx.fillText('Medical API · v1', 30, 50);
    [['GET', '/patients', '#5ee0a0'], ['POST', '/patients', '#ffcf66'], ['GET', '/appointments/{id}', '#5ee0a0'], ['PUT', '/records/{id}', '#7aa2ff'], ['DELETE', '/sessions', '#ff7a7a']].forEach(([m, path, c], i) => {
      const y = 92 + i * 52;
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(24, y - 30, w - 48, 42);
      ctx.fillStyle = c; ctx.font = '700 18px ui-monospace, monospace'; ctx.fillText(m, 40, y);
      ctx.fillStyle = '#d7def0'; ctx.font = '500 18px ui-monospace, monospace'; ctx.fillText(path, 140, y);
    });
    ctx.fillStyle = '#8b95b0'; ctx.font = '500 16px ui-monospace, monospace';
    ['{', '  "id": 1042,', '  "name": "…",', '  "visits": 7', '}'].forEach((l, i) => ctx.fillText(l, 40, 380 + i * 24));
  }, 600, 400);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.52), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.set(0, 0.29, 0.0105);
  lid.add(screen);
  g.add(lid);
  return g;
}
export const DEVICES = { phone: makePhone(), laptop: makeLaptop() };
export const deviceLight = new THREE.PointLight(0xffc48a, 0, 0, 2);
scene.add(deviceLight);
for (const dvc of Object.values(DEVICES)) { dvc.visible = false; scene.add(dvc); }

// Flakes of pigment that peel off when a painting steps out.
export const FLAKES = 360;
export const flakeGeo = new THREE.BufferGeometry();
export const flakePos = new Float32Array(FLAKES * 3), flakeVel = new Float32Array(FLAKES * 3);
flakeGeo.setAttribute('position', new THREE.BufferAttribute(flakePos, 3));
export const flakes = new THREE.Points(flakeGeo, new THREE.PointsMaterial({ color: 0xc0643a, size: 0.018, transparent: true, opacity: 0, depthWrite: false }));
flakes.frustumCulled = false;
scene.add(flakes);
export function burstFlakes(center, w, h) {
  const r = mulberry((Math.random() * 1e9) | 0);
  for (let i = 0; i < FLAKES; i++) {
    flakePos[i * 3] = center.x + (r() - 0.5) * w; flakePos[i * 3 + 1] = center.y + (r() - 0.5) * h; flakePos[i * 3 + 2] = center.z + 0.02;
    flakeVel[i * 3] = (r() - 0.5) * 0.5; flakeVel[i * 3 + 1] = r() * 0.4; flakeVel[i * 3 + 2] = 0.3 + r() * 0.9;
  }
  flakeGeo.attributes.position.needsUpdate = true;
  S.flakeAge = 0;
}

export const stepOut = { id: null, t: 0, dir: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), device: null, painting: null, startScale: 1 };
export function startStepOut(painting) {
  if (stepOut.id === painting.id && stepOut.dir >= 0) return;
  if (stepOut.id && stepOut.id !== painting.id) finishReturn();
  const dvc = DEVICES[painting.project];
  const u = (painting.x + painting.w / 2) / ART_W, v = (painting.y + painting.h / 2) / ART_H;
  wallPoint(u, v, stepOut.from);
  stepOut.from.z += 0.05;
  const worldW = (painting.w / ART_W) * WALL_W, worldH = (painting.h / ART_H) * WALL_H;
  const narrow = window.innerWidth <= 720;
  stepOut.to.set(pan.x - screenW * (narrow ? 0.05 : 0.19), (narrow ? 0.5 : 0) + (painting.project === 'phone' ? 0.0 : -0.2), narrow ? -0.9 : -0.75);
  stepOut.id = painting.id; stepOut.painting = painting; stepOut.device = dvc; stepOut.t = 0; stepOut.dir = 1;
  stepOut.startScale = painting.project === 'phone' ? worldH / 0.68 : worldW / 0.9;
  dvc.visible = true;
  burstFlakes(stepOut.from, worldW, worldH);
  late.playChime('project');
  late.openPanel('project', painting.project);
}
export function returnStepOut() { if (stepOut.id) stepOut.dir = -1; }
export function finishReturn() {
  if (!stepOut.device) return;
  stepOut.device.visible = false;
  stepOut.painting.alpha = 1;
  stepOut.id = null; stepOut.device = null; stepOut.painting = null; stepOut.dir = 0;
  deviceLight.intensity = 0;
}
export function updateStepOut(dt, time) {
  if (!stepOut.id) return;
  stepOut.t = clamp(stepOut.t + (dt / 1.5) * stepOut.dir, 0, 1);
  const e = easeInOut(stepOut.t);
  const dvc = stepOut.device;
  dvc.position.lerpVectors(stepOut.from, stepOut.to, e);
  dvc.position.y += Math.sin(e * Math.PI) * 0.25 + (stepOut.t === 1 ? Math.sin(time * 1.4) * 0.02 : 0);
  const s = THREE.MathUtils.lerp(stepOut.startScale, 1, e);
  const isPhone = stepOut.painting.project === 'phone';
  dvc.scale.set(s, s, Math.max(0.02, e));
  dvc.rotation.set(isPhone ? 0 : THREE.MathUtils.lerp(Math.PI / 2, 0.5, e), THREE.MathUtils.lerp(0, isPhone ? 0.35 : 0.45, e) + (stepOut.t === 1 ? Math.sin(time * 0.6) * 0.06 : 0), 0);
  // Fade the painting in a few steps: re-uploading the whole paint layer every frame is expensive.
  const fade = Math.round((1 - smooth(0.0, 0.5, stepOut.t)) * 6) / 6;
  stepOut.painting.alpha = fade;
  deviceLight.position.set(dvc.position.x + 0.6, dvc.position.y + 0.4, dvc.position.z + 0.9);
  deviceLight.intensity = e * 1.6;
  if (stepOut.dir < 0 && stepOut.t === 0) finishReturn();
}
