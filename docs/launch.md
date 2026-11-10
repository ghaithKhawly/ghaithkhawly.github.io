# Launching the cave

Everything is ready on `claude/quirky-euler-u6my7s`. Launching takes two steps,
and both are yours: one is a repository setting, the other a merge.

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
   The `Site` workflow can only deploy once this is set. Until then, every run on
   `main` skips the deploy and says why.
2. **Merge the branch into `main`** (a pull request, or a fast-forward: `main`
   hasn't moved since the branch started). The `Site` workflow on `main` builds
   both sites, runs every check (about 15 minutes), and deploys `dist/`.

After that:

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

Set Source back to **Deploy from a branch: `gh-pages` / root**. The previous
site comes back exactly as it was: the `gh-pages` branch is untouched. Once
you're happy with the launch, that branch can be deleted.
