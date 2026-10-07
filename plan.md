# Plan: Lantern

<!-- Everything above Steps is yours. Write it yourself, in your own words.
     The agent writes the Steps. You cut them down before anything is built. -->

## Project
The phone as a lantern carried by people walking together in the dark. It glows while you walk and fades when you stop. Each phone is its own lantern — one phone per person, in a dim room, several at once.

## The question
[What this prototype tests. What would tell you it works.]

## The experience
Someone picks up a phone in a dim room. The screen is all dark, no edges. Low in the frame, small and underlined: *Light the lantern*. They tap it, and grant motion. The text goes away. Low in the frame, below the middle, there is an ember. They walk, and it opens up — bright, and a little bigger. They stop, and it fades to almost dark in 5 seconds, then keeps sinking over a longer tail until it is a faint ember again, and no further. They move, and it is back in about 1 second, then keeps brightening as they go on. The people watching see a row of separate glows, each at its own pace. Nothing is joined up.

## Input, transformation, output, fallback
- Input: movement. Motion sensors only, once the tap has been granted. On a laptop, holding the mouse or a key stands in for walking.
- Transformation: moving → bright + a little bigger. Still → fades to almost dark in 5 seconds. Move again → back in about 1 second, then keeps building. The warm goes first as it dims and the pale core holds on longest, so a fading lantern reads as colder and further away rather than just dimmer. After the 5 seconds it keeps sinking, more slowly, to a faint ember that never quite goes out.
- Output: one soft light low in the frame, below the middle. Warm, soft edge fades. Pale near-white core, grey through the middle, warm amber rim, over a neutral near-black. Short rays around it, flickering.
- Fallback: on a laptop, hold to stay lit and release to fade. If motion is not granted, the lantern still runs and simply never lights.

## References
| File | Use it as | Take | Leave |
|---|---|---|---|
| references/layout-lantern.jpg | layout: match this | all dark, no edges; glow sits LOW, below the middle; warm, soft edge fades; bright + a little bigger; fades to almost dark (5s); back in about 1s; small, only before start | the phone outline, the paper, the pen, the annotation arrows and labels |
| references/mood-night-lanterns.jpg | inspiration: the feel | the feel only: [two or three qualities] | the rest |

## Limits
- Change only sketch.js.
- Screen only. The phone's real flashlight is not used.
- Each phone is its own lantern. No server, no shared room, no syncing.
- No sound, no microphone, no camera, no vibration, no GPS.
- Grain subtle or off: several phones in a dark room raise the light in the room.
- The agent may not commit.
- Not now: [what comes later]

## How I will check it
- On my laptop: press and hold to stay lit, release to fade. Tune the brightness and the 5s fade and the tail here first.
- On my phone: set screen brightness to maximum by hand, because auto-brightness will fight the piece. Tap *Light the lantern* and grant motion. Walk and watch the warm rim go first. Stop and time the fade against 5 seconds. Tune `setMoveThreshold()` in the actual room with people standing and shifting weight or gently swinging the phone: too high and no lantern lights, too low and they flicker on breathing.
- Sensors need HTTPS, so this has to be served, not opened as a file.

## Steps
<!-- Written by the agent. Each step small enough to check on your phone. -->

Only `sketch.js` changes. Every number a step introduces is named at the top of `sketch.js` so you can tune it without reading the rest. Diameters are fractions of the canvas width; the centre height is a fraction of the canvas height. Both are read off the layout drawing, so the layout holds on any phone.

To get this onto a phone, run `npm run phone` in this folder. It opens a temporary HTTPS address for this project and prints a QR code, and every save shows up when you reload. Sensors and the screen wake lock both need that secure context, so opening the file directly will not do. Keep `progress.md` up to date as you go, per AGENTS.md.

One standing rule for the steps below: when you define `mousePressed` or `mouseReleased`, define them *before* `lockGestures()` runs, and `return false` from them. p5-phone wraps those callbacks when gestures lock, and replacing its wrapper brings pull-to-refresh and pinch-zoom straight back.

**1. Full-screen dark canvas**
Build a canvas that fills the window, lock the browser's gestures, and fill it with a neutral near-black. Nothing else yet. Handle `windowResized()` and call `resizeCanvas()`: the phone's browser bars collapse after the first scroll, and a canvas frozen at its starting height leaves the bottom of the frame under the bar — which matters, because the glow is meant to sit low.
Use p5.js `createCanvas`, `resizeCanvas`, `windowWidth`, `windowHeight`, `windowResized`, `background`, and p5-phone `lockGestures()`.
Laptop: a flat near-black window; dragging on it does not scroll, zoom, or bounce.
Phone: the same, with no pull-to-refresh and no pinch-zoom when you drag, and nothing hidden under the browser bars after they collapse.
Numbers: `BG_NEAR_BLACK` — start at `#0A0A0A`, a neutral near-black with no colour cast.

**2. The start prompt**
Build a small underlined element reading *Light the lantern*, low in the frame, over the canvas. Create it and style it from JavaScript inside `sketch.js`, because only that file changes.
Use plain DOM creation (`document.createElement`, `appendChild`, inline `style`) plus p5's `select()` to reach it afterwards.
Laptop: small underlined text low in the frame over near-black, and nothing else on screen.
Phone: the same, and it must sit clear of the browser's own bars at the bottom.
Numbers: `PROMPT_TEXT` (`'Light the lantern'`), `PROMPT_SIZE`, `PROMPT_UNDERLINE`, `PROMPT_BOTTOM_MARGIN`.

**3. Motion permission, bound to that prompt**
Bind the motion permission to the prompt element itself, then hide the prompt as soon as motion is granted. This is the step most likely to need fixing, so do it before anything is drawn.
Use p5-phone `enableSensorOn('#start')`, the `window.sensorsEnabled` flag, and p5's `select('#start').hide()`. Optionally define `userSetupComplete()`.
Laptop: click the text, the overlay clears, the text is gone.
Phone: tap the text and the iOS motion prompt appears; allow it and the text is gone; it never comes back. Expect to tap twice on iOS — once for the sketch, once for the system dialog.
Numbers: none.

**4. Keep the screen on**
Ask the browser to hold the screen awake, request it when a finger lifts, and ask again whenever the page comes back into view. Without this the lantern dies after about 30 seconds, which is exactly while it is working. This is not a p5-phone feature — call the browser's own `navigator.wakeLock` directly, wrapped in try/catch, and re-request on `visibilitychange`.
Use `mouseReleased()` (not `mousePressed()`), `navigator.wakeLock`, and p5's `deltaTime`/`millis` if needed. Build on step 3, which must already have `lockGestures()` in `setup()`.
Laptop: nothing to check.
Phone: leave it running and walk for a minute; the screen must not dim or lock. Then lock and unlock the phone, come back to the page, and confirm it is still lit and still running.
Numbers: none.

**5. One brightness value, and the ember**
Build a single brightness value running 0 to 1, start it at the floor, and let movement raise it. Draw that value as a small pale dot at the glow point, so the resting state is already the ember you see when nobody is moving. It snaps toward its target for now; step 7 gives the rise and fall their shape.
Use p5-phone `deviceMoved()` and `setMoveThreshold()`, read only once `window.sensorsEnabled` is true; p5.js `fill`, `circle`, `deltaTime`, `map`, `constrain`, `lerp`.
Laptop: nothing drives the value yet, so the dot sits at the ember.
Phone: move the phone and the dot brightens and grows; let go and it drops back to the ember.
Numbers: `GLOW_X_FRAC` (`0.5` of canvas width), `GLOW_Y_FRAC` (`0.64` of canvas height — below the middle as drawn), `CORE_DIAMETER` (`0.39` of canvas width), `EMBER_FLOOR` (about `0.06`, faint; this is the single brightness floor and it is never zero), `MOVE_THRESHOLD` (start at p5's default `0.5`; tune in step 12).

**6. Hold to stay lit**
A desktop has no sensor, so `deviceMoved()` never fires there. Let a held mouse button or a held key count as movement instead, so the rest of the piece can be built and checked at your desk. Gate hardware reads on `window.sensorsEnabled`, never on `window.isDesktop` — the mobile and desktop flags are for desktop-only hints, not for deciding whether a sensor is live.
Use p5-phone's `window.isDesktop` as a hint only; p5.js `mousePressed`, `mouseReleased` and `mouseIsPressed`, each returning `false`. `mouseIsPressed` goes false as soon as *any* finger lifts, so if this ever grows a second finger, test `touches.length > 0` instead.
Laptop: press and hold and the glow rises and stays up; release and it falls back to the ember. From here to step 11 you can check everything without the phone.
Phone: unchanged from step 5. Holding must do nothing here, because movement is what drives the lantern on a phone.
Numbers: none. Holding feeds the same movement signal as the sensor, so there is no separate hold brightness.

**7. The shape of the rise and the fall**
Replace the plain snapping from step 5 with the timings from the layout, in one go. Falling: down to almost dark in 5 seconds, then a slower tail for longer, settling at `EMBER_FLOOR` and never reaching zero. Rising: about half brightness in 1 second, then on toward full over the next few seconds for as long as movement continues. All five numbers arrive here and nowhere else, and nothing from step 5 is replaced again.
Use p5.js `deltaTime`, `millis`, `map`, `constrain`, `lerp`. Time the build from the moment movement starts: `deviceMoved()` is only a yes/no and cannot tell you how hard anyone is moving, which is why step 14 exists.
Laptop: release and count 5 seconds to near-dark; keep watching and it goes on sinking, more slowly, then settles at the ember and stops. From the ember, hold and count 1 second to partway; keep holding and watch it go on brightening to full.
Phone: walk, stop, and time the first 5 seconds against your phone's stopwatch. Then stop until it is at the ember, walk again, and watch it wake partway in a second and keep building.
Numbers: `FADE_SECONDS` (`5`), `TAIL_SECONDS` (about `8`), `WAKE_SECONDS` (`1`), `WAKE_FRACTION` (about `0.5`), `BUILD_SECONDS` (about `4`).

**8. The halo and the core**
Draw the soft light as two shapes at the glow point: a soft outer halo, and a smaller brighter core inside it. Both grow and brighten with the brightness value. The soft edge must be a real gradient — p5 only draws hard-edged shapes, so stacked circles will band. Two things break the soft edge, and both are invisible on a laptop at low brightness: the outermost colour stop must sit at zero alpha, or filling the gradient's bounding box paints the corners and puts a square around the halo; and every stop needs its own colour with its own alpha rather than fading through transparent black, which turns the fade into a grey haze.
Use p5's `drawingContext` with `createRadialGradient` and `addColorStop`, filling an arc or the bounding box as above; p5 `fill` and `circle` for the core; `map` and `constrain` on brightness.
Laptop: hold, and a soft-edged light with no hard rim and no square edge grows out of the ember; release, and it shrinks back.
Phone: the same, and check the corners of the screen for a faint square and the middle of the fade for grey haze.
Numbers: `HALO_DIAMETER` (`0.73` of canvas width), `HALO_ALPHA_MAX`, `CORE_ALPHA_MAX`. `CORE_DIAMETER` is already set in step 5 — do not add a second one.

**9. The three colours**
Give the light its three colours first, all behaving together: a pale near-white core, a grey middle, and a warm amber rim over the neutral near-black. Nothing changes with brightness yet — this step only establishes that the three layers are distinct and sit where they should.
Use the radial gradient's colour stops with p5 `color()`, and `map` and `constrain` on brightness for the alphas.
Laptop: hold, and read the light as cool in the middle with a warm edge. It should already look like a lantern and not a white blob.
Phone: the same, and check the rim reads as warmth without the whole thing tipping orange.
Numbers: `CORE_COLOUR` (`#F2F4F5`, pale near-white), `MID_COLOUR` (`#8A9099`, grey), `RIM_COLOUR` (`#C98A3C`, warm amber).

**10. Warm fades first**
Now move the three colours out of step as brightness drops, so the amber rim retreats first and the pale core holds on longest. This is the idea of the piece — the reason dimming should read as colder and further away rather than merely fainter. It is a separate step from step 9 on purpose, so that if the fade looks wrong you know whether the problem is the palette or the timing. Give it time.
Use the same gradient stops with `map`, `constrain` and `lerp` on brightness, giving each layer its own range rather than one shared opacity.
Laptop: hold, then release slowly, and watch the rim leave before the core does.
Phone: the same while walking and stopping; check the rim is visibly gone before the core has dimmed much.
Numbers: `RIM_ALPHA_AT_EMBER` (how far the rim falls by the time brightness reaches `EMBER_FLOOR`), `CORE_ALPHA_AT_EMBER` (the same for the core, and higher).

**11. The rays**
Add short ticks around the glow. Their opacity follows brightness, and each flickers on its own slow, irregular cycle. Not a sine wave in step — vary it by eye, and keep it slow. It must never strobe: if it flashes more than about once a second, slow it down.
Use p5 `rotate`/`translate` or `cos`/`sin` around the glow point, `random`, `noise`, `millis`, `stroke`, `line`.
Laptop: hold, and a gentle living shimmer sits around the light; release, and the rays fade out with it.
Phone: the same, and confirm it reads as a shimmer and not a flicker.
Numbers: `RAY_COUNT` (about `12`), `RAY_LENGTH`, `RAY_WIDTH`, `RAY_MAX_ALPHA`, `RAY_FLICKER_SPEED` (slow), `RAY_FLICKER_DEPTH`.

**12. Tune the movement threshold in the room**
No new code. Change `MOVE_THRESHOLD` until the behaviour is right with real people in the dim room, standing and shifting weight or gently swinging the phone. Do this before the optional steps, because it is the only part of the piece you cannot judge from a laptop.
Use p5-phone `setMoveThreshold()` and `deviceMoved()`.
Laptop: nothing to check.
Phone: every lantern should light on a deliberate shift and stay lit while someone walks in place, and none of them should flicker on idle breathing or on standing still.
Numbers: `MOVE_THRESHOLD` — final value.

**13. Grain — optional, skip freely**
Add it only if the dark still looks flat and synthetic after step 11, and keep it at the very edge of being visible. It is a risk in the other direction: in a dim room a grainy screen reads as brighter and lifts the light in the whole room. `loadPixels`/`updatePixels` over a full-screen retina canvas every frame is the most expensive thing this sketch will ever do, so if the frame rate drops, leave it out — the piece is finished without it.
Use p5 `loadPixels`/`updatePixels`, or many faint points drawn per frame.
Laptop: barely noticeable; if you can see it clearly, it is too strong.
Phone: the dark must still read as dark and not grey, and the frame rate must not drop.
Numbers: `GRAIN_ALPHA` (very low), `GRAIN_DENSITY`.

**14. The continuous wobble — optional**
This is the half of "cheap first, both eventually" that steps 5 to 12 leave out. Read the accelerometer each frame, subtract the gravity baseline by smoothing, and use what is left as a dial, so brightness and size answer to how strongly someone is moving instead of to a timer. The reading includes gravity — roughly 1g when still — so it has to be smoothed before it means anything. p5 has no rotation-rate globals: do not read `rotationRateAlpha`, `rotationRateBeta` or `rotationRateGamma`. They do not exist, they throw a `ReferenceError` every frame, and they stop the sketch drawing.
Use p5 `accelerationX`, `accelerationY`, `accelerationZ` against `pAccelerationX/Y/Z`, read only once `window.sensorsEnabled` is true, smoothed with `lerp`; p5-phone `deviceMoved()` stays as the on/off signal until this replaces it.
Laptop: unchanged — step 6's hold-to-stay-lit still stands in for movement.
Phone: walking briskly should reach full brightness faster than ambling, and a small shift should never reach full at all.
Numbers: `WOBBLE_THRESHOLD` (how much leftover acceleration counts as walking), `WOBBLE_GAIN` (how hard the dial is driven).

## What I had to assume
- **Project name** — there was no title in the template, so I used "Lantern". Change it.
- **The question** — never asked in this chat, so it is left as the template's bracket.
- **Colours** — you chose descriptions rather than values, so the hex codes in step 10 are my starting guesses. `BG_NEAR_BLACK` in step 1 is the same.
- **The warm annotation** — `references/layout-lantern.jpg` says "warm, soft edge fades", and you chose a cool core with a warm rim. I have treated the cool core as winning and the annotation as still true of the outermost halo.
- **Momentum without a dial** — "back in about 1 second, then keeps building" needs the brightness to keep rising while movement continues, but `deviceMoved()` is only a yes/no. I have assumed the build is timed from the moment movement starts, so the rising acceleration reading stays a later option rather than a dependency.
- **Numbers you did not set** — the tail after 5 seconds (`TAIL_SECONDS`), the length of the build after 1 second (`BUILD_SECONDS`), how much brightness 1 second buys (`WAKE_FRACTION`), and the ember floor are all mine. The 5s, the 1s, the 0.39 core and 0.73 halo diameters and the 0.64 centre height are read off your layout drawing.
- **Ray count** — about 12, counted from the drawing.
- **Holding on a laptop** — both the mouse button and a key, since you did not say which.
- **Two taps on iOS** — the plan assumes the first tap on the prompt triggers the sketch and the system motion dialog follows as a second tap.
- **Full-screen** — the canvas fills the window and the fractions are of canvas width, so the layout holds on any phone but the browser's own bars are not drawn by the sketch.
- **Serving** — `setMoveThreshold()` and the wake lock both need HTTPS, so testing means serving the sketch, not opening the file.

## Changes
<!-- Yours. One line each time you change this plan, and why. -->
