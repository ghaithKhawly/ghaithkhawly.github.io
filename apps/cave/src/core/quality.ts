import { params } from '../config';

// Device tiers. The cave starts at a tier guessed from the device, then watches its own
// frame time and lowers the resolution (and, as a last step, the bloom) until it holds
// its frame rate: 60 fps on a computer, 30 on a phone. ?tier=low|mid|high picks the
// starting tier, ?fixed stops it adapting, ?perf shows what it settled on.
export type Tier = 'low' | 'mid' | 'high';
const coarse = matchMedia('(pointer: coarse)').matches;
const mem = (navigator as any).deviceMemory as number | undefined, cores = navigator.hardwareConcurrency || 4;

function guess(): Tier {
  const forced = params.get('tier');
  if (forced === 'low' || forced === 'mid' || forced === 'high') return forced;
  if (!coarse) return 'high';
  return (mem !== undefined && mem <= 3) || cores <= 4 ? 'low' : 'mid';
}

const TIERS = {
  //       most and least pixels per CSS pixel, bloom
  high: { maxPr: 1.75, minPr: 0.85, bloom: true },
  mid: { maxPr: 1.35, minPr: 0.7, bloom: true },
  low: { maxPr: 1.0, minPr: 0.6, bloom: false },
};

export const quality = {
  tier: guess(),
  targetFps: coarse ? 30 : 60,
  pr: 1,
  bloom: true,
  adaptive: !params.has('fixed'),
  fps: 0, frameMs: 0,
  changes: 0,
};
const T = TIERS[quality.tier];
quality.pr = Math.min(window.devicePixelRatio || 1, T.maxPr);
quality.bloom = T.bloom;

// Frame times over the last two seconds. Decisions wait for a full window after each
// change, and the scene has to be running (the intro and loading don't count).
const times: number[] = [];
let windowStart = 0, last = 0;
export function sampleFrame(now: number, running: boolean, apply: () => void) {
  const dt = last ? now - last : 0;
  last = now;
  // Before the scene runs, or a gap of seconds (a stall, an alert), isn't the device's pace.
  if (!running || dt <= 0 || dt > 3000) { times.length = 0; windowStart = now; return; }
  times.push(dt);
  if (now - windowStart < 2000 || times.length < 5) return;
  const sorted = times.slice().sort((a, b) => a - b), median = sorted[sorted.length >> 1];
  quality.frameMs = median; quality.fps = 1000 / median;
  times.length = 0; windowStart = now;
  if (!quality.adaptive) return;
  const budget = 1000 / quality.targetFps;
  const maxPr = Math.min(window.devicePixelRatio || 1, T.maxPr);
  if (median > budget * 1.2) {
    // Too slow: fewer pixels, then no bloom.
    if (quality.pr > T.minPr + 0.01) quality.pr = Math.max(T.minPr, quality.pr * 0.85);
    else if (quality.bloom) quality.bloom = false;
    else return;
  } else if (median < budget * 0.75 && quality.pr < maxPr - 0.01 && quality.changes < 6) {
    // Plenty of headroom: a little sharper, but only a few times, so it doesn't see-saw.
    quality.pr = Math.min(maxPr, quality.pr * 1.1);
  } else return;
  quality.changes++;
  apply();
}
