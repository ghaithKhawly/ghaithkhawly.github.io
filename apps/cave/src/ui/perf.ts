import { $, params } from '../config';
import { quality } from '../core/quality';
import { renderer } from '../world/scene';

// ?perf: what the cave settled on and how fast it's running, for checking on a real phone.
export const perfOn = params.has('perf');
const box = $('perf');
if (perfOn) { box.hidden = false; renderer.info.autoReset = false; }
let lastAt = 0;
export function perfFrameStart() { if (perfOn) renderer.info.reset(); }
export function updatePerf(now: number) {
  if (!perfOn || now - lastAt < 500) return;
  lastAt = now;
  const c = renderer.domElement, i = renderer.info, mem = (performance as any).memory;
  box.textContent = [
    `${quality.fps ? quality.fps.toFixed(0) : '…'} fps (${quality.frameMs ? quality.frameMs.toFixed(1) : '…'} ms), aiming for ${quality.targetFps}`,
    `tier ${quality.tier}${quality.adaptive ? '' : ' (fixed)'}, ${quality.pr.toFixed(2)} px per CSS px, bloom ${quality.bloom ? 'on' : 'off'}`,
    `${c.width}×${c.height} drawn, ${i.render.calls} draw calls, ${(i.render.triangles / 1000).toFixed(0)}k triangles`,
    `${i.memory.textures} textures, ${i.memory.geometries} geometries${mem ? `, ${(mem.usedJSHeapSize / 1048576).toFixed(0)} MB heap` : ''}`,
    `${navigator.hardwareConcurrency || '?'} cores${(navigator as any).deviceMemory ? `, ${(navigator as any).deviceMemory} GB` : ''}, ${window.devicePixelRatio}× screen`,
  ].join('\n');
}
