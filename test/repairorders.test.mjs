import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doSail, orderShip, sellShip, repairDamage, repairCost, repairPrice, repairQuote, orderRepair, processRepairs, cancelRepair, repairOf, repairDays, REPAIR_POINTS_PER_DAY, SHIP_TYPES } from "../src/game/game.mjs";
import { formConvoy, sailConvoy } from "../src/game/convoys.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const game = (cash = 20000) => { const g = newGame(world, "cadiz", {}); g.cash = cash; g.noGoal = true; return g; };
/** A second ship docked in the same port. */
const secondShip = (g, at) => { orderShip(g, "barca", at); for (let i = 0; i < SHIP_TYPES.barca.buildDays; i++) advanceDay(g); return g.ships[g.ships.length - 1]; };

test("the quote is a versioned snapshot: cost by damage and reputation, days from the slowest hull", () => {
  const g = game(), s = g.ships[0], b = secondShip(g, s.at);
  s.hull = 60; b.hull = 30; // 40 and 70 points of damage
  const q = repairQuote(g, [s.id, b.id], s.at);
  assert.equal(q.ok, true); assert.equal(q.v, 1); assert.equal(q.at, s.at);
  assert.deepEqual(q.ships, [s.id, b.id]);
  assert.equal(q.cost, repairPrice(g, s) + repairPrice(g, b));
  assert.equal(q.days, Math.ceil(70 / REPAIR_POINTS_PER_DAY), "the slowest member sets the days");
});

test("damage is clamped: INT_MIN reads as a total loss, a hull above 100 or NaN needs no repair", () => {
  const g = game(), s = g.ships[0];
  s.hull = -2147483648;
  assert.equal(repairDamage(s), 100); assert.equal(repairCost(s), 400); assert.equal(repairDays([s]), 4);
  s.hull = 150; assert.equal(repairDamage(s), 0);
  assert.equal(orderRepair(g, [s.id], s.at).reason, "no damage");
  s.hull = NaN; assert.equal(repairDamage(s), 0);
  assert.equal(orderRepair(g, [s.id], s.at).reason, "no damage");
});

test("the order revalidates the selection at execution", () => {
  const g = game(), s = g.ships[0], b = secondShip(g, s.at);
  s.hull = 50; b.hull = 50;
  assert.equal(orderRepair(g, [], s.at).reason, "no ships");
  assert.equal(orderRepair(g, [s.id, s.id], s.at).reason, "no ships");
  assert.equal(orderRepair(g, [999], s.at).reason, "unknown ship");
  const other = world.cities.find((c) => c.id !== s.at).id;
  assert.equal(orderRepair(g, [s.id], other).reason, "not in this port");
  b.voyage = { to: other, ticksLeft: 5 }; // selection changed between quote and order
  assert.equal(orderRepair(g, [s.id, b.id], s.at).reason, "at sea");
  delete b.voyage;
  s.hull = 100;
  assert.equal(orderRepair(g, [s.id, b.id], s.at).reason, "no damage");
});

test("exact cash buys the order, one coin short refuses it and charges nothing", () => {
  const g = game(), s = g.ships[0]; s.hull = 50;
  const cost = repairPrice(g, s);
  g.cash = cost - 1;
  assert.equal(orderRepair(g, [s.id], s.at).reason, "no cash");
  assert.equal(g.cash, cost - 1); assert.equal(repairOf(g, s.id), null);
  g.cash = cost;
  const r = orderRepair(g, [s.id], s.at);
  assert.equal(r.ok, true); assert.equal(r.cost, cost); assert.equal(g.cash, 0);
  assert.equal(orderRepair(g, [s.id], s.at).reason, "already in repair", "no double apply");
});

test("the yard delivers points a day per hull, clamps the last delivery and closes the order", () => {
  const g = game(), s = g.ships[0], b = secondShip(g, s.at);
  s.hull = 90; b.hull = 30; // 10 and 70 points
  const cost = repairPrice(g, s) + repairPrice(g, b), cash = g.cash;
  const r = orderRepair(g, [s.id, b.id], s.at);
  assert.equal(r.days, 3); assert.equal(g.cash, cash - cost, "charged once, up front");
  const cashAfterCharge = g.cash;
  processRepairs(g); // day 1: 90->100 (clamped: 10, not 25) and 30->55
  assert.equal(s.hull, 100); assert.equal(b.hull, 55);
  const o = repairOf(g, b.id);
  assert.equal(o.left, 45, "only the delivered points leave the order");
  assert.equal(repairOf(g, s.id), o, "one member finished, the order is still open");
  processRepairs(g); assert.equal(b.hull, 80);
  processRepairs(g); assert.equal(b.hull, 100);
  assert.equal(repairOf(g, b.id), null, "the order closes when every hull is sound");
  assert.equal(g.cash, cashAfterCharge, "progress never moves money");
  assert.ok((g.inbox ?? []).some((m) => m.kind === "repairDone" && m.orderId === r.id), "completion notice posted");
});

test("cancellation refunds the undelivered share and frees the ships", () => {
  const g = game(), s = g.ships[0]; s.hull = 0; // 100 points, 4 days
  const cost = repairPrice(g, s), cash = g.cash;
  const r1 = orderRepair(g, [s.id], s.at);
  const c1 = cancelRepair(g, r1.id); // nothing delivered yet: full refund
  assert.equal(c1.ok, true); assert.equal(c1.refund, cost); assert.equal(g.cash, cash);
  assert.equal(repairOf(g, s.id), null);
  assert.equal(cancelRepair(g, r1.id).reason, "no order", "a closed order cannot be cancelled twice");
  orderRepair(g, [s.id], s.at);
  const o = repairOf(g, s.id), oid = o.id;
  processRepairs(g); // 25 of 100 delivered
  const cashBefore = g.cash, expected = Math.floor((o.cost * 75) / 100);
  const c2 = cancelRepair(g, oid);
  assert.equal(c2.refund, expected); assert.equal(g.cash, cashBefore + expected);
  assert.equal(s.hull, 25, "delivered work stays");
});

test("a ship under repair cannot sail, cannot be sold, and holds its convoy in port", () => {
  const g = game(), s = g.ships[0], b = secondShip(g, s.at);
  s.hull = 40; b.hull = 100;
  orderRepair(g, [s.id], s.at);
  const other = world.cities.find((c) => c.id !== s.at).id;
  assert.equal(doSail(g, s, other).reason, "in repair");
  assert.equal(sellShip(g, s).reason, "in repair");
  const cv = formConvoy(g, [s.id, b.id]).convoy;
  assert.equal(sailConvoy(g, cv.id, other, { doSail, inRepair: (x) => repairOf(g, x.id) }).reason, "in repair");
  assert.ok(!s.voyage && !b.voyage, "nobody left");
  for (let i = 0; i < 3; i++) processRepairs(g); // 60 points: 3 days
  assert.equal(s.hull, 100); assert.equal(repairOf(g, s.id), null);
  assert.equal(doSail(g, s, other).ok, true, "free to sail once the yard delivers");
});

test("an old save without repairs loads, and a pending order survives save/load", () => {
  const g = game(), s = g.ships[0]; s.hull = 10; // 90 points, 4 days
  const r = orderRepair(g, [s.id], s.at);
  const save = serialize(g, "test");
  delete save.state.repairs; delete save.state.nextRepairId; // as written before this feature
  const g2 = deserialize(save, world).g;
  assert.equal(g2.repairs, undefined, "no fabricated queue");
  assert.equal(orderRepair(g2, [g2.ships[0].id], g2.ships[0].at).id, 1, "ids start clean");
  const g3 = deserialize(serialize(g, "test"), world).g;
  const o3 = repairOf(g3, g3.ships[0].id);
  assert.ok(o3 && o3.id === r.id && o3.left === o3.total, "the pending order rides the save");
  processRepairs(g3);
  assert.equal(g3.ships[0].hull, 35, "progress continues after loading");
});

test("advanceDay moves the yard once a day and a finished order frees the ship that evening", () => {
  const g = game(), s = g.ships[0]; s.hull = 75; // 25 points: one day
  orderRepair(g, [s.id], s.at);
  advanceDay(g);
  assert.equal(s.hull, 100); assert.equal(repairOf(g, s.id), null);
  assert.ok((g.inbox ?? []).some((m) => m.kind === "repairDone"), "the feed says so");
});
