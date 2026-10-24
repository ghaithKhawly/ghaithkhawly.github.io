import * as THREE from 'three';
import { COLUMN, FLOOR_Y, WALL_H, WALL_W, WALL_Z } from '../config';
import { clamp, fbm } from '../util';
import { quality } from '../core/quality';

// Cave geometry
export function wallZ(x, y) {
  return WALL_Z + 0.11 * x * x + (y > 0 ? 0.1 * y * y : 0.03 * y * y)
    + (fbm(x * 0.35 + 10, y * 0.35 + 3, 4, 7) - 0.5) * 0.55
    + (fbm(x * 1.6 + 2, y * 1.6 + 5, 3, 11) - 0.5) * 0.09;
}
export function wallPoint(u, vTop, out = new THREE.Vector3()) {
  const x = (u - 0.5) * WALL_W, y = (0.5 - vTop) * WALL_H;
  return out.set(x, y, wallZ(x, y));
}
// The wall is drawn five times (rock, older marks, paint, shadows, glow), so its detail
// follows the device tier. Even the lowest stays within a few millimetres of the true
// surface, which the paint decals and the pointer use.
const WALL_SEGS = { high: [260, 130], mid: [200, 100], low: [160, 80] };
export function makeWall() {
  const [sx, sy] = WALL_SEGS[quality.tier];
  const g = new THREE.PlaneGeometry(WALL_W, WALL_H, sx, sy);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, wallZ(p.getX(i), p.getY(i)));
  g.computeVertexNormals();
  return g;
}
export function offsetGeometry(g, d) {
  const c = g.clone();
  const p = c.attributes.position, n = c.attributes.normal;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * d, p.getY(i) + n.getY(i) * d, p.getZ(i) + n.getZ(i) * d);
  return c;
}
export function makeFloor() {
  const g = quality.tier === 'high' ? new THREE.PlaneGeometry(12, 7, 150, 90) : new THREE.PlaneGeometry(12, 7, 100, 60);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, (fbm(x * 0.45 + 4, z * 0.45 + 9, 4, 5) - 0.5) * 0.35 + (fbm(x * 2.2, z * 2.2, 3, 8) - 0.5) * 0.06);
  }
  g.computeVertexNormals();
  g.translate(0, FLOOR_Y, -1.9);
  return g;
}
export function makeRock(radius, seed, flatten = 0.6) {
  const g = new THREE.IcosahedronGeometry(radius, 4);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    v.addScaledVector(n, (fbm(n.x * 2 + seed, n.y * 2 + n.z * 1.7, 4, seed) - 0.5) * radius * 0.9);
    v.y *= flatten;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
export function makeStalactite(len, rad, seed) {
  const g = new THREE.ConeGeometry(rad, len, 9, 8, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + (fbm(x * 6 + seed, y * 4 + z * 6, 3, seed) - 0.5) * 0.7;
    p.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  g.rotateX(Math.PI);
  g.translate(0, -len / 2, 0);
  return g;
}
// A floor-to-ceiling stone column: thick at the base, lumpy, slightly leaning.
export const columnRadius = (y) => THREE.MathUtils.lerp(0.34, 0.2, clamp((y - COLUMN.bottom) / COLUMN.height, 0, 1));
export function makeColumn() {
  const g = new THREE.CylinderGeometry(1, 1, COLUMN.height, 28, 60, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const yw = y + COLUMN.bottom + COLUMN.height / 2;
    const a = Math.atan2(z, x);
    const r = columnRadius(yw) * (1 + (fbm(a * 1.6 + 3, yw * 1.4, 4, 91) - 0.5) * 0.5);
    p.setXYZ(i, Math.cos(a) * r + Math.sin(yw * 0.7) * 0.05, yw, Math.sin(a) * r);
  }
  g.computeVertexNormals();
  return g;
}
