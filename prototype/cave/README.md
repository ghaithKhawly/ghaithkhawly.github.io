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
| Look at the screen for a second | Head tracking calibrates; a hint says three things are hidden |
| Lean left and right, closer and further | The rock arch, stalactites and stone column move against the far wall, like looking through a window. Leaning far enough uncovers the hidden things (below). **Head tracking** turns it off; **Recenter** recalibrates |
| **Wolf**: hand sideways, thumb up, three fingers together | An ember eye opens in the shadow; after about 1 s, **Experience** opens and the animals glow |
| **Rabbit**: index and middle finger up, the rest folded | Eye opens; **About** opens |
| **Open palm**, fingers spread, held still | Your handprint is sprayed onto the wall; **Contact** opens |
| Hold your shadow's **index fingertip** on the painted phone or laptop | It glows, then steps out of the wall as a real 3D device; the project opens |

The **Shadow shapes** card (bottom left) shows each shape's silhouette and
lights up the one you are making. When your hand is close to a shape, the bar
at the bottom says what to change, for example "Almost a wolf · turn your hand
sideways".

## Without a camera: painting mode

Three shapes are scratched into the rock, with embers along the lines: a
wolf, a hare and a hand, drawn the way Ice Age painters drew them.

1. Click one. You walk up to the wall: the view zooms in, the fire falls
   behind you, and an oil lamp follows your hand, raking across the rock.
   Embers glow along the parts of the engraving still to trace.
2. Trace the outline. The wolf and hare take charcoal, the hand takes red
   ochre. Pigment catches on the bumps of the rock, thins as the stroke runs
   dry, and scratches louder the faster you draw. Your hand's shadow holds the
   charcoal stick.
3. When most of the outline is covered, a ghost hand finishes it the way a
   cave painter would:
   - **Wolf and hare:** ochre rubbed in row by row (red for the wolf, yellow
     for the hare), then a charcoal contour that swells and tapers, an eye,
     and a few strokes of fur.
   - **Hand:** a stencil. The ghost presses its hand flat to the rock and
     blows red ochre round it, leaving the hand bare, like the negative hands
     at Chauvet and Cueva de las Manos.

   Then the eye opens, you step back, and the section opens.

| Shape | Opens |
|---|---|
| Wolf | Experience |
| Hare | About |
| Hand | Contact |

Scribbling at random doesn't count; you have to follow the outline.
**Step back from the wall** (or Esc) leaves without painting. Click the phone
or laptop to make it step out. **Shortcuts** (top right) opens any section; on
a shape you haven't painted, it lets you watch the ghost hand paint it. On a
phone, the view starts on the hare; drag anywhere that isn't a shape to look
along the wall.

## The paintings

Everything on the wall is generated in code, built from the marks real cave
painters made rather than flat shapes:

- **Ochre washes**: rubbed in unevenly, darker in a band inside the contour
  and where the form turns (the Altamira bison's hump and belly, the Lascaux
  horse's back), feathered at the edge, sometimes with a halo of blown
  pigment.
- **Charcoal and ochre lines** that swell and taper, skip over the grain of
  the rock, and thin out towards hooves and tails.
- **Finger dots** with a darker rim, **flint engravings** (a pale groove with
  a dark lip), and **negative hands** sprayed round a hand.
- **Age**: uneven fading, pits where the pigment never took, flakes where the
  rock spalled off, and a patchy white calcite veil over the old paintings.
- **The rock shows through**: a shader tints every mark by the rock texture
  under it, so pigment looks soaked into the stone.
- **Older layers underneath**: faded figures half covered by later ones,
  finger flutings, an engraved mammoth, red dots and a sign near the crack.

The figures follow real sites: an Altamira bison, a Lascaux horse and stag,
Levantine hunters, and an owl for Education, after the one at Chauvet.
Paintings are rendered at twice the wall layer's resolution on their own
decals, so they stay sharp up close. The work takes about a second in all, so
it runs in the background while the intro is up.

## Hidden things

Three sections aren't on the wall where you can see them. Leaning finds them;
each one opens when it has been in view for half a second, and the HUD counts
what you've found.

| Hidden | Where | How to see it |
|---|---|---|
| Education (an owl) | On the wall behind the stone column, left | Lean right to look past the column |
| Certifications (six suns) | Inside the glowing crack, on its right wall | Lean left to look into it |
| Languages (two speakers) | Inside the crack, on its left wall | Lean right to look into it |

How to lean:

- **Camera:** move your head. About 10 cm is enough.
- **Mouse:** move the cursor to a screen edge. The left edge leans right (you
  see further left), and the other way round.
- **Phone:** drag along the wall to stand in front of the column or the crack,
  then tilt the phone left or right. iPhones ask for motion access when you
  tap **No camera · paint with the mouse**.

## Sound

- Fire: "Fireplace Sound loop" by PagDev, [CC0 on OpenGameArt](https://opengameart.org/content/fireplace-sound-loop), cross-faded in code so the loop has no seam.
- Water drips with a long cave echo, a soft chime when a painting wakes or a hidden thing is found, and the scratch of charcoal or ochre while you paint, all synthesized in the browser.
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
- clicking the wolf zooms in to the wall; tracing it in charcoal starts the
  ghost hand, which rubs in the ochre, outlines it, then steps back and opens
  Experience; the Shortcuts chips paint the hare the same way and stencil the
  hand
- each hidden thing is out of sight straight on and found by leaning:
  the owl at a right lean, Languages at a right lean, Certifications at a
  left lean, one at a time
- on a phone: the view starts on the hare, the zoom fits the shape on the
  narrow screen, panning reveals the owl, and panning plus a lean reveals
  both sides of the crack
- the fire recording loads and loops; no page errors

You confirmed the wolf works with a real hand.

**Not yet tested on a real device:** phone tilt (no gyroscope in a headless
browser), and how far you need to lean with a real webcam.

## Known limits

- Safari's canvas lacks the `filter` blur, so shadows are slightly harder-edged there.
- The device screens (savings app, API list) are illustrations, not real screenshots.
- Paintings, rock and fire are all generated in code; nothing here is final art.
