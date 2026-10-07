# Progress

## Where things are
Steps 1-11 of 14 built and verified in a browser. Steps 12-14 remain:

- **12. Tune `MOVE_THRESHOLD` in the room.** No code — a number to tune with
  several people standing and shifting weight in a dim room.
- **13. Grain** — written, behind `GRAIN_ON = false`.
- **14. The continuous wobble dial** — written, behind `WOBBLE_ON = false`.

The whole sketch is in `sketch.js`. Nothing outside it has changed.

## What works and how I checked it
All verified in a desktop browser against a local static server, by sampling the
canvas and by screenshotting — the screenshots were the decisive check, because
pixel sampling alone hid two real problems.

- **Steps 1-3** — near-black full-screen canvas, gestures locked, centred prompt
  over a blurred scrim, press anywhere to start.
- **Press gate** — movement before the press does nothing (0.056, the ember).
  Canvas tap on a phone does nothing. Desktop hold reaches 1.0.
- **Step 7 timings, measured** — fall: 0.53 at 0.5s, 0.44 at 2s, 0.20 at 5s
  ("almost dark"), then a slower tail to 0.06 by 13s, holding there. Rise: still
  at 0.53 after 1s, building to 1.0 over the next 4s.
- **Step 8-11** — no square edge (all four corners read pure background), smooth
  falloff with no banding. Warm amber ring at full brightness; at the ember the
  amber is completely gone and only a pale cool point remains.

Confirmed by you on a real phone: the wake lock holds, press-to-start works, and
the desktop-only hold fix works.

## What changed after the screenshots
Two problems that pixel sampling had hidden:

1. The core was a **hard-edged filled circle** and read as a flat ball sitting on
   the glow. It is now its own radial gradient, so there is no visible edge.
2. The rim was a **saturated brown band** with a boundary, and a navy ring
   appeared between core and rim (mid grey over near-black). Warm colour is now
   confined to the outermost fifth at low alpha, and the mid is fainter.

Also renamed `brightness` to `lanternBrightness` — it collided with p5's own
`p5.brightness()`.

## What is next
Step 12, and it needs you in a dim room with other people. `MOVE_THRESHOLD` is
set to p5's default `0.5`. Too high and no lantern lights when people shift
weight; too low and they flicker on idle breathing. This is the one part of the
piece that cannot be judged from a laptop, and it is the most likely thing to
make the demo look broken when the code is fine.

Two notes for later:

- Steps 13 and 14 are written but off. `GRAIN_ON` is false because several grainy
  phones in a dark room raise the light in the room. `WOBBLE_ON` is false because
  it needs tuning against a real accelerometer; the gravity-subtraction code is
  there and the `rotationRate*` trap is documented in the comments.
- The p5-phone warning "Assign touch/mouse handlers before lockGestures()" still
  appears. It did not go away when the call was deferred, so it was reverted.
  Gesture blocking verifiably works (`gesturesLocked` true, canvas
  `touch-action: none`), so it is treated as a false positive.
