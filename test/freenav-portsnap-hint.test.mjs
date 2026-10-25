import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Pins the 24/10 human-playtest fixes in web/main.mjs: (1) a free-nav right click near a port dot
// snaps to that port instead of routing to open sea; (2) the bottom hint of an anchored ship says
// it is holding position, not 'wait to arrive'.
const src = readFileSync('web/main.mjs', 'utf8');

test('free-nav contextmenu snaps a near-port click to the port, zoom-independent', () => {
  assert.match(src, /querySelectorAll\("g\.city"\)\.forEach\(\(el\) => \{ const d = Math\.hypot\(Number\(el\.dataset\.mx\) - q\.x, Number\(el\.dataset\.my\) - q\.y\)/, 'snaps against the rendered port dots in map space');
  assert.match(src, /const tol = 48 \/ \(ctm\.a \|\| 1\)/, 'tolerance is 48 screen px converted with the CTM (zoom-independent)');
  assert.match(src, /if \(snap && world\.nodes\[snap\]\) \(\{ lat, lon \} = world\.nodes\[snap\]\); else \{ lon = q\.x \/ sc \+ x0; lat = y1 - q\.y \/ \(sc \* 1\.25\); \}/, 'a snapped click goes to the port node, anything else keeps the sea point');
});

test('anchored ships get a holding-position hint in both locales', () => {
  assert.match(src, /s\.voyage \? \(s\.voyage\.anchored \? t\.hintAnchored : t\.hintSea\) :/, 'the bottom hint branches on anchored');
  assert.match(src, /hintAnchored: "Tu barco está al pairo\. Clic derecho para darle un nuevo rumbo\."/, 'es string');
  assert.match(src, /hintAnchored: "Your ship is holding position\. Right-click to set a new course\."/, 'en string');
});
