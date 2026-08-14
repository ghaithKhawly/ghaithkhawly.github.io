# ghaithkhawly.github.io

My personal portfolio — live at **[ghaithkhawly.github.io](https://ghaithkhawly.github.io)**.

One site that presents itself two ways. A recruiter hiring for a full-time role
and a client looking for a freelancer want different things from the same
person, so the site serves a different CV to each rather than averaging them
into something vague.

```
https://ghaithkhawly.github.io              → freelance  (default)
https://ghaithkhawly.github.io/?type=fulltime → full-time
```

`?type=full-time`, `?type=job` and `?cv=fulltime` all resolve to the full-time
variant; anything else falls back to freelance. The switch happens in
`AppContext` at mount, so it costs one query parameter and no routing library.

| | Freelance | Full-time |
|---|---|---|
| Source | `cv-freelance.tex` | `cv-fulltime.tex` |
| Data | `src/data/cv-data.json` | `src/data/cv-fulltime.json` |
| Leads with | *What I offer* + 4 services | experience and certifications |
| Experience entries | 2 | 3 |
| Skill categories | 4 | 6 |
| Certifications | — | 6 |

---

## The idea: LaTeX is the source of truth

I keep my actual CV in LaTeX, because that is what produces the PDF I send to
people. Maintaining a second copy of the same facts in JSX means the two drift
apart, and the website version is always the stale one.

So the `.tex` file is the input, not a byproduct:

```
cv-fulltime.tex  ──parse──▶  src/data/*.json  ──import──▶  React components
cv-freelance.tex
```

`scripts/cv-parser-lib.js` reads moderncv markup directly — `\name{}{}`,
`\title{}`, `\email{}`, `\social[github]{}`, `\section{}`, `\cventry{}{}{}{}{}{}` ,
`\cvitem{}{}`, `\cvitemwithcomment{}{}{}` — and pulls out personal details,
experience with its bullet list, education with GPA, skills by category,
projects, certifications and languages.

It also runs `extractTechnologies()` over each experience and project
description, matching against a keyword list (React, TypeScript, FastAPI,
PostgreSQL, .NET, Docker, GCP …) to produce the technology tags shown on each
card. Those tags are derived from what the text actually says rather than
maintained as a separate list that can contradict it.

### The two scripts

```bash
npm run cv:parse     # node scripts/parse-cv.js [file]
npm run cv:update    # node scripts/update-portfolio.js [file]
```

- **`cv:parse`** — parses and writes JSON, and prints a readable summary of
  everything it found. Use it to check the parser understood the `.tex` before
  letting it touch anything.
- **`cv:update`** — does the same, then **regenerates `Hero.tsx`,
  `Contact.tsx` and `Footer.tsx`** with the values written into the source.
  It rewrites component files in place, so commit before running it.

> **Both scripts default to `cv-fulltime.tex` but always write to
> `src/data/cv-data.json` — the file the app loads as the *freelance* dataset.**
> Running `npm run cv:parse` with no arguments therefore overwrites the
> freelance data with full-time content. Pass the file explicitly
> (`node scripts/parse-cv.js cv-freelance.tex`), and note that
> `cv-fulltime.json` is currently maintained by hand — neither script writes it.

---

## Running it

```bash
npm install
npm start      # http://localhost:3000
npm run build
```

Node 18+. Create React App (`react-scripts` 5) with TypeScript.

### Deployment

```bash
npm run deploy   # predeploy runs build, then gh-pages -d build
```

GitHub Pages serves this site from the **`gh-pages`** branch root; `main` holds
the source. The `build/` directory committed on `main` is a leftover from an
earlier setup and is not what gets served.

---

## Stack

| | |
|---|---|
| **React 18 + TypeScript** | Create React App |
| **framer-motion** | section and card animations |
| **lucide-react** | icons |
| **Plain CSS** | one `main.css`, custom properties for theming |
| **gh-pages** | deployment |

No UI framework and no CSS-in-JS — the whole site is a single page of six
sections in one 767-line stylesheet, and a design system would be more code
than the thing it styles.

### Theming

Dark by default, toggleable, persisted in `localStorage`. The theme is applied
as `data-theme` on `<html>` and every colour resolves through CSS custom
properties, so switching costs one attribute change rather than a re-render of
styled components.

### Scroll animations

`useInView()` in `AppContext.tsx` wraps an `IntersectionObserver` and returns a
`ref` plus an `isInView` flag. It latches — once a section has been seen it stays
revealed, so scrolling back up doesn't replay the animation — and disconnects
the observer on unmount.

---

## Structure

```
cv-freelance.tex          the two CVs — the real source of truth
cv-fulltime.tex
scripts/
├── cv-parser-lib.js      moderncv → structured data
├── parse-cv.js           parse + report
└── update-portfolio.js   parse + codegen into components
src/
├── App.tsx
├── context/AppContext.tsx   theme, CV variant selection, useInView
├── data/*.json              generated from the .tex files
├── components/              Navbar · Hero · About · Experience
│                            Skills · Projects · Contact · Footer
└── styles/main.css
```
