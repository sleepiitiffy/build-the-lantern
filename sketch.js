// Lantern — a p5.js 2 + p5-phone sketch. Built from plan.md, one step at a time.
//
// Every number this sketch introduces is named here at the top, so it can be
// tuned without reading the rest of the file.

// Step 1 — neutral near-black, no colour cast, so all the colour attention
// stays on the glow's own shifting.
const BG_NEAR_BLACK = '#0A0A0A';

// Step 2 — the start prompt. Small, underlined, low in the frame, and the only
// thing on screen before the piece begins.
const PROMPT_TEXT = 'Light the lantern';
const PROMPT_SIZE = 15; // px — small, as drawn
const PROMPT_UNDERLINE = true;
const PROMPT_OPACITY = 0.55; // quiet against the dark, still legible
const PROMPT_BOTTOM_MARGIN = 56; // px above the bottom edge, clear of the bars

// Step 5 — the glow's position, read off references/layout-lantern.jpg. Diameters
// are fractions of the canvas width; the centre height is a fraction of the
// canvas height. That split is deliberate, so the layout holds on any phone.
const GLOW_X_FRAC = 0.5; // horizontally centred, as drawn
const GLOW_Y_FRAC = 0.64; // below the middle, as drawn
const CORE_DIAMETER = 0.39; // of canvas width
const EMBER_FLOOR = 0.06; // the brightness floor — faint, and never zero
const MOVE_THRESHOLD = 0.5; // p5's default; tune this in the room at step 12

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Stops pull-to-refresh, swipe-back, pinch-zoom, double-tap zoom and
  // overscroll. Called straight from setup(), which is how the p5-phone docs
  // show it.
  lockGestures();

  buildStartPrompt();

  // Step 3 — the motion permission is bound to that element rather than to a
  // full-screen overlay, so the only thing the person taps is the word they can
  // actually see. Must come after buildStartPrompt(), since it binds to the
  // element that creates. Chrome 153+ holds motion still inside an iframe until
  // the page has focus, and p5-phone 1.15.3 hands over focus on this tap.
  enableSensorOn('#start');

  // Step 5 — read only after window.sensorsEnabled is true. Below that, motion
  // values are stale or undefined rather than reporting stillness.
  setMoveThreshold(MOVE_THRESHOLD);
}

// Built here in sketch.js rather than in index.html, because the plan allows
// only this file to change. Positioned over the canvas, so it sits in the same
// low place the glow will later take.
function buildStartPrompt() {
  const prompt = document.createElement('div');
  prompt.id = 'start';
  prompt.textContent = PROMPT_TEXT;

  prompt.style.position = 'fixed';
  prompt.style.left = '0';
  prompt.style.right = '0';
  prompt.style.bottom = `${PROMPT_BOTTOM_MARGIN}px`;
  prompt.style.textAlign = 'center';
  prompt.style.fontFamily = 'inherit';
  prompt.style.fontSize = `${PROMPT_SIZE}px`;
  prompt.style.fontWeight = '300';
  prompt.style.letterSpacing = '0.06em';
  prompt.style.color = `rgba(242, 244, 245, ${PROMPT_OPACITY})`;
  prompt.style.textDecoration = PROMPT_UNDERLINE ? 'underline' : 'none';
  prompt.style.textUnderlineOffset = '5px';

  // A word this small is a small target. Pad the hit area out to a comfortable
  // size without making the text itself any bigger.
  prompt.style.padding = '18px 28px';
  prompt.style.cursor = 'pointer';

  // Stops the long-press selection menu and the double-tap zoom from ever
  // appearing over the prompt.
  prompt.style.userSelect = 'none';
  prompt.style.webkitUserSelect = 'none';
  prompt.style.webkitTapHighlightColor = 'transparent';

  // Above the canvas.
  prompt.style.zIndex = '1';

  document.body.appendChild(prompt);
}

let promptHidden = false;

// Step 5 — one brightness value, 0 to 1, and the whole piece hangs off it. It
// starts at the floor, so the resting state is already the ember: there is no
// separate "off" state to draw. Step 7 gives the rise and fall their shape; for
// now it snaps toward its target.
let brightness = EMBER_FLOOR;

// Step 5 — movement, read from the accelerometer p5 already exposes. This is a
// p5 built-in, not something p5-phone provides: p5-phone only requests the
// permission and sets the flag.
let moving = false;

function deviceMoved() {
  moving = true;
}

// Step 6 — a held mouse button or key counts as movement on a desktop, where
// there is no sensor and deviceMoved() never fires. This is the one input that
// differs by platform; everything downstream reads the same brightness value.
let holding = false;

function mousePressed() {
  holding = true;
  return false;
}

// Step 4 — the screen wake lock. This is NOT a p5-phone feature: there is no
// keepScreenOn(), no enableWakeLock*(), and nothing to add to enablePermissions*.
// It is the browser's own Screen Wake Lock, called directly, and the sketch
// cannot work without it. A phone dims and locks after roughly 30 seconds
// without a touch, and nobody touches their phone while walking — so without
// this the lantern goes dark exactly while it is doing its job.
let wakeLock = null;
let wantAwake = false;

// The browser drops the lock whenever the page is hidden — another app, the
// lock screen, the side button — and never restores it by itself.
document.addEventListener('visibilitychange', () => {
  if (wantAwake && document.visibilityState === 'visible') {
    requestWakeLock();
  }
});

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) {
    // Power saving, low battery, or an iframe without the permission. The piece
    // still runs; the screen may just dim.
    console.warn('Wake lock refused:', err.message);
  }
}

function draw() {
  background(BG_NEAR_BLACK);

  // Step 3 — the prompt leaves as soon as motion is actually granted, not when
  // the request was merely made. Gating on the flag rather than on the tap means
  // a person who dismisses the iOS dialog keeps the prompt and can try again,
  // instead of being left staring at an empty screen with no way forward.
  if (!promptHidden && window.sensorsEnabled) {
    select('#start').hide();
    promptHidden = true;
  }

  // Steps 5 and 6 — one value, two possible drivers. The sensor is gated on its
  // own flag and is never read before permission; the hold is a desktop-only
  // stand-in. Either counts as movement, and nothing downstream knows the
  // difference.
  const isMoving = (window.sensorsEnabled && moving) || holding;

  // Step 7 shapes this properly. For now it snaps toward its target, so the dot
  // jumps rather than eases.
  brightness = constrain(isMoving ? 1 : EMBER_FLOOR, 0, 1);

  // deviceMoved() is an event, not a state, so it has to be cleared each frame or
  // one shake would leave the lantern lit for good.
  moving = false;

  drawEmber();
}

// Step 5 — the ember: the resting state, drawn at the brightness floor so
// somebody who has never moved still sees a light. Position and size come from
// the layout drawing.
function drawEmber() {
  const d = CORE_DIAMETER * width;
  noStroke();
  fill(242, 244, 245, constrain(brightness, 0, 1) * 255);
  circle(width * GLOW_X_FRAC, height * GLOW_Y_FRAC, d);
}

// Step 4 — requested from mouseReleased, deliberately. iOS refuses the first
// wake lock request unless it comes from a user gesture, and a touch only counts
// as one when the finger lifts, so mousePressed is too early. userSetupComplete()
// is worse still: it runs after the permission prompts, by which point iOS may no
// longer count the tap. Chrome needs no gesture at all, so this is harmless there.
//
// Step 6 shares this handler, because it is the same event: lifting a finger is
// both the end of a hold and a valid moment to ask for the wake lock.
//
// Returning false keeps p5-phone's gesture blocking in charge, per the rule in
// plan.md about assigning these before lockGestures().
function mouseReleased() {
  holding = false;

  const held = wakeLock !== null && !wakeLock.released;
  if ('wakeLock' in navigator && !held) {
    wantAwake = true;
    requestWakeLock();
  }
  return false;
}

// Step 6 — a key stands in for walking on a desktop too, so the piece can be
// checked without a mouse.
function keyPressed() {
  holding = true;
  return false;
}

function keyReleased() {
  holding = false;
  return false;
}

// The phone's browser bars collapse after the first scroll. A canvas left at
// the size it had in setup() would keep the bottom of the frame underneath
// them, and the glow is meant to sit low.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
