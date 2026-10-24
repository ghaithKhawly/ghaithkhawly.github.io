import * as THREE from 'three';
import { S } from '../state';
import { GUIDES } from '../art/guides';
import { GLOW_PAD, PAINTINGS, STENCILS, fxCtx, fxTex, shadowCtx, shadowTex, shadowTmp, shadowTmpCtx, wallPatch } from '../art/layers';
import { SH_H, SH_W } from '../config';
import { drawHandSilhouette } from '../hands/silhouette';
import { finish, focus } from '../play/focus';
import { G, pointer } from '../tracking/state';
import { clamp, makeCanvas, supportsFilter } from '../util';
import { crackPath, scene } from '../world/scene';

// Drawing the shadow + glow layers
export function drawShadows(handPts, stick) {
  // Opaque black base: the alpha map reads brightness, so soft edges need real grey levels.
  shadowCtx.fillStyle = '#000';
  shadowCtx.fillRect(0, 0, SH_W, SH_H);
  if (handPts.length) {
    shadowTmpCtx.clearRect(0, 0, SH_W, SH_H);
    shadowTmpCtx.fillStyle = '#fff'; shadowTmpCtx.strokeStyle = '#fff';
    for (const pts of handPts) drawHandSilhouette(shadowTmpCtx, pts, Math.hypot(pts[0].x - pts[9].x, pts[0].y - pts[9].y), 2.6, 'rgba(255,255,255,0)', stick);
    if (supportsFilter) {
      shadowCtx.filter = `blur(${((1.6 + Math.max(0, S.flickerNow) * 1.4) * (1 - 0.55 * focus.t)).toFixed(1)}px)`;
      shadowCtx.drawImage(shadowTmp, 0, 0);
      shadowCtx.filter = 'none';
    } else {
      shadowCtx.globalAlpha = 0.25;
      for (const [ox, oy] of [[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5]]) shadowCtx.drawImage(shadowTmp, ox, oy);
      shadowCtx.globalAlpha = 1;
    }
  }
  shadowCtx.fillStyle = '#000';
  shadowCtx.fill(crackPath);
  shadowTex.needsUpdate = true;
}

export function guideGlowFor(g) {
  if (!g.glowPatch) {
    const pad = 16, K = 2, c = makeCanvas((g.w + pad * 2) * K, (g.h + pad * 2) * K);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.channel = 1;
    const mesh = new THREE.Mesh(wallPatch(g.x - pad, g.y - pad, g.w + pad * 2, g.h + pad * 2, 0.016), new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    mesh.renderOrder = 6; mesh.visible = false;
    scene.add(mesh);
    g.glowPatch = { pad, K, ctx: c.getContext('2d'), tex, mesh };
  }
  return g.glowPatch;
}
// Embers along the parts of the engraving still to trace.
export function drawGuideGlow(g, a) {
  const gp = guideGlowFor(g), c = gp.ctx, K = gp.K, n = g.samples.length;
  const X = (x) => (x - g.x + gp.pad) * K, Y = (y) => (y - g.y + gp.pad) * K;
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  c.lineCap = 'round';
  for (const [wd, col] of [[7, `rgba(255,120,40,${0.13 * a})`], [2.6, `rgba(255,160,80,${0.4 * a})`], [1, `rgba(255,220,160,${0.7 * a})`]] as [number, string][]) {
    c.strokeStyle = col; c.lineWidth = wd * K;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (g.covered[i] && g.covered[j]) continue;
      c.moveTo(X(g.samples[i][0]), Y(g.samples[i][1])); c.lineTo(X(g.samples[j][0]), Y(g.samples[j][1]));
    }
    c.stroke();
  }
  gp.tex.needsUpdate = true;
  gp.mesh.visible = true;
}
export function emberEye(x, y, R) {
  const grd = fxCtx.createRadialGradient(x, y, 0, x, y, R * 3);
  grd.addColorStop(0, 'rgba(255,220,150,1)'); grd.addColorStop(0.25, 'rgba(255,140,50,0.8)'); grd.addColorStop(1, 'rgba(255,80,20,0)');
  fxCtx.fillStyle = grd;
  fxCtx.beginPath(); fxCtx.arc(x, y, R * 3, 0, Math.PI * 2); fxCtx.fill();
}
export let fxWasActive = true;
export function drawFx(handPts) {
  const eyesOpen = S.mode === 'camera' && (G.label === 'wolf' || G.label === 'rabbit') && S.analyses.some((a) => a.label === G.label);
  const active = S.mode === 'mouse' || eyesOpen || PAINTINGS.some((p) => p.g > 0.01 && p.alpha > 0.01) || STENCILS.some((st) => st.glow && S.clock <= st.glowUntil);
  if (!active && !fxWasActive) return;
  fxWasActive = active;
  fxCtx.clearRect(0, 0, SH_W, SH_H);
  for (const p of PAINTINGS) {
    if (!p.glow || p.g <= 0.01 || p.alpha <= 0.01) continue;
    fxCtx.globalAlpha = Math.min(1, p.g) * p.alpha;
    fxCtx.drawImage(p.glow, p.x / 2 - GLOW_PAD, p.y / 2 - GLOW_PAD);
    // A traced creature opens its eye while it glows.
    const g = p.guide;
    if (g && g.eye && p.g > 0.4) { fxCtx.globalAlpha = clamp((p.g - 0.4) * 2.5, 0, 1); emberEye((g.x + g.eye[0] * g.w) / 2, (g.y + g.eye[1] * g.h) / 2, 3.2); }
  }
  for (const s of STENCILS) {
    if (!s.glow || S.clock > s.glowUntil) continue;
    fxCtx.globalAlpha = clamp((1 - (S.clock - s.born) / (s.glowUntil - s.born)) * 1.3, 0, 1);
    fxCtx.drawImage(s.glow, s.x / 2 - GLOW_PAD, s.y / 2 - GLOW_PAD);
  }
  // Tracing guides: dotted ochre outlines that breathe, brighter where already traced.
  // Up at the wall, the one you're tracing glows along its engraving instead.
  for (const g of GUIDES) if (g.glowPatch) g.glowPatch.mesh.visible = false;
  if (S.mode === 'mouse') {
    for (const g of GUIDES) {
      if (g.done) continue;
      const focused = focus.active && focus.guide === g;
      if (focused && focus.t > 0.3) { drawGuideGlow(g, 0.75 + 0.25 * Math.sin(S.clock * 2.2)); continue; }
      const breathe = (focused ? 0.75 : 0.32) + 0.2 * Math.sin(S.clock * 2.2 + g.x) + g.hover * 0.4;
      g.samples.forEach(([x, y], i) => {
        const lit = g.covered[i];
        if (lit && focused) return;
        fxCtx.globalAlpha = lit ? 0.95 : clamp(breathe, 0, 1);
        fxCtx.fillStyle = lit ? 'rgb(255,190,110)' : 'rgb(230,130,60)';
        fxCtx.beginPath(); fxCtx.arc(x / 2, y / 2, lit ? 2.2 : focused ? 1.1 : 1.35, 0, Math.PI * 2); fxCtx.fill();
      });
    }
    if (pointer.inside && !finish.g) {
      fxCtx.globalAlpha = pointer.drawing ? 1 : 0.7;
      emberEye(pointer.ax / 2, pointer.ay / 2, pointer.drawing ? 1.6 : 1.2);
    }
  }
  fxCtx.globalAlpha = 1;
  // Living shadows: an ember eye opens in a wolf or rabbit.
  if (eyesOpen) {
    const idx = S.analyses.findIndex((a) => a.label === G.label);
    const pts = handPts[idx];
    if (pts) {
      const s = Math.hypot(pts[0].x - pts[9].x, pts[0].y - pts[9].y);
      let ex, ey;
      if (G.label === 'wolf') { const a = pts[6], th = pts[2]; ex = a.x + (th.x - a.x) * 0.3; ey = a.y + (th.y - a.y) * 0.3 - s * 0.08; }
      else { const a = pts[5], b = pts[9]; ex = (a.x + b.x) / 2 + (pts[0].x - b.x) * 0.15; ey = (a.y + b.y) / 2 + (pts[0].y - b.y) * 0.15; }
      const R = s * 0.055 * clamp(G.hold / 0.5, 0, 1);
      if (R > 0.4) emberEye(ex, ey, R);
    }
  }
  fxTex.needsUpdate = true;
}
