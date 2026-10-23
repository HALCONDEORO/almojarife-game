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
test("hull wear adds plank patches then a battered stern; the intact ship is byte-identical to before", () => {
  assert.equal(shipSvg("cog", {}), shipSvg("cog", { hull: 100 }));
  const b1 = shipSvg("cog", { hull: 50 }), b2 = shipSvg("cog", { hull: 20 });
  assert.notEqual(b1, shipSvg("cog", { hull: 100 }));
  assert.equal((b1.match(/#6b5136/g) || []).length, 1); // one wood patch
  assert.equal((b2.match(/#6b5136/g) || []).length, 2); // two patches
  assert.match(b2, /M-11 0 L-8.4 -2.2 L-8.4 2.2 Z/); // battered stern wedge (cog)
  assert.doesNotMatch(b1, /L-8.4 -2.2/);
  assert.equal( // the classic markup for an intact cog, mine, rotated: unchanged byte for byte
    shipSvg("cog", { mine: true, heading: 45 }),
    '<g class="ship" transform="rotate(45) scale(1.7)"><path d="M-11 0 C-10 -4.5 -2 -5.5 5 -4 L12 0 L5 4 C-2 5.5 -10 4.5 -11 0 Z" fill="#7a2a1c" stroke="#2a1d10" stroke-width=".9"/><path d="M-1 -7 L-1 7 L2 5 L2 -5 Z" fill="#f6ecd2" stroke="#2a1d10" stroke-width=".6"/></g>');
});

