// Route journal: each docked stop records every rule's planned order and its actual result.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, setRouteAdv, doBuy } from "../src/game/game.mjs";
import { price } from "../src/sim/market.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { shipWindowHtml } from "../src/view/shipwindow.mjs";
const world = loadWorld();
const freshGame = () => { const game = newGame(world, "cadiz", { embargo: false }); game.eventsOn = false; game.cash = 50000; return game; };
const runDays = (game, days) => { for (let dayIndex = 0; dayIndex < days; dayIndex++) advanceDay(game); };
const twoPorts = (game) => { const homePort = game.ships[0].at; return [homePort, ...world.cities.filter((city) => city.id !== homePort).slice(0, 1).map((city) => city.id)]; };

test("a stop's journal records the done trade and the concrete reason a rule did not fire", () => {
  const game = freshGame(), ship = game.ships[0], [portA, portB] = twoPorts(game);
  const grainToday = price(world, game.market[portA].grain, "grain");
  setRouteAdv(game, ship, [
    { city: portA, buy: [{ good: "grain", maxPrice: Math.floor(grainToday) - 1 }, { good: "wine" }], sell: [{ good: "salt" }] }, // grain over the cap, salt not aboard
    { city: portB },
  ]);
  runDays(game, 1);
  const dayLog = ship.route.log?.[0];
  assert.ok(dayLog, "a journal day was recorded");
  assert.equal(dayLog.city, portA);
  assert.equal(dayLog.stop, 1);
  const byKey = (entry) => `${entry.action}:${entry.good}`;
  const entries = Object.fromEntries(dayLog.entries.map((entry) => [byKey(entry), entry]));
  assert.equal(entries["buy:grain"].skip, "max_price"); // the planned buy did not fire: the price sat over the cap
  assert.equal(entries["sell:salt"].skip, "no_cargo"); // the planned sell had nothing aboard
  assert.equal(entries["buy:wine"].qty > 0, true); // and the rule that could fire did, with quantity and cost
  assert.equal(entries["buy:wine"].amt > 0, true);
  runDays(game, 40); // the journal stays bounded over long runs
  assert.ok(ship.route.log.length <= 12, String(ship.route.log.length));
});

test("the journal survives the save round trip", () => {
  const game = freshGame(), ship = game.ships[0], [portA, portB] = twoPorts(game);
  setRouteAdv(game, ship, [{ city: portA, buy: [{ good: "grain" }] }, { city: portB }]);
  runDays(game, 1);
  assert.ok(ship.route.log?.length >= 1);
  const { g: loaded } = deserialize(serialize(game, "Prueba"), world);
  const loadedLog = loaded.ships[0].route.log;
  assert.deepEqual(loadedLog[0], ship.route.log[0]);
});

test("a docked stop with no rules records nothing", () => {
  const game = freshGame(), ship = game.ships[0], [portA, portB] = twoPorts(game);
  setRouteAdv(game, ship, [{ city: portA }, { city: portB }]);
  runDays(game, 1);
  assert.equal(ship.route.log ?? null, null); // no rules, no journal day
  doBuy(game, ship, "grain", 5);
  runDays(game, 1);
  assert.equal(ship.route.log ?? null, null);
});

test("the ship window shows the journal in Spanish and English, planned next to actual", () => {
  const game = freshGame(), ship = game.ships[0], [portA, portB] = twoPorts(game);
  const grainToday = price(world, game.market[portA].grain, "grain");
  setRouteAdv(game, ship, [
    { city: portA, buy: [{ good: "grain", maxPrice: Math.floor(grainToday) - 1 }], sell: [{ good: "salt" }] },
    { city: portB },
  ]);
  runDays(game, 1);
  const helpers = { fmt: (amount) => String(Math.round(amount)), cityName: (id) => id, types: { cog: "Coca" }, goods: { grain: "Trigo", salt: "Sal" }, eta: () => "" };
  const es = shipWindowHtml(game, ship, "es", "data", helpers);
  assert.match(es, /Diario de ruta/);
  assert.match(es, /no compró Trigo: precio sobre el máximo/);
  assert.match(es, /no vendió Sal: no iba en la bodega/);
  const en = shipWindowHtml(game, ship, "en", "data", { ...helpers, goods: { grain: "Grain", salt: "Salt" } });
  assert.match(en, /Route log/);
  assert.match(en, /did not buy Grain: price over the cap/);
  assert.ok(!es.includes("undefined"), "no undefined placeholders");
});
