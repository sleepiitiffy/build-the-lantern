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

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Stops pull-to-refresh, swipe-back, pinch-zoom, double-tap zoom and
  // overscroll. Must run before any mousePressed/mouseReleased is defined, so
  // that p5-phone's wrapper survives.
  lockGestures();

  buildStartPrompt();

  // Step 3 — the motion permission is bound to that element rather than to a
  // full-screen overlay, so the only thing the person taps is the word they can
  // actually see. Must come after buildStartPrompt(), since it binds to the
  // element that creates. Chrome 153+ holds motion still inside an iframe until
  // the page has focus, and p5-phone 1.15.3 hands over focus on this tap.
  enableSensorOn('#start');
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
}

// The phone's browser bars collapse after the first scroll. A canvas left at
// the size it had in setup() would keep the bottom of the frame underneath
// them, and the glow is meant to sit low.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
