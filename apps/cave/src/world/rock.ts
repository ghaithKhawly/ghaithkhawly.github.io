import * as THREE from 'three';
import wallDiff from '../assets/rock/wall-diff.webp';
import wallNormal from '../assets/rock/wall-normal.webp';
import wallHeightUrl from '../assets/rock/wall-height.webp';
import stoneDiff from '../assets/rock/stone-diff.webp';
import stoneNormal from '../assets/rock/stone-normal.webp';

// Photo-scanned rock, CC0 from Poly Haven (see assets/rock/README.md): smooth limestone
// for the painted wall and floor, flakier stone for the mouth, column and boulders.
export const ROCK = {
  wall: { map: wallDiff, normal: wallNormal },
  stone: { map: stoneDiff, normal: stoneNormal },
};

// Each image loads once; every use gets its own texture (so its own repeat), which
// fills in when the image arrives. `rockLoad.pending` counts images still on their way.
export const rockLoad = { pending: 0 };
const images = new Map<string, Promise<HTMLImageElement>>();
function image(url: string) {
  let p = images.get(url);
  if (!p) {
    rockLoad.pending++;
    p = new THREE.ImageLoader().loadAsync(url).finally(() => { rockLoad.pending--; });
    images.set(url, p);
  }
  return p;
}
export function rockTexture(url: string, rx: number, ry: number, colour = false) {
  const t = new THREE.Texture();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 8;
  if (colour) t.colorSpace = THREE.SRGBColorSpace;
  image(url).then((img) => { t.image = img; t.needsUpdate = true; });
  return t;
}
export function rockMaterial(set: { map: string; normal: string }, rx: number, ry: number, params: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({ map: rockTexture(set.map, rx, ry, true), normalMap: rockTexture(set.normal, rx, ry), ...params });
}

// Relief of the wall rock (0 to 1), so pigment can catch on the bumps. Flat until the image is in.
export const ROCK_N = 512;
export const wallHeight = new Float32Array(ROCK_N * ROCK_N).fill(0.5);
image(wallHeightUrl).then((img) => {
  const c = document.createElement('canvas');
  c.width = c.height = ROCK_N;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, ROCK_N, ROCK_N);
  const d = x.getImageData(0, 0, ROCK_N, ROCK_N).data;
  for (let i = 0; i < wallHeight.length; i++) wallHeight[i] = d[i * 4] / 255;
});
