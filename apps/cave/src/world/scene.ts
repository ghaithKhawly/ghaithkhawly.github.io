import { late } from '../late';
import * as THREE from 'three';
import { S } from '../state';
import { $, ART_H, ART_W, COLUMN, CRACK, EYE_D, FIRE, FLOOR_Y, SCREEN_H, SH_H, SH_W } from '../config';
import { makeStencil, posePoints } from '../hands/silhouette';
import { PAINT_RES, paintedCanvas } from '../paint/painters';
import { bakedJob, clamp, fbm, makeCanvas, mulberry, supportsFilter, vnoise } from '../util';
import { makeColumn, makeFloor, makeRock, makeStalactite, makeWall, wallPoint } from './geometry';
import { ROCK, ROCK_N, rockMaterial, rockTexture, wallHeight } from './rock';

// Renderer, scene, camera
export const canvas = $('scene');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030202);
scene.fog = new THREE.FogExp2(0x050302, 0.045);
export const camera = new THREE.PerspectiveCamera();

// The painted wall's rock. The paint layers share its normal map, so pigment follows the relief.
export const rock = { map: rockTexture(ROCK.wall.map, 3.2, 1.6, true), normal: rockTexture(ROCK.wall.normal, 3.2, 1.6) };
// Rock relief at a paint-layer pixel, so pigment can catch on the bumps.
export function rockHeight(ax, ay) {
  const u = ((ax / ART_W) * 3.2) % 1, v = (((1 - ay / ART_H) * 1.6) % 1 + 1) % 1;
  return wallHeight[Math.floor((1 - v) * (ROCK_N - 1)) * ROCK_N + Math.floor(u * (ROCK_N - 1))];
}

// The crack: a hole in the wall's alpha mask that opens onto a hidden chamber.
export const crackMask = makeCanvas(SH_W, SH_H);
export const crackPts = [];
{
  const ctx = crackMask.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, SH_W, SH_H);
  const cx = CRACK.ax / 2, cy = CRACK.ay / 2, hw = CRACK.halfW / 2, hh = CRACK.halfH / 2;
  const N = 28;
  for (let i = 0; i <= N; i++) { const t = i / N; crackPts.push([cx - hw * Math.sin(Math.PI * t) * (0.75 + 0.5 * vnoise(t * 9, 1, 81)) - Math.sin(t * 7) * 2, cy - hh + 2 * hh * t]); }
  for (let i = N; i >= 0; i--) { const t = i / N; crackPts.push([cx + hw * Math.sin(Math.PI * t) * (0.75 + 0.5 * vnoise(t * 9, 4, 82)) - Math.sin(t * 7) * 2, cy - hh + 2 * hh * t]); }
  ctx.fillStyle = '#000';
  ctx.beginPath(); crackPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
}
export const crackData = crackMask.getContext('2d').getImageData(0, 0, SH_W, SH_H).data;
export const crackPath = new Path2D();   // in shadow-canvas pixels
crackPts.forEach(([x, y], i) => (i ? crackPath.lineTo(x, y) : crackPath.moveTo(x, y)));
crackPath.closePath();
export const crackTex = new THREE.CanvasTexture(crackMask);
export const inCrack = (ax, ay) => { const i = (Math.floor(ay / 2) * SH_W + Math.floor(ax / 2)) * 4; return ax >= 0 && ay >= 0 && ax < ART_W && ay < ART_H && crackData[i] < 128; };

export const wallMat = new THREE.MeshStandardMaterial({ map: rock.map, normalMap: rock.normal, normalScale: new THREE.Vector2(1.0, 1.0), roughness: 0.95, metalness: 0, color: 0xffffff, alphaMap: crackTex, alphaTest: 0.5 });
export const wallGeo = makeWall();
export const wall = new THREE.Mesh(wallGeo, wallMat);
scene.add(wall);

scene.add(new THREE.Mesh(makeFloor(), rockMaterial(ROCK.wall, 4, 2.4, { roughness: 1, color: 0xb6a38e })));

// Floor props: hidden while you're up at the wall, where they'd only block the view.
export const props = new THREE.Group();
scene.add(props);
export const rockPieceMat = rockMaterial(ROCK.stone, 1, 1, { roughness: 0.95, color: 0xfae4cb });
for (const [x, z, rad, seed] of [[-2.4, -1.0, 0.55, 3], [2.2, -0.8, 0.45, 5], [-1.3, -0.4, 0.22, 9], [1.4, -0.3, 0.26, 12], [-3.0, -2.2, 0.7, 14], [2.9, -2.4, 0.6, 18], [0.8, -2.6, 0.3, 21]]) {
  const m = new THREE.Mesh(makeRock(rad, seed), rockPieceMat);
  m.position.set(x, FLOOR_Y + rad * 0.25, z);
  m.rotation.y = seed;
  props.add(m);
}
export const column = new THREE.Mesh(makeColumn(), rockMaterial(ROCK.stone, 1, 2, { roughness: 0.95, color: 0xdcc5ad }));
column.position.set(COLUMN.x, 0, COLUMN.z);
scene.add(column);

// Fire pit: stones, logs, flames, embers, light.
export const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5b5047, roughness: 0.9 });
for (let i = 0; i < 10; i++) {
  const a = (i / 10) * Math.PI * 2;
  const st = new THREE.Mesh(makeRock(0.07 + (i % 3) * 0.015, 30 + i, 0.7), stoneMat);
  st.position.set(FIRE.x + Math.cos(a) * 0.3, FIRE.y + 0.03, FIRE.z + Math.sin(a) * 0.3);
  props.add(st);
}
export const logMat = new THREE.MeshStandardMaterial({ color: 0x1c130d, roughness: 1, emissive: new THREE.Color(0xff4a12), emissiveIntensity: 0.25 });
for (let i = 0; i < 3; i++) {
  const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.58, 8), logMat);
  lg.rotation.z = Math.PI / 2 - 0.25;
  lg.rotation.y = (i / 3) * Math.PI;
  lg.position.set(FIRE.x, FIRE.y + 0.08, FIRE.z);
  props.add(lg);
}

export const flameUniforms = { uTime: { value: 0 }, uProj: { value: 500 }, uLevel: { value: 0.4 } };
export function makeParticles(count, spread, seedBase, vertexMain, fragment, at = FIRE, uniforms = flameUniforms) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  const r = mulberry(seedBase);
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * spread;
    pos[i * 3] = Math.cos(a) * rad; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = Math.sin(a) * rad;
    seed[i] = r();
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      attribute float aSeed; uniform float uTime; uniform float uProj; uniform float uLevel;
      varying float vLife; varying float vSeed;
      void main() {
        vec3 p = position; float life; float size;
        ${vertexMain}
        vLife = life; vSeed = aSeed;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = size * uProj / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: fragment,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, mat);
  pts.position.copy(at);
  pts.frustumCulled = false;
  scene.add(pts);
  return pts;
}
export const FLAME_FRAG = `
  varying float vLife; varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(vec3(1.0, 0.86, 0.5), vec3(1.0, 0.38, 0.06), smoothstep(0.0, 0.45, vLife));
    col = mix(col, vec3(0.35, 0.06, 0.02), smoothstep(0.55, 1.0, vLife));
    a *= 1.0 - smoothstep(0.5, 1.0, vLife);
    gl_FragColor = vec4(col * a * 1.4, a);
  }`;
export const flames = makeParticles(260, 0.15, 3, `
  life = fract(uTime * (0.7 + aSeed * 0.6) + aSeed * 7.13);
  float hgt = 0.95 * uLevel + 0.15;
  p.y += life * hgt;
  p.xz *= (1.0 - life * 0.85);
  p.x += sin(uTime * 4.0 + aSeed * 40.0) * 0.035 * life;
  p.z += cos(uTime * 3.1 + aSeed * 23.0) * 0.025 * life;
  size = (1.0 - life) * (0.16 + aSeed * 0.12) * (0.5 + 0.5 * uLevel);
`, FLAME_FRAG);
export const embers = makeParticles(90, 0.2, 9, `
  life = fract(uTime * (0.12 + aSeed * 0.1) + aSeed * 3.7);
  p.y += life * (2.6 + aSeed);
  p.x += sin(uTime * 0.9 + aSeed * 50.0) * 0.35 * life + (aSeed - 0.5) * life * 0.8;
  p.z += cos(uTime * 0.7 + aSeed * 31.0) * 0.25 * life;
  size = (0.018 + aSeed * 0.014) * (0.6 + 0.4 * sin(uTime * 9.0 + aSeed * 60.0)) * uLevel;
`, `
  varying float vLife; varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, d) * (1.0 - smoothstep(0.6, 1.0, vLife));
    gl_FragColor = vec4(vec3(1.0, 0.55, 0.18) * a * 2.0, a);
  }`);

export function radialTexture(stops) {
  const c = makeCanvas(128, 128);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export const haloTex = radialTexture([[0, 'rgba(255,170,80,0.9)'], [0.35, 'rgba(255,110,30,0.25)'], [1, 'rgba(255,80,20,0)']]);
export const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
halo.position.set(FIRE.x, FIRE.y + 0.22, FIRE.z);
halo.scale.set(1.3, 1.3, 1);
scene.add(halo);

export const fireLight = new THREE.PointLight(0xff8a3d, 0, 0, 2);
fireLight.position.set(FIRE.x, FIRE.y + 0.5, FIRE.z);
scene.add(fireLight);
export const fillLight = new THREE.PointLight(0xffa860, 0, 0, 2);
fillLight.position.set(FIRE.x + 0.15, FIRE.y + 0.25, FIRE.z + 0.2);
scene.add(fillLight);
export const washLight = new THREE.PointLight(0xff9a50, 0, 0, 2);
washLight.position.set(0, 0.7, -0.5);
scene.add(washLight);
// An oil lamp held close to the wall while painting: raking light shows the rock relief.
export const lampLight = new THREE.PointLight(0xffb070, 0, 3.2, 2);
scene.add(lampLight);
scene.add(new THREE.HemisphereLight(0x22324a, 0x0b0705, 0.6));

// ---------------------------------------------------------------------------
// The hidden chamber behind the crack
// ---------------------------------------------------------------------------
export const chamber = new THREE.Group();
export const CH = { w: 0.9, h: 1.3, d: 1.9 };
{
  const S = wallPoint(CRACK.ax / ART_W, CRACK.ay / ART_H);
  // Aligned with the straight-on line of sight, so looking straight in shows only the back wall.
  // A phone can't see the crack from the middle, so there it's aligned for someone standing in front of it.
  const narrow = (window.innerWidth / window.innerHeight) * SCREEN_H < 1.6;
  const E = new THREE.Vector3(narrow ? S.x : 0, 0, EYE_D);
  const dir = S.clone().sub(E).normalize();
  chamber.rotation.set(Math.asin(dir.y), Math.atan2(-dir.x, -dir.z), 0, 'YXZ');
  chamber.position.copy(S).addScaledVector(dir, 0.12);
  const box = new THREE.BoxGeometry(CH.w, CH.h, CH.d);
  box.translate(0, 0, -CH.d / 2);
  chamber.add(new THREE.Mesh(box, rockMaterial(ROCK.stone, 1.2, 1.2, { color: 0xa58a74, roughness: 1, side: THREE.BackSide })));
  const lamp = new THREE.PointLight(0xffa04a, 2.2, 2.6, 2);
  lamp.position.set(0, -0.38, -CH.d * 0.62);
  chamber.add(lamp);
  chamber.userData.lamp = lamp;
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  flame.position.copy(lamp.position); flame.scale.set(0.22, 0.3, 1);
  chamber.add(flame);
  const lampBowl = new THREE.Mesh(makeRock(0.06, 120, 0.5), stoneMat);
  lampBowl.position.set(0, -CH.h / 2 + 0.04, -CH.d * 0.62);
  chamber.add(lampBowl);
  // A handprint on the back wall: what you see when you look straight in.
  const baitDecal = wallDecal(makeCanvas(256, 256), 0.42, new THREE.Vector3(0.05, 0.05, -CH.d + 0.005), 0);
  chamber.add(baitDecal);
  const bait = baitDecal.material.map.image;
  bakedJob('decal-bait', bait, 3, () => {
    const st = makeStencil(posePoints('palm', 128, 120, 34), 34, 'red', 333, 1);
    bait.width = st.canvas.width; bait.height = st.canvas.height;
    bait.getContext('2d').drawImage(st.canvas, 0, 0);
  }, () => {
    baitDecal.geometry.dispose();
    baitDecal.geometry = new THREE.PlaneGeometry(0.42, (0.42 * bait.height) / bait.width);
    baitDecal.material.map.needsUpdate = true;
  });
  scene.add(chamber);
  const spill = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.4 }));
  spill.position.copy(S).add(new THREE.Vector3(0, 0, 0.06));
  spill.scale.set(0.42, 1.05, 1);
  scene.add(spill);
  chamber.userData.spill = spill;
}
export function wallDecal(srcCanvas, width, pos, rotY) {
  const tex = new THREE.CanvasTexture(srcCanvas); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, (width * srcCanvas.height) / srcCanvas.width), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, depthWrite: false, emissive: new THREE.Color(0xff7a2a), emissiveMap: tex, emissiveIntensity: 0 }));
  m.position.copy(pos); m.rotation.y = rotY;
  return m;
}
// Paintings on the chamber's inner walls: lean left to see the right wall, lean right to see the left one.
export const certsDecal = wallDecal(makeCanvas(280 * PAINT_RES, 230 * PAINT_RES), 0.86, new THREE.Vector3(CH.w / 2 - 0.004, 0.05, -CH.d * 0.4), -Math.PI / 2);
export const langDecal = wallDecal(makeCanvas(280 * PAINT_RES, 230 * PAINT_RES), 0.86, new THREE.Vector3(-CH.w / 2 + 0.004, 0.05, -CH.d * 0.4), Math.PI / 2);
for (const [decal, kind, seed] of [[certsDecal, 'cloud', 401], [langDecal, 'talk', 402]] as [THREE.Mesh, string, number][]) {
  const map = (decal.material as THREE.MeshStandardMaterial).map;
  bakedJob(`decal-${kind}`, map.image, 3, () => paintedCanvas(kind, 280, 230, seed, {}, PAINT_RES, map.image), () => { map.needsUpdate = true; });
}
chamber.add(certsDecal, langDecal);

// ---------------------------------------------------------------------------
// Foreground: the cave mouth and stalactites, close to the screen.
// Near and far layers moving differently is what makes head tracking read as depth.
// ---------------------------------------------------------------------------
export const MOUTH_Z = -0.4;
export const mouthMask = makeCanvas(512, 512);
export const mouthMaskTex = new THREE.CanvasTexture(mouthMask);
export const mouthMat = rockMaterial(ROCK.stone, 1.1, 1.1, { alphaMap: mouthMaskTex, alphaTest: 0.5, alphaToCoverage: true, color: 0x947e6c, roughness: 1, side: THREE.DoubleSide });
export let mouth = null, mouthData = null, mouthDims = { W: 1, H: 1 };
export const stalactites = new THREE.Group();
scene.add(stalactites);
export const stalMat = rockMaterial(ROCK.stone, 1, 1, { color: 0xd4bca3, roughness: 0.9 });
for (let i = 0; i < 7; i++) {
  const m = new THREE.Mesh(makeStalactite(0.35 + (i % 3) * 0.18, 0.05 + (i % 2) * 0.03, 70 + i), stalMat);
  m.userData = { fx: [-0.42, -0.3, -0.16, 0.05, 0.2, 0.33, 0.44][i], z: [-0.9, -1.4, -0.75, -1.8, -1.1, -0.85, -1.5][i] };
  stalactites.add(m);
}
export function buildMouth() {
  if (mouth) { scene.remove(mouth); mouth.geometry.dispose(); }
  const sc = (EYE_D - MOUTH_Z) / EYE_D;
  const hw = (late.screenW / 2) * sc, hh = (SCREEN_H / 2) * sc;
  const O = 1.6;
  const W = hw * O * 2, H = hh * O * 2;
  const ix = hw * 0.93, iy = hh * 1.02, yo = -hh * 0.12;
  // Opening outline: an irregular arch, open at the bottom so the fire stays visible.
  const outline = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const th = -0.12 * Math.PI + (i / N) * 1.24 * Math.PI;
    const rx = ix * (1 + (fbm(th * 2.2, 0.5, 3, 61) - 0.5) * 0.2);
    const ry = iy * (1 + (fbm(th * 2.2, 3.5, 3, 62) - 0.5) * 0.24);
    let x = Math.cos(th) * rx, y = yo + Math.sin(th) * ry;
    const top = Math.sin(th);
    if (top > 0.5) y -= Math.pow(Math.max(0, Math.sin(th * 23 + 1.3)), 6) * hh * 0.16 * top;
    if (i === 0 || i === N) y = -hh * O - 0.1;
    outline.push([x, y]);
  }
  const mctx = mouthMask.getContext('2d');
  const toPx = ([x, y]) => [((x + W / 2) / W) * 512, ((H / 2 - y) / H) * 512];
  mctx.fillStyle = '#fff'; mctx.fillRect(0, 0, 512, 512);
  if (supportsFilter) mctx.filter = 'blur(2px)';
  mctx.fillStyle = '#000';
  mctx.beginPath();
  outline.forEach((p, i) => { const [x, y] = toPx(p); i ? mctx.lineTo(x, y) : mctx.moveTo(x, y); });
  mctx.closePath(); mctx.fill();
  mctx.filter = 'none';
  mouthMaskTex.needsUpdate = true;
  mouthData = mctx.getImageData(0, 0, 512, 512).data;
  mouthDims = { W, H };
  const g = new THREE.PlaneGeometry(W, H, 90, 90);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const r = Math.hypot(x / ix, (y - yo) / iy);
    // The rock bulges toward the viewer away from the opening, so the edge has real depth.
    p.setZ(i, MOUTH_Z + clamp(r - 1, 0, 0.8) * 0.55 + (fbm(x * 1.4 + 7, y * 1.4, 4, 63) - 0.5) * 0.3);
  }
  g.computeVertexNormals();
  mouth = new THREE.Mesh(g, mouthMat);
  scene.add(mouth);
  for (const m of stalactites.children) {
    const z = m.userData.z;
    const s2 = (EYE_D - z) / EYE_D;
    m.position.set(m.userData.fx * late.screenW * s2, (SCREEN_H / 2) * s2 + 0.05, z);
  }
}
