import * as THREE from 'three';
import { clamp, fbm, makeCanvas, mulberry, smooth } from '../util';

// Rock textures (tileable colour + normal map + height, generated once)
export const ROCK_N = 512;
export function makeRockTextures(N = ROCK_N) {
  const F = 6;
  const H = new Float32Array(N * N);
  const col = makeCanvas(N, N);
  const cctx = col.getContext('2d');
  const img = cctx.createImageData(N, N);
  const r = mulberry(7);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = (i / N) * F, y = (j / N) * F;
      const base = fbm(x, y, 5, 3, F);
      const ridge = 1 - Math.abs(2 * fbm(x * 2, y * 2, 4, 9, F * 2) - 1);
      const h = base * 0.75 + ridge * ridge * 0.25;
      H[j * N + i] = h;
      const stain = fbm(x * 0.5, y * 0.5, 3, 21, F / 2);
      const shade = 0.64 + 0.48 * h;
      const st = smooth(0.5, 0.78, stain);
      let R = 184 * shade, G = 171 * shade, B = 154 * shade;
      R = R * (1 - st * 0.45) + 96 * st * 0.45; G = G * (1 - st * 0.5) + 66 * st * 0.5; B = B * (1 - st * 0.55) + 48 * st * 0.55;
      const crack = smooth(0.93, 0.99, ridge);
      R *= 1 - crack * 0.16; G *= 1 - crack * 0.16; B *= 1 - crack * 0.16;
      const speck = (r() - 0.5) * 14;
      const k = (j * N + i) * 4;
      img.data[k] = clamp(R + speck, 0, 255); img.data[k + 1] = clamp(G + speck, 0, 255); img.data[k + 2] = clamp(B + speck, 0, 255); img.data[k + 3] = 255;
    }
  }
  cctx.putImageData(img, 0, 0);
  const nrm = makeCanvas(N, N);
  const nctx = nrm.getContext('2d');
  const nimg = nctx.createImageData(N, N);
  const S = 7;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const hl = H[j * N + ((i - 1 + N) % N)], hr = H[j * N + ((i + 1) % N)];
      const hu = H[((j - 1 + N) % N) * N + i], hd = H[((j + 1) % N) * N + i];
      let nx = -(hr - hl) * S, ny = -(hu - hd) * S, nz = 1;
      const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L;
      const k = (j * N + i) * 4;
      nimg.data[k] = (nx * 0.5 + 0.5) * 255; nimg.data[k + 1] = (ny * 0.5 + 0.5) * 255; nimg.data[k + 2] = (nz * 0.5 + 0.5) * 255; nimg.data[k + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);
  const map = new THREE.CanvasTexture(col);
  map.colorSpace = THREE.SRGBColorSpace;
  const normal = new THREE.CanvasTexture(nrm);
  for (const t of [map, normal]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }
  return { map, normal, height: H };
}
