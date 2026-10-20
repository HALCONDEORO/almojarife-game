import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, buyCannon } from "../src/game/game.mjs";
import { CANNON_PRICE, CANNON_UPKEEP, maxCannons, defenceOf, splitCost } from "../src/game/crew.mjs";
import { SETTLE_EVERY } from "../src/game/ledger.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };
test("buying a cannon costs money, respects the limit and adds defence", () => {
  const g = game(), s = g.ships[0], c0 = g.cash;
  assert.ok(buyCannon(g, s).ok); assert.equal(g.cash, c0 - CANNON_PRICE); assert.equal(defenceOf(s), 10);
  while (buyCannon(g, s).ok); assert.equal(s.cannons, maxCannons(s)); assert.equal(buyCannon(g, s).reason, "full");
  g.cash = 1; s.cannons = 0; assert.equal(buyCannon(g, s).reason, "no cash");
});
test("the weekly report shows crew wages and cannons as their own lines", () => {
  const g = game(), s = g.ships[0]; buyCannon(g, s);
  for (let d = 0; d < SETTLE_EVERY; d++) advanceDay(g);
  const l = g.reports[0].lines[0];
  assert.equal(l.cannons, SETTLE_EVERY * CANNON_UPKEEP);
  assert.ok(l.wages > 0);
  assert.ok(Math.abs(l.wages + l.cannons + l.hull - l.cost) < 0.02);
});
test("splitCost keeps the total", () => { const x = splitCost(14, 3.5); assert.ok(Math.abs(x.wages + x.cannons + x.hull - 14) < 0.02); });
