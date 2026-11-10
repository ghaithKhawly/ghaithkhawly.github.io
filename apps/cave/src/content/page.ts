// The CV as a page: every section and project as plain HTML. The build writes it into
// index.html (scripts/cv-page.ts), so it's there before any script runs. It is what
// screen readers read and search engines index while the cave is drawn over it, and the
// site itself where the cave can't be drawn (no WebGL 2, no JavaScript, or ?flat).
//
// No DOM here: the build runs this in Node.
import { CV, sentences } from '../content.ts';
import { PROJECTS } from './projects.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Paintings are pictures of what each section is about; the words carry the content.
const art = (file: string, cls = 'art') => `<img class="${cls}" src="/src/assets/baked/${file}.webp" alt="" loading="lazy" decoding="async">`;
const link = (href: string, text: string) => `<a href="${esc(href)}" rel="noopener">${esc(text)}</a>`;
const used = (items: string[]) => `<p class="used">${esc(items.join(', '))}</p>`;

function slab(id: string, title: string, painting: string, body: string) {
  return `<section class="slab" id="cv-${id}" aria-labelledby="cv-${id}-title">${art(painting)}<div class="words"><h2 id="cv-${id}-title">${esc(title)}</h2>${body}</div></section>`;
}

function experience() {
  const xs = CV.experiences, first = xs[xs.length - 1], one = xs.every((x) => x.company === first.company);
  const lede = one ? `<p class="lede">At ${esc(first.company)} since ${esc(first.period.split(/\s+[-–]\s+/)[0])}.</p>` : '';
  const roles = xs.map((x) => `<li><span class="when">${esc(x.period)}</span><h3>${esc(one ? x.position : `${x.position}, ${x.company}`)}</h3><p>${esc(sentences(x.description))}</p>${x.technologies.length ? used(x.technologies) : ''}</li>`).join('');
  const m = CV.medical;
  return `${lede}<ol class="roles">${roles}</ol><div class="group"><h3>Also: ${esc(m.title)}</h3><p>${esc(m.description)}</p>${used(m.technologies)}</div>`;
}

function about() {
  const skills = CV.skills.map((g) => `<div class="group"><h3>${esc(g.title)}</h3>${used(g.skills)}</div>`).join('');
  return `<p>${esc(CV.about)}</p>${skills}`;
}

function projects() {
  return PROJECTS.map((p) => {
    const shots = p.screens.length
      ? `<div class="shots${p.device === 'laptop' ? ' wide' : ''}" role="group" tabindex="0" aria-label="${esc(`Screens from ${p.title}`)}">${p.screens.map((s) => `<figure><img src="/src/assets/screens/${p.id}/${s.file}.webp" alt="${esc(s.caption)}" loading="lazy" decoding="async"><figcaption>${esc(s.caption)}</figcaption></figure>`).join('')}</div>`
      : '';
    return `<article class="slab project" id="cv-project-${p.id}" aria-labelledby="cv-project-${p.id}-title">${art(`painting-project-${p.id}`)}<div class="words">`
      + `<p class="kicker">${esc(p.status)}</p><h3 id="cv-project-${p.id}-title">${esc(p.title)}</h3><p class="lede">${esc(p.what)}</p>`
      + `<ul class="points">${p.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>${used(p.stack)}`
      + `${p.note ? `<p class="note">${esc(p.note)}</p>` : ''}${p.link ? `<p>${link(p.link, 'The code on GitHub')}</p>` : ''}</div>${shots}</article>`;
  }).join('');
}

// What search engines and link previews read: the title, a description, the share
// picture (public/og.jpg) and who this is, as schema.org data.
export const SITE = 'https://ghaithkhawly.github.io/';
export function headHtml() {
  const role = CV.title.toLowerCase(), city = CV.location.split(',')[0];
  const title = `${CV.name}, ${role} in ${city}`;
  const desc = `${CV.title} in ${city}. My portfolio is a firelit cave: cast shadows on its wall with your hands and a webcam, or paint on it. The same CV is here as a plain page too.`;
  const person = {
    '@context': 'https://schema.org', '@type': 'Person', name: CV.name, jobTitle: CV.title, url: SITE,
    address: { '@type': 'PostalAddress', addressLocality: city, addressCountry: 'SY' },
    sameAs: [CV.github, CV.linkedin],
    knowsAbout: CV.skills.flatMap((g) => g.skills).slice(0, 20),
  };
  const meta = (k: string, v: string, attr = 'name') => `<meta ${attr}="${k}" content="${esc(v)}">`;
  return [
    `<title>${esc(title)}</title>`,
    meta('description', desc),
    `<link rel="canonical" href="${SITE}">`,
    meta('theme-color', '#070504'),
    '<link rel="icon" href="./favicon.svg" type="image/svg+xml">',
    '<link rel="icon" href="./favicon-32.png" sizes="32x32" type="image/png">',
    '<link rel="apple-touch-icon" href="./apple-touch-icon.png">',
    meta('og:type', 'website', 'property'), meta('og:site_name', CV.name, 'property'),
    meta('og:title', title, 'property'), meta('og:description', desc, 'property'), meta('og:url', SITE, 'property'),
    meta('og:image', `${SITE}og.jpg`, 'property'), meta('og:image:width', '1200', 'property'), meta('og:image:height', '630', 'property'),
    meta('og:image:alt', `${CV.name}'s name painted at the mouth of a firelit cave, its wall covered in red ochre paintings`, 'property'),
    meta('twitter:card', 'summary_large_image'),
    `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`,
  ].join('\n');
}

export function pageHtml() {
  const e = CV.education;
  return `<main id="page" aria-labelledby="page-title">
<header class="page-head">
<h1 id="page-title">${esc(CV.name)}</h1>
<p class="role">${esc(`${CV.title}, ${CV.location}`)}</p>
<nav aria-label="Sections"><a href="#cv-about">About</a><a href="#cv-experience">Experience</a><a href="#cv-projects">Projects</a><a href="#cv-education">Education</a><a href="#cv-contact">Contact</a></nav>
<p class="page-note"><span id="page-why">This is the CV as a plain page. The site itself is a cave you explore with your hands, and it needs a browser that can draw in 3D.</span> <a href="./" id="page-enter">Enter the cave</a></p>
</header>
${slab('about', 'About', 'guide-rabbit-fill', about())}
${slab('experience', 'Experience', 'guide-wolf-fill', experience())}
<section id="cv-projects" aria-labelledby="cv-projects-title"><h2 id="cv-projects-title" class="projects-title">Projects</h2>${projects()}</section>
${slab('education', 'Education', 'painting-owl', `<h3>${esc(e.degree)}</h3><p>${esc(e.institution)}</p><p class="used">${esc(`${e.period}. ${e.note}`)}</p>`)}
${slab('certs', 'Certifications', 'decal-cloud', `<p class="lede">${esc(`Google Cloud, ${CV.certifications.year}.`)}</p><ul class="list">${CV.certifications.items.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`)}
${slab('languages', 'Languages', 'decal-talk', `<ul class="list">${CV.languages.map((l) => `<li>${esc(`${l.language}: ${l.level}`)}</li>`).join('')}</ul>`)}
${slab('contact', 'Contact', 'guide-hand-fill', `<p class="lede">Write to me:</p><p class="email">${link(`mailto:${CV.email}`, CV.email)}</p><p class="linkrow">${link(CV.github, 'GitHub')}${link(CV.linkedin, 'LinkedIn')}</p><p class="used">${esc(CV.location)}</p>`)}
<footer class="page-foot"><p>${link('./classic/', 'The previous version of this site')}</p></footer>
</main>`;
}
