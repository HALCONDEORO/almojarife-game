import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { tollFor, chargeToll, baseToll, tollsDue } from "../src/game/tolls.mjs";
import { addRespect } from "../src/game/rank.mjs";
import { dueNow, SETTLE_EVERY } from "../src/game/ledger.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };
test("toll depends on ship size and on respect in the port", () => {
  const g = game(), s = g.ships[0], b = baseToll(s);
  assert.equal(tollFor(g, s, "cadiz"), b);
  addRespect(g, "cadiz", 2000); assert.equal(tollFor(g, s, "cadiz"), b * 0.75);
  addRespect(g, "cadiz", 8000); assert.equal(tollFor(g, s, "cadiz"), b * 0.5);
  addRespect(g, "cadiz", 30000); assert.equal(tollFor(g, s, "cadiz"), 0);
});
test("tolls go into the weekly bill and show as their own report line", () => {
  const g = game(), s = g.ships[0]; chargeToll(g, s, "cadiz"); chargeToll(g, s, "sevilla");
  const t = tollsDue(g); assert.ok(t > 0); assert.ok(dueNow(g) >= t);
  g.day = SETTLE_EVERY - 1; const c0 = g.cash; advanceDay(g);
  const r = g.reports[0]; assert.equal(r.tolls, t); assert.ok(r.paid >= t); assert.equal(tollsDue(g), 0); assert.ok(g.cash <= c0 - t + 1e-9);
});
test("a ship that docks pays the toll", () => {
  const g = game(), s = g.ships[0], other = world.cities.find((c) => c.id !== s.at).id;
  s.voyage = { from: s.at, to: other, ticksLeft: 240, totalTicks: 240, path: [s.at, other], km: 1 };
  const before = tollsDue(g); advanceDay(g);
  assert.ok(tollsDue(g) > before);
});
import { netWorth } from "../src/game/game.mjs";
test("accrued tolls count against net worth until they are paid (exact)", () => {
  const g = game(), s = g.ships[0], w0 = netWorth(g);
  const t = chargeToll(g, s, "cadiz"); assert.ok(t > 0);
  assert.equal(Math.round((w0 - netWorth(g)) * 100) / 100, t);
});
