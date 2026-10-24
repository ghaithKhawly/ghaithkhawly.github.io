import { late } from '../late';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { S } from '../state';
import { ART_H, ART_W, EYE_D, WALL_H, WALL_W } from '../config';
import { clamp, easeInOut, mulberry, smooth } from '../util';
import { wallPoint } from '../world/geometry';
import { scene } from '../world/scene';
import { type ProjectInfo, projectById, screenUrl } from '../content/projects';

// Step-out devices: a project's painting becomes the phone or laptop it runs on, showing
// real screens. One phone and one laptop serve every project; their screens are swapped.
export const deviceMat = new THREE.MeshStandardMaterial({ color: 0x1d1c1f, metalness: 0.55, roughness: 0.38 });
// Lit screens, kept under the bloom threshold so a white page doesn't flare.
const SCREEN_ON = 0xc4c4c4;
const screenMat = () => new THREE.MeshBasicMaterial({ color: 0x0b0b0c, toneMapped: false });
export const PHONE = { w: 0.34, h: 0.71, screenW: 0.312, screenH: 0.675 };   // screen is 480 × 1039
export function makePhone() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new RoundedBoxGeometry(PHONE.w, PHONE.h, 0.035, 4, 0.045), deviceMat));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PHONE.screenW, PHONE.screenH), screenMat());
  screen.position.z = 0.0185;
  g.add(screen);
  g.userData.screen = screen;
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
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.525), screenMat());   // 16:10
  screen.position.set(0, 0.29, 0.0105);
  lid.add(screen);
  g.add(lid);
  g.userData.screen = screen;
  return g;
}
export const DEVICES = { phone: makePhone(), laptop: makeLaptop() };

// Screens load on demand; each is kept once loaded.
const loaded = new Map<string, Promise<THREE.Texture>>();
function screenTexture(project: ProjectInfo, i: number) {
  const key = `${project.id}/${i}`;
  if (!loaded.has(key)) {
    loaded.set(key, screenUrl(project, project.screens[i]).then((url) => new THREE.TextureLoader().loadAsync(url)).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
    }));
  }
  return loaded.get(key);
}
export const screens = { project: null as ProjectInfo | null, index: 0, at: 0, auto: true, loading: 0 };
// Show screen i of the open project (wrapping round). `user` stops the slow auto-advance.
export function showScreen(i: number, user = false) {
  const p = screens.project;
  if (!p || !p.screens.length) return;
  screens.index = ((i % p.screens.length) + p.screens.length) % p.screens.length;
  screens.at = S.clock;
  if (user) screens.auto = false;
  const want = screens.index, dvc = DEVICES[p.device];
  screens.loading++;
  screenTexture(p, want).then((t) => {
    if (screens.project !== p || screens.index !== want) return;
    const m = dvc.userData.screen.material as THREE.MeshBasicMaterial;
    m.map = t; m.color.set(SCREEN_ON); m.needsUpdate = true;
  }).catch((e) => console.error(e)).finally(() => { screens.loading--; });
  late.screenChanged?.();
}
// Fetch the rest of a project's screens in the background once the first is up.
function preload(p: ProjectInfo) { p.screens.forEach((_, i) => screenTexture(p, i)); }

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

export const stepOut = { id: null, t: 0, dir: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), device: null, painting: null, startScale: 1, yaw: 0 };
export function startStepOut(painting) {
  const project = projectById(painting.project);
  if (!project) return;
  if (stepOut.id === painting.id && stepOut.dir >= 0) return;
  if (stepOut.id && stepOut.id !== painting.id) finishReturn();
  late.playChime('project');
  // The view walks up to the painting and the words go on the rock beside it (see focus.ts).
  late.openPanel('project', project.id);
  if (!project.device || !project.screens.length) return;   // nothing to step out yet: just the words
  const dvc = DEVICES[project.device], isPhone = project.device === 'phone';
  const u = (painting.x + painting.w / 2) / ART_W, v = (painting.y + painting.h / 2) / ART_H;
  wallPoint(u, v, stepOut.from);
  stepOut.from.z += 0.05;
  // It comes off the wall toward you, along the line from your eye to the painting, so it
  // stays where the painting was on screen and ends up about a third bigger than it.
  const worldW = (painting.w / ART_W) * WALL_W, worldH = (painting.h / ART_H) * WALL_H;
  const t = late.focus.target, eye = new THREE.Vector3(t.x, t.y, t.z + EYE_D * t.s);
  const k = Math.min(0.85, isPhone ? PHONE.h / (1.35 * worldH) : 0.9 / (1.15 * worldW));
  stepOut.to.copy(eye).lerp(stepOut.from, k);
  if (!isPhone) stepOut.to.y -= 0.12;
  const side = late.focus.target.x > stepOut.from.x ? 1 : -1;   // turn a little toward the words
  stepOut.yaw = window.innerWidth <= 720 ? 0 : side * 0.22;
  stepOut.id = painting.id; stepOut.painting = painting; stepOut.device = dvc; stepOut.t = 0; stepOut.dir = 1;
  stepOut.startScale = isPhone ? worldH / PHONE.h : worldW / 0.9;
  dvc.visible = true;
  screens.project = project; screens.auto = true;
  const m = dvc.userData.screen.material as THREE.MeshBasicMaterial;
  m.map = null; m.color.set(0x0b0b0c); m.needsUpdate = true;
  showScreen(0);
  preload(project);
  burstFlakes(stepOut.from, worldW, worldH);
}
export function returnStepOut() { if (stepOut.id) stepOut.dir = -1; }
export function finishReturn() {
  if (!stepOut.device) return;
  stepOut.device.visible = false;
  stepOut.painting.alpha = 1;
  stepOut.id = null; stepOut.device = null; stepOut.painting = null; stepOut.dir = 0;
  screens.project = null;
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
  const isPhone = dvc === DEVICES.phone;
  dvc.scale.set(s, s, Math.max(0.02, e));
  dvc.rotation.set(isPhone ? 0 : THREE.MathUtils.lerp(Math.PI / 2, 0.42, e), THREE.MathUtils.lerp(0, stepOut.yaw, e) + (stepOut.t === 1 ? Math.sin(time * 0.6) * 0.04 : 0), 0);
  // Screens move on by themselves, slowly, until the visitor picks one.
  if (stepOut.t === 1 && stepOut.dir > 0 && screens.auto && S.clock - screens.at > 6) showScreen(screens.index + 1);
  // Fade the painting in a few steps: re-uploading the whole paint layer every frame is expensive.
  const fade = Math.round((1 - smooth(0.0, 0.5, stepOut.t)) * 6) / 6;
  stepOut.painting.alpha = fade;
  deviceLight.position.set(dvc.position.x + 0.6, dvc.position.y + 0.4, dvc.position.z + 0.9);
  deviceLight.intensity = e * 1.6;
  if (stepOut.dir < 0 && stepOut.t === 0) finishReturn();
}
