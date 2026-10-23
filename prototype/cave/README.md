# The Cave: prototype

A throwaway prototype to answer one question before any real design work: does
exploring a portfolio with your hands and head feel good?

One self-contained page, `index.html`, plus `fire.mp3`. It uses three.js for the
cave and Google's MediaPipe for hand and face tracking, both loaded from CDNs.
The tracking models (about 8 MB) are downloaded from Google once. Camera frames
never leave the browser.

## Open it

The camera only works over `https` or on `localhost`.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000/prototype/cave/
```

Use Chrome or Edge on a laptop with a webcam for the first test.

## With the camera

| Do this | What should happen |
|---|---|
| Look at the screen for a second | Head tracking calibrates; a hint asks you to lean left and right |
| Lean left and right, closer and further | The rock arch and stalactites near the screen move against the far wall, like looking through a window. **Head tracking** turns it off; **Recenter** recalibrates |
| **Wolf**: hand sideways, thumb up, three fingers together | An ember eye opens in the shadow; after about 1 s, **Experience** opens and the animals glow |
| **Rabbit**: index and middle finger up, the rest folded | Eye opens; **About** opens |
| **Open palm**, fingers spread, held still | Your handprint is sprayed onto the wall; **Contact** opens |
| Hold your shadow's **index fingertip** on the painted phone or laptop | It glows, then steps out of the wall as a real 3D device; the project opens |

The **Shadow shapes** card (bottom left) shows each shape's silhouette and
lights up the one you are making. When your hand is close to a shape, the bar
at the bottom says what to change, for example "Almost a wolf · turn your hand
sideways".

## Without a camera: painting mode

Three dotted outlines wait on the wall: a wolf, a rabbit and a hand. Paint over
one with the mouse (or a finger on a phone). When most of the outline is
covered, it fills in with ochre, its eye opens, and its section opens:

| Outline | Opens |
|---|---|
| Wolf | Experience |
| Rabbit | About |
| Hand | Contact |

Scribbling at random doesn't count; you have to follow the outline. Anything
else you paint stays on the wall. Click the phone or laptop to make it step
out. **Shortcuts** (top right) opens the sections directly, for anyone who
can't or won't paint. On a phone, drag anywhere that isn't a shape to look
along the wall.

## Sound

- Fire: "Fireplace Sound loop" by PagDev, [CC0 on OpenGameArt](https://opengameart.org/content/fireplace-sound-loop), cross-faded in code so the loop has no seam.
- Water drips with a long cave echo, and a soft chime when a painting wakes, both synthesized in the browser.
- **Sound** (top right) mutes everything.

## If a shape isn't recognised

Turn on **Tracking view** (top right). It shows the camera with the detected
hand, and the numbers the classifier uses:

- `ext I M R P T`: which fingers count as extended (● yes, ○ no)
- `up / side / tips / spread`: hand direction, fingers together, finger spread

Screenshot that panel while holding the shape. The thresholds live in
`analyzeHand()` and are quick to tune.

## Tested so far

Run headless with a fake webcam fed real hand photos (Google's MediaPipe test
images), and with scripted mouse input:

- two-finger hand → **rabbit**, the Rabbit card lights up, About opens
- open palm → **palm**, handprint sprayed, Contact opens
- face detection calibrates head tracking and shows the lean hint
- tracing the wolf and hand outlines with the mouse fills them in and opens
  their sections; a random scribble over the rabbit does not
- the fire recording loads and loops; the phone layout renders without errors

**Not yet tested with a real hand:** the wolf. There was no wolf-shadow photo to
test with, so its thresholds are a first guess.

## Known limits

- Safari's canvas lacks the `filter` blur, so shadows are slightly harder-edged there.
- The device screens (savings app, API list) are illustrations, not real screenshots.
- Paintings, rock and fire are all generated in code; nothing here is final art.
