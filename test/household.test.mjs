import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, netWorth } from "../src/game/game.mjs";
import { householdWeek, householdCharge, HOUSEHOLD_RATE_YEAR } from "../src/game/household.mjs";
const world = loadWorld();
const hash = (g) => createHash("sha1").update(JSON.stringify({ ...g, household: undefined, world: undefined })).digest("hex");
test("pure: 2% a year over 52 weeks, never above cash, zero for no worth", () => {
  assert.equal(householdCharge(100000, 52000), 20);
  assert.equal(householdCharge(5, 52000), 5);
  assert.equal(householdCharge(1000, 0), 0); assert.equal(householdCharge(1000, -50), 0); assert.equal(householdCharge(-10, 1000), 0);
  assert.equal(HOUSEHOLD_RATE_YEAR, 0.02);
});
test("flag off by default: state identical to a game that never heard of it", () => {
  const a = newGame(world, "cadiz", { seed: 3 }), b = newGame(world, "cadiz", { seed: 3, household: false });
  assert.equal(a.household, false);
  for (let i = 0; i < 70; i++) { advanceDay(a); advanceDay(b); }
  assert.equal(hash(a), hash(b));
});
test("flag on: player and bot with the same cash and worth pay exactly the same, via the same weekly hook", () => {
  const g = newGame(world, "cadiz", { seed: 3, household: true });
  g.day = 7; g.ships[0].cargo = { wool: 100 }; g.warehouses = {}; g.loans = [];
  const t = g.ai[0]; t.ship.cargo = { wool: 100 }; t.cash = g.cash;
  const worthP = netWorth(g), c0 = g.cash;
  householdWeek(g, netWorth);
  assert.equal(Math.round((c0 - g.cash) * 100), Math.round((c0 - t.cash) * 100));
  assert.equal(Math.round((c0 - g.cash) * 100) / 100, householdCharge(c0, worthP));
  assert.ok(c0 - g.cash > 0);
});
test("hook does nothing off the weekly day or with the flag off", () => {
  const g = newGame(world, "cadiz", { seed: 3, household: true }); g.day = 6; const c = g.cash;
  assert.equal(householdWeek(g, netWorth), 0); assert.equal(g.cash, c);
  const h = newGame(world, "cadiz", { seed: 3 }); h.day = 7; assert.equal(householdWeek(h, netWorth), 0);
});
