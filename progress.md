# Progress

## Where things are
Step 1 of 14 done. `sketch.js` holds a full-screen near-black canvas with
gestures locked and a resize handler. Nothing is drawn yet.

## What works and how I checked it
Step 1 checked in a browser over HTTPS via `npm run phone`. Console is clean —
no errors. p5.js 2.3.2 and p5-phone 1.15.3 both loaded, p5-phone reported
"Mobile gestures locked", `window.gesturesLocked` is `true`, the canvas is
1301x1250 filling the window, and the screen renders as flat near-black.

Not yet checked on your phone. The gesture behaviour — no pull-to-refresh, no
pinch-zoom — and the browser-bar collapse both need a real touchscreen to
confirm.

## What is next
Step 2, the start prompt: a small underlined *Light the lantern* element low in
the frame, created and styled from inside `sketch.js`.
