import { S } from '../state';
import { sprayAround } from '../paint/pigment';
import { POSES } from './poses';

export { POSES };

// Hand silhouettes (live shadows, stencils, synthetic poses, thumbnails)
export function drawHandSilhouette(ctx, pts, s, armLength = 2.6, fadeTo = 'rgba(255,255,255,0)', stick = false) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const w = pts[0], m = pts[9];
  let dx = w.x - m.x, dy = w.y - m.y;
  const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  const nx = -dy, ny = dx;
  if (armLength > 0) {
    // Forearm, fading out so it reads as an arm reaching in rather than a pillar.
    const far = { x: w.x + dx * s * armLength, y: w.y + dy * s * armLength };
    const solid = ctx.fillStyle;
    const grad = ctx.createLinearGradient(w.x, w.y, far.x, far.y);
    grad.addColorStop(0, solid); grad.addColorStop(0.55, solid); grad.addColorStop(1, fadeTo);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(w.x + nx * s * 0.36, w.y + ny * s * 0.36);
    ctx.lineTo(far.x + nx * s * 0.46, far.y + ny * s * 0.46);
    ctx.lineTo(far.x - nx * s * 0.46, far.y - ny * s * 0.46);
    ctx.lineTo(w.x - nx * s * 0.36, w.y - ny * s * 0.36);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = solid;
  }
  ctx.beginPath();
  [0, 1, 2, 5, 9, 13, 17].forEach((i, k) => (k ? ctx.lineTo(pts[i].x, pts[i].y) : ctx.moveTo(pts[i].x, pts[i].y)));
  ctx.closePath(); ctx.fill();
  ctx.lineWidth = s * 0.3; ctx.stroke();
  const seg = (ids, wd) => { ctx.lineWidth = wd; ctx.beginPath(); ids.forEach((i, k) => (k ? ctx.lineTo(pts[i].x, pts[i].y) : ctx.moveTo(pts[i].x, pts[i].y))); ctx.stroke(); };
  seg([1, 2, 3, 4], s * 0.24); seg([5, 6, 7, 8], s * 0.19); seg([9, 10, 11, 12], s * 0.2); seg([13, 14, 15, 16], s * 0.185); seg([17, 18, 19, 20], s * 0.16);
  if (stick) {
    // A charcoal stick held between thumb and finger, its tip at the fingertip.
    const a = pts[6], b = pts[8];
    const ux = (b.x - a.x), uy = (b.y - a.y), l = Math.hypot(ux, uy) || 1;
    ctx.lineWidth = s * 0.11;
    ctx.beginPath(); ctx.moveTo(b.x + (ux / l) * s * 0.08, b.y + (uy / l) * s * 0.08); ctx.lineTo(b.x - (ux / l) * s * 1.5 + (pts[4].x - b.x) * 0.3, b.y - (uy / l) * s * 1.5 + (pts[4].y - b.y) * 0.3); ctx.stroke();
  }
}

// A sprayed "negative" handprint: pigment blown around a hand, the hand left bare.
export function makeStencil(pts, s, col, seed, alpha = 1) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 1; i < 21; i++) { minX = Math.min(minX, pts[i].x); minY = Math.min(minY, pts[i].y); maxX = Math.max(maxX, pts[i].x); maxY = Math.max(maxY, pts[i].y); }
  minY = Math.min(minY, pts[0].y); maxY = Math.max(maxY, pts[0].y + s * 0.6);
  const pad = s * 0.9;
  const ox = minX - pad, oy = minY - pad, W = Math.ceil(maxX - minX + pad * 2), H = Math.ceil(maxY - minY + pad * 2);
  const local = pts.map((p) => ({ x: p.x - ox, y: p.y - oy }));
  local[0] = { x: local[0].x + (local[0].x - local[9].x) * 0.15, y: local[0].y + (local[0].y - local[9].y) * 0.15 };
  const c = sprayAround(W, H, (x) => drawHandSilhouette(x, local, s * 0.92, 0), col, seed, { reach: s * 0.35, alpha });
  return { canvas: c, x: ox, y: oy };
}

export function posePoints(name, cx, cy, s, rot = 0, anchor = 9) {
  const pose = POSES[name];
  const [px, py] = pose[anchor];
  const cr = Math.cos(rot), sr = Math.sin(rot);
  return pose.map(([x, y]) => {
    const dx = (x - px) * s, dy = (y - py) * s;
    return { x: cx + dx * cr - dy * sr, y: cy + dx * sr + dy * cr };
  });
}

// Little firelit discs showing each shape's shadow: the tip for "how do I make this?".
export function renderThumb(canvas, name) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const bg = ctx.createRadialGradient(W * 0.45, H * 0.6, 0, W / 2, H / 2, W * 0.62);
  bg.addColorStop(0, '#e19a5a'); bg.addColorStop(0.55, '#a8592c'); bg.addColorStop(1, '#3a1b0d');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2); ctx.fill();
  const pose = POSES[name === 'wolf' ? 'wolfOpen' : name];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pose) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  const s = Math.min((W * 0.62) / (maxX - minX + 0.5), (H * 0.62) / (maxY - minY + 0.5));
  const cx = W / 2 - ((minX + maxX) / 2) * s, cy = H / 2 - ((minY + maxY) / 2) * s;
  const pts = pose.map(([x, y]) => ({ x: cx + x * s, y: cy + y * s }));
  ctx.save();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(28,12,6,0.9)'; ctx.strokeStyle = 'rgba(28,12,6,0.9)';
  drawHandSilhouette(ctx, pts, s, 1.6, 'rgba(28,12,6,0)');
  ctx.restore();
}
for (const c of document.querySelectorAll<HTMLCanvasElement>('canvas[data-thumb]')) renderThumb(c, c.dataset.thumb);
