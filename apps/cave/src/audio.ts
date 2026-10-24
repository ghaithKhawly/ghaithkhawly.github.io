import { provide } from './late';
import { $ } from './config';
import { clamp } from './util';

// Earlier modules reach these through `late` (see late.ts). The getters are lazy, so
// registering before the declarations below is safe.
provide({ get playChime() { return playChime; }, get startAudio() { return startAudio; } });

// Sound: a recorded fire, cave drips, chalk-on-stone scratching, chimes
export let audio = null;
export function impulse(ac, seconds, decay) {
  const len = Math.floor(ac.sampleRate * seconds), b = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
  return b;
}
// Cross-fade the end of the recording into its start so the loop has no seam.
export function seamlessLoop(ac, buf, fadeSec) {
  const F = Math.floor(fadeSec * buf.sampleRate), N = buf.length;
  const out = ac.createBuffer(buf.numberOfChannels, N - F, buf.sampleRate);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const i = buf.getChannelData(ch), o = out.getChannelData(ch);
    o.set(i.subarray(0, N - F));
    for (let k = 0; k < F; k++) { const t = k / F; o[k] = i[k] * Math.sqrt(t) + i[N - F + k] * Math.sqrt(1 - t); }
  }
  return out;
}
export function audioOn() { return $('t-sound').getAttribute('aria-pressed') === 'true'; }
export function startAudio() {
  if (audio) return;
  try {
    const ac: AudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    master.gain.setTargetAtTime(audioOn() ? 0.9 : 0, ac.currentTime, 0.8);
    const verb = ac.createConvolver(); verb.buffer = impulse(ac, 3.2, 2.6);
    const wet = ac.createGain(); wet.gain.value = 0.6; verb.connect(wet).connect(master);
    // Scratch: noise through a band-pass, its volume following how fast you paint.
    const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const scratchSrc = ac.createBufferSource(); scratchSrc.buffer = nb; scratchSrc.loop = true;
    const scratchBp = ac.createBiquadFilter(); scratchBp.type = 'bandpass'; scratchBp.frequency.value = 2600; scratchBp.Q.value = 0.9;
    const scratchGain = ac.createGain(); scratchGain.gain.value = 0;
    scratchSrc.connect(scratchBp).connect(scratchGain).connect(master); scratchSrc.start();
    audio = { ac, master, verb, fire: false, scratchGain, scratchBp };
    fetch('fire.mp3').then((r) => r.arrayBuffer()).then((b) => ac.decodeAudioData(b)).then((buf) => {
      const src = ac.createBufferSource(); src.buffer = seamlessLoop(ac, buf, 1.2); src.loop = true;
      const dry = ac.createGain(); dry.gain.value = 0.55;
      const send = ac.createGain(); send.gain.value = 0.08;
      src.connect(dry).connect(master); src.connect(send).connect(verb);
      src.start();
      audio.fire = true;
    }).catch((e) => console.warn('Fire recording unavailable.', e));
    const drip = () => {
      if (!audio) return;
      const t = ac.currentTime + 0.02;
      const o = ac.createOscillator(); o.type = 'sine';
      const f = 900 + Math.random() * 1100;
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.09);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
      if (p) { p.pan.value = Math.random() * 1.6 - 0.8; o.connect(g).connect(p).connect(verb); } else o.connect(g).connect(verb);
      o.start(t); o.stop(t + 0.25);
      setTimeout(drip, 2500 + Math.random() * 6000);
    };
    setTimeout(drip, 1800);
  } catch (e) { console.warn('Audio unavailable', e); }
}
export function setScratch(speed, tool) {
  if (!audio) return;
  const t = audio.ac.currentTime;
  audio.scratchBp.frequency.setTargetAtTime(tool === 'charcoal' ? 2800 : 900, t, 0.05);
  audio.scratchGain.gain.setTargetAtTime(audioOn() ? clamp(speed / 1.6, 0, 1) * (tool === 'charcoal' ? 0.16 : 0.22) : 0, t, 0.04);
}
export const CHIME_ROOT = { wolf: 196, rabbit: 293.66, palm: 329.63, hand: 329.63, project: 246.94, secret: 392 };
export function playChime(kind) {
  if (!audio || !audioOn()) return;
  const { ac, master, verb } = audio;
  const t = ac.currentTime + 0.02, f = CHIME_ROOT[kind] || 261.6;
  for (const [mult, amp] of [[1, 0.16], [1.5, 0.07], [2, 0.06], [3.01, 0.025]]) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * mult;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    o.connect(g); g.connect(master); g.connect(verb);
    o.start(t); o.stop(t + 2.7);
  }
}
$('t-sound').addEventListener('click', (e) => {
  const on = !audioOn();
  e.currentTarget.setAttribute('aria-pressed', String(on));
  if (!audio) startAudio();
  else audio.master.gain.setTargetAtTime(on ? 0.9 : 0, audio.ac.currentTime, 0.2);
});
