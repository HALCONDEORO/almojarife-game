import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, buyWarehouse, netWorth, quote, WAREHOUSE_CAP } from "../src/game/game.mjs";
import { validateWorkshops, buildWorkshop, sellWorkshop, tickWorkshops, allowedIn, workshopDef, workshopOf, workshopsDue, workshopsValue, costPerDay, WORKSHOP_RESALE } from "../src/game/workshops.mjs";
import { SETTLE_EVERY } from "../src/game/ledger.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { messageText } from "../src/view/ledgerview.mjs";
const raw = JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url)));
const world = buildWorld(raw);
const loom = workshopDef(world, "loom");

/** A game with a ship docked at Bilbao, a warehouse there and plenty of cash. */
function atBilbao(cash = 20000) {
  const g = newGame(world, "bilbao"); g.cash = cash; buyWarehouse(g, "bilbao");
  return g;
}
/** Build a loom and jump to the day it is ready (no days are simulated). */
function withLoom(g) {
  assert.ok(buildWorkshop(g, "bilbao", "loom").ok);
  g.day = workshopOf(g, "bilbao", "loom").readyDay;
  return workshopOf(g, "bilbao", "loom");
}
/** Run the workshops only, on days that are not settlement days. */
const tickOn = (g, day) => { g.day = day; return tickWorkshops(g); };
/** The first day from d on that is not a settlement day. */
const workDay = (d) => d % SETTLE_EVERY ? d : d + 1;

test("the shipped workshop data is valid and uses only existing goods", () => {
  assert.deepEqual(validateWorkshops(raw.workshops, raw.goods), []);
  assert.deepEqual(raw.workshops.map((w) => w.id), ["loom"]);
  assert.deepEqual(loom.inputs, { wool: 4 }); assert.deepEqual(loom.outputs, { cloth: 3 });
});
test("the validator catches bad recipes", () => {
  const bad = (patch) => validateWorkshops([{ ...structuredClone(loom), ...patch }], raw.goods);
  assert.ok(bad({ inputs: { velvet: 2 } }).some((e) => e.includes("unknown good")));
  assert.ok(bad({ outputs: { cloth: 0 } }).some((e) => e.includes("positive whole number")));
  assert.ok(bad({ outputs: {} }).some((e) => e.includes("must not be empty")));
  assert.ok(bad({ price: 0 }).some((e) => e.includes("price")));
  assert.ok(bad({ name: { es: "Telar" } }).some((e) => e.includes('missing "en"')));
  assert.ok(bad({ allow: {} }).some((e) => e.includes("allow")));
  assert.ok(bad({ season: "velvet" }).some((e) => e.includes("season")));
  assert.ok(validateWorkshops([loom, loom], raw.goods).some((e) => e.includes("duplicate")));
  assert.ok(validateWorkshops(null, raw.goods).length);
});
test("the loom is allowed where wool is made or the port is big", () => {
  const ok = world.cities.filter((c) => allowedIn(world, c.id, loom)).map((c) => c.id).sort();
  assert.deepEqual(ok, ["barcelona", "bilbao", "lisboa", "sevilla", "valencia"]);
});
test("building needs a docked ship, a warehouse, cash, an allowed port and no loom yet", () => {
  const g = newGame(world, "bilbao"); g.cash = 20000;
  assert.equal(buildWorkshop(g, "bilbao", "loom").reason, "no warehouse");
  buyWarehouse(g, "bilbao");
  assert.equal(buildWorkshop(g, "bilbao", "silk_mill").reason, "unknown type");
  assert.equal(buildWorkshop(g, "sevilla", "loom").reason, "no ship here");
  const c0 = g.cash, r = buildWorkshop(g, "bilbao", "loom");
  assert.ok(r.ok); assert.equal(g.cash, c0 - loom.price); assert.equal(r.readyDay, g.day + loom.buildDays);
  assert.equal(buildWorkshop(g, "bilbao", "loom").reason, "already owned");
  const c = newGame(world, "cadiz"); c.cash = 20000; buyWarehouse(c, "cadiz");
  assert.equal(buildWorkshop(c, "cadiz", "loom").reason, "not allowed here");
  const poor = atBilbao(); poor.cash = 100; assert.equal(buildWorkshop(poor, "bilbao", "loom").reason, "no cash");
});
test("nothing is made or charged while it is being built", () => {
  const g = atBilbao(); g.warehouses.bilbao.goods.wool = 40;
  buildWorkshop(g, "bilbao", "loom");
  const w = workshopOf(g, "bilbao", "loom");
  for (let d = 1; d < w.readyDay; d++) if (d % SETTLE_EVERY) tickOn(g, d);
  assert.equal(g.warehouses.bilbao.goods.wool, 40); assert.equal(w.cost, 0); assert.equal(w.made, 0);
});
test("exact production with full inputs: 4 wool become 3 cloth a day, the market is untouched", () => {
  const g = atBilbao(); g.warehouses.bilbao.goods.wool = 40;
  const w = withLoom(g), mk = JSON.stringify(g.market), d0 = g.day;
  for (let i = 0; i < 5; i++) tickOn(g, d0 + i);
  assert.equal(g.warehouses.bilbao.goods.wool, 40 - 5 * 4);
  assert.equal(g.warehouses.bilbao.goods.cloth, 5 * 3);
  assert.equal(w.made, 15);
  assert.equal(JSON.stringify(g.market), mk);
});
test("partial inputs: it stops when wool runs out and warns only once", () => {
  const g = atBilbao(); g.warehouses.bilbao.goods.wool = 10; // enough for two days
  const w = withLoom(g), d0 = g.day, msgs = () => (g.inbox ?? []).filter((m) => m.txt?.en?.includes("out of raw materials")).length;
  for (let i = 0; i < 6; i++) { const d = d0 + i; if (d % SETTLE_EVERY) tickOn(g, d); }
  assert.equal(g.warehouses.bilbao.goods.wool, 2); assert.equal(g.warehouses.bilbao.goods.cloth, 6);
  assert.equal(w.stalled, "noInput"); assert.equal(msgs(), 1);
  g.warehouses.bilbao.goods.wool += 4; tickOn(g, workDay(d0 + 8));
  assert.equal(w.stalled, null, "works again when wool is back");
  assert.equal(g.warehouses.bilbao.goods.cloth, 9);
});
test("a stopped loom does not bank days of work", () => {
  const g = atBilbao(); const w = withLoom(g), d0 = g.day;
  for (let i = 0; i < 6; i++) { const d = d0 + i; if (d % SETTLE_EVERY) tickOn(g, d); }
  g.warehouses.bilbao.goods.wool = 40;
  tickOn(g, workDay(d0 + 7));
  assert.equal(g.warehouses.bilbao.goods.cloth, 3, "one day's batch, not six");
  assert.ok(w.progress <= 1);
});
test("the warehouse capacity (300) is respected", () => {
  const g = atBilbao(); const w = withLoom(g);
  // A recipe that makes more than it uses fills the warehouse: check it with a test-only type.
  g.world = { ...world, workshops: [...world.workshops, { ...structuredClone(loom), id: "grow", inputs: { wool: 1 }, outputs: { cloth: 5 } }] };
  delete g.workshops.bilbao.loom; g.workshops.bilbao.grow = { ...w, made: 0 };
  g.warehouses.bilbao.goods = { wool: 10, salt: WAREHOUSE_CAP - 12 };
  tickOn(g, workDay(g.day));
  const used = Object.values(g.warehouses.bilbao.goods).reduce((a, b) => a + b, 0);
  assert.ok(used <= WAREHOUSE_CAP); assert.equal(g.workshops.bilbao.grow.stalled, "full");
  assert.equal(g.warehouses.bilbao.goods.wool, 10);
});
test("costs build up daily and are paid on the settlement day, with a report and a message", () => {
  const g = atBilbao(); g.warehouses.bilbao.goods.wool = 200;
  buildWorkshop(g, "bilbao", "loom");
  const w = workshopOf(g, "bilbao", "loom");
  while (g.day < w.readyDay) advanceDay(g);
  const start = g.day;
  while (g.day % SETTLE_EVERY !== SETTLE_EVERY - 1) advanceDay(g);
  const days = g.day - start + 1;
  assert.equal(workshopsDue(g), days * costPerDay(loom));
  const cashBefore = g.cash;
  advanceDay(g); // ship upkeep is also taken on that day
  const r = g.workshopReports[0];
  assert.equal(r.cost, (days + 1) * costPerDay(loom)); assert.equal(r.made, (days + 1) * 3);
  assert.equal(workshopsDue(g), 0);
  assert.ok(g.cash <= cashBefore - r.cost, "the workshop cost left the cash");
  const m = g.inbox.find((x) => x.txt?.es?.startsWith("Talleres, semana"));
  assert.ok(m); assert.match(messageText(m, "en", String), /Workshops, week \d+: they made \d+ units/);
});
test("weekly cost can push cash into overdraft like ship upkeep", () => {
  const g = atBilbao(); const w = withLoom(g); g.cash = 0;
  let d = g.day; while (d % SETTLE_EVERY !== 0) { if (d % SETTLE_EVERY) tickOn(g, d); d++; }
  const r = tickOn(g, d);
  assert.ok(r.cost > 0); assert.equal(g.cash, -r.cost); assert.equal(w.cost, 0);
});
test("seasonal recipes make less at the low of the season", () => {
  const g = atBilbao(); const w = withLoom(g);
  g.world = { ...world, workshops: [{ ...structuredClone(loom), season: "wool" }] };
  const run = (from) => { g.warehouses.bilbao.goods = { wool: 200 }; w.progress = 0; w.stalled = null; let n = 0; for (let d = from; d < from + 20; d++) if (d % SETTLE_EVERY) { tickOn(g, d); n++; } return { cloth: g.warehouses.bilbao.goods.cloth ?? 0, n }; };
  const low = run(150 + 182 - 10), high = run(150 - 10);
  assert.ok(low.cloth < high.cloth, `low ${JSON.stringify(low)} < high ${JSON.stringify(high)}`);
  assert.ok(high.cloth <= Math.ceil(high.n * 1.35) * 3 && low.cloth >= Math.floor(low.n * 0.65) * 3 - 3);
});
test("selling gives back part of the price and pays what is owed", () => {
  const g = atBilbao(); const w = withLoom(g); w.cost = 30;
  assert.equal(workshopsValue(g), Math.round(loom.price * WORKSHOP_RESALE));
  const c0 = g.cash, r = sellWorkshop(g, "bilbao", "loom");
  assert.ok(r.ok); assert.equal(g.cash, c0 + r.value - 30);
  assert.equal(workshopOf(g, "bilbao", "loom"), null); assert.equal(workshopsValue(g), 0);
  assert.equal(sellWorkshop(g, "bilbao", "loom").reason, "not owned");
});
test("old saves without workshops load and play on; a save keeps the loom", () => {
  const g = atBilbao(); const save = serialize(g, "Casa"); delete save.state.workshops; delete save.state.workshopReports;
  const { g: old } = deserialize(save, world);
  for (let i = 0; i < 15; i++) advanceDay(old);
  assert.equal(old.over, null); assert.equal(workshopsDue(old), 0); assert.equal(workshopsValue(old), 0);
  withLoom(g); g.warehouses.bilbao.goods.wool = 8;
  const { g: back } = deserialize(serialize(g, "Casa"), world);
  assert.deepEqual(back.workshops, g.workshops);
  tickOn(back, workDay(back.day)); assert.equal(back.warehouses.bilbao.goods.cloth, 3);
});
test("a type removed from the data is ignored, not a crash", () => {
  const g = atBilbao(); withLoom(g); g.world = { ...world, workshops: [] };
  assert.doesNotThrow(() => { for (let i = 0; i < 8; i++) advanceDay(g); });
  assert.equal(workshopsValue(g), 0);
});
test("a bot that runs a loom for a year and sells all the cloth in a port that needs it does not sink the price for good", () => {
  const g = newGame(world, "barcelona"); g.cash = 20000; buyWarehouse(g, "barcelona"); // below the goal, so the game does not end
  buildWorkshop(g, "barcelona", "loom");
  const low = [];
  for (let d = 0; d < 365; d++) {
    const wh = g.warehouses.barcelona.goods;
    wh.wool = Math.max(wh.wool ?? 0, 20); // the bot keeps the loom fed
    if (wh.cloth) { g.market.cadiz.cloth.stock += wh.cloth; delete wh.cloth; } // and dumps all the cloth on Cádiz
    advanceDay(g); if (g.over) break;
    low.push(quote(g, "cadiz", "cloth") <= Math.round(world.goods.cloth.base * 0.4));
  }
  const lastMonth = low.slice(-30);
  assert.ok(lastMonth.some((x) => !x), "the cloth price in Cádiz stays above the 0.4x floor");
  assert.ok(netWorth(g) > 0);
});
