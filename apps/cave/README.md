# The Cave

A portfolio you explore inside a firelit cave. With a webcam, your hands cast
shadows on the wall (a wolf opens Experience, a rabbit About, an open palm leaves
a handprint for Contact) and leaning your head looks around the cave. Without
one, you walk up to the wall and paint. Three sections are hidden: behind a stone
column and inside a lamp-lit crack.

How it plays, gesture by gesture, is in the [prototype README](../../prototype/cave/README.md).
What happens next is in the [v1 plan](../../docs/v1-plan.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck, then build into dist/
npm test           # Playwright browser checks against the built site
```

The camera needs `https` or `localhost`.

## How the code is laid out

This is the prototype split into TypeScript modules, with behaviour unchanged.

| Folder | What's in it |
|---|---|
| `world/` | The cave: rock textures, wall and floor geometry, the column, fire, crack chamber, cave mouth |
| `paint/` | The pigment engine (washes, charcoal lines, finger dots, engravings, ageing) and the paintings built from it |
| `art/` | The wall's paint layers, painting decals, the shapes to trace, and visitor strokes |
| `hands/` | Hand silhouettes and poses, and the gesture classifier |
| `tracking/` | Camera, MediaPipe, head and hand state |
| `play/` | Painting mode input, the zoom and ghost hand, hidden things, devices that step out of paintings |
| `fx/` | Live shadows and glows |
| `core/` | Post-processing and the window camera |
| `ui/` | Panels, toasts, tool buttons |
| `content.ts` | CV content, read from `../classic/src/data/cv-fulltime.json` |

Three pieces of plumbing hold the split together:

- **`main.ts` imports every module in the order the prototype ran.** A module may
  only use earlier modules while it sets up.
- **`late.ts`** is for calls the other way round, made at runtime (painting mode
  opening a panel, say): the later module registers getters on `late`, and the
  earlier one calls `late.openPanel(...)`.
- **`state.ts`** holds the few values several modules write (`S.mode`, `S.clock`,
  …), since an imported `let` is read-only.

TypeScript runs with `strict` off for now. M1 onwards tightens it module by module.

## Checks

`tests/` drives the built site in Chromium with WebGL in software (about one
frame a second):

- tracing the wolf finishes it and opens Experience
- the Contact shortcut stencils the hand
- leaning finds all three hidden things, one at a time
- on a phone, the view starts on the hare and the zoom fits the screen
- a fake webcam showing a rabbit shadow opens About (needs `ffmpeg`)

The page exposes `window.__cave` for these checks (state getters and a few
helpers). It does nothing for visitors.
