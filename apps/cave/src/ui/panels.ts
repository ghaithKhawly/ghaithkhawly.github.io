import { late, provide } from '../late';
import { S } from '../state';
import { CV } from '../content';
import { PAINTINGS } from '../art/layers';
import { $ } from '../config';
import { returnStepOut } from '../play/stepout';

// Earlier modules reach these through `late` (see late.ts). The getters are lazy, so
// registering before the declarations below is safe.
provide({ get openPanel() { return openPanel; } });

// Sections, painted on the rock beside their paintings. The words are real text, laid
// over the canvas and multiplied into it; a limewash goes down first so they read.
export const panel = $('panel'), panelBody = $('panel-body'), wash = $('panel-wash');
export let panelKind = null, panelArg = null;
// Everything opened so far (sections, and `project:<id>`), for the tally of finds.
export const opened = new Set<string>();
export function el(tag: string, cls?: string | null, text?: string | null): HTMLElement { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
const sentences = (lines: string[]) => lines.map((l) => l.trim().replace(/\.?$/, '.')).join(' ');
export function openPanel(kind: string, arg?: any) {
  panelKind = kind; panelArg = arg;
  opened.add(kind === 'project' ? `project:${arg}` : kind);
  panelBody.replaceChildren();
  const eyebrow = $('panel-eyebrow'), title = $('panel-title');
  if (kind === 'experience') {
    eyebrow.textContent = 'Opened by the wolf';
    title.textContent = 'Experience';
    const xs = CV.experiences, first = xs[xs.length - 1];
    if (xs.every((x) => x.company === first.company)) {
      panelBody.append(el('p', 'lede', `At ${first.company} since ${first.period.split(/\s+[-–]\s+/)[0]}.`));
    }
    const ol = el('ol', 'roles');
    for (const x of xs) {
      const li = el('li');
      li.append(el('span', 'when', x.period), el('h3', 'painted', xs.every((y) => y.company === x.company) ? x.position : `${x.position}, ${x.company}`), el('p', null, sentences(x.description)));
      if (x.technologies?.length) li.append(el('p', 'used', x.technologies.join(', ')));
      ol.append(li);
    }
    panelBody.append(ol);
    boost(['bison', 'horse', 'deer', 'hunters']);
  } else if (kind === 'about') {
    eyebrow.textContent = 'Opened by the hare';
    title.textContent = CV.name;
    panelBody.append(el('p', 'lede', `${CV.title}, ${CV.location}.`), el('p', null, CV.about));
    for (const g of CV.skills) {
      const grp = el('div', 'group'); grp.append(el('h4', null, g.title));
      grp.append(el('p', 'used', g.skills.join(', ')));
      panelBody.append(grp);
    }
    boost(['self']);
  } else if (kind === 'project') {
    const p = CV.projects[arg];
    eyebrow.textContent = 'Stepped out of the wall';
    title.textContent = p.title;
    panelBody.append(el('p', null, p.description), el('p', 'used', p.technologies.join(', ')), el('p', 'note', 'The screen on the device is an illustration for now, not a real screenshot.'));
  } else if (kind === 'contact') {
    eyebrow.textContent = 'Your handprint';
    title.textContent = 'Leave a mark';
    panelBody.append(el('p', 'lede', 'Your handprint is on the wall now, next to everyone who came before. Write to me:'));
    const line = el('div', 'contact-line');
    const value = el('span', 'value', CV.email);
    const copy = el('button', 'btn', 'Copy email') as HTMLButtonElement; copy.type = 'button';
    copy.addEventListener('click', () => {
      const ok = () => { copy.textContent = 'Copied'; setTimeout(() => (copy.textContent = 'Copy email'), 1600); };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(CV.email).then(ok, () => selectText(value)); else selectText(value);
    });
    line.append(value, copy);
    const links = el('div', 'linkrow');
    for (const [label, href] of [['GitHub', CV.github], ['LinkedIn', CV.linkedin]]) { const a = el('a', null, label) as HTMLAnchorElement; a.href = href; a.target = '_blank'; a.rel = 'noopener'; links.append(a); }
    panelBody.append(line, links, el('p', 'used', CV.location));
  } else if (kind === 'education') {
    eyebrow.textContent = 'Behind the column, under the owl';
    title.textContent = 'Education';
    panelBody.append(el('h3', 'painted', CV.education.degree), el('p', null, CV.education.institution), el('p', 'used', `${CV.education.period}. ${CV.education.note}`));
  } else if (kind === 'certs') {
    eyebrow.textContent = 'Inside the crack, beside six suns';
    title.textContent = 'Certifications';
    const ul = el('ul', 'list'); for (const c of CV.certifications.items) ul.append(el('li', null, c));
    panelBody.append(el('p', 'lede', `Google Cloud, ${CV.certifications.year}.`), ul);
  } else if (kind === 'languages') {
    eyebrow.textContent = 'Inside the crack, beside two speakers';
    title.textContent = 'Languages';
    const ul = el('ul', 'list'); for (const l of CV.languages) ul.append(el('li', null, `${l.language}: ${l.level}`));
    panelBody.append(ul);
  }
  document.body.classList.add('panel-open');
  place();
}
// Walk up to the painting, then lay the words on the free side of the view.
function place() {
  const side = late.frameSection(panelKind);
  panel.classList.remove('side-left', 'side-right', 'side-above', 'side-below');
  panel.classList.add(`side-${side}`);
  panel.hidden = false; wash.hidden = false;
  panel.scrollTop = 0;
  requestAnimationFrame(() => { placeWash(); fadeIfMore(); });
}
const fadeIfMore = () => panel.classList.toggle('more', panel.scrollTop + panel.clientHeight < panel.scrollHeight - 8);
panel.addEventListener('scroll', fadeIfMore, { passive: true });
export function placeWash() {
  if (panel.hidden) return;
  const r = panel.getBoundingClientRect(), mx = 56, my = 44;
  Object.assign(wash.style, { left: `${r.left - mx}px`, top: `${r.top - my}px`, width: `${r.width + mx * 2}px`, height: `${r.height + my * 2}px` });
}
window.addEventListener('resize', () => { if (panelKind) place(); });
export function selectText(node) { const r = document.createRange(); r.selectNodeContents(node); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
export function closePanel() {
  panel.hidden = true; wash.hidden = true;
  document.body.classList.remove('panel-open');
  if (panelKind === 'project') returnStepOut();
  if (late.focus.section) late.endFocus();
  panelKind = null; panelArg = null;
}
$('panel-close').addEventListener('click', closePanel);

export function boost(ids) {
  ids.forEach((id, i) => {
    const p = PAINTINGS.find((q) => q.id === id);
    if (!p) return;
    p.boostFrom = S.clock + i * 0.14;
    p.boostTo = S.clock + 2.4 + i * 0.14;
  });
}

export let toastTimer = 0;
export function toast(text, seconds = 3.2) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ($('toast').hidden = true), seconds * 1000);
}
