# The Cave: prototype

A throwaway prototype to answer one question before any real design work: does
exploring a portfolio with your hands and head feel good?

One self-contained page: `index.html`. It uses three.js for the cave and Google's
MediaPipe for hand and face tracking, both loaded from CDNs. The tracking models
(about 8 MB) are downloaded from Google once. Camera frames never leave the
browser.

## Open it

The camera only works over `https` or on `localhost`.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000/prototype/cave/
```

Use Chrome or Edge on a laptop with a webcam for the first test.

## What to try

| Do this | What should happen |
|---|---|
| Move your head side to side, closer and further | The cave shifts in depth like a window (needs about a second of looking at the screen to calibrate; **Recenter** redoes it) |
| **Wolf**: hand sideways, thumb up, three fingers out together | An ember eye opens in the shadow; after about 1 s, **Experience** opens and the animals glow |
| **Rabbit**: index and middle finger up, the rest folded | Eye opens; **About** opens |
| **Open palm**, fingers spread, held still | Your handprint is sprayed onto the wall; **Contact** opens |
| Hold your shadow's **index fingertip** on the painted phone or laptop | It glows, then steps out of the wall as a real 3D device; the project opens |

No camera? **Explore with mouse** shows the same scene, with buttons for the
three shapes and click-to-open on the phone and laptop. On a phone, drag to look
along the wall.

## If a shape isn't recognised

Turn on **Tracking view** (top right). It shows the camera with the detected
hand, and the numbers the classifier uses:

- `ext I M R P T`: which fingers count as extended (● yes, ○ no)
- `up / side / tips / spread`: hand direction, fingers together, finger spread

Screenshot that panel while holding the shape. The thresholds live in
`analyzeHand()` and are quick to tune.

## Tested so far

Run headless with a fake webcam fed real hand photos (Google's MediaPipe test
images):

- two-finger hand → **rabbit**, About opens
- open palm → **palm**, handprint sprayed, Contact opens
- face detection runs and feeds head tracking
- synthetic wolf, rabbit and palm poses classify correctly; mouse mode, the
  step-out animation and the phone layout render without errors

**Not yet tested with a real hand:** the wolf. There was no wolf-shadow photo to
test with, so its thresholds are a first guess.

## Known limits

- Safari's canvas lacks the `filter` blur, so shadows are slightly harder-edged there.
- The device screens (savings app, API list) are illustrations, not real screenshots.
- Paintings, rock and fire are all generated in code; nothing here is final art.
