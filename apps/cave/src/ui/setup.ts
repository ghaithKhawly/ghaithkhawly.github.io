import { provide } from '../late';
import { S } from '../state';
import { $ } from '../config';
import { G, faceBox, lastFaceAt, video } from '../tracking/state';
import { flushToast } from './panels';

// The first time the camera is on: check the light, find the head, then the hand, and
// teach the first shape, showing what the tracker sees. Each step moves on by itself;
// Skip ends it. It isn't shown again on this device.
provide({ get startSetup() { return startSetup; } });

const KEY = 'cave:setup-done';
const card = $('setup'), view = $('setup-view') as HTMLCanvasElement, say = $('setup-say'), steps = [...card.querySelectorAll('[data-step]')] as HTMLElement[];
const vctx = view.getContext('2d');
const probe = document.createElement('canvas'); probe.width = 64; probe.height = 48;
const pctx = probe.getContext('2d', { willReadFrequently: true });

export const setup = { on: false, step: 0, since: 0, light: 'unknown' as 'unknown' | 'dark' | 'behind' | 'good', lightAt: -1, handAt: -1 };

function done() { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } }
export function startSetup(force = false) {
  if (S.mode !== 'camera' || (!force && done())) return;
  setup.on = true; setup.step = 0; setup.since = S.clock; setup.handAt = -1;
  card.hidden = false;
  document.body.classList.add('setup-on');
  render();
}
export function endSetup() {
  setup.on = false;
  card.hidden = true;
  document.body.classList.remove('setup-on');
  flushToast();
  try { localStorage.setItem(KEY, '1'); } catch { /* private window: it shows again next time */ }
}
$('setup-skip').addEventListener('click', endSetup);

// Average brightness of the frame, and of the face against the rest when there is one.
function measureLight() {
  if (video.readyState < 2) return;
  pctx.drawImage(video, 0, 0, 64, 48);
  const d = pctx.getImageData(0, 0, 64, 48).data;
  let all = 0, face = 0, nf = 0;
  const fb = S.clock - lastFaceAt < 1 ? faceBox : null;
  for (let j = 0; j < 48; j++) for (let i = 0; i < 64; i++) {
    const k = (j * 64 + i) * 4, l = (0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]) / 255;
    all += l;
    if (fb && i / 64 > fb.x && i / 64 < fb.x + fb.w && j / 48 > fb.y && j / 48 < fb.y + fb.h) { face += l; nf++; }
  }
  all /= 64 * 48;
  const faceL = nf ? face / nf : null;
  setup.light = all < 0.16 ? 'dark' : faceL !== null && faceL < all * 0.62 ? 'behind' : 'good';
}

const LIGHT = {
  unknown: 'Checking the light…',
  dark: 'It’s dark where you are. Turn on a light, or face a window: the tracker needs to see your hands.',
  behind: 'There’s a bright light behind you. Turn so it falls on your face and hands.',
  good: 'The light is good.',
};
function render() {
  let text = '';
  if (setup.step === 0) text = LIGHT[setup.light];
  else if (setup.step === 1) text = S.clock - setup.since > 6 && S.clock - lastFaceAt > 1 ? 'I can’t see your face. Sit facing the screen, about an arm’s length from it.' : 'Look at the screen for a moment while it finds your head.';
  else if (setup.step === 2) text = S.hands.length ? 'There’s your hand. Now make the hare: two fingers up, the others and your thumb folded.' : 'Raise a hand into the firelight, palm to the camera.';
  if (say.textContent !== text) say.textContent = text;
  steps.forEach((el, i) => { el.classList.toggle('done', i < setup.step); el.classList.toggle('now', i === setup.step); });
  // A light that's still poor stays flagged on its step after the walkthrough moves on.
  steps[0].classList.toggle('warn', setup.step > 0 && setup.light !== 'good');
  steps[0].title = setup.step > 0 && setup.light !== 'good' ? LIGHT[setup.light] : '';
}

// What the tracker sees: the camera, dimmed and mirrored, with the hand's 21 points.
const BONES = [[0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [5, 9, 10, 11, 12], [9, 13, 14, 15, 16], [13, 17, 18, 19, 20], [0, 17]];
function drawView() {
  const W = view.width, H = view.height;
  vctx.save();
  if (video.readyState >= 2) { vctx.translate(W, 0); vctx.scale(-1, 1); vctx.drawImage(video, 0, 0, W, H); }
  vctx.restore();
  vctx.fillStyle = 'rgba(12, 7, 4, 0.45)'; vctx.fillRect(0, 0, W, H);
  for (const a of S.analyses) {
    const shape = a.label !== 'hand';
    vctx.strokeStyle = shape ? '#e0703a' : '#efe3c9'; vctx.lineWidth = 2;
    for (const b of BONES) { vctx.beginPath(); b.forEach((i, k) => { const p = a.N[i]; k ? vctx.lineTo(p.x * W, p.y * H) : vctx.moveTo(p.x * W, p.y * H); }); vctx.stroke(); }
    vctx.fillStyle = shape ? '#e0703a' : '#efe3c9';
    for (const p of a.N) { vctx.beginPath(); vctx.arc(p.x * W, p.y * H, 2.2, 0, Math.PI * 2); vctx.fill(); }
  }
}

// Called a few times a second from the main loop.
export function updateSetup() {
  if (!setup.on) return;
  if (S.clock - setup.lightAt > 0.5) { setup.lightAt = S.clock; measureLight(); }
  if (setup.step === 0 && (setup.light === 'good' && S.clock - setup.since > 1.2)) next();
  // No face detector (it failed to load) or a face found: on to the hand.
  if (setup.step === 1 && (!S.faceDetector || S.faceRef)) next();
  if (setup.step === 2) {
    if (S.hands.length && setup.handAt < 0) setup.handAt = S.clock;
    if (G.label === 'rabbit' || G.latched) { endSetup(); return; }
  }
  // A dark room shouldn't block the rest: after a few seconds the light step lets you on.
  if (setup.step === 0 && S.clock - setup.since > 8) next();
  render();
  drawView();
}
function next() { setup.step++; setup.since = S.clock; }
