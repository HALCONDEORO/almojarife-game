// Boundary catalog (anti-failure idea 12): a setter validates its NORMALIZED value before
// touching state, and an invalid replacement never removes the previous entry.
// Pattern reference: setPriceAlert rounding fix (alerts.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, buyWarehouse } from "../src/game/game.mjs";
import { setStewardReserve, setStewardRule, stewardOf } from "../src/game/steward.mjs";
import { setRoute, setRouteAdv } from "../src/game/routes.mjs";
import { addInfamy, infamyOf } from "../src/game/pardon.mjs";
const world = loadWorld();
const mk = () => { const g = newGame(world); g.cash = 100000; assert.ok(buyWarehouse(g, "cadiz").ok); return g; };

test("setStewardReserve: a positive amount that floors to zero is rejected, previous reserve kept", () => {
  const g = mk();
  assert.ok(setStewardReserve(g, "cadiz", 7).ok);
  for (const amount of [0.1, 0.49, Number.MIN_VALUE]) {
    assert.deepEqual(setStewardReserve(g, "cadiz", amount), { ok: false, reason: "bad amount" });
    assert.equal(stewardOf(g, "cadiz").reserve, 7, "invalid replacement preserves the reserve");
  }
  assert.ok(setStewardReserve(g, "cadiz", 1.5).ok);
  assert.equal(stewardOf(g, "cadiz").reserve, 1, "stored normalized");
  assert.ok(setStewardReserve(g, "cadiz", 0).ok, "zero still clears the reserve");
  assert.equal(stewardOf(g, "cadiz").reserve, 0);
  assert.equal(setStewardReserve(g, "cadiz", NaN).ok, false);
  assert.equal(setStewardReserve(g, "cadiz", -3).ok, false);
});

test("setStewardRule: an invalid rule never removes the one in force", () => {
  const g = mk();
  assert.ok(setStewardRule(g, "cadiz", "grain", { buyBelow: 3, buyTo: 10 }).ok);
  const before = structuredClone(stewardOf(g, "cadiz").rules.grain);
  for (const rule of [{ buyBelow: -1 }, { buyTo: NaN }, { sellAbove: Infinity }]) {
    assert.equal(setStewardRule(g, "cadiz", "grain", rule).ok, false);
    assert.deepEqual(stewardOf(g, "cadiz").rules.grain, before, "rule in force untouched");
  }
  assert.equal(setStewardRule(g, "cadiz", "unobtainium", { buyBelow: 1, buyTo: 2 }).reason, "unknown good");
  assert.deepEqual(stewardOf(g, "cadiz").rules.grain, before);
});

test("setRoute: bad inputs leave the current route alone", () => {
  const g = mk();
  const s = g.ships[0];
  assert.ok(setRoute(g, s, "cadiz", "lisboa", "grain").ok);
  const before = structuredClone(s.route);
  for (const [a, b, out] of [["cadiz", "cadiz", "grain"], ["cadiz", "lisboa", "unobtainium"], ["nowhere", "lisboa", "grain"]]) {
    assert.equal(setRoute(g, s, a, b, out).ok, false);
    assert.deepEqual(s.route, before, "route in force untouched");
  }
});

test("addInfamy: non-finite input changes nothing", () => {
  const g = mk();
  addInfamy(g, 3);
  const before = infamyOf(g);
  addInfamy(g, NaN);
  assert.equal(infamyOf(g), before);
});

test("setStewardRule: legacy and unknown keys are dropped, never stored", () => {
  const g = mk();
  assert.ok(setStewardRule(g, "cadiz", "grain", { buyBelow: 3, buyTo: 10, note: "old UI", v: 1 }).ok);
  assert.deepEqual(Object.keys(stewardOf(g, "cadiz").rules.grain).sort(), ["buyBelow", "buyTo", "sellAbove", "sellKeep"], "only whitelisted keys stored");
  assert.ok(setStewardRule(g, "cadiz", "grain", null).ok, "null rule resets to defaults");
  assert.deepEqual(stewardOf(g, "cadiz").rules.grain, { buyBelow: 0, buyTo: 0, sellAbove: 0, sellKeep: 0 });
});

test("setRouteAdv: bad input never replaces the route in force; rule keys are whitelisted", () => {
  const g = mk();
  const s = g.ships[0];
  const stops = [
    { city: "cadiz", buy: [{ good: "grain", maxPrice: 5 }], sell: [] },
    { city: "lisboa", buy: [], sell: [{ good: "grain", minPrice: 2 }] },
  ];
  assert.ok(setRouteAdv(g, s, stops).ok);
  const before = structuredClone(s.route);
  assert.deepEqual(Object.keys(s.route.stops[0].buy[0]).sort(), ["good", "maxPrice", "minPrice"], "only whitelisted rule keys");
  for (const bad of [null, [stops[0]], [...stops, stops[1]], [{ city: "nowhere" }, stops[1]], [{ city: "cadiz", buy: [{ good: "grain", maxPrice: -1 }] }, stops[1]]]) {
    assert.equal(setRouteAdv(g, s, bad).ok, false);
    assert.deepEqual(s.route, before, "route in force untouched");
  }
  assert.equal(setRouteAdv(g, s, stops, { minCash: NaN }).ok, false);
  assert.deepEqual(s.route, before);
});
