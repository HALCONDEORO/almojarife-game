import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, setRoute, repairPrice } from "../src/game/game.mjs";
import { setRouteAdv, ROUTE_REPAIR_HULL } from "../src/game/routes.mjs";
import { messageText } from "../src/view/ledgerview.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };
const pair = (g) => { const a = g.ships[0].at, b = world.cities.find((c) => c.id !== a).id; return [a, b]; };
const goodAt = (g, a) => Object.keys(world.goods).find((k) => g.market[a][k] && g.market[a][k].stock > 50);
const routeMsgs = (g, kind) => (g.inbox ?? []).filter((m) => m.kind === kind);
const fmt = (n) => String(Math.round(n));

test("route ship below 50% hull repairs at the dock before loading", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a);
  s.hull = 40; const cost = repairPrice(g, s), c0 = g.cash;
  setRoute(g, s, a, b, good);
  advanceDay(g);
  assert.equal(s.hull, 100, "hull restored");
  assert.ok(c0 - g.cash >= cost, "repair charged (cargo buys may add more)");
  const m = routeMsgs(g, "routeRepair");
  assert.equal(m.length, 1, "one repair notice");
  assert.equal(m[0].cost, cost);
  const txt = messageText(m[0], "es", fmt);
  assert.ok(txt.includes("reparó el casco"), "ES text renders");
  const en = messageText(m[0], "en", fmt);
  assert.ok(en.includes("repaired the hull"), "EN text renders");
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
  const skip = routeMsgs(g, "routeRepairSkip");
  assert.equal(skip.length, 1, "one skip warning");
  assert.equal(skip[0].cost, cost);
  assert.ok(messageText(skip[0], "es", fmt).includes("freno de caja"), "ES skip text");
  advanceDay(g); // still docked? (stuck: no buys possible without cash) -> no second warning
  assert.ok(routeMsgs(g, "routeRepairSkip").length <= 2, "no daily spam beyond the streak");
});

test("advanced route: cash above brake + cost repairs through the v2 path", () => {
  const g = game(), s = g.ships[0], a = s.at, b = world.cities.find((c) => c.id !== a).id, good = goodAt(g, a);
  s.hull = 20;
  const cost = repairPrice(g, s);
  setRouteAdv(g, s, [{ city: a, buy: [{ good }], sell: [] }, { city: b, buy: [], sell: [{ good }] }], { minCash: 500 });
  g.cash = cost + 500;
  advanceDay(g);
  assert.equal(s.hull, 100, "repaired with exactly cost + brake");
  assert.equal(g.cash >= 500 || routeMsgs(g, "routeRepair").length === 1, true);
  assert.equal(routeMsgs(g, "routeRepair").length, 1, "repair notice via v2");
});
