import { test } from "node:test";
import assert from "node:assert/strict";
import { shipDescriptor, HULL_SIDE } from "../src/view/shipvisual.mjs";
import { SHIP_TYPES } from "../src/sim/trade.mjs";

test("the descriptor reads only real ship fields and clamps them", () => {
  const d = shipDescriptor({ id: 7, type: "caravel", hull: 45, weapons: { cannon: 2, ballista: 1 }, gunCond: 30, gear: 2, crew: 12 });
  assert.deepEqual(d, { id: 7, type: "caravel", hull: 45, weapons: 3, maxGuns: 4, gun: 30, gear: 2, crew: 12 });
  assert.equal(shipDescriptor({ id: 1, type: "cog", hull: 250 }).hull, 100);
  assert.equal(shipDescriptor({ id: 1, type: "cog" }).hull, 100, "missing hull means intact");
  assert.equal(shipDescriptor({ id: 1, type: "cog" }).weapons, 0);
});
test("every ship class has side-view dimensions", () => {
  for (const k of Object.keys(SHIP_TYPES)) assert.ok(HULL_SIDE[k], k);
});
