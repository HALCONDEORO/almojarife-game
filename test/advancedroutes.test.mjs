import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, setRouteAdv, setRoute, clearRoute, doBuy, doSell, doSail } from "../src/game/game.mjs";
import { processRoutes } from "../src/game/routes.mjs";
import { price } from "../src/sim/market.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };
const run = (g, n) => { for (let i = 0; i < n; i++) advanceDay(g); };
const ports = (g, n) => { const a = g.ships[0].at; return [a, ...world.cities.filter((c) => c.id !== a).slice(0, n - 1).map((c) => c.id)]; };

test("setRouteAdv validates stops, rules and the cash brake", () => {
  const g = game(), s = g.ships[0], [a, b] = ports(g, 2);
  assert.equal(setRouteAdv(g, s, [{ city: a }]).reason, "too few stops");
  assert.equal(setRouteAdv(g, s, [{ city: a }, { city: "nowhere" }]).reason, "bad stop");
  assert.equal(setRouteAdv(g, s, [{ city: a }, { city: a }, { city: b }]).reason, "bad stop");
  assert.equal(setRouteAdv(g, s, [{ city: a, buy: [{ good: "gold-dust" }] }, { city: b }]).reason, "bad rule");
  assert.equal(setRouteAdv(g, s, [{ city: a, buy: [{ good: "grain", maxPrice: -3 }] }, { city: b }]).reason, "bad rule");
  assert.equal(setRouteAdv(g, s, [{ city: a }, { city: b }], { minCash: -1 }).reason, "bad cash brake");
  assert.ok(setRouteAdv(g, s, [{ city: a }, { city: b }]).ok);
  assert.equal(s.route.v, 2); assert.equal(s.route.idx, 0); assert.equal(s.route.minCash, 0);
  assert.ok(clearRoute(s));
});

test("a three-stop circuit trades every leg and counts full runs", () => {
  const g = game(), s = g.ships[0], [a, b, c] = ports(g, 3);
  setRouteAdv(g, s, [
    { city: a, buy: [{ good: "grain" }] },
    { city: b, sell: [{ good: "grain" }], buy: [{ good: "wine" }] },
    { city: c, sell: [{ good: "wine" }] },
  ]);
  run(g, 1);
  assert.ok(s.voyage && s.voyage.to === b, "left for the second stop");
  const seen = new Set();
  for (let d = 0; d < 200 && (seen.size < 3 || s.route.legs < 1); d++) { run(g, 1); seen.add(s.at); }
  assert.ok(seen.has(a) && seen.has(b) && seen.has(c), "visited every stop");
  assert.ok(s.route.legs >= 1, "completed a full circuit");
  assert.ok((g.inbox ?? []).some((m) => m.kind === "routeLeg"), "sales were reported");
});

test("price limits hold the cargo and wait instead of trading badly", () => {
  const g = game(), s = g.ships[0], [a, b] = ports(g, 2);
  setRouteAdv(g, s, [
    { city: a, buy: [{ good: "grain", maxPrice: 1 }] }, // grain never costs 1: no buy
    { city: b, sell: [{ good: "grain" }] },
  ]);
  run(g, 3);
  assert.equal(s.at, a); assert.equal(s.voyage, null);
  assert.equal((g.inbox ?? []).filter((m) => m.kind === "routeStuck").length, 1, "one stall message");
  // sell limit: cargo is held when the price is below the limit
  const g2 = game(), s2 = g2.ships[0], [a2, b2] = ports(g2, 2);
  s2.cargo = { grain: 20 };
  setRouteAdv(g2, s2, [{ city: a2 }, { city: b2, sell: [{ good: "grain", minPrice: 99999 }] }]);
  for (let d = 0; d < 60 && !(s2.at === b2 && !s2.voyage); d++) run(g2, 1);
  run(g2, 2);
  assert.equal(s2.at, b2, "waits at the sell stop");
  assert.equal(s2.cargo.grain, 20, "did not sell under the limit");
});

test("the cash brake keeps the reserve while buying", () => {
  const g = game(), s = g.ships[0], [a, b] = ports(g, 2);
  g.cash = 2000;
  setRouteAdv(g, s, [{ city: a, buy: [{ good: "grain" }] }, { city: b, sell: [{ good: "grain" }] }], { minCash: 1500 });
  run(g, 1);
  assert.ok(g.cash >= 1500, `cash ${g.cash} never dipped under the brake`);
  assert.ok((s.cargo.grain ?? 0) > 0, "still bought what the brake allowed");
});

test("legacy and advanced routes run side by side; advanced routes survive saving", () => {
  const g = game(), [a, b, c] = ports(g, 3);
  g.cash = 6000; // enough for both ships to load on day one
  g.ships.push({ ...g.ships[0], id: 99, cargo: {}, voyage: null, at: a });
  setRoute(g, g.ships[0], a, b, "grain");
  setRouteAdv(g, g.ships[1], [{ city: a, buy: [{ good: "grain" }] }, { city: c, sell: [{ good: "grain" }] }], { minCash: 100 });
  run(g, 1);
  assert.ok(g.ships[0].voyage && g.ships[1].voyage, "both sailed");
  const back = deserialize(serialize(g, "X"), world).g;
  assert.deepEqual(back.ships[1].route, g.ships[1].route);
});

test("buy limits compare to the market price, before the port fee", () => {
  const g = game(), s = g.ships[0], [a, b] = ports(g, 2);
  const market = price(world, g.market[a].grain, "grain");
  setRouteAdv(g, s, [{ city: a, buy: [{ good: "grain", maxPrice: market }] }, { city: b }]); // cap = market price: the fee on top must not block the buy
  processRoutes(g, { doBuy, doSell, doSail });
  assert.ok((s.cargo.grain ?? 0) > 0, "bought at the market-price cap, fee ignored for the limit");
  const g2 = game(), s2 = g2.ships[0], [a2, b2] = ports(g2, 2);
  const m2 = price(world, g2.market[a2].grain, "grain");
  setRouteAdv(g2, s2, [{ city: a2, buy: [{ good: "grain", maxPrice: m2 - 1 }] }, { city: b2 }]); // one below the market price: no buy
  processRoutes(g2, { doBuy, doSell, doSail });
  assert.equal(s2.cargo.grain ?? 0, 0, "one coin below the market price blocks the buy");
});
