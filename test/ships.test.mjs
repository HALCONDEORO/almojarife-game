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
