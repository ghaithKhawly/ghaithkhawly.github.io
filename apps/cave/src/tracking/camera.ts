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
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    video.srcObject = stream;
    await video.play();
    S.camAspect = (video.videoWidth || 4) / (video.videoHeight || 3);
    status.textContent = 'Loading hand tracking (about 8 MB, once)…';
    const mp = await import(/* @vite-ignore */ `${MP_BASE}/vision_bundle.mjs`);
    const fileset = await mp.FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
    const make = async (Cls, opts) => {
      try { const t = await Cls.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'GPU' } }); stats.delegate = 'GPU'; return t; }
      catch (e) { console.warn('GPU delegate unavailable, using CPU.', e); stats.delegate = 'CPU'; return Cls.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'CPU' } }); }
    };
    S.handLandmarker = await make(mp.HandLandmarker, { baseOptions: { modelAssetPath: HAND_MODEL }, runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    status.textContent = 'Loading head tracking…';
    try { S.faceDetector = await make(mp.FaceDetector, { baseOptions: { modelAssetPath: FACE_MODEL }, runningMode: 'VIDEO', minDetectionConfidence: 0.5 }); }
    catch (e) { console.warn('Face detector failed; the window effect stays off.', e); }
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
export function startMouse() { S.mode = 'mouse'; late.startAudio(); startTilt(); enterScene(); setTimeout(showSecretsHint, 4000); }

// Phones: tilting the phone leans, the way moving your head does with the camera on.
export let tiltRef = null, tiltOn = false;
export function startTilt() {
  if (!('DeviceOrientationEvent' in window) || !matchMedia('(pointer: coarse)').matches) return;
  const listen = () => window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    if (!tiltRef) tiltRef = { g: e.gamma, b: e.beta };
    tiltOn = true;
    if (S.eyeLocked || focus.active) return;
    eyeTarget.x = clamp((e.gamma - tiltRef.g) / 18, -1, 1) * 1.5;
    eyeTarget.y = -clamp((e.beta - tiltRef.b) / 25, -1, 1) * 0.5;
  });
  // iOS asks first, and only from inside a tap, which is where this runs.
  const DOE = DeviceOrientationEvent as any;
  if (typeof DOE.requestPermission === 'function') DOE.requestPermission().then((r) => r === 'granted' && listen()).catch(() => {});
  else listen();
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
  if (!cam) setGestureUI(paintingHint(), 0);
  // On a narrow screen the middle of the wall is the fire; start looking at the rabbit instead.
  if (screenW < 1.6) pan.target = pan.x = 0.9;
  fireTarget = 1;
}
export const paintingHint = () => (window.innerWidth <= 720 ? 'Tap a dotted shape to paint it. Drag to look round.' : 'Click a dotted shape to paint it');

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
