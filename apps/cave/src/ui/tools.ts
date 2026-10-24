import { provide } from '../late';
import { S } from '../state';
import { GUIDES } from '../art/guides';
import { playChime } from '../audio';
import { $, EYE_D } from '../config';
import { endFocus, finish, focus, startFinish } from '../play/focus';
import { SECRETS, discover } from '../play/secrets';
import { G, eye, eyeTarget, faceF, stats, video } from '../tracking/state';
import { closePanel, openPanel } from './panels';

// Earlier modules reach these through `late` (see late.ts). The getters are lazy, so
// registering before the declarations below is safe.
provide({ get toggleDebug() { return toggleDebug; } });

// Tools: head tracking, shapes, tracking view, shortcuts
$('t-head').addEventListener('click', (e) => {
  S.headOn = !S.headOn;
  e.currentTarget.setAttribute('aria-pressed', String(S.headOn));
  if (!S.headOn) { eyeTarget.x = 0; eyeTarget.y = 0; eyeTarget.z = EYE_D; }
});
$('t-shapes').addEventListener('click', (e) => {
  const show = $('shapes').hidden;
  $('shapes').hidden = !show;
  e.currentTarget.setAttribute('aria-pressed', String(show));
});
$('t-shortcuts').addEventListener('click', (e) => {
  const show = $('chips').hidden;
  $('chips').hidden = !show;
  e.currentTarget.setAttribute('aria-pressed', String(show));
});
for (const chip of document.querySelectorAll('.chip')) {
  chip.addEventListener('click', () => {
    const section = (chip as HTMLElement).dataset.section;
    const g = GUIDES.find((q) => q.section === section);
    const secret = SECRETS.find((s) => s.id === section);
    if (g && !g.done) startFinish(g);
    else if (secret && !secret.found) discover(secret);
    else { playChime(section === 'experience' ? 'wolf' : section === 'about' ? 'rabbit' : 'palm'); openPanel(section); }
  });
}
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (focus.active && !finish.g) endFocus(); else closePanel();
});
export let debugOn = false;
export function toggleDebug(force?: boolean) {
  debugOn = force ?? !debugOn;
  $('debug').hidden = !debugOn;
  $('t-debug').setAttribute('aria-pressed', String(debugOn));
}
$('t-debug').addEventListener('click', () => toggleDebug());
$('t-recenter').addEventListener('click', () => { S.faceRef = null; S.faceCal = []; for (const f of Object.values(faceF)) f.reset(); });
export const dbgCtx = $('debug-cam').getContext('2d');
export function drawDebug() {
  if (!debugOn) return;
  const W = 240, H = 180;
  dbgCtx.save();
  if (S.mode === 'camera' && video.readyState >= 2) { dbgCtx.translate(W, 0); dbgCtx.scale(-1, 1); dbgCtx.drawImage(video, 0, 0, W, H); }
  else { dbgCtx.fillStyle = '#000'; dbgCtx.fillRect(0, 0, W, H); }
  dbgCtx.restore();
  const bones = [[0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [0, 17, 18, 19, 20], [5, 9, 13, 17]];
  for (const a of S.analyses) {
    dbgCtx.strokeStyle = a.label === 'hand' ? '#b39c84' : '#ffb25e'; dbgCtx.lineWidth = 2;
    for (const b of bones) { dbgCtx.beginPath(); b.forEach((i, k) => { const p = a.N[i]; k ? dbgCtx.lineTo(p.x * W, p.y * H) : dbgCtx.moveTo(p.x * W, p.y * H); }); dbgCtx.stroke(); }
  }
  const a = S.analyses[0];
  const f = (v) => (v ? '●' : '○');
  $('debug-text').textContent = [
    `fps ${stats.fps.toFixed(0)} · detect ${stats.detectMs.toFixed(1)}ms · ${stats.delegate}`,
    `head ${S.faceRef ? (S.headOn ? 'tracked' : 'off') : 'calibrating'} · eye ${eye.x.toFixed(2)}, ${eye.y.toFixed(2)}, ${eye.z.toFixed(2)}`,
    a ? `raw ${a.label} · stable ${G.label} ${G.hold.toFixed(1)}s` : 'no hand',
    a ? `ext  I${f(a.ext.index)} M${f(a.ext.middle)} R${f(a.ext.ring)} P${f(a.ext.pinky)} T${f(a.thumbOut)}` : '',
    a ? `str  ${['index', 'middle', 'ring', 'pinky'].map((k) => a.str[k].toFixed(2)).join(' ')}` : '',
    a ? `up${f(a.up)} side${f(a.sideways)} tips${f(a.tipsTogether)} spread ${a.spread.toFixed(2)}` : '',
  ].join('\n');
}
