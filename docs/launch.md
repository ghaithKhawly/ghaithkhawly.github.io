# Launching the cave

GitHub Pages already serves this site from the `gh-pages` branch, so launching
needs no settings change. The `Site` workflow publishes on `main`:

1. Every push to `main` builds both sites and runs every check (about 15
   minutes).
2. If they pass, it commits `dist/` to `gh-pages`, one commit per deploy, and
   asks Pages to build.

| Address | What's there |
|---|---|
| `/` | The cave |
| `/?flat` | The same CV as a plain page (also what browsers without WebGL 2 get) |
| `/classic/` | The previous site, unchanged |
| Anything else | A painted 404 with the way back |

## Check it

- Open the site on a computer and a phone.
- Paste the address into a chat app to see the link preview (`og.jpg`).
- Run `?perf` on a phone and `?trial` with your hands. These are the M4 and M3
  exit tests in the [v1 plan](v1-plan.md#milestones).

## If something's wrong

Revert the deploy commit on `gh-pages` (the commit before it is the previous
site, as it was). GitHub's web UI can't revert, so from a clone:

```bash
git fetch origin gh-pages
git checkout gh-pages
git revert --no-edit HEAD
git push origin gh-pages
```

The next push to `main` deploys again.
