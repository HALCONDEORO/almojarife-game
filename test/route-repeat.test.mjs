import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, setRoute, setRouteAdv, clearRoute, repeatRoute, routeStats } from "../src/game/game.mjs";
import { cashCardHtml } from "../src/view/cashcard.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };
const pair = (g) => { const a = g.ships[0].at, b = world.cities.find((c) => c.id !== a).id; return [a, b]; };
const goodAt = (g, a) => Object.keys(world.goods).find((k) => g.market[a][k] && g.market[a][k].stock > 50);

test("clearing a route remembers it; repeat brings it back with counters from zero", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a);
  assert.ok(setRoute(g, s, a, b, good).ok);
  s.route.legs = 5; s.route.profit = 120;
  assert.ok(clearRoute(s));
  assert.equal(s.route, undefined);
  assert.deepEqual({ a: s.lastRoute.a, b: s.lastRoute.b, out: s.lastRoute.out }, { a, b, out: good });
  assert.equal(s.lastRoute.legs, undefined);
  assert.ok(repeatRoute(g, s).ok);
  assert.equal(s.route.legs, 0); assert.equal(s.route.a, a);
  assert.equal(repeatRoute(g, s).reason, "already on a route");
});
test("repeat with nothing saved, or a saved route that is no longer valid, is refused", () => {
  const g = game(), s = g.ships[0];
  assert.equal(repeatRoute(g, s).reason, "no saved route");
  s.lastRoute = { a: "nowhere", b: "elsewhere", out: "grain", back: null };
  assert.equal(repeatRoute(g, s).ok, false);
});
test("advanced routes are remembered and repeated too", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a);
  assert.ok(setRouteAdv(g, s, [{ city: a, buy: [{ good }], sell: [] }, { city: b, buy: [], sell: [{ good }] }], { minCash: 50 }).ok);
  clearRoute(s);
  assert.ok(repeatRoute(g, s).ok);
  assert.equal(s.route.v, 2); assert.equal(s.route.minCash, 50);
});
test("a route counts the profit of its sales; laps and profit per lap come from that", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a);
  setRoute(g, s, a, b, good);
  for (let i = 0; i < 120 && s.route.legs < 2; i++) advanceDay(g);
  assert.ok(s.route.legs >= 1, "the ship sold at least once");
  assert.ok(Number.isFinite(s.route.profit));
  assert.equal(routeStats(null), null);
  assert.deepEqual(routeStats({ legs: 4, back: "x", profit: 100 }), { laps: 2, profit: 100, perLap: 50 });
  assert.deepEqual(routeStats({ v: 2, legs: 3, profit: 30 }), { laps: 3, profit: 30, perLap: 10 });
  assert.equal(routeStats({ legs: 1, back: "x", profit: 5 }).perLap, null);
});
test("card shows laps and profit per lap, or a repeat button for a saved route", () => {
  const sel = { route: { a: "cadiz", b: "malaga" } };
  const es = cashCardHtml({ lang: "es", ships: [sel], selected: sel, stats: { laps: 2, profit: 100, perLap: 50 }, fmtM: (x) => `${x} mon` });
  assert.match(es, /Vueltas: 2 · beneficio por vuelta: \+50 mon/);
  const saved = { lastRoute: { a: "cadiz", b: "malaga" } };
  const h = cashCardHtml({ lang: "es", ships: [saved], selected: saved, cityName: (c) => c });
  assert.match(h, /Ruta guardada: cadiz ⇄ malaga/); assert.match(h, /id="route-repeat"[^>]*>Repetir ruta/);
  assert.doesNotMatch(cashCardHtml({ lang: "es", ships: [{}], selected: {} }), /route-repeat/);
});
