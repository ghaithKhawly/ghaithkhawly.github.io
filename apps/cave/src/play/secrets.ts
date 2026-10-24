import { late } from '../late';
import type { Secret } from '../types';
import * as THREE from 'three';
import { S } from '../state';
import { PAINTINGS } from '../art/layers';
import { ART_H, ART_W, COLUMN, WALL_H, WALL_W } from '../config';
import { pan } from '../core/view';
import { boost, openPanel, panelKind, toast } from '../ui/panels';
import { clamp } from '../util';
import { columnRadius, wallPoint, wallZ } from '../world/geometry';
import { MOUTH_Z, camera, certsDecal, inCrack, langDecal, mouthData, mouthDims } from '../world/scene';

// Hidden things: found by leaning until they come into view
export const owl = PAINTINGS.find((p) => p.id === 'owl');
export const SECRETS: Secret[] = [
  { id: 'education', title: 'Education', where: 'behind the column', seen: 0, found: false,
    points: () => [[0.5, 0.5], [0.3, 0.3], [0.7, 0.3], [0.3, 0.75], [0.7, 0.75]].map(([u, v]) => wallPoint((owl.x + u * owl.w) / ART_W, (owl.y + v * owl.h) / ART_H)) },
  { id: 'certs', title: 'Certifications', where: 'inside the crack, on the right wall', seen: 0, found: false, decal: certsDecal,
    points: () => [[0, 0], [-0.25, 0.2], [0.25, 0.2], [-0.25, -0.2], [0.25, -0.2]].map(([x, y]) => certsDecal.localToWorld(new THREE.Vector3(x, y, 0))) },
  { id: 'languages', title: 'Languages', where: 'inside the crack, on the left wall', seen: 0, found: false, decal: langDecal,
    points: () => [[0, 0], [-0.25, 0.2], [0.25, 0.2], [-0.25, -0.2], [0.25, -0.2]].map(([x, y]) => langDecal.localToWorld(new THREE.Vector3(x, y, 0))) },
];
export const tmpV = new THREE.Vector3(), rayDir = new THREE.Vector3();
// Cheap analytic occlusion: the column, the cave mouth, and the wall (with its crack).
export function blocked(from, to, targetOnWall) {
  rayDir.copy(to).sub(from);
  const len = rayDir.length();
  rayDir.divideScalar(len);
  // Column
  const dxz = rayDir.x * rayDir.x + rayDir.z * rayDir.z;
  if (dxz > 1e-6) {
    const t = clamp(((COLUMN.x - from.x) * rayDir.x + (COLUMN.z - from.z) * rayDir.z) / dxz, 0, len);
    const px = from.x + rayDir.x * t, py = from.y + rayDir.y * t, pz = from.z + rayDir.z * t;
    if (py > COLUMN.bottom && py < COLUMN.bottom + COLUMN.height && Math.hypot(px - COLUMN.x, pz - COLUMN.z) < columnRadius(py) * 1.15) return true;
  }
  // Cave mouth (approximated by its plane)
  if (mouthData && Math.abs(rayDir.z) > 1e-6) {
    const t = (MOUTH_Z - from.z) / rayDir.z;
    if (t > 0 && t < len) {
      const x = from.x + rayDir.x * t, y = from.y + rayDir.y * t;
      const u = (x - pan.x + mouthDims.W / 2) / mouthDims.W, v = (mouthDims.H / 2 - y) / mouthDims.H;
      if (u >= 0 && u < 1 && v >= 0 && v < 1 && mouthData[(Math.floor(v * 512) * 512 + Math.floor(u * 512)) * 4] > 128) return true;
    }
  }
  // Wall: march to the first crossing; only the crack lets a ray through.
  const stop = targetOnWall ? len - 0.08 : len;
  let prevT = 0, prevF = from.z - wallZ(from.x, from.y);
  for (let i = 1; i <= 40; i++) {
    const t = (i / 40) * stop;
    tmpV.copy(from).addScaledVector(rayDir, t);
    if (Math.abs(tmpV.x) > WALL_W / 2 || Math.abs(tmpV.y) > WALL_H / 2) { prevT = t; continue; }
    const f = tmpV.z - wallZ(tmpV.x, tmpV.y);
    if (f < 0 && prevF >= 0) {
      const tc = prevT + (t - prevT) * (prevF / (prevF - f));
      tmpV.copy(from).addScaledVector(rayDir, tc);
      const ax = (tmpV.x / WALL_W + 0.5) * ART_W, ay = (0.5 - tmpV.y / WALL_H) * ART_H;
      return !inCrack(ax, ay);
    }
    prevT = t; prevF = f;
  }
  return false;
}
export function visibleFraction(s) {
  const pts = s.points();
  let vis = 0;
  for (const p of pts) {
    tmpV.copy(p).project(camera);
    if (tmpV.z > 1 || Math.abs(tmpV.x) > 0.95 || Math.abs(tmpV.y) > 0.95) continue;
    if (!blocked(camera.position, p, s.id === 'education')) vis++;
  }
  return vis / pts.length;
}
export let secretTimer = 0;
export function updateSecrets(dt) {
  secretTimer += dt;
  // One discovery at a time: the next waits until its panel is closed.
  if (secretTimer < 0.15 || S.mode === 'idle' || late.focus.active || late.focus.t > 0 || panelKind) return;
  const step = secretTimer; secretTimer = 0;
  for (const s of SECRETS) {
    if (s.found) continue;
    s.seen = visibleFraction(s) >= 0.6 ? s.seen + step : 0;
    if (s.seen >= 0.45) { discover(s); return; }
  }
}
export function discover(s) {
  s.found = true;
  s.foundAt = S.clock;
  const n = SECRETS.filter((q) => q.found).length;
  late.playChime('secret');
  toast(`Found ${n} of 3 · ${s.title}, ${s.where}`);
  if (s.id === 'education') boost(['owl']);
  openPanel(s.id);
}
