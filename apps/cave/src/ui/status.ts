import { S } from '../state';
import { GUIDES } from '../art/guides';
import { PAINTINGS } from '../art/layers';
import { $ } from '../config';
import { SECRETS } from '../play/secrets';
import { opened } from './panels';

// What there is to find: a painting for each section and project, and the hidden things.
export const PAINTED = [...GUIDES.map((g) => g.section), ...PAINTINGS.filter((p) => p.project).map((p) => `project:${p.project}`)];

// One tally mark per find, scratched like a count on the cave wall. Found ones are
// painted over in red ochre; the hidden things are the short marks after the gap.
let drawn = '';
export function updateFinds() {
  const painted = PAINTED.map((k) => opened.has(k)), hidden = SECRETS.map((s) => s.found);
  const key = [...painted, ...hidden].map(Number).join('');
  if (key === drawn) return;
  drawn = key;
  const marks: string[] = [];
  let x = 6;
  const mark = (found: boolean, top: number, i: number) => {
    marks.push(`<path class="${found ? 'found' : 'open'}" d="M${x} 40 L${x + 2 + ((i * 7) % 3)} ${top}"/>`);
    x += 15;
  };
  painted.forEach((f, i) => mark(f, 4, i));
  x += 24;
  hidden.forEach((f, i) => mark(f, 18, i + painted.length));
  const svg = $('tally');
  svg.setAttribute('width', String(x));
  svg.setAttribute('viewBox', `0 0 ${x} 44`);
  svg.innerHTML = marks.join('');
  const p = painted.filter(Boolean).length, h = hidden.filter(Boolean).length;
  $('finds-text').textContent = `${p} of ${painted.length} paintings, ${h} of ${hidden.length} hidden`;
}

let lastStatus = '';
export function updateStatus(headTracked: boolean) {
  let text: string;
  if (S.mode === 'camera') {
    text = !S.headOn ? 'Camera on. Head tracking is off.'
      : !S.faceRef ? 'Camera on. Look at the screen while it finds your head.'
      : headTracked ? 'Camera on. Lean to look round the cave.'
      : 'Camera on. Face the screen so it can see your head.';
  } else {
    text = matchMedia('(pointer: coarse)').matches ? 'No camera. Tilt or drag to look round.' : 'No camera. Move to the edges of the screen to look round.';
  }
  if (text !== lastStatus) { $('hud-status').textContent = text; lastStatus = text; }
  updateFinds();
}
