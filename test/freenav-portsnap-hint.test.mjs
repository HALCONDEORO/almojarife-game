import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Pins the 24/10 human-playtest fixes in web/main.mjs: (1) a free-nav right click near a port dot
// snaps to that port instead of routing to open sea; (2) the bottom hint of an anchored ship says
// it is holding position, not 'wait to arrive'.
const src = readFileSync('web/main.mjs', 'utf8');

test('preview and contextmenu share zoom-independent port snapping', () => {
  assert.match(src, /const dest = mapDestination\(mapEl, ev, world/, 'orders use the shared pointer resolver');
  const overlay = readFileSync('web/routepreview.mjs','utf8');
  assert.match(overlay, /const dest = mapDestination\(map,/, 'preview uses the same resolver');
  assert.match(overlay, /48 \/ \(ctm\.a \|\| 1\)/, '48 screen-pixel tolerance');
});

test('anchored ships get a holding-position hint in both locales', () => {
  assert.match(src, /s\.voyage \? \(\(s\.voyage\.anchored \? t\.hintAnchored : pendingEvent\(g\) \? t\.hintEvent : t\.hintSea\) \+ \(objLine && !objMin/, 'the bottom hint branches on anchored and stacks the mission line under sail (Marco 25/10)');
  assert.match(src, /hintAnchored: "Tu barco está al pairo\. Clic derecho para darle un nuevo rumbo\."/, 'es string');
  assert.match(src, /hintAnchored: "Your ship is holding position\. Right-click to set a new course\."/, 'en string');
});
