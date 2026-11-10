import { provide } from '../late';
import { S } from '../state';
import { $, params } from '../config';
import { setup } from './setup';
import { G } from '../tracking/state';
import { flushToast } from './panels';

// Trial mode (?trial): ten tries at the three shapes, one prompt at a time, scored. Shapes
// open nothing while it runs. It measures what M3 is judged on: 9 of 10 real tries.
provide({ get trial() { return trial; }, get trialShape() { return trialShape; }, get startTrial() { return startTrial; } });

const ORDER = ['wolf', 'rabbit', 'palm', 'rabbit', 'wolf', 'palm', 'wolf', 'rabbit', 'palm', 'wolf'];
const NAME = { wolf: 'the wolf', rabbit: 'the hare', palm: 'an open palm' };
const HOW = {
  wolf: 'Hand sideways, thumb up as the ear, three fingers together as the snout.',
  rabbit: 'Two fingers up, the others and your thumb folded.',
  palm: 'Fingers up and spread, and hold still.',
};
const GIVE_UP = 12;   // seconds from the hand appearing

export const trial = { on: false, i: 0, phase: 'rest' as 'rest' | 'show' | 'over', since: 0, handAt: -1, results: [] as { want: string; got: string | null; secs: number }[] };
const card = $('trial'), say = $('trial-say'), how = $('trial-how'), count = $('trial-count');

// On from the moment the camera starts, so a shape made during the walkthrough opens
// nothing either; the prompts wait until the walkthrough is over.
export function startTrial() {
  if (!params.has('trial') || S.mode !== 'camera' || trial.on) return;
  Object.assign(trial, { on: true, i: 0, phase: 'rest', since: S.clock, handAt: -1, results: [] });
}
// A shape was held long enough to count.
export function trialShape(label: string) {
  if (!trial.on || trial.phase !== 'show') return;
  record(label);
}
function record(got: string | null) {
  trial.results.push({ want: ORDER[trial.i], got, secs: trial.handAt >= 0 ? S.clock - trial.handAt : 0 });
  trial.i++;
  trial.phase = trial.i >= ORDER.length ? 'over' : 'rest';
  trial.since = S.clock; trial.handAt = -1;
}

let restClearAt = -1;
export function updateTrial() {
  if (!trial.on || setup.on) return;
  card.hidden = false;
  document.body.classList.add('trial-on');
  const want = ORDER[trial.i];
  if (trial.phase === 'rest') {
    // Each try starts from no shape held, so one doesn't run into the next. (Not "no hand
    // in view": a stray detection, a sleeve or a face, would hold that up for good.)
    if (G.label !== 'hand' && G.label !== 'none') restClearAt = -1; else if (restClearAt < 0) restClearAt = S.clock;
    if (restClearAt >= 0 && S.clock - restClearAt > 0.6) { trial.phase = 'show'; trial.since = S.clock; }
    say.textContent = trial.i ? 'Relax your hand.' : 'Ten tries. Relax your hand to start.';
    how.textContent = '';
  } else if (trial.phase === 'show') {
    if (S.hands.length && trial.handAt < 0) trial.handAt = S.clock;
    if (trial.handAt >= 0 && S.clock - trial.handAt > GIVE_UP) record(null);
    say.textContent = `Make ${NAME[want]}.`;
    how.textContent = HOW[want];
  } else {
    const ok = trial.results.filter((r) => r.got === r.want);
    const by = (w) => `${NAME[w]} ${ok.filter((r) => r.want === w).length} of ${trial.results.filter((r) => r.want === w).length}`;
    const secs = ok.length ? ok.reduce((a, r) => a + r.secs, 0) / ok.length : 0;
    say.textContent = `${ok.length} of ${trial.results.length} worked.`;
    how.textContent = `${by('wolf')}, ${by('rabbit')}, ${by('palm')}. ${ok.length ? `About ${secs.toFixed(1)} s each to be recognised.` : ''}`;
    $('trial-copy').hidden = false;
  }
  count.textContent = trial.phase === 'over' ? '' : `Try ${Math.min(trial.i + 1, ORDER.length)} of ${ORDER.length}`;
}
$('trial-copy').addEventListener('click', () => {
  const text = ['The Cave, gesture trial', ...trial.results.map((r, i) => `${i + 1}. ${r.want}: ${r.got === r.want ? 'yes' : r.got ? `read as ${r.got}` : 'not recognised'}${r.got ? ` (${r.secs.toFixed(1)} s)` : ''}`), say.textContent, how.textContent].join('\n');
  navigator.clipboard?.writeText(text).then(() => { $('trial-copy').textContent = 'Copied'; }, () => {});
});
$('trial-end').addEventListener('click', () => { trial.on = false; card.hidden = true; document.body.classList.remove('trial-on'); flushToast(); });
