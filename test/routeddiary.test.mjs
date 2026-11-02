// Route journal: each docked stop records every rule's planned order and its actual result.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, setRouteAdv, doBuy } from "../src/game/game.mjs";
import { price } from "../src/sim/market.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { shipWindowHtml } from "../src/view/shipwindow.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world, "cadiz", { embargo: false }); g.eventsOn = false; g.cash = 50000; return g; };
const run = (g, n) => { for (let i = 0; i < n; i++) advanceDay(g); };
const ports = (g, n) => { const a = g.ships[0].at; return [a, ...world.cities.filter((c) => c.id !== a).slice(0, n - 1).map((c) => c.id)]; };

test("a stop's journal records the done trade and the concrete reason a rule did not fire", () => {
  const g = game(), s = g.ships[0], [a, b] = ports(g, 2);
  const grainToday = price(world, g.market[a].grain, "grain");
  setRouteAdv(g, s, [
    { city: a, buy: [{ good: "grain", maxPrice: Math.floor(grainToday) - 1 }, { good: "wine" }], sell: [{ good: "salt" }] }, // grain over the cap, salt not aboard
    { city: b },
  ]);
  run(g, 1);
  const dayLog = s.route.log?.[0];
  assert.ok(dayLog, "a journal day was recorded");
  assert.equal(dayLog.city, a);
  assert.equal(dayLog.stop, 1);
  const byKey = (entry) => `${entry.action}:${entry.good}`;
  const entries = Object.fromEntries(dayLog.entries.map((entry) => [byKey(entry), entry]));
  assert.equal(entries["buy:grain"].skip, "max_price"); // the planned buy did not fire: the price sat over the cap
  assert.equal(entries["sell:salt"].skip, "no_cargo"); // the planned sell had nothing aboard
  assert.equal(entries["buy:wine"].qty > 0, true); // and the rule that could fire did, with quantity and cost
  assert.equal(entries["buy:wine"].amt > 0, true);
  run(g, 40); // the journal stays bounded over long runs
  assert.ok(s.route.log.length <= 12, String(s.route.log.length));
});

test("the journal survives the save round trip", () => {
  const g = game(), s = g.ships[0], [a, b] = ports(g, 2);
  setRouteAdv(g, s, [{ city: a, buy: [{ good: "grain" }] }, { city: b }]);
  run(g, 1);
  assert.ok(s.route.log?.length >= 1);
  const { g: loaded } = deserialize(serialize(g, "Prueba"), world);
  const loadedLog = loaded.ships[0].route.log;
  assert.deepEqual(loadedLog[0], s.route.log[0]);
});

test("a docked stop with no rules records nothing", () => {
  const g = game(), s = g.ships[0], [a, b] = ports(g, 2);
  setRouteAdv(g, s, [{ city: a }, { city: b }]);
  run(g, 1);
  assert.equal(s.route.log ?? null, null); // no rules, no journal day
  doBuy(g, s, "grain", 5);
  run(g, 1);
  assert.equal(s.route.log ?? null, null);
});

test("the ship window shows the journal in Spanish and English, planned next to actual", () => {
  const g = game(), s = g.ships[0], [a, b] = ports(g, 2);
  const grainToday = price(world, g.market[a].grain, "grain");
  setRouteAdv(g, s, [
    { city: a, buy: [{ good: "grain", maxPrice: Math.floor(grainToday) - 1 }], sell: [{ good: "salt" }] },
    { city: b },
  ]);
  run(g, 1);
  const hp = { fmt: (n) => String(Math.round(n)), cityName: (id) => id, types: { cog: "Coca" }, goods: { grain: "Trigo", salt: "Sal" }, eta: () => "" };
  const es = shipWindowHtml(g, s, "es", "data", hp);
  assert.match(es, /Diario de ruta/);
  assert.match(es, /no compró Trigo: precio sobre el máximo/);
  assert.match(es, /no vendió Sal: no iba en la bodega/);
  const en = shipWindowHtml(g, s, "en", "data", { ...hp, goods: { grain: "Grain", salt: "Salt" } });
  assert.match(en, /Route log/);
  assert.match(en, /did not buy Grain: price over the cap/);
  assert.ok(!es.includes("undefined"), "no undefined placeholders");
});
