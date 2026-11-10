# ghaithkhawly.github.io

My portfolio. Two sites live in this repo:

| | What | Path when deployed |
|---|---|---|
| [`apps/cave`](apps/cave) | **The Cave**: a firelit cave you explore with your hands and head (webcam) or by painting on the wall (mouse, touch). Vite + TypeScript + three.js. | `/` |
| [`apps/classic`](apps/classic) | The original React site, generated from my LaTeX CV. | `/classic/` |

Both read the same CV data: `apps/classic/src/data/*.json`, generated from
`apps/classic/cv-*.tex` (see the [classic README](apps/classic/README.md)).

The plan for The Cave's first release is in [`docs/v1-plan.md`](docs/v1-plan.md).
[`prototype/cave`](prototype/cave) is the single-file prototype it grew from, kept
as a reference.

## Run it

Node 22.

```bash
npm run setup     # install both apps
npm run dev       # the cave, with hot reload
npm run build     # both sites into dist/ (cave at /, classic at /classic/)
npm test          # the cave's browser checks (Playwright, Chromium)
```

The checks drive the real WebGL scene in a software renderer, so they are slow
(several minutes).

## Deploying

The [`Site` workflow](.github/workflows/site.yml) builds and checks both sites on
every push, and on `main` deploys `dist/` to GitHub Pages, as long as Pages is
set to deploy from GitHub Actions. Until launch the live site is still the classic
one, served from the `gh-pages` branch. Launching is two steps:
[docs/launch.md](docs/launch.md).
