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
const PROMPT_CENTRE_OFFSET = 0; // px; 0 puts the words dead centre of the screen

// The scrim dims the whole screen — lantern included — so it reads as a screen
// waiting to be touched rather than as the piece already running. Kept well
// below opaque: the ember has to stay visible through it, or there is nothing
// to activate.
const SCRIM_ALPHA = 0.3;

// The blur, as a percentage of the glow's own diameter. Expressed that way rather
// than in pixels so it holds on any screen size. Backdrop blur is what makes the
// lantern read as being *behind* something rather than merely dimmed — it softens
// the ember's edge at the same time as it darkens it, which is the same quality
// references/mood-night-lanterns.jpg gets from being out of focus.
const SCRIM_BLUR_FRAC = 0.5;
const SCRIM_BLUR_PX = () => SCRIM_BLUR_FRAC * (HALO_DIAMETER * width);

// Step 5 — the glow's position, read off references/layout-lantern.jpg. Diameters
// are fractions of the canvas width; the centre height is a fraction of the
// canvas height. That split is deliberate, so the layout holds on any phone.
const GLOW_X_FRAC = 0.5; // horizontally centred, as drawn
const GLOW_Y_FRAC = 0.64; // below the middle, as drawn
const CORE_DIAMETER = 0.39; // of canvas width
const EMBER_FLOOR = 0.06; // the brightness floor — faint, and never zero

// Step 8 — the soft outer halo. Much larger than the core, because a glow reads
// as light in the air around a source rather than as a bigger source. CORE_DIAMETER
// is already set in step 5 and must not be duplicated here.
const HALO_DIAMETER = 0.73; // of canvas width
const HALO_ALPHA_MAX = 0.55; // at full brightness
const CORE_ALPHA_MAX = 1; // at full brightness; the core is the brightest thing
const MOVE_THRESHOLD = 0.5; // p5's default; tune this in the room at step 12

// Step 7 — the shape of the rise and the fall, from references/layout-lantern.jpg.
// The two directions are deliberately unequal: slow to lose the light, quick to
// get it back. A fast recovery and a patient loss is how an eye behaves, and it
// is what stops the piece feeling sluggish.
const FADE_SECONDS = 5; // the main drop, to almost dark
const TAIL_SECONDS = 8; // then a slower sink to the ember floor — longer than the fade
const WAKE_SECONDS = 1; // back to partway in this long
const WAKE_FRACTION = 0.5; // how much brightness that one second buys
const BUILD_SECONDS = 4; // then on to full over this long, while movement continues

// Step 3 — the piece stays inert until the screen is pressed. This is
// deliberately driven by the press and not by window.sensorsEnabled: once iOS
// has remembered the motion permission from an earlier visit, the sensor is live
// the moment the page loads, so movement would light the lantern while the
// prompt was still up. Pressing is the only thing that starts it.
let started = false;

// Both elements, kept rather than looked up each frame. p5's select('#start') is
// a query on the whole document, so it also matches an element with that id
// belonging to something else on the page.
let startPrompt = null;
let startScrim = null;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Stops pull-to-refresh, swipe-back, pinch-zoom, double-tap zoom and
  // overscroll. Called straight from setup(), which is how the p5-phone docs
  // show it.
  lockGestures();

  buildStartPrompt();

  // Step 3 — the motion permission is bound to the scrim, which is the whole
  // screen, rather than to a library-drawn overlay. Must come after
  // buildStartPrompt(), since it binds to the element that creates. Chrome 153+
  // holds motion still inside an iframe until the page has focus, and p5-phone
  // 1.15.3 hands over focus on this tap.
  enableSensorOn('#scrim');

  // Step 5 — read only after window.sensorsEnabled is true. Below that, motion
  // values are stale or undefined rather than reporting stillness.
  setMoveThreshold(MOVE_THRESHOLD);
}

// Built here in sketch.js rather than in index.html, because the plan allows
// only this file to change.
//
// Two layers, in this order from the bottom up: the canvas with the ember on it,
// then a translucent scrim over the whole screen, then the words on top of that.
// The scrim is the tap target, so pressing anywhere starts the piece — the words
// are a label on the target rather than the target itself.
function buildStartPrompt() {
  // The scrim. Covers everything, sits above the canvas, and takes the press.
  const scrim = (startScrim = document.createElement('div'));
  scrim.id = 'scrim';
  scrim.style.position = 'fixed';
  scrim.style.inset = '0';
  scrim.style.backgroundColor = `rgba(0, 0, 0, ${SCRIM_ALPHA})`;
  scrim.style.zIndex = '1';
  scrim.style.cursor = 'pointer';

  // Applied here and again on resize, since the blur is a length and the glow's
  // size is a fraction of the canvas.
  scrim.style.backdropFilter = `blur(${SCRIM_BLUR_PX()}px)`;
  scrim.style.webkitBackdropFilter = `blur(${SCRIM_BLUR_PX()}px)`;

  // The start signal. Bound here rather than in p5's mousePressed, because the
  // scrim now covers the canvas: p5 listens for pointer events on the canvas
  // element, and anything landing on top of it never reaches those handlers.
  // Listening on the scrim means a press anywhere on screen counts, including on
  // the words themselves.
  //
  // This runs alongside p5-phone's own handler on this same element, so one
  // press sets this flag and raises the motion permission together. Nothing
  // stops propagation, because p5-phone still needs the event.
  scrim.addEventListener('pointerdown', () => {
    started = true;
  });

  document.body.appendChild(scrim);

  const prompt = (startPrompt = document.createElement('div'));
  prompt.id = 'start';
  prompt.textContent = PROMPT_TEXT;

  prompt.style.position = 'fixed';
  prompt.style.left = '0';
  prompt.style.right = '0';
  prompt.style.top = '50%';
  prompt.style.transform = `translateY(calc(-50% + ${PROMPT_CENTRE_OFFSET}px))`;
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

  // Above the scrim, so the words are never dimmed by it.
  prompt.style.zIndex = '2';

  // The words are a label, not the target. Without this they would swallow taps
  // meant for the scrim underneath, so pressing exactly on the text would do
  // nothing.
  prompt.style.pointerEvents = 'none';

  document.body.appendChild(prompt);
}

// Step 5 — one brightness value, 0 to 1, and the whole piece hangs off it. It
// starts at the floor, so the resting state is already the ember: there is no
// separate "off" state to draw.
let lanternBrightness = EMBER_FLOOR;

// Step 7 — edge detectors and elapsed time for the two curves. `wasMoving` is
// what turns "is moving" into "just started" or "just stopped", which is when
// the rise and the fall both begin.
let wasMoving = false;
let wakeElapsed = 0;
let wakeFrom = EMBER_FLOOR;
let fadeElapsed = 0;
let fadeFrom = 1;

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
//
// Desktop only, deliberately. A finger resting on a phone screen also arrives as
// mousePressed, and letting that count would light the lantern whenever somebody
// touched the glass — which is not walking, and is the opposite of what the piece
// is about. The plan's step 6 says the same thing: holding must do nothing on a
// phone.
let holding = false;

function isHolding() {
  return window.isDesktop === true && holding;
}

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

  // Step 3 — the prompt leaves when it is pressed, and not a moment before. The
  // words stay up until the piece has genuinely been started, which means a
  // person who dismisses the iOS dialog still has something to tap again.
  // Nothing at all happens until the prompt is pressed: no hiding, no brightness
  // change, no reaction to movement. This check comes first so that nothing below
  // it can run early.
  if (!started) {
    moving = false;
    drawLantern();
    return;
  }

  // Both layers go together once the press has happened: the scrim first, so the
  // screen stops reading as dormant, and the words with it. Hiding the elements
  // we already hold, rather than querying for them again.
  if (startScrim) {
    startScrim.style.display = 'none';
  }
  if (startPrompt) {
    startPrompt.style.display = 'none';
  }

  // Steps 5 and 6 — one value, two possible drivers. The sensor is gated on its
  // own flag and is never read before permission; the hold is a desktop-only
  // stand-in. Either counts as movement, and nothing downstream knows the
  // difference.
  const isMoving = (window.sensorsEnabled && moving) || isHolding();

  lanternBrightness = shapeBrightness(lanternBrightness, isMoving, deltaTime / 1000);

  // deviceMoved() is an event, not a state, so it has to be cleared each frame or
  // one shake would leave the lantern lit for good.
  moving = false;

  drawLantern();
}

// Step 7 — the timings. Two curves rather than one rate, because the piece needs
// a fast recovery and a slow, two-stage loss.
//
// Time is spent rather than tracked per frame, so the shape survives a dropped
// frame or a backgrounded tab instead of stretching. The wake is timed from the
// moment movement starts, since deviceMoved() is a yes/no and cannot report how
// hard anyone is moving — that dial is step 14.
function shapeBrightness(current, isMoving, dt) {
  if (isMoving) {
    if (!wasMoving) {
      // Movement just started. Remember where the rise began, so WAKE_SECONDS
      // and BUILD_SECONDS are measured against the ember rather than against
      // whatever brightness happened to be on screen.
      wakeFrom = current;
      wakeElapsed = 0;
    }
    wakeElapsed += dt;

    // First second climbs to partway, then the build carries on to full.
    const wakePart = map(
      constrain(wakeElapsed, 0, WAKE_SECONDS),
      0,
      WAKE_SECONDS,
      wakeFrom,
      wakeFrom + (1 - wakeFrom) * WAKE_FRACTION
    );
    const buildPart = map(
      constrain(wakeElapsed - WAKE_SECONDS, 0, BUILD_SECONDS),
      0,
      BUILD_SECONDS,
      wakeFrom + (1 - wakeFrom) * WAKE_FRACTION,
      1
    );

    wasMoving = true;
    return constrain(Math.max(wakePart, buildPart), 0, 1);
  }

  if (wasMoving) {
    // Movement just stopped. Restart the fall from wherever it actually is, so
    // an interrupted rise still fades smoothly from where it got to.
    fadeFrom = current;
    fadeElapsed = 0;
    wasMoving = false;
  }
  fadeElapsed += dt;

  // Stage one: down to almost dark in FADE_SECONDS. Stage two: a slower tail to
  // the ember floor, which is never reached in zero — the lantern is still there
  // when you stop, just very nearly out.
  const fadeEnd = EMBER_FLOOR + (1 - EMBER_FLOOR) * 0.15; // "almost dark"

  if (fadeElapsed <= FADE_SECONDS) {
    // Still in the first stage, so the tail has no say yet.
    return constrain(map(fadeElapsed, 0, FADE_SECONDS, fadeFrom, fadeEnd), EMBER_FLOOR, 1);
  }

  const tail = map(
    constrain(fadeElapsed, FADE_SECONDS, FADE_SECONDS + TAIL_SECONDS),
    FADE_SECONDS,
    FADE_SECONDS + TAIL_SECONDS,
    fadeEnd,
    EMBER_FLOOR
  );

  return constrain(tail, EMBER_FLOOR, 1);
}

// Step 8 — the lantern: a soft outer halo with a brighter core inside it, both
// centred on the glow point, both driven by the brightness value.
//
// The soft edge is a real radial gradient rather than a stack of concentric
// circles, because p5 only draws hard-edged shapes and stacked circles band
// visibly at low brightness on a phone. Two details make or break it, and both
// are near-invisible on a laptop:
//
//   - the outermost colour stop must sit at zero alpha. Fill the gradient's
//     bounding box and anything beyond its outer radius takes that last stop, so
//     a non-zero one paints the corners and puts a visible square around the halo.
//   - each stop carries its own colour and its own alpha, rather than fading
//     through transparent black, which turns the whole falloff into grey haze.
function drawLantern() {
  const cx = width * GLOW_X_FRAC;
  const cy = height * GLOW_Y_FRAC;
  const b = constrain(lanternBrightness, 0, 1);

  // Both shapes grow as well as brighten, which is the "a little bigger" from the
  // layout. The halo grows less than the core: it is light in the air, not a
  // bigger source.
  const r = (HALO_DIAMETER * width * map(b, 0, 1, 0.72, 1)) / 2;

  const grad = drawingContext.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, color(242, 244, 245, HALO_ALPHA_MAX * b * 255).toString());
  grad.addColorStop(0.45, color(242, 244, 245, HALO_ALPHA_MAX * b * 160).toString());
  // Zero alpha at the outer edge, or the corners of the fill pick this stop up
  // and the halo gains a square edge.
  grad.addColorStop(1, color(242, 244, 245, 0).toString());

  drawingContext.fillStyle = grad;
  drawingContext.beginPath();
  drawingContext.arc(cx, cy, r, 0, TWO_PI);
  drawingContext.closePath();
  drawingContext.fill();

  // The core, inside the halo. p5's own circle is fine here: it has a hard edge
  // by design, which is what a filament looks like.
  noStroke();
  fill(242, 244, 245, CORE_ALPHA_MAX * b * 255);
  circle(cx, cy, CORE_DIAMETER * width * map(b, 0, 1, 0.6, 1));
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

  // The scrim's blur is a length derived from the canvas width, so it has to be
  // recomputed rather than left at whatever the screen was on load.
  if (startScrim) {
    startScrim.style.backdropFilter = `blur(${SCRIM_BLUR_PX()}px)`;
    startScrim.style.webkitBackdropFilter = `blur(${SCRIM_BLUR_PX()}px)`;
  }
}
