import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, doSell, doSail, waitUntilArrival } from "../src/game/game.mjs";
import { voyageLog, bestVoyage, recordSale, openVoyage } from "../src/game/voyages.mjs";
const world = loadWorld();
test("a voyage is logged and its sales add up", () => {
  const g = newGame(world); g.eventsOn = false; const s = g.ships[0];
  const good = Object.keys(world.goods)[0];
  assert.equal(doBuy(g, s, good, 10).ok, true);
  const to = world.cities.find((c) => c.id !== s.at).id;
  assert.equal(doSail(g, s, to).ok, true);
  assert.equal(voyageLog(g).length, 1); assert.equal(voyageLog(g)[0].to, to);
  waitUntilArrival(g, s);
  const r = doSell(g, s, good, 10);
  const v = voyageLog(g, s.id)[0];
  if (r.ok) { assert.equal(v.sold, r.qty); assert.ok(Math.abs(v.revenue - r.revenue) < 0.01); }
  assert.equal(bestVoyage(g), v);
});
test("old saves and unknown ships do not break", () => {
  const g = { }; assert.deepEqual(voyageLog(g), []); assert.equal(bestVoyage(g), null);
  assert.equal(recordSale(g, { id: 9 }, 1, 1, 1), false);
});
test("the cap is 40 voyages per ship, so a busy ship does not push out another", () => {
  const g = { day: 1 };
  openVoyage(g, { id: 2 }, "a", "b");
  for (let i = 0; i < 50; i++) openVoyage(g, { id: 1 }, "a", "b");
  assert.equal(voyageLog(g, 1).length, 40); assert.equal(voyageLog(g, 2).length, 1);
});
