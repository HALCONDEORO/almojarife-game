import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, setRoute, repairPrice, repairOf } from "../src/game/game.mjs";
import { setRouteAdv, ROUTE_REPAIR_HULL } from "../src/game/routes.mjs";
import { messageText } from "../src/view/ledgerview.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; g.noGoal = true; return g; };
const pair = (g) => { const a = g.ships[0].at, b = world.cities.find((c) => c.id !== a).id; return [a, b]; };
const goodAt = (g, a) => Object.keys(world.goods).find((k) => g.market[a][k] && g.market[a][k].stock > 50);
const routeMsgs = (g, kind) => (g.inbox ?? []).filter((m) => m.kind === kind);
const fmt = (n) => String(Math.round(n));

test("route ship below 50% hull orders a repair at the dock and waits for the yard", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a);
  s.hull = 40; const cost = repairPrice(g, s), c0 = g.cash;
  setRoute(g, s, a, b, good);
  advanceDay(g);
  const o = repairOf(g, s.id);
  assert.ok(o, "the route placed a repair order instead of sailing");
  assert.equal(o.cost, cost); assert.equal(o.days, 3); // 60 points at 25/day
  assert.ok(c0 - g.cash >= cost, "repair charged (cargo buys may add more)");
  assert.ok(!s.voyage, "the ship waits in port");
  const m = routeMsgs(g, "routeRepair");
  assert.equal(m.length, 1, "one repair notice");
  assert.equal(m[0].cost, cost); assert.equal(m[0].days, 3);
  const txt = messageText(m[0], "es", fmt);
  assert.ok(txt.includes("encargó reparar el casco"), "ES text renders");
  const en = messageText(m[0], "en", fmt);
  assert.ok(en.includes("ordered a hull repair"), "EN text renders");
  advanceDay(g);
  assert.ok(!s.voyage && repairOf(g, s.id), "still in the yard on day two, not sailing");
  assert.equal(Object.keys(s.cargo).length, 0, "no trading while the ship is in the yard");
  assert.equal(routeMsgs(g, "routeRepair").length, 1, "no second order while one is open");
  advanceDay(g);
  assert.equal(s.hull, 100); assert.equal(repairOf(g, s.id), null, "yard done on day three");
  assert.ok(routeMsgs(g, "repairDone").length >= 1, "completion notice");
  advanceDay(g);
  assert.ok(s.voyage || repairOf(g, s.id) === null, "the route resumes once the ship is free");
});

test("route ship at or above the threshold is left alone", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a);
  s.hull = ROUTE_REPAIR_HULL;
  setRoute(g, s, a, b, good);
  const c0 = g.cash;
  advanceDay(g);
  assert.equal(s.hull, ROUTE_REPAIR_HULL, "no repair at 50%");
  assert.equal(routeMsgs(g, "routeRepair").length, 0);
  assert.equal(routeMsgs(g, "routeRepairSkip").length, 0);
});

test("advanced route: the cash brake blocks the repair and the feed warns once", () => {
  const g = game(), s = g.ships[0], a = s.at, b = world.cities.find((c) => c.id !== a).id, good = goodAt(g, a);
  s.hull = 30;
  const cost = repairPrice(g, s);
  setRouteAdv(g, s, [{ city: a, buy: [{ good }], sell: [] }, { city: b, buy: [], sell: [{ good }] }], { minCash: 1000 });
  g.cash = cost + 999; // one short of cost + brake
  advanceDay(g);
  assert.equal(s.hull, 30, "not repaired: brake does not cover it");
  assert.equal(repairOf(g, s.id), null, "no order without the cash");
  const skip = routeMsgs(g, "routeRepairSkip");
  assert.equal(skip.length, 1, "one skip warning");
  assert.equal(skip[0].cost, cost);
  assert.ok(messageText(skip[0], "es", fmt).includes("freno de caja"), "ES skip text");
  advanceDay(g); // still docked? (stuck: no buys possible without cash) -> no second warning
  assert.ok(routeMsgs(g, "routeRepairSkip").length <= 2, "no daily spam beyond the streak");
});

test("advanced route: cash above brake + cost orders the repair through the v2 path", () => {
  const g = game(), s = g.ships[0], a = s.at, b = world.cities.find((c) => c.id !== a).id, good = goodAt(g, a);
  s.hull = 20;
  const cost = repairPrice(g, s);
  setRouteAdv(g, s, [{ city: a, buy: [{ good }], sell: [] }, { city: b, buy: [], sell: [{ good }] }], { minCash: 500 });
  g.cash = cost + 500;
  advanceDay(g);
  const o = repairOf(g, s.id);
  assert.ok(o, "repair ordered with exactly cost + brake");
  assert.equal(o.cost, cost);
  assert.equal(routeMsgs(g, "routeRepair").length, 1, "repair notice via v2");
  for (let i = 0; i < 5 && s.hull < 100; i++) advanceDay(g);
  assert.equal(s.hull, 100); assert.equal(repairOf(g, s.id), null);
});
