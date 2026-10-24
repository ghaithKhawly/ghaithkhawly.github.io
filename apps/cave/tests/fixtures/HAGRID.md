`hagrid-hands.json.gz`: hand landmarks for 2,542 photos from HaGRID, the HAnd Gesture
Recognition Image Dataset, by Alexander Kapitanov, Andrey Makhlyarchuk and Karina
Kvanchiani (https://github.com/hukenovs/hagrid), licensed CC BY-SA 4.0
(https://creativecommons.org/licenses/by-sa/4.0/). This file is a derivative and is
shared under the same licence.

How it was made: from the 384p sample (https://huggingface.co/datasets/cj-mills/hagrid-sample-30k-384p),
150 photos per gesture, one per person, for 18 gestures. Each was cropped round the
gesturing hand so the hand fills about a third of the frame (like a webcam at arm's
length) and run through MediaPipe's hand landmarker, the same version and options the
site uses. Photos where no hand was found are left out. Each entry: `g` the HaGRID
gesture, `a` the crop's aspect (width / height), `h` the hands found, each 21 `[x, y]`
points in the crop's normalized coordinates (not mirrored).
