import { provide } from '../late';
import { S } from '../state';
import { CV } from '../content';
import { PAINTINGS } from '../art/layers';
import { $ } from '../config';
import { line } from '../paint/pigment';
import { returnStepOut } from '../play/stepout';

// Earlier modules reach these through `late` (see late.ts). The getters are lazy, so
// registering before the declarations below is safe.
provide({ get openPanel() { return openPanel; } });

// Panels
export const panel = $('panel'), panelBody = $('panel-body');
export let panelKind = null;
export function el(tag: string, cls?: string | null, text?: string | null): HTMLElement { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
export function openPanel(kind: string, arg?: any) {
  panelKind = kind;
  panelBody.replaceChildren();
  panel.classList.toggle('left', kind === 'certs' || kind === 'languages');
  const eyebrow = $('panel-eyebrow'), title = $('panel-title');
  if (kind === 'experience') {
    eyebrow.textContent = 'The hunt · Wolf';
    title.textContent = 'Experience';
    for (const x of CV.experiences) {
      const r = el('div', 'role');
      r.append(el('span', 'when', x.period), el('h3', null, `${x.position} · ${x.company}`));
      const ul = el('ul'); for (const d of x.description) ul.append(el('li', null, d));
      r.append(ul); panelBody.append(r);
    }
    boost(['bison', 'horse', 'deer', 'hunters']);
  } else if (kind === 'about') {
    eyebrow.textContent = 'The figure · Rabbit';
    title.textContent = CV.name;
    panelBody.append(el('p', null, CV.about), el('p', 'muted', `${CV.title} · ${CV.location}`));
    for (const g of CV.skills) {
      const grp = el('div', 'group'); grp.append(el('h4', null, g.title));
      const tags = el('div', 'tags'); for (const s of g.skills) tags.append(el('span', 'tag', s));
      grp.append(tags); panelBody.append(grp);
    }
    boost(['self']);
  } else if (kind === 'project') {
    const p = CV.projects[arg];
    eyebrow.textContent = 'Stepped out of the wall';
    title.textContent = p.title;
    const tags = el('div', 'tags'); for (const t of p.technologies) tags.append(el('span', 'tag', t));
    panelBody.append(el('p', null, p.description), tags, el('p', 'muted', 'Prototype note: the device screen is an illustration, not a real screenshot.'));
  } else if (kind === 'contact') {
    eyebrow.textContent = 'Your handprint';
    title.textContent = 'Leave a mark';
    panelBody.append(el('p', null, 'Your handprint is on the wall now, next to everyone who came before. Write to me:'));
    const line = el('div', 'contact-line');
    const value = el('span', 'value', CV.email);
    const copy = el('button', 'btn', 'Copy email') as HTMLButtonElement; copy.type = 'button';
    copy.addEventListener('click', () => {
      const ok = () => { copy.textContent = 'Copied'; setTimeout(() => (copy.textContent = 'Copy email'), 1600); };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(CV.email).then(ok, () => selectText(value)); else selectText(value);
    });
    line.append(el('span', 'muted', 'Email'), value);
    const links = el('div', 'linkrow');
    for (const [label, href] of [['GitHub', CV.github], ['LinkedIn', CV.linkedin]]) { const a = el('a', null, label) as HTMLAnchorElement; a.href = href; a.target = '_blank'; a.rel = 'noopener'; links.append(a); }
    panelBody.append(line, copy, links, el('p', 'muted', CV.location));
  } else if (kind === 'education') {
    eyebrow.textContent = 'Found behind the column · The owl';
    title.textContent = 'Education';
    panelBody.append(el('h3', null, CV.education.degree), el('p', null, CV.education.institution), el('p', 'muted', `${CV.education.period} · ${CV.education.note}`));
  } else if (kind === 'certs') {
    eyebrow.textContent = 'Found inside the crack · Six suns';
    title.textContent = 'Certifications';
    const ul = el('ul', 'list'); for (const c of CV.certifications.items) ul.append(el('li', null, c));
    panelBody.append(el('p', 'muted', `Google Cloud · ${CV.certifications.year}`), ul);
  } else if (kind === 'languages') {
    eyebrow.textContent = 'Found inside the crack · Two speakers';
    title.textContent = 'Languages';
    const ul = el('ul', 'list'); for (const l of CV.languages) ul.append(el('li', null, `${l.language} · ${l.level}`));
    panelBody.append(ul);
  }
  panel.hidden = false;
}
export function selectText(node) { const r = document.createRange(); r.selectNodeContents(node); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
export function closePanel() {
  panel.hidden = true;
  if (panelKind === 'project') returnStepOut();
  panelKind = null;
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
