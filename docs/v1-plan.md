# The Cave: v1 plan

The prototype (`prototype/cave/`) proved the idea. v1 turns it into the site at
`ghaithkhawly.github.io`, with the current React site kept at `/classic`.

## Where the prototype stands

| | Karam | Salem | The Cave (prototype) |
|---|---|---|---|
| Originality | 7 | 6 | 9 |
| Look and feel | 9 | 7.5 | 5.5 |
| Interaction depth | 6 | 7.5 | 8.5 |
| Works first time, any device | 8.5 | 8.5 | 4 |
| Time to reach the content | 7 | 5 | 6 |
| Overall | 8 | 7 | 6.5 (about 9 if v1 lands) |

What v1 has to fix:

- **Too close to Karam's site.** A flame-lit room, paintings as sections, a
  painting interaction, "step back". What he can't do is the hook: your hands
  and your head. v1 leads with that and drops the shared copy.
- **The look doesn't hold together.** Realistic rock, generated paintings and a
  monospace status display that reads like a developer tool.
- **Reliability.** Only the wolf has been tried with a real hand; real phones,
  tilt and low-end GPUs are untested.
- **Content is thin and sits in plain panels.** Two projects; the references
  put their CV inside objects.
- **Prototype shortcuts.** One 3,000-line HTML file, no build, no types,
  paintings generated in the browser (about a second of CPU), nothing for
  browsers without WebGL.

## Decisions

| Question | Decision |
|---|---|
| Stack | Vite + TypeScript + three.js, no UI framework. The scene is imperative and the panels are small; React would add weight and a second render loop for little gain. |
| Art | Real rock: CC0 photo-scanned textures (Poly Haven, ambientCG), plus the procedural pigment engine run **at build time** to bake paintings into WebP. Nothing heavy is generated in the visitor's browser. |
| Current site | Kept, unchanged, at `/classic`. |
| Projects | Picked from the GitHub account; see below. |

## Projects

Each project gets a painting in the same Paleolithic style, a metaphor for what
it does, that steps out of the wall as the device it runs on, showing real
screenshots.

| Project | State | Stack | Painting → steps out as |
|---|---|---|---|
| **Rakeb** (Damascus transit router) | Actively developed; the flagship | Expo / React Native, Fastify, PostgreSQL + PostGIS, Python graph pipeline, A\* in worker threads, Arabic free-text trips | Trails of dots between camps → a phone with the route map (design screens are in the repo) |
| **Office Order** | In daily use at an office, on an air-gapped LAN | Express, SQLite, React + Vite + Tailwind, SSE, Arabic-first RTL | Hunters sharing out a kill → a laptop and the wall display |
| **Savings Tracker** | Finished (v3, 20 tests) | Expo / React Native, Zustand, Victory charts | A hoard and tally marks → a phone |
| **justacalc** | Finished; private repo | Expo Router, mathjs + decimal.js, nerdamer | Counting marks → a phone |
| **Aquarium Object Detection** | Finished university project, with Ammar Alzoubi | PyTorch: a from-scratch grid detector vs. Faster R-CNN | Fish and a shark → boxes snap round them |
| **Gym Management System** | Finished coursework; private repo | Flutter, SQLite, offline-first | Figures lifting stones → a tablet |
| **Taza** | Live landing page and vendor bot (to confirm) | React + Vite, Telegram bot on Render | Bread and fruit → a phone |
| **Medical App** | Team project, from the CV; no repo | FastAPI, PostgreSQL | Stays under Experience |

Left out: **The-Gym-app** (unfinished, superseded by Gym Management System),
**backend** (NestJS scaffold), **supabase-connectivity-suite** (an internal
tool), **taza-year-in-review** (small; a candidate for a moving painting later).

Private repos are described without a link unless they are made public.

## Architecture

```
apps/
  cave/           the new site (Vite + TypeScript + three.js)
    src/
      core/       renderer, window camera, frame loop, device tier
      world/      wall, rock, cave mouth, column, fire, crack chamber
      paint/      pigment engine (shared by the bake script and live strokes)
      tracking/   MediaPipe hands + face, gestures, One Euro filters
      play/       painting mode, ghost hand, hidden things, step-out devices
      ui/         intro, panels, toasts, shortcuts (plain DOM)
      audio/      fire loop, drips, chimes, scratch
      content/    typed content built from content/*.json
    scripts/bake-paintings.ts   renders paintings to public/art/*.webp
  classic/        the current React site, built with PUBLIC_URL=/classic
content/          one source of truth: CV and projects (JSON)
docs/
prototype/        frozen reference
```

- **Build output:** `dist/` holds the cave at the root and the classic site
  under `dist/classic/`. One GitHub Actions workflow builds, tests and deploys
  both.
- **Deploy switch:** the live site deploys from the `gh-pages` branch today.
  Until launch (M6) nothing changes there. At launch, Settings → Pages →
  Source switches to "GitHub Actions" (one click, done by you).
- **Tracking:** MediaPipe is only downloaded after the visitor turns the
  camera on.

## Budgets

| | Desktop | Mid-range phone |
|---|---|---|
| JS on first load (gzip, excluding MediaPipe) | ≤ 250 KB | ≤ 250 KB |
| Everything before the intro is usable | ≤ 1.5 MB | ≤ 1.5 MB |
| Frame rate | 60 fps | 30 fps or better |
| Intro usable | ≤ 2 s | ≤ 3 s on 4G |

Device tiers pick the bloom, shadow resolution, pixel ratio and particle
count. A browser without WebGL gets a 2D version of the cave (the paintings as
images, the same content).

## Milestones

| # | Milestone | Work | Done when |
|---|---|---|---|
| M0 | Foundation | Restructure into `apps/cave` + `apps/classic`; port the prototype to TypeScript modules; content from JSON; port the Playwright checks; CI that builds both apps and runs the checks | The cave matches the prototype; CI passes |
| M1 | Art direction | Replace the status display; type and colour system; fire glare; CC0 rock; paintings baked at build time; cave mouth and column sculpted to match | You approve still frames |
| M2 | Content in the cave | All projects above as paintings that step out with real screenshots; Experience, About, Education and the rest framed as things in the cave, not plain panels | Every section reachable by gesture, by painting and by shortcut |
| M3 | Camera | A short setup walkthrough; gesture confidence and hysteresis; tested with real hands in different light; lean thresholds tuned | 9 out of 10 real tries succeed |
| M4 | Phones and performance | Device tiers, budgets above, tilt on iOS and Android, self-hosted MediaPipe files | Budgets met on a real mid-range phone |
| M5 | Fallbacks and reach | 2D version, reduced motion, keyboard, a screen-reader copy of the CV in the page, share and search metadata | Lighthouse accessibility ≥ 90 |
| M6 | Launch | Switch Pages to Actions; `/classic` live; old deploy script retired | The cave is live |

## Risks

| Risk | Plan |
|---|---|
| Gestures fail for some hands or light | The setup walkthrough shows what the tracker sees; painting mode and shortcuts always work without the camera |
| Looks like Karam's site | Lead with hands and head; no "step back" copy; content framed as cave things, not framed paintings in a gallery |
| Phone GPUs | Device tiers; the 2D version as the floor |
| Scope | Each milestone ships on its own; nothing waits on M6 |

## Found while auditing the repos

- **Rakeb's public history contains the local PostgreSQL admin password**
  (removed from the code in `c2582a1`, still in `cc83c14` and earlier). If that
  password is used anywhere else, change it. Rewriting the history is optional
  once it's changed.
- **The-Gym-app has `node_modules` committed** (about 29,000 files).
