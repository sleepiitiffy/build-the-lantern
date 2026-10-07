// Lantern — a p5.js 2 + p5-phone sketch. Built from plan.md, one step at a time.
//
// Every number this sketch introduces is named here at the top, so it can be
// tuned without reading the rest of the file.

// Step 1 — neutral near-black, no colour cast, so all the colour attention
// stays on the glow's own shifting.
const BG_NEAR_BLACK = '#0A0A0A';

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Stops pull-to-refresh, swipe-back, pinch-zoom, double-tap zoom and
  // overscroll. Must run before any mousePressed/mouseReleased is defined, so
  // that p5-phone's wrapper survives.
  lockGestures();
}

function draw() {
  background(BG_NEAR_BLACK);
}

// The phone's browser bars collapse after the first scroll. A canvas left at
// the size it had in setup() would keep the bottom of the frame underneath
// them, and the glow is meant to sit low.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
