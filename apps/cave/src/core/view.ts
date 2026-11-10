import { provide } from '../late';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { EYE_D, SCREEN_H } from '../config';
import { quality } from './quality';
import { buildMouth, camera, flameUniforms, renderer, scene } from '../world/scene';

// Earlier modules reach these through `late` (see late.ts). The getters are lazy, so
// registering before the declarations below is safe.
provide({ get screenW() { return screenW; } });

// Post-processing
export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
export const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.7, 0.82);
composer.addPass(bloom);
// Vignette, film grain, and glare: firelight scattered in the eye, a warm haze and faint
// rays round the flame, the way a fire looks when everything else is dark.
export const vignette = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uStrength: { value: 0.88 }, uFire: { value: new THREE.Vector2(0.5, 0.2) }, uGlare: { value: 0 }, uAspect: { value: 1.6 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uStrength; uniform vec2 uFire; uniform float uGlare; uniform float uAspect; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5;
      float v = smoothstep(0.85, 0.22, length(d * vec2(1.05, 1.3)));
      c.rgb *= mix(1.0 - uStrength, 1.0, v);
      vec2 f = (vUv - uFire) * vec2(uAspect, 1.0);
      float r = length(f), a = atan(f.y, f.x);
      float haze = exp(-r * 3.4) * 0.07 + exp(-r * 12.0) * 0.12;
      float rays = (pow(abs(sin(a * 7.0 + uTime * 0.12)), 22.0) * 0.6 + pow(abs(sin(a * 11.0 - uTime * 0.09 + 1.3)), 30.0) * 0.4) * exp(-r * 7.0) * 0.12;
      c.rgb += vec3(1.0, 0.52, 0.2) * (haze + rays) * uGlare;
      c.rgb += (rnd(vUv * 1000.0 + fract(uTime)) - 0.5) * 0.02;
      gl_FragColor = c;
    }`,
});
composer.addPass(vignette);
composer.addPass(new OutputPass());

export let screenW = SCREEN_H;
export const pan = { x: 0, target: 0 };   // sideways look-around where the window is narrow (phones)
// Render size and quality, for resizes and the frame-rate watcher. Each buffer is
// reallocated once, and only when it changes: three's setPixelRatio resizes at the old
// size, so calling it and setSize would reallocate twice.
let sized = { w: 0, h: 0, pr: 0 };
export function applyQuality() {
  const w = window.innerWidth, h = window.innerHeight, pr = quality.pr;
  if (w !== sized.w || h !== sized.h || pr !== sized.pr) {
    renderer.setDrawingBufferSize(w, h, pr);
    if (pr !== sized.pr) composer.setPixelRatio(pr);
    if (w !== sized.w || h !== sized.h) composer.setSize(w, h);
    sized = { w, h, pr };
  }
  bloom.enabled = quality.bloom;
  flameUniforms.uProj.value = (h * renderer.getPixelRatio() * EYE_D) / SCREEN_H;
}
let builtFor = '';
export function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  screenW = SCREEN_H * (w / h);
  applyQuality();
  // The cave mouth is shaped to the window; rebuild it only when the shape changes.
  const shape = `${w}x${h}`;
  if (shape !== builtFor) { builtFor = shape; buildMouth(); }
}
window.addEventListener('resize', resize);
resize();

// The viewport is a window onto the cave: an off-axis frustum through a screen rectangle.
// win moves and scales that rectangle; zooming to the wall moves the window up to the rock.
export const win = { x: 0, y: 0, z: 0, s: 1 };
export function applyWindowCamera(eye) {
  const n = 0.05, f = 60;
  const l = ((-screenW / 2 - eye.x) * n) / eye.z, r = ((screenW / 2 - eye.x) * n) / eye.z;
  const b = ((-SCREEN_H / 2 - eye.y) * n) / eye.z, t = ((SCREEN_H / 2 - eye.y) * n) / eye.z;
  camera.position.set(win.x + eye.x * win.s, win.y + eye.y * win.s, win.z + eye.z * win.s);
  camera.quaternion.identity();
  camera.updateMatrixWorld();
  camera.projectionMatrix.makePerspective(l, r, t, b, n, f);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
