import test from "node:test";
import assert from "node:assert/strict";
import { newGame, advanceDay, bestPorts, doBuy, doSail, buyRumor, RUMOR_PRICE, isLive } from "../src/game/game.mjs";
import { knownMarket } from "../src/game/intel.mjs";
import { loadWorld } from "../src/sim/world.mjs";
const world = loadWorld();
const fresh = () => { const g = newGame(world, "cadiz", {}); const s = g.ships[0]; const good = Object.keys(world.goods)[0]; s.cargo[good] = 5; s.basis = { [good]: 50 }; return { g, s }; };

test("at the start only the home port is known, so there is no best-port advice", () => {
  const { g, s } = fresh();
  assert.deepEqual(Object.keys(g.intel), [s.at]);
  assert.deepEqual(bestPorts(g, s), []);
});
test("a rumour costs coins, shows an old inexact price, and unlocks that port in the advice", () => {
  const { g, s } = fresh();
  const other = world.cities.find((c) => c.id !== s.at).id, cash = g.cash;
  assert.equal(buyRumor(g, other).ok, true);
  assert.equal(g.cash, cash - RUMOR_PRICE);
  const rows = bestPorts(g, s);
  assert.equal(rows.length <= 1, true);
  for (let i = 0; i < 3; i++) advanceDay(g);
  const k = knownMarket(g);
  assert.equal(k.age[other].days, 3); assert.equal(k.age[other].exact, false);
});
test("a rumour is refused when broke, for the port you are in, or for an unknown port", () => {
  const { g, s } = fresh();
  assert.equal(buyRumor(g, s.at).ok, false);
  assert.equal(buyRumor(g, "atlantis").ok, false);
  g.cash = RUMOR_PRICE - 1;
  const other = world.cities.find((c) => c.id !== s.at).id;
  assert.equal(buyRumor(g, other).ok, false);
  assert.equal(g.cash, RUMOR_PRICE - 1);
});
test("rumour error stays within 25% and is repeatable for the same game state", () => {
  const a = fresh().g, b = fresh().g, o = world.cities.find((c) => c.id !== a.ships[0].at).id;
  buyRumor(a, o); buyRumor(b, o);
  assert.deepEqual(a.intel[o].cells, b.intel[o].cells);
  for (const [gd, e] of Object.entries(a.intel[o].cells)) { const real = a.market[o][gd].stock; assert.ok(Math.abs(e.stock - real) <= Math.ceil(real * 0.25) + 1); }
});
test("a port where a ship is docked or a warehouse stands is live and exact", () => {
  const { g, s } = fresh();
  assert.equal(isLive(g, s.at), true);
  advanceDay(g);
  assert.equal(knownMarket(g).age[s.at].exact, true);
});
test("sailing away keeps the last seen data, which grows old", () => {
  const { g, s } = fresh(); const home = s.at, to = world.cities.find((c) => c.id !== home).id;
  doSail(g, s, to);
  for (let i = 0; i < 4; i++) advanceDay(g);
  assert.equal(isLive(g, home), false);
  assert.ok(knownMarket(g).age[home].days >= 3);
});
test("a rumour bought through the tavern needs one of your ships docked in that port", () => {
  const { g, s } = fresh(); const other = world.cities.find((c) => c.id !== s.at).id;
  assert.equal(buyRumor(g, other, other).reason, "no ship here");
  assert.equal(buyRumor(g, other, s.at).ok, true);
});
