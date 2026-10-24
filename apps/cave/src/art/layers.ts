import type { Painting } from '../types';
import * as THREE from 'three';
import { S } from '../state';
import { ART_H, ART_W, SH_H, SH_W } from '../config';
import { makeStencil, posePoints } from '../hands/silhouette';
import { PAINT_RES, paintedCanvas } from '../paint/painters';
import { bakedJob, bakedLayer, makeCanvas, mulberry, supportsFilter } from '../util';
import { offsetGeometry, wallPoint } from '../world/geometry';
import { crackTex, rock, scene, wallGeo } from '../world/scene';

// Wall layers: paint (lit), shadow, glow (additive)
export const artCanvas = makeCanvas(ART_W, ART_H);
export const artCtx = artCanvas.getContext('2d');
export const artTex = new THREE.CanvasTexture(artCanvas);
artTex.colorSpace = THREE.SRGBColorSpace; artTex.anisotropy = 4;
export const artMat = new THREE.MeshStandardMaterial({ map: artTex, alphaMap: crackTex, normalMap: rock.normal, transparent: true, roughness: 0.95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
// Pigment soaks into the stone: it takes on the rock's grain and colour, and thins over
// pits and stains. The rock texture is sampled through the normal map's wall UVs.
// Mean linear luminance of the wall rock (assets/rock/wall-diff.webp): paint over brighter
// rock than this looks lighter, over darker rock deeper.
const WALL_ROCK_L = 0.219;
export function soakIntoRock(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRock = { value: rock.map };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform sampler2D uRock;\n#define ROCK_L ${WALL_ROCK_L.toFixed(3)}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec3 rockC = texture2D(uRock, vNormalMapUv).rgb;
        float rockL = dot(rockC, vec3(0.2126, 0.7152, 0.0722));
        diffuseColor.rgb *= mix(1.0, clamp(rockL / ROCK_L, 0.6, 1.35), 0.6);
        diffuseColor.a *= mix(0.8, 1.0, smoothstep(0.08, 0.3, rockL));`);
  };
  mat.customProgramCacheKey = () => 'soak';
  return mat;
}
// Paint-layer stack on the wall, back to front: older marks and stencils, then the
// paintings (each its own denser decal), then the calcite veil and the visitor's strokes.
soakIntoRock(artMat);
export const artMesh = new THREE.Mesh(offsetGeometry(wallGeo, 0.01), artMat);
artMesh.renderOrder = 3;
scene.add(artMesh);
export const baseCanvas = makeCanvas(ART_W, ART_H);
export const baseTex = new THREE.CanvasTexture(baseCanvas);
// Everything on the base layer at load (handprints, older figures, flutings) is baked as one image.
export const baseJob = bakedLayer('base', baseCanvas, () => { S.baseDirty = true; S.baseUploadAt = 0; });
baseTex.colorSpace = THREE.SRGBColorSpace; baseTex.anisotropy = 4;
// the base layer uploads at most twice a second while it fills in
export const baseMesh = new THREE.Mesh(offsetGeometry(wallGeo, 0.004), soakIntoRock(new THREE.MeshStandardMaterial({ map: baseTex, alphaMap: crackTex, normalMap: rock.normal, transparent: true, roughness: 0.95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
baseMesh.renderOrder = 1;
scene.add(baseMesh);
// A patch of wall surface carrying one painting. Its UVs are the wall's (for the rock
// normal map); the painting itself is mapped through uv1.
export function wallPatch(x, y, w, h, lift) {
  const g = new THREE.PlaneGeometry(1, 1, Math.max(2, Math.ceil(w / 8)), Math.max(2, Math.ceil(h / 8)));
  const pos = g.attributes.position, uv = g.attributes.uv, local = new Float32Array(uv.array), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const u = (x + uv.getX(i) * w) / ART_W, vTop = (y + (1 - uv.getY(i)) * h) / ART_H;
    wallPoint(u, vTop, v);
    pos.setXYZ(i, v.x, v.y, v.z);
    uv.setXY(i, u, 1 - vTop);
  }
  g.setAttribute('uv1', new THREE.BufferAttribute(local, 2));
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) + n.getX(i) * lift, pos.getY(i) + n.getY(i) * lift, pos.getZ(i) + n.getZ(i) * lift);
  return g;
}
export function addPaintingDecal(p) {
  const tex = new THREE.CanvasTexture(p.canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.channel = 1;
  const mat = soakIntoRock(new THREE.MeshStandardMaterial({ map: tex, normalMap: rock.normal, transparent: true, opacity: 0.94, roughness: 0.95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1.5 }));
  p.mesh = new THREE.Mesh(wallPatch(p.x, p.y, p.w, p.h, 0.007), mat);
  p.mesh.renderOrder = 2;
  scene.add(p.mesh);
}

export const shadowCanvas = makeCanvas(SH_W, SH_H);
export const shadowCtx = shadowCanvas.getContext('2d');
export const shadowTmp = makeCanvas(SH_W, SH_H);
export const shadowTmpCtx = shadowTmp.getContext('2d');
export const shadowTex = new THREE.CanvasTexture(shadowCanvas);
export const shadowMat = new THREE.MeshBasicMaterial({ color: 0x040201, alphaMap: shadowTex, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
export const shadowMesh = new THREE.Mesh(offsetGeometry(wallGeo, 0.012), shadowMat);
shadowMesh.renderOrder = 4;
scene.add(shadowMesh);

export const fxCanvas = makeCanvas(SH_W, SH_H);
export const fxCtx = fxCanvas.getContext('2d');
export const fxTex = new THREE.CanvasTexture(fxCanvas);
fxTex.colorSpace = THREE.SRGBColorSpace;
export const fxMat = new THREE.MeshBasicMaterial({ map: fxTex, alphaMap: crackTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
export const fxMesh = new THREE.Mesh(offsetGeometry(wallGeo, 0.018), fxMat);
fxMesh.renderOrder = 5;
scene.add(fxMesh);

// Painting layout in paint-layer pixels. The visible wall spans roughly x 390–1660, y 110–790;
// the stone column hides x ≈ 400–600 from straight on, and the crack sits at x ≈ 1500.
export const PAINTINGS: Painting[] = [
  { id: 'bison', kind: 'bison', x: 640, y: 262, w: 235, h: 140, group: 'herd', seed: 11 },
  { id: 'horse', kind: 'horse', x: 900, y: 240, w: 235, h: 135, group: 'herd', seed: 12 },
  { id: 'deer', kind: 'deer', x: 1160, y: 245, w: 195, h: 150, group: 'herd', seed: 13 },
  { id: 'hunters', kind: 'hunters', x: 640, y: 425, w: 230, h: 125, group: 'hunt', seed: 15 },
  { id: 'self', kind: 'self', x: 905, y: 405, w: 130, h: 150, group: 'self', seed: 16 },
  { id: 'phone', kind: 'phone', x: 1075, y: 410, w: 95, h: 165, group: 'project', project: 'phone', seed: 17 },
  { id: 'laptop', kind: 'laptop', x: 1225, y: 430, w: 185, h: 135, group: 'project', project: 'laptop', seed: 18 },
  { id: 'dots', kind: 'dots', x: 700, y: 205, w: 200, h: 40, group: 'sign', seed: 19 },
  { id: 'tally', kind: 'tally', x: 1580, y: 285, w: 100, h: 55, group: 'sign', seed: 20 },
  { id: 'owl', kind: 'owl', x: 520, y: 330, w: 100, h: 130, group: 'secret', secret: 'education', seed: 21 },
];
export const GLOW_PAD = 26;
export const glowRGB = 'rgb(255,128,48)';
export function makeGlowSprite(src, w, h) {
  const tint = makeCanvas(w, h);
  const t = tint.getContext('2d');
  t.drawImage(src, 0, 0, w, h);
  t.globalCompositeOperation = 'source-in';
  t.fillStyle = glowRGB; t.fillRect(0, 0, w, h);
  // A halo round the painting, mostly outside it, so the painting itself stays legible.
  const g = makeCanvas(w + GLOW_PAD * 2, h + GLOW_PAD * 2);
  const gc = g.getContext('2d');
  if (supportsFilter) { gc.filter = 'blur(7px)'; gc.drawImage(tint, GLOW_PAD, GLOW_PAD); gc.filter = 'none'; }
  else { gc.globalAlpha = 0.5; gc.drawImage(tint, GLOW_PAD, GLOW_PAD); }
  gc.globalCompositeOperation = 'destination-out';
  gc.globalAlpha = 0.75;
  gc.drawImage(tint, GLOW_PAD, GLOW_PAD);
  gc.globalCompositeOperation = 'source-over';
  gc.globalAlpha = 0.12;
  gc.drawImage(tint, GLOW_PAD, GLOW_PAD);
  return g;
}
export function addPaintingState(p) { p.alpha = 1; p.g = 0; p.boostFrom = 0; p.boostTo = 0; p.glow = makeGlowSprite(p.canvas, p.w / 2, p.h / 2); }
for (const p of PAINTINGS) {
  p.canvas = makeCanvas(p.w * PAINT_RES, p.h * PAINT_RES);
  addPaintingState(p);
  addPaintingDecal(p);
  bakedJob(`painting-${p.id}`, p.canvas, 1, () => paintedCanvas(p.kind, p.w, p.h, p.seed, {}, PAINT_RES, p.canvas), () => {
    p.glow = makeGlowSprite(p.canvas, p.w / 2, p.h / 2);
    p.mesh.material.map.needsUpdate = true;
  });
}

// Ancient handprints, sprayed long before the visitor arrived.
export const STENCILS = [];
{
  const r = mulberry(77);
  const spots = [[1600, 640], [1640, 545], [1610, 760], [1665, 690], [1545, 835], [430, 720], [500, 790], [360, 640]];
  spots.forEach(([x, y], i) => {
    const s = 26 + r() * 10, rot = (r() - 0.5) * 0.9, col = r() < 0.6 ? 'red' : 'yellow', alpha = 0.75 + r() * 0.25;
    baseJob(2, () => {
      const st = makeStencil(posePoints('palm', x, y, s, rot), s, col, 100 + i, alpha);
      STENCILS.push({ ...st, alpha: 1, glowUntil: 0, born: 0 });
      baseCanvas.getContext('2d').drawImage(st.canvas, st.x, st.y);
      S.baseDirty = true;
    });
  });
}
