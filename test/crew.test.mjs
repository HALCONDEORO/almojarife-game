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
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { accrueDay } from "../src/game/ledger.mjs";
test("a v1 save without cannons or the cannon book settles and shows no cannon cost", () => {
  const g = game(); delete g.ships[0].cannons; delete g.accrued;
  const back = deserialize(JSON.parse(JSON.stringify(serialize(g, "X"))), world).g;
  for (let d = 0; d < SETTLE_EVERY; d++) advanceDay(back);
  const l = back.reports[0].lines[0]; assert.equal(l.cannons, 0); assert.ok(l.wages > 0); assert.ok(Math.abs(l.wages + l.hull - l.cost) < 0.02);
});
test("with negative cash a cannon cannot be bought and cash is not touched", () => {
  const g = game(); g.cash = -50; const r = buyCannon(g, g.ships[0]);
  assert.equal(r.ok, false); assert.equal(r.reason, "no cash"); assert.equal(g.cash, -50); assert.equal(g.ships[0].cannons ?? 0, 0);
});
test("a cannon bought mid-week only costs upkeep for the days after the purchase", () => {
  const g = game(), s = g.ships[0];
  for (let d = 0; d < 3; d++) advanceDay(g);
  buyCannon(g, s);
  for (let d = 3; d < SETTLE_EVERY; d++) advanceDay(g);
  const l = g.reports[0].lines[0];
  assert.equal(l.cannons, (SETTLE_EVERY - 3) * CANNON_UPKEEP);
  assert.ok(Math.abs(l.wages + l.cannons + l.hull - l.cost) < 0.02);
});
test("crew wages never exceed the hull-and-crew base and cannon cost is not part of wages", () => {
  const x = splitCost(10, 4); assert.ok(x.wages <= 6 * 0.6 + 0.01); assert.equal(splitCost(0, 0).wages, 0); assert.ok(splitCost(3, 5).wages >= 0);
});
import { gunCond, gunRepairCost, repairGuns, wearGunsBy, GUN_WEAR_PER_DAY, GUN_REPAIR_SHARE } from "../src/game/crew.mjs";
test("armament condition: old saves count as 100%, it wears at sea, defence follows it", () => {
  const g = game(), s = g.ships[0]; assert.equal(gunCond(s), 100);
  s.gunCond = "bad"; assert.equal(gunCond(s), 100); s.gunCond = 250; assert.equal(gunCond(s), 100); delete s.gunCond;
  buyCannon(g, s); const other = world.cities.find((c) => c.id !== s.at).id;
  s.voyage = { from: s.at, to: other, ticksLeft: 1200, totalTicks: 1200, path: [s.at, other], km: 1 };
  advanceDay(g); assert.ok(Math.abs(gunCond(s) - (100 - GUN_WEAR_PER_DAY)) < 1e-9);
  assert.equal(defenceOf(s), Math.round(10 * gunCond(s) / 100));
});
test("repairing the armament at port costs in proportion to damage and cannons", () => {
  const g = game(), s = g.ships[0]; buyCannon(g, s); buyCannon(g, s);
  assert.equal(repairGuns(g, s).reason, "no damage");
  wearGunsBy(s, 50); assert.equal(gunCond(s), 50);
  assert.equal(gunRepairCost(s), 2 * CANNON_PRICE * GUN_REPAIR_SHARE * 0.5);
  const c0 = g.cash, cost = gunRepairCost(s); assert.ok(repairGuns(g, s).ok); assert.equal(g.cash, c0 - cost); assert.equal(gunCond(s), 100);
  wearGunsBy(s, 50); g.cash = 1; assert.equal(repairGuns(g, s).reason, "no cash");
  s.voyage = { from: "a", to: "b", ticksLeft: 480, totalTicks: 480, path: [], km: 1 }; g.cash = 1e5; assert.equal(repairGuns(g, s).reason, "at sea");
});
test("a ship without cannons does not wear and a new cannon mixes into the condition", () => {
  const g = game(), s = g.ships[0]; wearGunsBy(s, 30); assert.equal(gunCond(s), 100);
  buyCannon(g, s); wearGunsBy(s, 40); buyCannon(g, s); assert.equal(gunCond(s), (60 + 100) / 2);
});
test("wear never raises armament condition: below the 10% floor it stays, at the floor it stays, above it falls to at least 10", () => {
  const mk = (c) => ({ type: "cog", cannons: 2, gunCond: c });
  const a = mk(0); wearGunsBy(a, 0.4); assert.equal(a.gunCond, 0);
  const b = mk(5); wearGunsBy(b, 3); assert.equal(b.gunCond, 5);
  const c = mk(10); wearGunsBy(c, 1); assert.equal(c.gunCond, 10);
  const d = mk(10.2); wearGunsBy(d, 5); assert.equal(d.gunCond, 10);
  const e = mk(80); wearGunsBy(e, 5); assert.equal(e.gunCond, 75);
});
