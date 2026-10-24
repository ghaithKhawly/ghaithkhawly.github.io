import { late, provide } from '../late';
import { S } from '../state';
import { $, FACE_MODEL, HAND_MODEL, MP_BASE, params } from '../config';
import { pan, screenW } from '../core/view';
import { focus } from '../play/focus';
import { eyeTarget, onFace, setGestureUI, showSecretsHint, smoothLandmarks, stats, video } from './state';
import { clamp } from '../util';
import { canvas } from '../world/scene';

// Earlier modules reach these through `late` (see late.ts). The getters are lazy, so
// registering before the declarations below is safe.
provide({ get paintingHint() { return paintingHint; }, get tiltOn() { return tiltOn; } });

// Camera + models
export async function startCamera() {
  const status = $('intro-status');
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    status.textContent = 'This page needs https or localhost to use the camera. Switching to painting mode.';
    setTimeout(() => startMouse(), 1400);
    return;
  }
  $('start-cam').disabled = true; $('start-mouse').disabled = true;
  late.startAudio();
  try {
    status.textContent = 'Asking for your camera…';
    // Asked already, if the intro was tapped before the cave loaded.
    const early = await window.__early?.stream;
    if (early && 'error' in early) throw early.error;
    const stream = early || await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    video.srcObject = stream;
    await video.play();
    S.camAspect = (video.videoWidth || 4) / (video.videoHeight || 3);
    status.textContent = 'Loading hand tracking (about 9 MB, once)…';
    const mp = await import('@mediapipe/tasks-vision');
    const { fileset, hand, face } = await trackerFiles(mp, (got, total) => {
      status.textContent = `Loading hand tracking: ${(got / 1e6).toFixed(1)} of ${(total / 1e6).toFixed(1)} MB (once)…`;
    });
    const make = async (Cls, opts) => {
      try { const t = await Cls.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'GPU' } }); stats.delegate = 'GPU'; return t; }
      catch (e) { console.warn('GPU delegate unavailable, using CPU.', e); stats.delegate = 'CPU'; return Cls.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'CPU' } }); }
    };
    S.handLandmarker = await make(mp.HandLandmarker, { baseOptions: hand, runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    status.textContent = 'Loading head tracking…';
    try { S.faceDetector = await make(mp.FaceDetector, { baseOptions: face, runningMode: 'VIDEO', minDetectionConfidence: 0.5 }); }
    catch (e) { console.warn('Face detector failed; the window effect stays off.', e); }
    if (fileset.wasmBinaryPath.startsWith('blob:')) URL.revokeObjectURL(fileset.wasmBinaryPath);
    S.mode = 'camera';
    enterScene();
  } catch (err) {
    console.error(err);
    status.textContent = err && err.name === 'NotAllowedError'
      ? 'Camera permission was declined. Switching to painting mode.'
      : `Camera or tracking failed (${err && err.message ? err.message : err}). Switching to painting mode.`;
    setTimeout(() => startMouse(), 1600);
  }
}

// The tracker's runtime and models, from the site's own gzipped copy (made by
// scripts/mediapipe/plugin.ts). A browser that can't unzip in the page or run SIMD, or a
// copy that fails to load, falls back to the CDN.
const LOCAL = ['vision_wasm_internal.wasm.gz', 'hand_landmarker.task.gz', 'blaze_face_short_range.tflite.gz'];
async function trackerFiles(mp, progress: (got: number, total: number) => void) {
  if ('DecompressionStream' in window && await mp.FilesetResolver.isSimdSupported()) {
    try {
      const base = new URL('mediapipe/', document.baseURI);
      const res = await Promise.all(LOCAL.map(async (f) => {
        const r = await fetch(new URL(f, base));
        if (!r.ok || !r.body) throw new Error(`${f}: ${r.status}`);
        return r;
      }));
      const sizes = res.map((r) => Number(r.headers.get('content-length')));
      const total = sizes.every((n) => n > 0) ? sizes.reduce((a, n) => a + n, 0) : 0;
      let got = 0;
      const [wasm, hand, face] = await Promise.all(res.map(async (r) => {
        const chunks: Uint8Array[] = [];
        for (const reader = r.body.getReader(); ;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value); got += value.length;
          if (total) progress(Math.min(got, total), total);
        }
        return gunzip(new Blob(chunks as BlobPart[]));
      }));
      return {
        fileset: { wasmLoaderPath: new URL('vision_wasm_internal.js', base).href, wasmBinaryPath: URL.createObjectURL(new Blob([wasm as BlobPart], { type: 'application/wasm' })) },
        hand: { modelAssetBuffer: hand }, face: { modelAssetBuffer: face },
      };
    } catch (e) { console.warn('The site\'s copy of hand tracking failed to load; using the CDN.', e); }
  }
  return { fileset: await mp.FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`), hand: { modelAssetPath: HAND_MODEL }, face: { modelAssetPath: FACE_MODEL } };
}
// A host that sends .gz files already unzipped (Content-Encoding) leaves nothing to undo.
async function gunzip(blob: Blob) {
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  const raw = head[0] === 0x1f && head[1] === 0x8b ? new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))) : new Response(blob);
  return new Uint8Array(await raw.arrayBuffer());
}

export function startMouse() { S.mode = 'mouse'; late.startAudio(); startTilt(); enterScene(); setTimeout(showSecretsHint, 4000); }

// Phones: tilting the phone leans, the way moving your head does with the camera on.
// The phone's tilt as seen on screen: gamma and beta are fixed to the phone, so turned
// sideways (landscape) they swap. Returns [left-right, toward-away], in degrees.
export function screenTilt(gamma: number, beta: number, angle: number): [number, number] {
  const a = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  return a === 90 ? [beta, -gamma] : a === 180 ? [-gamma, -beta] : a === 270 ? [-beta, gamma] : [gamma, beta];
}
const screenAngle = () => screen.orientation?.angle ?? (window as any).orientation ?? 0;
export let tiltRef = null, tiltOn = false;
export function startTilt() {
  if (!('DeviceOrientationEvent' in window) || !matchMedia('(pointer: coarse)').matches) return;
  const listen = () => {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null || e.beta == null) return;
      const [x, y] = screenTilt(e.gamma, e.beta, screenAngle());
      // Wherever the phone is held when tilt starts (or after it's turned) is straight ahead.
      if (!tiltRef) tiltRef = { x, y };
      tiltOn = true;
      if (S.eyeLocked || focus.active) return;
      eyeTarget.x = clamp((x - tiltRef.x) / 18, -1, 1) * 1.5;
      eyeTarget.y = -clamp((y - tiltRef.y) / 25, -1, 1) * 0.5;
    });
    const recenter = () => { tiltRef = null; };
    screen.orientation?.addEventListener?.('change', recenter);
    window.addEventListener('orientationchange', recenter);
  };
  // iOS asks first, and only from inside a tap: either the early tap in index.html, or
  // this one when the cave was already loaded. Recent Chromium has the same call but can
  // answer "prompt" while still sending events, so listen whatever the answer: events
  // that aren't allowed simply never arrive.
  const DOE = DeviceOrientationEvent as any;
  if (!window.__early?.tilt && typeof DOE.requestPermission === 'function') DOE.requestPermission().catch(() => {});
  listen();
}

export let fireTarget = 0.35;
export function enterScene() {
  $('intro').hidden = true;
  $('hud').hidden = false; $('finds').hidden = false; $('tools').hidden = false; $('gesture').hidden = false;
  const cam = S.mode === 'camera';
  $('shapes').hidden = !cam;
  for (const id of ['t-head', 't-shapes', 't-debug', 't-recenter']) $(id).hidden = !cam;
  $('t-shortcuts').hidden = cam;
  canvas.style.cursor = cam ? 'default' : 'none';
  if (params.has('debug') && cam) late.toggleDebug(true);
  // ?setup shows the walkthrough again; ?trial runs it, then the gesture trial.
  if (cam) { late.startSetup(params.has('setup') || params.has('trial')); late.startTrial(); }
  if (!cam) setGestureUI(paintingHint(), 0);
  // On a narrow screen the middle of the wall is the fire; start looking at the rabbit instead.
  if (screenW < 1.6) pan.target = pan.x = 0.9;
  fireTarget = 1;
}
// Touch screens get "tap", whichever way round the phone is held.
export const press = matchMedia('(pointer: coarse)').matches ? 'Tap' : 'Click';
export const paintingHint = () => (press === 'Tap' ? 'Tap a dotted shape to paint it. Drag to look round.' : 'Click a dotted shape to paint it');

export function detect(t) {
  if (S.mode !== 'camera' || !S.handLandmarker || video.readyState < 2) return;
  if (video.currentTime === S.lastVideoTime) return;
  S.lastVideoTime = video.currentTime;
  const ts = performance.now();
  const res = S.handLandmarker.detectForVideo(video, ts);
  stats.detectMs = stats.detectMs * 0.9 + (performance.now() - ts) * 0.1;
  S.hands = smoothLandmarks((res.landmarks || []).map((lm) => lm.map((p) => ({ x: 1 - p.x, y: p.y }))));
  if (S.faceDetector && S.frameNo++ % 2 === 0) {
    const fr = S.faceDetector.detectForVideo(video, ts + 0.5);
    if (fr.detections && fr.detections.length) onFace(fr.detections.reduce((a, b) => (b.boundingBox.width > a.boundingBox.width ? b : a)), t);
  }
}
