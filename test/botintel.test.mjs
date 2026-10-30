import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket } from "../src/sim/market.mjs";
import { makeShip } from "../src/sim/trade.mjs";
import { botIntelView, refreshBotKnowledge, botIntelHooks, buyBotReport } from "../src/game/botintel.mjs";

const world = loadWorld();
const CADIZ_CHART = ["arcila", "cadiz", "ceuta", "huelva", "larache", "sevilla", "tanger", "tetuan"];
function setup(id = 7, home = "cadiz") {
  const g = { world, market: makeMarket(world), day: 10, tick: 3, seed: 5, over: false };
  const bot = { ship: makeShip(id, "cog", "cadiz"), home, cash: 1000 };
  return { g, bot };
}

test("the view is the bot's private state boundary: proxies persist on the bot and nothing human leaks in", () => {
  const { g, bot } = setup(11);
  g.intel = { barcelona: { day: 10, exact: true, cells: { grain: { stock: 1 } } } };
  const v1 = refreshBotKnowledge(g, bot), v2 = botIntelView(g, bot);
  assert.equal(v1.intel, bot.intel);
  assert.equal(v2.intel, bot.intel, "the intel book persists on the bot across views");
  assert.equal(v2.warehouses, bot.warehouses);
  assert.deepEqual(Object.keys(v2.intel), ["cadiz"], "the player's intel book is not visible");
  assert.deepEqual(Object.keys(g.intel), ["barcelona"], "the player's intel book is untouched");
  v2.cash = 555; assert.equal(bot.cash, 555, "cash writes reach the bot");
  const d = v2.discovered; v2.discovered = { x: 1 }; assert.equal(bot.discovered.x, 1, "chart writes reach the bot"); bot.discovered = d;
  assert.equal(v2.nextId, 11, "rumours are seeded with the bot ship's id");
  assert.ok(v2.ships.length === 1 && v2.ships[0] === bot.ship, "a single-ship bot views its own ship only");
  const escort = makeShip(12, "nao", "cadiz"); bot.ships = [bot.ship, escort];
  assert.equal(botIntelView(g, bot).ships.length, 2, "a later multi-ship bot supplies its fleet");
});

test("the starting chart covers the home port's 150 km, even when the ship lies elsewhere", () => {
  const { g, bot } = setup();
  refreshBotKnowledge(g, bot);
  assert.deepEqual(Object.keys(bot.discovered).sort(), CADIZ_CHART);
  assert.equal(bot.discovered.barcelona, undefined, "a far city stays unknown");
  const far = setup(8, "lisboa");
  refreshBotKnowledge(far.g, far.bot);
  assert.deepEqual(Object.keys(far.bot.discovered).sort(), ["cadiz", "lisboa", "setubal"], "the chart is drawn around home, not the ship");
});

test("exact snapshots exist only where the house is present", () => {
  const { g, bot } = setup();
  const view = refreshBotKnowledge(g, bot);
  assert.deepEqual(Object.keys(view.intel), ["cadiz"]);
  const i = view.intel.cadiz;
  assert.equal(i.day, 10); assert.equal(i.exact, true);
  assert.deepEqual(i.cells, g.market.cadiz);
  assert.notEqual(i.cells, g.market.cadiz, "the snapshot is a copy, not the live book");
});

test("planning hooks expose only the known market and the discovered chart", () => {
  const { g, bot } = setup();
  refreshBotKnowledge(g, bot);
  const hooks = botIntelHooks(g, bot);
  assert.deepEqual(Object.keys(hooks.planningMarket()), ["cadiz"]);
  assert.deepEqual(hooks.planningMarket().cadiz, g.market.cadiz);
  assert.equal(hooks.canVisit("cadiz"), true);
  assert.equal(hooks.canVisit("sevilla"), true);
  assert.equal(hooks.canVisit("lisboa"), false, "undiscovered city");
  assert.equal(hooks.canVisit("zzz"), false, "unknown city");
});

test("an idle merchant at sea buys no report", () => {
  const { g, bot } = setup();
  refreshBotKnowledge(g, bot);
  bot.ship.voyage = { from: "cadiz", to: "lisboa" };
  assert.deepEqual(buyBotReport(g, bot), { ok: false, reason: "at sea" });
  assert.equal(bot.cash, 1000, "no money moved");
});

test("the stalest port wins the report, ties break by city id, the rumour is paid and bounded", () => {
  const { g, bot } = setup(9);
  const view = refreshBotKnowledge(g, bot);
  for (const id of Object.keys(bot.discovered)) view.intel[id] = { day: 10, exact: false, cells: {} };
  view.intel.huelva = { day: 1, exact: false, cells: {} };
  view.intel.sevilla = { day: 1, exact: false, cells: {} };
  const r = buyBotReport(g, bot);
  assert.equal(r.ok, true);
  assert.equal(r.city, "huelva", "oldest report first, tie to the alphabetically earlier port");
  assert.equal(bot.cash, 960, "the report costs its real in-game price of 40");
  assert.equal(view.intel.huelva.day, 10);
  assert.equal(view.intel.huelva.exact, false, "a rumour, not a live snapshot");
  const goods = Object.entries(view.intel.huelva.cells);
  assert.equal(goods.length, 20);
  for (const [good, e] of goods) {
    const real = g.market.huelva[good].stock;
    assert.ok(e.stock >= Math.floor(real * 0.74) && e.stock <= Math.ceil(real * 1.26), `${good} rumour outside the +-25% error band`);
  }
  const twin = setup(9);
  const tv = refreshBotKnowledge(twin.g, twin.bot);
  for (const id of Object.keys(twin.bot.discovered)) tv.intel[id] = { day: 10, exact: false, cells: {} };
  tv.intel.huelva = { day: 1, exact: false, cells: {} }; tv.intel.sevilla = { day: 1, exact: false, cells: {} };
  buyBotReport(twin.g, twin.bot);
  assert.deepEqual(tv.intel.huelva.cells, view.intel.huelva.cells, "same day, city and ship id seed the same rumour");
});

test("with no reports at all the first buy goes to the alphabetically first unreported port", () => {
  const { g, bot } = setup(7);
  refreshBotKnowledge(g, bot);
  const r = buyBotReport(g, bot);
  assert.equal(r.ok, true);
  assert.equal(r.city, "arcila");
  assert.equal(bot.cash, 960);
});

test("with every report fresh the merchant buys a route rumour instead, discovering a new port", () => {
  const { g, bot } = setup();
  const view = refreshBotKnowledge(g, bot);
  for (const c of world.cities) view.intel[c.id] ??= { day: 10, exact: false, cells: {} };
  for (const c of world.cities) view.intel[c.id].day = 10;
  const r = buyBotReport(g, bot);
  assert.deepEqual(r, { ok: true, cost: 60, city: "faro" });
  assert.equal(bot.cash, 940, "the route rumour costs its real price of 60");
  assert.notEqual(bot.discovered.faro, undefined, "the new route is charted");
});
