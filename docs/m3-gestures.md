# Gestures on real hands (M3)

The cave reads three shapes from the camera: the **wolf** (Experience), the **hare**
(About) and the **open palm** (Contact). This is how well it reads them, measured, and
what changed to get there.

## How it's measured

- **Real hands:** 2,542 photos from [HaGRID](https://github.com/hukenovs/hagrid)
  (CC BY-SA 4.0), 150 people per gesture, 18 gestures. Each photo is cropped so the hand
  fills about a third of the frame, like a webcam at arm's length, and run through the
  same MediaPipe hand model, version and options the site uses. The classifier then
  sees exactly what it would see live.
- **The wolf** isn't a HaGRID gesture, so it's scored on the site's own wolf pose, varied
  the way real hands and the tracker vary it: rotation, finger curl, gaps between the
  fingers, thumb angle and landmark noise. The same variation leaves the hare and palm at
  98–100%, so it's a fair yardstick.
- One frame at a time. Live, a shape also has to win 6 of the last 10 frames and be held
  for 0.9 s (1 s for the palm), which removes most single-frame mistakes.

`npm run test:gestures` reruns all of it in about a second; CI runs it on every push and
fails if recognition drops below the targets (93% for each shape, at most 3% of other
gestures read as a shape, 90% for the varied wolf).

## Results

| | Before | After |
|---|---|---|
| Open palm read as a palm | 84% | **99%** |
| Peace sign read as the hare | 97% | **97%** |
| Two fingers up read as the hare | 96% | **96%** |
| Wolf, varied | 71% | **95%** |
| Other gestures read as a shape | 11.1% | **1.7%** |

## What changed

- **The palm no longer needs the thumb out.** 23 of 24 missed palms failed only that
  check: most people keep the thumb close to the index finger.
- **The hare needs the thumb folded.** Thumb, index and middle up ("three") was read as
  the hare 98% of the time. The thumb separates them cleanly: in the hare photos the
  thumb tip stays within 0.43 hand-lengths of the middle knuckle, in "three" it's at
  least 0.78 away. The cut-off is 0.6.
- **The wolf's thumb and fingertip checks are looser** (thumb 0.65 instead of 0.85
  hand-lengths from the middle knuckle; fingertips within 0.8 instead of 0.62). Those two
  checks were behind nearly all of the 29% of misses, and loosening them
  added no false wolves on the real photos.
- **Hysteresis.** Every check has an entering value and a looser staying value, so a
  held shape doesn't flicker out when one measurement wavers (for the wolf, holding
  lifts 95% to 96% one frame at a time).

## Leaning

The hidden things are found by leaning (head tracking moves the view). A sweep of the
eye from side to side showed the crack's right wall (Certifications) was partly in view
from straight on, so an eye offset of 0.3 found it, about 3 cm of head movement: natural
sway while making a shape could set it off. Each hidden thing now has its own
threshold, so each takes a deliberate lean of about 10 cm (an eye offset of 0.9) and
nothing is found standing still or swaying (the hidden-things check now tests 0 and
±0.4). The crack's left wall (Languages) only shows between offsets of 0.9 and 1.5, and
now counts across all of that rather than 0.9 to 1.3.

## The first time the camera is on

A short walkthrough, once per device (`?setup` shows it again):

1. **Light.** Measures the frame; too dark, or a bright light behind you (your face much
   darker than the room), and it says what to do. A poor light stays flagged after it
   moves on.
2. **Your head.** Look at the screen while it finds your head.
3. **Your hand.** Raise a hand, then make the hare. Making it ends the walkthrough and
   opens About, as usual.

Throughout, a small mirrored camera view shows what the tracker sees: the 21 points on
each hand, in ochre when it reads a shape. Skip ends it at any step.

## Testing with your hands: `?trial`

Open the site with `?trial` and use the camera. After the walkthrough it asks for ten
shapes, one at a time (the wolf four times, the hare three, the palm three), starting
each from a relaxed hand. A shape counts when it's held long enough to open its
section; it opens nothing during the trial. After ten it shows the score, per shape and
how long each took, with a button to copy the results. M3 is done when that's 9 of 10.

## What's left

- The wolf's numbers come from a model of real variation, not real photos. It's the
  shape most likely to fall short with real hands: three fingers pressed together and
  seen side-on is hard for the tracker. `?trial` measures it with real hands.
- "Three" (index, middle and ring up) is read as a shape 9% of the time, the worst of
  the other gestures, but nobody is asked to make it.
