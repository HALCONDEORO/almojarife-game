import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doSail, orderShip, sellShip, repairDamage, repairCost, repairPrice, repairQuote, orderRepair, processRepairs, cancelRepair, repairOf, repairDays, REPAIR_POINTS_PER_DAY, SHIP_TYPES } from "../src/game/game.mjs";
import { formConvoy, sailConvoy } from "../src/game/convoys.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const mkGame = (cash = 20000) => { const game = newGame(world, "cadiz", {}); game.cash = cash; game.noGoal = true; return game; };
/** A second ship docked in the same port. */
const secondShip = (game, at) => { orderShip(game, "barca", at); for (let idx = 0; idx < SHIP_TYPES.barca.buildDays; idx++) advanceDay(game); return game.ships[game.ships.length - 1]; };

test("the quote is a versioned snapshot: cost by damage and reputation, days from the slowest hull", () => {
  const game = mkGame(), ship = game.ships[0], mate = secondShip(game, ship.at);
  ship.hull = 60; mate.hull = 30; // 40 and 70 points of damage
  const quote1 = repairQuote(game, [ship.id, mate.id], ship.at);
  assert.equal(quote1.ok, true); assert.equal(quote1.v, 1); assert.equal(quote1.at, ship.at);
  assert.deepEqual(quote1.ships, [ship.id, mate.id]);
  assert.equal(quote1.cost, repairPrice(game, ship) + repairPrice(game, mate));
  assert.equal(quote1.days, Math.ceil(70 / REPAIR_POINTS_PER_DAY), "the slowest member sets the days");
});

test("damage is clamped: INT_MIN reads as a total loss, a hull above 100 or NaN needs no repair", () => {
  const game = mkGame(), ship = game.ships[0];
  ship.hull = -2147483648;
  assert.equal(repairDamage(ship), 100); assert.equal(repairCost(ship), 400); assert.equal(repairDays([ship]), 4);
  ship.hull = 150; assert.equal(repairDamage(ship), 0);
  assert.equal(orderRepair(game, [ship.id], ship.at).reason, "no damage");
  ship.hull = NaN; assert.equal(repairDamage(ship), 0);
  assert.equal(orderRepair(game, [ship.id], ship.at).reason, "no damage");
});

test("the order revalidates the selection at execution", () => {
  const game = mkGame(), ship = game.ships[0], mate = secondShip(game, ship.at);
  ship.hull = 50; mate.hull = 50;
  assert.equal(orderRepair(game, [], ship.at).reason, "no ships");
  assert.equal(orderRepair(game, [ship.id, ship.id], ship.at).reason, "no ships");
  assert.equal(orderRepair(game, [999], ship.at).reason, "unknown ship");
  const other = world.cities.find((costB) => costB.id !== ship.at).id;
  assert.equal(orderRepair(game, [ship.id], other).reason, "not in this port");
  mate.voyage = { to: other, ticksLeft: 5 }; // selection changed between quote and order
  assert.equal(orderRepair(game, [ship.id, mate.id], ship.at).reason, "at sea");
  delete mate.voyage;
  ship.hull = 100;
  assert.equal(orderRepair(game, [ship.id, mate.id], ship.at).reason, "no damage");
});

test("exact cash buys the order, one coin short refuses it and charges nothing", () => {
  const game = mkGame(), ship = game.ships[0]; ship.hull = 50;
  const cost = repairPrice(game, ship);
  game.cash = cost - 1;
  assert.equal(orderRepair(game, [ship.id], ship.at).reason, "no cash");
  assert.equal(game.cash, cost - 1); assert.equal(repairOf(game, ship.id), null);
  game.cash = cost;
  const ord1 = orderRepair(game, [ship.id], ship.at);
  assert.equal(ord1.ok, true); assert.equal(ord1.cost, cost); assert.equal(game.cash, 0);
  assert.equal(orderRepair(game, [ship.id], ship.at).reason, "already in repair", "no double apply");
});

test("the yard delivers points a day per hull, clamps the last delivery and closes the order", () => {
  const game = mkGame(), ship = game.ships[0], mate = secondShip(game, ship.at);
  ship.hull = 90; mate.hull = 30; // 10 and 70 points
  const cost = repairPrice(game, ship) + repairPrice(game, mate), cash = game.cash;
  const ord1 = orderRepair(game, [ship.id, mate.id], ship.at);
  assert.equal(ord1.days, 3); assert.equal(game.cash, cash - cost, "charged once, up front");
  const cashAfterCharge = game.cash;
  processRepairs(game); // day 1: 90->100 (clamped: 10, not 25) and 30->55
  assert.equal(ship.hull, 100); assert.equal(mate.hull, 55);
  const ord = repairOf(game, mate.id);
  assert.equal(ord.left, 45, "only the delivered points leave the order");
  assert.equal(repairOf(game, ship.id), ord, "one member finished, the order is still open");
  processRepairs(game); assert.equal(mate.hull, 80);
  processRepairs(game); assert.equal(mate.hull, 100);
  assert.equal(repairOf(game, mate.id), null, "the order closes when every hull is sound");
  assert.equal(game.cash, cashAfterCharge, "progress never moves money");
  assert.ok((game.inbox ?? []).some((m) => m.kind === "repairDone" && m.orderId === ord1.id), "completion notice posted");
});

test("cancellation refunds the undelivered share and frees the ships", () => {
  const game = mkGame(), ship = game.ships[0]; ship.hull = 0; // 100 points, 4 days
  const cost = repairPrice(game, ship), cash = game.cash;
  const r1 = orderRepair(game, [ship.id], ship.at);
  const c1 = cancelRepair(game, r1.id); // nothing delivered yet: full refund
  assert.equal(c1.ok, true); assert.equal(c1.refund, cost); assert.equal(game.cash, cash);
  assert.equal(repairOf(game, ship.id), null);
  assert.equal(cancelRepair(game, r1.id).reason, "no order", "a closed order cannot be cancelled twice");
  orderRepair(game, [ship.id], ship.at);
  const ord = repairOf(game, ship.id), oid = ord.id;
  processRepairs(game); // 25 of 100 delivered
  const cashBefore = game.cash, expected = Math.floor((ord.cost * 75) / 100);
  const c2 = cancelRepair(game, oid);
  assert.equal(c2.refund, expected); assert.equal(game.cash, cashBefore + expected);
  assert.equal(ship.hull, 25, "delivered work stays");
});

test("a ship under repair cannot sail, cannot be sold, and holds its convoy in port", () => {
  const game = mkGame(), ship = game.ships[0], mate = secondShip(game, ship.at);
  ship.hull = 40; mate.hull = 100;
  orderRepair(game, [ship.id], ship.at);
  const other = world.cities.find((costB) => costB.id !== ship.at).id;
  assert.equal(doSail(game, ship, other).reason, "in repair");
  assert.equal(sellShip(game, ship).reason, "in repair");
  const conv = formConvoy(game, [ship.id, mate.id]).convoy;
  assert.equal(sailConvoy(game, conv.id, other, { doSail, inRepair: (sh) => repairOf(game, sh.id) }).reason, "in repair");
  assert.ok(!ship.voyage && !mate.voyage, "nobody left");
  for (let idx = 0; idx < 3; idx++) processRepairs(game); // 60 points: 3 days
  assert.equal(ship.hull, 100); assert.equal(repairOf(game, ship.id), null);
  assert.equal(doSail(game, ship, other).ok, true, "free to sail once the yard delivers");
});

test("an old save without repairs loads, and a pending order survives save/load", () => {
  const game = mkGame(), ship = game.ships[0]; ship.hull = 10; // 90 points, 4 days
  const ord1 = orderRepair(game, [ship.id], ship.at);
  const save = serialize(game, "test");
  delete save.state.repairs; delete save.state.nextRepairId; // as written before this feature
  const loaded = deserialize(save, world).g;
  assert.equal(loaded.repairs, undefined, "no fabricated queue");
  assert.equal(orderRepair(loaded, [loaded.ships[0].id], loaded.ships[0].at).id, 1, "ids start clean");
  const round = deserialize(serialize(game, "test"), world).g;
  const o3 = repairOf(round, round.ships[0].id);
  assert.ok(o3 && o3.id === ord1.id && o3.left === o3.total, "the pending order rides the save");
  processRepairs(round);
  assert.equal(round.ships[0].hull, 35, "progress continues after loading");
});

test("advanceDay moves the yard once a day and a finished order frees the ship that evening", () => {
  const game = mkGame(), ship = game.ships[0]; ship.hull = 75; // 25 points: one day
  orderRepair(game, [ship.id], ship.at);
  advanceDay(game);
  assert.equal(ship.hull, 100); assert.equal(repairOf(game, ship.id), null);
  assert.ok((game.inbox ?? []).some((m) => m.kind === "repairDone"), "the feed says so");
});

test("a wrecked hull (INT_MIN) is normalized at execution: full delivery closes the order and frees the ship", () => {
  const game = mkGame(), ship = game.ships[0];
  ship.hull = -2147483648; // foreign extreme: the quote already prices it as a total loss (100 points, 400 coins, 4 days)
  const res = orderRepair(game, [ship.id], ship.at);
  assert.equal(res.ok, true); assert.equal(res.days, 4); assert.equal(res.cost, repairPrice(game, ship));
  assert.equal(ship.hull, 0, "the yard stabilizes the wreck before working");
  for (let idx = 0; idx < 3; idx++) processRepairs(game);
  assert.equal(ship.hull, 75); assert.notEqual(repairOf(game, ship.id), null, "still in the yard with work left");
  processRepairs(game);
  assert.equal(ship.hull, 100); assert.equal(repairOf(game, ship.id), null, "the order closes and the ship is free");
  const other = world.cities.find((city) => city.id !== ship.at).id;
  assert.equal(doSail(game, ship, other).ok, true, "sails after full delivery");
});

test("cancelling a wrecked hull (INT_MIN) mid-work refunds the undelivered share and keeps delivered points", () => {
  const game = mkGame(), ship = game.ships[0];
  ship.hull = -2147483648;
  const cash0 = game.cash, res = orderRepair(game, [ship.id], ship.at);
  assert.equal(res.ok, true);
  processRepairs(game); processRepairs(game); // two deliveries: 50 points
  assert.equal(ship.hull, 50);
  const ord = repairOf(game, ship.id);
  const cancel = cancelRepair(game, ord.id);
  const expected = Math.floor((res.cost * 50) / 100);
  assert.equal(cancel.ok, true); assert.equal(cancel.refund, expected);
  assert.equal(game.cash, cash0 - res.cost + expected);
  assert.equal(ship.hull, 50, "delivered work stays");
  assert.equal(repairOf(game, ship.id), null, "the ship is free again");
});

test("the web sail call shape (no inRepair op) cannot split a convoy: every member is checked before any leaves", () => {
  const game = mkGame(), ship = game.ships[0], mate = secondShip(game, ship.at);
  mate.hull = 100; // the healthy member sails first in cv order
  ship.hull = 40;
  orderRepair(game, [ship.id], ship.at); // the damaged member is in the yard
  const conv = formConvoy(game, [mate.id, ship.id]).convoy; // healthy first, repair member after
  const other = world.cities.find((city) => city.id !== ship.at).id;
  const res = sailConvoy(game, conv.id, other, { doSail }); // the exact call web/main.mjs sailToTarget makes
  assert.equal(res.ok, false); assert.equal(res.reason, "in repair");
  assert.ok(!mate.voyage && !ship.voyage, "no partial departure: nobody left");
  assert.ok(game.convoys[conv.id], "the convoy still exists");
});
