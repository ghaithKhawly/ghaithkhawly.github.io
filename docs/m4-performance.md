# M4: phones and performance

M4 is done when the budgets in the [v1 plan](v1-plan.md#budgets) hold on a real
mid-range phone. Everything below was measured in headless Chromium with
Lighthouse's phone throttling: a 390×844 screen at 3×, slow 4G (1.6 Mbps, 150 ms)
and a CPU four times slower. There is no GPU here, so WebGL runs in software,
about a frame a second. Frame rates are only useful as a before/after comparison.
The real-phone numbers come from `?perf` on a phone (see the end).

## Budgets

| Budget | Target | Now | Measured by |
|---|---|---|---|
| JS on first load (gzip, not counting hand tracking) | ≤ 250 kB | 176 kB | `npm run budget`, in CI |
| Everything before the intro is usable | ≤ 1.5 MB | 343 kB (counting all five font files); 246 kB is what a phone actually fetches | `npm run budget`, in CI |
| Intro usable on 4G | ≤ 3 s | 0.6 s to working buttons, 0.9 s to a tap being answered | throttled load |
| Frame rate | 30 fps on a mid-range phone | Not measurable without a GPU | `?perf` on a real phone |

## Before and after

Before is the M3 build; after is this one. Same throttling for both.

| | Before | After |
|---|---|---|
| First paint | 1.04 s | 0.73 s |
| Intro buttons work | 4.8 s (only once the whole script had run) | 0.6 s |
| Bytes before the intro is usable | 276 kB, from 3 hosts | 246 kB, from the site only |
| Everything loaded (rock, paintings, screens) | 13.0 s, 1.85 MB | 12.4 s, 1.85 MB |
| Script time per frame, after settling | 58.6 ms | 34.4 ms |
| Frames per second (software WebGL) | 0.5 | 2.2 |
| Hand tracking download | 11.6 MB, from jsDelivr and Google | 9.9 MB, from the site |
| Camera tap to tracking ready | 115 s | 94 s |

The last two rows were measured on throttled 4G without the CPU throttle. Both
times are inflated by software WebGL. The byte counts are what matters there.

## What changed

**The intro works before the cave is built.** A small inline script in
`index.html` answers the first tap while the 640 kB module is still loading.
It asks for the camera, unlocks sound, and asks for tilt permission on iOS. The
cave picks the choice up once it loads (`window.__early`). The tap used to do
nothing for about 5 s on a slow phone.

**Less work per frame:**

- The pointer finds the wall by marching along the ray against the wall's
  height function, instead of raycasting 67,000 triangles on every move.
- The shadow and glow layers are skipped when they're empty. Each one is a full
  copy of the wall mesh.
- The cave mouth mesh went from 90×90 to 64×64.
- The canvas isn't multisampled, since everything is drawn through the
  post-processing chain's own targets.
- Shaders compile before the first frame (`compileAsync`, in parallel where the
  browser supports it), so the first frame doesn't stall.

**Device tiers** (`src/core/quality.ts`). The starting tier is guessed from the
device:

| Tier | Who gets it | Pixel ratio (most, least) | Bloom | Wall mesh |
|---|---|---|---|---|
| High | Computers | 1.75, 0.85 | On | 260×130 |
| Mid | Phones with more than 4 cores, unless they report 3 GB of memory or less | 1.35, 0.7 | On | 200×100 |
| Low | Other phones | 1.0, 0.6 | Off | 160×80 |

The cave then watches its own frame time, using the median of 2-second windows,
against a target of 60 fps on a computer and 30 on a phone:

- Too slow: it lowers the resolution 15% at a time, and as a last step turns
  the bloom off.
- Plenty of headroom: it raises the resolution again, at most six times, so it
  doesn't see-saw.

Each change reallocates the canvas once, and only when something actually
changed. Under the throttled phone profile it settles on the low tier at 0.6
after four steps.

**Tilt on phones:**

- Tilting leans on iOS and Android, in portrait and in landscape. The phone's
  axes are turned to match the screen, and straight ahead is reset whenever the
  phone is rotated.
- Recent Chromium has iOS's permission call but can answer "prompt" while
  still sending events, so the cave always listens.
- Edge-lean (looking round when the pointer nears the edge) is mouse-only and
  off while tilt is on. Chromium's synthetic mouse events after a rotation were
  resetting it.

These are checked in `tests/tilt.spec.ts`.

**Nothing loads from other hosts:**

- The fonts (Alegreya, Alegreya Sans, both OFL) are served from the site.
- Hand tracking is too. `scripts/mediapipe/plugin.ts` takes the runtime from
  the pinned `@mediapipe/tasks-vision` package and fetches the two models once,
  checked against their sha256.
- The build gzips the large files itself. GitHub Pages does gzip `.wasm`
  ([this one](https://kripken.github.io/ammo.js/builds/ammo.wasm.wasm) comes back
  `Content-Encoding: gzip`). But nothing compresses a `.task` model,
  and gzip takes the hand model from 7.8 to 5.8 MB.
- The page unzips the files with `DecompressionStream`, and shows a byte count
  while they download.
- A browser without `DecompressionStream` or WebAssembly SIMD (Safari before
  16.4) falls back to the CDN, as does a copy that fails to load.
- The camera check asserts that nothing is fetched from jsDelivr or Google.

## Checking it yourself

| | |
|---|---|
| `npm run budget` | The size budgets, against `dist/` |
| `?perf` | Frame rate, tier, pixel ratio, bloom, render size, draw calls, triangles, textures, memory |
| `?tier=low`, `mid` or `high` | Start at that tier |
| `?fixed` | Don't adapt; useful to compare tiers |

## What's left for M4

- **A real mid-range phone.** Open the site with `?perf`, turn the camera on,
  and read the frame rate and tier after a minute. The target is 30 fps or
  better. If it lands below that on the tier it picked, the tier guess or the
  floors in `quality.ts` move.
- **Tilt on a real iPhone.** Chromium's emulation covers the axes and the
  rotation, not Safari's permission prompt.
