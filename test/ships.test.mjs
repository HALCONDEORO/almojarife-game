import test from "node:test";
import assert from "node:assert/strict";
import { headingDeg, shipSvg, wakeSvg, pushTrail } from "../src/view/ships.mjs";
test("heading is 0 to the right, 90 down, 180 left and null when standing still", () => {
  assert.equal(headingDeg({ x: 0, y: 0 }, { x: 5, y: 0 }), 0);
  assert.equal(headingDeg({ x: 0, y: 0 }, { x: 0, y: 5 }), 90);
  assert.equal(Math.abs(headingDeg({ x: 0, y: 0 }, { x: -5, y: 0 })), 180);
  assert.equal(headingDeg({ x: 1, y: 1 }, { x: 1, y: 1 }), null);
});
test("each ship type has a drawing; unknown types fall back and nothing throws", () => {
  for (const t of ["cog", "caravel", "galleon"]) assert.match(shipSvg(t, { mine: true, heading: 45 }), /rotate\(45\)/);
  assert.notEqual(shipSvg("cog", { mine: true }), shipSvg("cog", { mine: false }));
});
test("wake needs two points, fades and the trail stays short and skips tiny steps", () => {
  assert.equal(wakeSvg([{ x: 0, y: 0 }]), "");
  assert.equal((wakeSvg([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 9, y: 1 }]).match(/<line/g) || []).length, 2);
  const tr = {};
  for (let i = 0; i < 40; i++) pushTrail(tr, 7, { x: i * 3, y: 0 });
  assert.equal(tr[7].length, 14);
  const n = tr[7].length; pushTrail(tr, 7, { x: 39 * 3 + 0.1, y: 0 });
  assert.equal(tr[7].length, n);
});
test("a big jump (days skipped) restarts the wake instead of drawing a line across the map", () => {
  const tr = {}; pushTrail(tr, 1, { x: 0, y: 0 }); pushTrail(tr, 1, { x: 5, y: 0 }); pushTrail(tr, 1, { x: 400, y: 300 });
  assert.equal(tr[1].length, 1);
});
test("four ship types have distinct silhouettes and growing sail plans", () => {
  const hulls = new Set(), sails = {};
  for (const t of ["barca", "cog", "caravel", "nao"]) {
    const paths = [...shipSvg(t, {}).matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
    hulls.add(paths[0]);
    sails[t] = paths.length;
  }
  assert.equal(hulls.size, 4);
  const rects = (t) => (shipSvg(t, {}).match(/<rect/g) || []).length;
  assert.equal(rects("nao"), 0); // gunports are the only rects
  assert.ok(sails.barca < sails.caravel && sails.caravel < sails.nao, JSON.stringify(sails));
});
test("armament draws one gunport pair per mounted piece, capped at the mount cap", () => {
  assert.equal((shipSvg("nao", { weapons: 8, maxGuns: 8 }).match(/<rect/g) || []).length, 16);
  assert.equal((shipSvg("barca", { weapons: 5, maxGuns: 1 }).match(/<rect/g) || []).length, 2);
  assert.equal((shipSvg("cog", {}).match(/<rect/g) || []).length, 0); // unarmed default: no ticks
});
test("worn armament (gunCond < 50) renders half-width gunport marks as a shape cue", () => {
  const worn = shipSvg("cog", { weapons: 2, gun: 40 }), good = shipSvg("cog", { weapons: 2, gun: 90 });
  assert.equal((worn.match(/width="0.9"/g) || []).length, 4); // 2 pieces x 2 rails, half-width
  assert.equal((good.match(/width="1.8"/g) || []).length, 4);
  assert.doesNotMatch(worn, /width="1.8"/);
});
test("hull wear adds plank patches then a battered stern; the intact ship has a pinned canonical markup", () => {
  assert.equal(shipSvg("cog", {}), shipSvg("cog", { hull: 100 }));
  const b1 = shipSvg("cog", { hull: 50 }), b2 = shipSvg("cog", { hull: 20 });
  assert.notEqual(b1, shipSvg("cog", { hull: 100 }));
  assert.equal((b1.match(/#6b5136/g) || []).length, 1); // one wood patch
  assert.equal((b2.match(/#6b5136/g) || []).length, 2); // two patches
  assert.match(b2, /M-11 0 L-8.4 -2.2 L-8.4 2.2 Z/); // battered stern wedge (cog)
  assert.doesNotMatch(b1, /L-8.4 -2.2/);
  assert.equal( // canonical markup of an intact cog, mine, rotated: pinned byte for byte
    shipSvg("cog", { mine: true, heading: 45 }),
    "<g class=\"ship\" transform=\"rotate(45) scale(1.7)\"><path d=\"M-11 0 C-10.5 -3.4 -6 -5.4 0 -5.2 C5 -5 9 -3 12.5 0 C9 3 5 5 0 5.2 C-6 5.4 -10.5 3.4 -11 0 Z\" fill=\"#a8533a\" stroke=\"#6e4a22\" stroke-width=\".9\" stroke-linejoin=\"round\"/><path d=\"M-11 0 H12.5 C9 3 5 5 0 5.2 C-6 5.4 -10.5 3.4 -11 0 Z\" fill=\"#6e4a22\" opacity=\".3\"/><path d=\"M-11 0 C-10.5 -3.4 -6 -5.4 0 -5.2 C5 -5 9 -3 12.5 0 C9 3 5 5 0 5.2 C-6 5.4 -10.5 3.4 -11 0 Z\" transform=\"scale(.76 .68)\" fill=\"#c9a35e\" stroke=\"#6e4a22\" stroke-width=\".4\"/><path d=\"M-9.4 0 L10 0\" stroke=\"#6e4a22\" stroke-width=\".35\" opacity=\".6\" fill=\"none\"/><path d=\"M-11 0 C-10.5 -3.4 -6 -5.4 0 -5.2 C5 -5 9 -3 12.5 0 C9 3 5 5 0 5.2 C-6 5.4 -10.5 3.4 -11 0 Z\" transform=\"scale(.86)\" fill=\"none\" stroke=\"#c9a35e\" stroke-width=\".5\"/><path d=\"M-11 0 C-10.5 -3.4 -6 -5.4 0 -5.2 C5 -5 9 -3 12.5 0 C9 3 5 5 0 5.2 C-6 5.4 -10.5 3.4 -11 0 Z\" transform=\"scale(.94)\" fill=\"none\" stroke=\"#f6e9cc\" stroke-width=\".22\" opacity=\".7\"/><path d=\"M-10.4 -2.6 L-6.4 -3.4 L-6.4 3.4 L-10.4 2.6 Z\" fill=\"#a8733a\" stroke=\"#6e4a22\" stroke-width=\".6\" stroke-linejoin=\"round\"/><path d=\"M-10.4 -2.6 L-6.4 -3.4 L-6.4 3.4 L-10.4 2.6 Z\" transform=\"scale(.92 .72)\" fill=\"#c9a35e\" stroke=\"#f6e9cc\" stroke-width=\".2\"/><path d=\"M-1 -7 C5.16 -5.25 5.16 5.25 -1 7 Z\" fill=\"#f6e9cc\" stroke=\"#6e4a22\" stroke-width=\".6\" stroke-linejoin=\"round\"/><path d=\"M3.62 0 C3.62 3.06 2.08 6.13 -1 7 L-1 0 Z\" fill=\"#b9b09a\" opacity=\".6\"/><line x1=\"-1.2\" y1=\"-7.6\" x2=\"-0.8\" y2=\"7.6\" stroke=\"#6e4a22\" stroke-width=\".5\" stroke-linecap=\"round\"/><line x1=\"-1\" y1=\"-3.5\" x2=\"1.64\" y2=\"-3.5\" stroke=\"#6e4a22\" stroke-width=\".18\" opacity=\".55\"/><line x1=\"-1\" y1=\"0\" x2=\"2.52\" y2=\"0\" stroke=\"#6e4a22\" stroke-width=\".18\" opacity=\".55\"/><line x1=\"-1\" y1=\"3.5\" x2=\"1.64\" y2=\"3.5\" stroke=\"#6e4a22\" stroke-width=\".18\" opacity=\".55\"/><circle cx=\"0.21\" cy=\"0\" r=\".7\" fill=\"#6e4a22\" stroke=\"#6e4a22\" stroke-width=\".2\"/><line x1=\"-8.6\" y1=\"0\" x2=\"-8.6\" y2=\"-2.6\" stroke=\"#6e4a22\" stroke-width=\".35\"/><path d=\"M-8.6 -2.6 L-10.7 -2.2 L-8.6 -1.5 Z\" fill=\"#b2403f\"/></g>"
  );
});


test("wear escalates by hull band: sail patches and tears, mast lean, then list; bands and thresholds as for the hull patches", () => {
  const cnt = (s, re) => (s.match(re) || []).length, A = shipSvg("caravel", { hull: 100 }), B = shipSvg("caravel", { hull: 50 }), C = shipSvg("caravel", { hull: 20 });
  assert.equal(cnt(A, /#b7a273/g), 0); // sound sails: no mended cloth
  assert.equal(cnt(B, /#b7a273/g), 1); // one patch on the main sail
  assert.equal(cnt(C, /#b7a273/g), 1);
  assert.ok(cnt(C, /opacity=".8"/g) > cnt(B, /opacity=".8"/g), "holes only in the worst band");
  assert.doesNotMatch(A, /rotate\(1\.2\)|rotate\(3\)|scale\(1 \.94\)/);
  assert.match(B, /rotate\(1\.2\)/); assert.doesNotMatch(B, /scale\(1 \.94\)/); // lean only
  assert.match(C, /rotate\(3\)/); assert.match(C, /scale\(1 \.94\)/); // more lean plus list
  assert.equal(shipSvg("nao", { hull: 69.9 }), shipSvg("nao", { hull: 30 })); // same band, same bytes
  assert.notEqual(shipSvg("nao", { hull: 70 }), shipSvg("nao", { hull: 69.9 }));
  assert.notEqual(shipSvg("nao", { hull: 30 }), shipSvg("nao", { hull: 29.9 }));
});
test("size ladder: hull length grows barca < cog < caravel < nao by about the side-view ratios", () => {
  const len = { barca: 15, cog: 23.5, caravel: 28.6, nao: 34.2 }, sc = (t) => +shipSvg(t, {}).match(/<g transform="scale\(([\d.]+)\)">/)?.[1] || 1;
  assert.equal(sc("cog"), 1);
  assert.ok(sc("barca") < 1 && sc("caravel") > 1 && sc("nao") > sc("caravel"));
  assert.ok(len.nao / len.barca > 2.2 && len.nao / len.barca < 2.4);
});
