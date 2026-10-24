import * as THREE from 'three';
import { S } from '../state';
import { GUIDES, SECTION_NAME, checkGuides, guideAt, guideProgress, traceGuides } from '../art/guides';
import { PAINTINGS, artCtx } from '../art/layers';
import { TOOLS, dab, markArt, renderStroke, strokesCtx } from '../art/strokes';
import { playChime, setScratch } from '../audio';
import { $, ART_H, ART_W } from '../config';
import { pan, screenW } from '../core/view';
import { PIG } from '../paint/pigment';
import { finish, focus, startFocus } from './focus';
import { startStepOut, stepOut } from './stepout';
import { paintingHint, startCamera, startMouse } from '../tracking/camera';
import { eyeTarget, pointer, setGestureUI } from '../tracking/state';
import { boost, openPanel } from '../ui/panels';
import { clamp, smooth } from '../util';
import { camera, canvas, wall } from '../world/scene';

// Painting mode input (mouse, pen or touch)
export const raycaster = new THREE.Raycaster();
export const ndc = new THREE.Vector2();
export function wallHit(clientX, clientY) {
  ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObject(wall, false)[0];
  return hit ? [hit.uv.x * ART_W, (1 - hit.uv.y) * ART_H] : null;
}
export function paintingAt(ax, ay, filter) { return PAINTINGS.find((p) => filter(p) && ax > p.x && ax < p.x + p.w && ay > p.y && ay < p.y + p.h) || null; }
export function clickTarget(ax, ay) {
  return paintingAt(ax, ay, (p) => p.project && stepOut.id !== p.id) || paintingAt(ax, ay, (p) => p.guide && p.glow);
}
// Edge-lean for the mouse: near a screen edge, the view leans that way.
export const edgeLean = (v) => Math.sign(v) * smooth(0.55, 1, Math.abs(v));
canvas.addEventListener('pointerdown', (e) => {
  if (S.mode === 'idle' || finish.g) return;
  const hit = wallHit(e.clientX, e.clientY);
  pointer.down = true; pointer.moved = 0; pointer.lastX = e.clientX; pointer.lastT = performance.now();
  pointer.panning = false; pointer.drawing = false;
  if (S.mode !== 'mouse' || !hit) return;
  const g = guideAt(hit[0], hit[1], 40);
  // Away from the wall: clicking a shape walks you up to it first.
  if (!focus.active && g && !g.done) { startFocus(g); pointer.down = false; return; }
  // On touch, a drag that doesn't start on a shape looks around instead of painting.
  if (!focus.active && e.pointerType === 'touch' && !g && !clickTarget(hit[0], hit[1])) { pointer.panning = true; return; }
  if (focus.active && focus.t < 0.9) { pointer.down = false; return; }
  pointer.drawing = true;
  pointer.inside = true; pointer.ax = hit[0]; pointer.ay = hit[1]; pointer.strokeLen = 0;
  const fg = focus.active ? focus.guide : null;
  const tool = fg ? fg.tool : 'ochre';
  S.currentStroke = { pts: [], seed: (Math.random() * 1e6) | 0, tool, color: fg ? fg.line : PIG.red };
  addStrokePoint(hit, 0);
  canvas.setPointerCapture?.(e.pointerId);
});
export function addStrokePoint(p, speed) {
  const T = TOOLS[S.currentStroke.tool];
  const r = T.base * (1.3 - clamp(speed / 1.4, 0, 0.6));
  const load = Math.max(0.3, 1 - pointer.strokeLen / 2200);
  const pt = [p[0], p[1], r, load];
  S.currentStroke.pts.push(pt);
  dab(artCtx, pt[0], pt[1], pt[2], S.currentStroke.color, pt[3], S.currentStroke.seed + S.currentStroke.pts.length - 1, S.currentStroke.tool);
  traceGuides(p[0], p[1]);
}
canvas.addEventListener('pointermove', (e) => {
  if (S.mode === 'idle') return;
  const now = performance.now();
  const dx = e.clientX - pointer.lastX; pointer.lastX = e.clientX;
  if (pointer.down) pointer.moved += Math.abs(dx);
  if (pointer.panning) {
    const limit = Math.max(0, 3.0 - screenW / 2);
    pan.target = clamp(pan.target - (dx / window.innerWidth) * screenW * 1.4, -limit, limit);
    return;
  }
  if (S.mode !== 'mouse') return;
  const hit = wallHit(e.clientX, e.clientY);
  if (!hit) return;
  pointer.inside = true; pointer.ax = hit[0]; pointer.ay = hit[1];
  for (const g of GUIDES) g.hover = guideAt(hit[0], hit[1], 20) === g ? 1 : 0;
  if (!pointer.drawing) {
    canvas.style.cursor = clickTarget(hit[0], hit[1]) ? 'pointer' : 'none';
    if (!focus.active) {
      const g = guideAt(hit[0], hit[1], 30);
      setGestureUI(g && !g.done ? `Click to paint ${g.title} · opens ${SECTION_NAME[g.section]}` : paintingHint(), 0);
      if (!S.eyeLocked) {
        eyeTarget.x = -edgeLean((e.clientX / window.innerWidth - 0.5) * 2) * 1.5;
        eyeTarget.y = edgeLean((e.clientY / window.innerHeight - 0.5) * 2) * 0.5;
      }
    }
    pointer.lastT = now;
    return;
  }
  const prevPt = S.currentStroke.pts[S.currentStroke.pts.length - 1];
  const dist = Math.hypot(hit[0] - prevPt[0], hit[1] - prevPt[1]);
  if (dist < 2) return;
  const speed = dist / Math.max(1, now - pointer.lastT);
  pointer.lastT = now;
  setScratch(speed, S.currentStroke.tool);
  const steps = Math.ceil(dist / 2.5);
  for (let i = 1; i <= steps; i++) {
    pointer.strokeLen += dist / steps;
    addStrokePoint([prevPt[0] + ((hit[0] - prevPt[0]) * i) / steps, prevPt[1] + ((hit[1] - prevPt[1]) * i) / steps], speed);
  }
  S.artUploadPending = true;
  if (focus.active && focus.guide && !focus.guide.done) setGestureUI(`Tracing ${focus.guide.title}`, guideProgress(focus.guide) / 0.68);
  checkGuides(false);
});
export function endPointer(e) {
  if (!pointer.down) return;
  pointer.down = false;
  setScratch(0, 'ochre');
  if (pointer.drawing && S.currentStroke) {
    if (S.currentStroke.pts.length < 3 && pointer.moved < 8) {
      // A click rather than a stroke: wake a project or reopen a painted creature.
      const [x, y] = S.currentStroke.pts[0];
      const target = clickTarget(x, y);
      if (target?.project) startStepOut(target);
      else if (target?.guide) { boost([target.id]); playChime(target.guide.id); openPanel(target.guide.section); }
      markArt(x - 30, y - 30, 60, 60);
    } else {
      renderStroke(strokesCtx, S.currentStroke);
      checkGuides(true);
    }
  } else if (S.mode === 'camera' && pointer.moved < 8 && e) {
    const hit = wallHit(e.clientX, e.clientY);
    const target = hit && clickTarget(hit[0], hit[1]);
    if (target?.project) startStepOut(target);
  }
  S.currentStroke = null; pointer.drawing = false; pointer.panning = false;
}
window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => {
  if (pointer.drawing) return;
  pointer.inside = false;
  if (S.mode === 'mouse' && !S.eyeLocked) { eyeTarget.x = 0; eyeTarget.y = 0; }
});

$('start-cam').addEventListener('click', startCamera);
$('start-mouse').addEventListener('click', startMouse);
