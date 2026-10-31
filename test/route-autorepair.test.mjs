import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, setRoute, repairPrice, repairOf } from "../src/game/game.mjs";
import { setRouteAdv, ROUTE_REPAIR_HULL } from "../src/game/routes.mjs";
import { messageText } from "../src/view/ledgerview.mjs";
const world = loadWorld();
const mkGame = () => { const game = newGame(world); game.eventsOn = false; game.noGoal = true; return game; };
const pair = (game) => { const portA = game.ships[0].at, portB = world.cities.find((city) => city.id !== portA).id; return [portA, portB]; };
const goodAt = (game, portA) => Object.keys(world.goods).find((k) => game.market[portA][k] && game.market[portA][k].stock > 50);
const routeMsgs = (game, kind) => (game.inbox ?? []).filter((msgs) => msgs.kind === kind);
const fmt = (n) => String(Math.round(n));

test("route ship below 50% hull orders a repair at the dock and waits for the yard", () => {
  const game = mkGame(), ship = game.ships[0], [portA, portB] = pair(game), good = goodAt(game, portA);
  ship.hull = 40; const cost = repairPrice(game, ship), c0 = game.cash;
  setRoute(game, ship, portA, portB, good);
  advanceDay(game);
  const ord = repairOf(game, ship.id);
  assert.ok(ord, "the route placed a repair order instead of sailing");
  assert.equal(ord.cost, cost); assert.equal(ord.days, 3); // 60 points at 25/day
  assert.ok(c0 - game.cash >= cost, "repair charged (cargo buys may add more)");
  assert.ok(!ship.voyage, "the ship waits in port");
  const msgs = routeMsgs(game, "routeRepair");
  assert.equal(msgs.length, 1, "one repair notice");
  assert.equal(msgs[0].cost, cost); assert.equal(msgs[0].days, 3);
  const txt = messageText(msgs[0], "es", fmt);
  assert.ok(txt.includes("encargó reparar el casco"), "ES text renders");
  const enText = messageText(msgs[0], "en", fmt);
  assert.ok(enText.includes("ordered a hull repair"), "EN text renders");
  advanceDay(game);
  assert.ok(!ship.voyage && repairOf(game, ship.id), "still in the yard on day two, not sailing");
  assert.equal(Object.keys(ship.cargo).length, 0, "no trading while the ship is in the yard");
  assert.equal(routeMsgs(game, "routeRepair").length, 1, "no second order while one is open");
  advanceDay(game);
  assert.equal(ship.hull, 100); assert.equal(repairOf(game, ship.id), null, "yard done on day three");
  assert.ok(routeMsgs(game, "repairDone").length >= 1, "completion notice");
  advanceDay(game);
  assert.ok(ship.voyage || repairOf(game, ship.id) === null, "the route resumes once the ship is free");
});

test("route ship at or above the threshold is left alone", () => {
  const game = mkGame(), ship = game.ships[0], [portA, portB] = pair(game), good = goodAt(game, portA);
  ship.hull = ROUTE_REPAIR_HULL;
  setRoute(game, ship, portA, portB, good);
  const c0 = game.cash;
  advanceDay(game);
  assert.equal(ship.hull, ROUTE_REPAIR_HULL, "no repair at 50%");
  assert.equal(routeMsgs(game, "routeRepair").length, 0);
  assert.equal(routeMsgs(game, "routeRepairSkip").length, 0);
});

test("advanced route: the cash brake blocks the repair and the feed warns once", () => {
  const game = mkGame(), ship = game.ships[0], portA = ship.at, portB = world.cities.find((city) => city.id !== portA).id, good = goodAt(game, portA);
  ship.hull = 30;
  const cost = repairPrice(game, ship);
  setRouteAdv(game, ship, [{ city: portA, buy: [{ good }], sell: [] }, { city: portB, buy: [], sell: [{ good }] }], { minCash: 1000 });
  game.cash = cost + 999; // one short of cost + brake
  advanceDay(game);
  assert.equal(ship.hull, 30, "not repaired: brake does not cover it");
  assert.equal(repairOf(game, ship.id), null, "no order without the cash");
  const skip = routeMsgs(game, "routeRepairSkip");
  assert.equal(skip.length, 1, "one skip warning");
  assert.equal(skip[0].cost, cost);
  assert.ok(messageText(skip[0], "es", fmt).includes("freno de caja"), "ES skip text");
  advanceDay(game); // still docked? (stuck: no buys possible without cash) -> no second warning
  assert.ok(routeMsgs(game, "routeRepairSkip").length <= 2, "no daily spam beyond the streak");
});

test("advanced route: cash above brake + cost orders the repair through the v2 path", () => {
  const game = mkGame(), ship = game.ships[0], portA = ship.at, portB = world.cities.find((city) => city.id !== portA).id, good = goodAt(game, portA);
  ship.hull = 20;
  const cost = repairPrice(game, ship);
  setRouteAdv(game, ship, [{ city: portA, buy: [{ good }], sell: [] }, { city: portB, buy: [], sell: [{ good }] }], { minCash: 500 });
  game.cash = cost + 500;
  advanceDay(game);
  const ord = repairOf(game, ship.id);
  assert.ok(ord, "repair ordered with exactly cost + brake");
  assert.equal(ord.cost, cost);
  assert.equal(routeMsgs(game, "routeRepair").length, 1, "repair notice via v2");
  for (let idx = 0; idx < 5 && ship.hull < 100; idx++) advanceDay(game);
  assert.equal(ship.hull, 100); assert.equal(repairOf(game, ship.id), null);
});
