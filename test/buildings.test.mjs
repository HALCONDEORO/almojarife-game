// Construction engine, sim slice: pricing, purchase, tick timing, upkeep lines, save round-trip.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, advanceTick, TICKS_PER_DAY } from "../src/game/game.mjs";
import { BUILDING_TYPES, plotPrice, buyPlot, quoteConstruction, startConstruction, buildingAt } from "../src/game/buildings.mjs";
import { accruedTotal } from "../src/game/ledger.mjs";
import { RECIPES } from "../src/sim/recipes.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "cadiz:7", type: "workshop", w: 4, d: 5 }; // a layout descriptor like the seeded city layout emits

test("plot price is deterministic, positive, and grows with population and area", () => {
  const a = plotPrice(world, "cadiz", PLOT), b = plotPrice(world, "cadiz", PLOT);
  assert.equal(a, b); assert.ok(Number.isSafeInteger(a) && a > 0);
  const small = world.cities.reduce((m, c) => (!m || (c.pop ?? 8000) < (m.pop ?? 8000) ? c : m), null);
  const big = world.cities.reduce((m, c) => (!m || (c.pop ?? 8000) > (m.pop ?? 8000) ? c : m), null);
  assert.ok(plotPrice(world, big.id, PLOT) > plotPrice(world, small.id, PLOT));
  assert.ok(plotPrice(world, "cadiz", { ...PLOT, w: 5, d: 5 }) > a);
  assert.equal(plotPrice(world, "cadiz", { ...PLOT, id: 7 }), null); // bad descriptors refused
  assert.equal(plotPrice(world, "cadiz", { ...PLOT, w: 0 }), null);
});

test("buying a plot pays once and refuses double purchase, low cash and unknowns", () => {
  const g = newGame(world, "cadiz", { cash: 10000 });
  const price = plotPrice(world, "cadiz", PLOT), cash = g.cash;
  assert.deepEqual(buyPlot(g, "nowhere", PLOT).ok, false);
  assert.deepEqual(buyPlot(g, "cadiz", PLOT), { ok: true, price });
  assert.equal(g.cash, cash - price);
  assert.equal(buildingAt(g, "cadiz", PLOT.id).state, "plot");
  assert.equal(buyPlot(g, "cadiz", PLOT).ok, false); // already owned
  g.cash = 1;
  const r = buyPlot(g, "cadiz", { id: "cadiz:9", type: "house", w: 3, d: 3 });
  assert.equal(r.ok, false); assert.equal(r.reason, "no cash");
});

test("construction quotes materials at the local market, pays fee, finishes on the exact tick", () => {
  const g = newGame(world, "cadiz", { cash: 10000 });
  buyPlot(g, "cadiz", PLOT);
  const spec = BUILDING_TYPES.workshop, stockBefore = {};
  for (const [good, n] of Object.entries(RECIPES.workshop)) stockBefore[good] = g.market.cadiz[good].stock;
  const q = quoteConstruction(g, "cadiz", PLOT.id, "workshop");
  assert.ok(q.ok); assert.equal(q.level, 1);
  assert.equal(q.ticks, spec.buildDays * TICKS_PER_DAY);
  const cash = g.cash;
  const r = startConstruction(g, "cadiz", PLOT.id, "workshop");
  assert.ok(r.ok); assert.equal(g.cash, cash - q.cost);
  for (const [good, n] of Object.entries(RECIPES.workshop)) assert.equal(g.market.cadiz[good].stock, stockBefore[good] - n); // inputs leave the market
  assert.equal(startConstruction(g, "cadiz", PLOT.id, "workshop").ok, false); // already building
  const b = buildingAt(g, "cadiz", PLOT.id);
  assert.equal(b.state, "construction"); assert.equal(b.readyTick, g.tick + q.ticks);
  for (let i = 0; i < q.ticks - 1; i++) advanceTick(g);
  assert.equal(buildingAt(g, "cadiz", PLOT.id).state, "construction"); // not one tick early
  advanceTick(g);
  const done = buildingAt(g, "cadiz", PLOT.id);
  assert.equal(done.state, "active"); assert.equal(done.level, 1); assert.equal(done.readyTick, undefined);
});

test("upkeep accrues daily per active building, lands in the weekly report, and resets", () => {
  const g = newGame(world, "cadiz", { cash: 10000 });
  buyPlot(g, "cadiz", PLOT);
  startConstruction(g, "cadiz", PLOT.id, "workshop");
  advanceDay(g); // still under construction: no building upkeep (the ship's own upkeep accrues as usual)
  assert.equal(g.accrued?.buildings?.["cadiz/cadiz:7"] ?? 0, 0);
  while (buildingAt(g, "cadiz", PLOT.id).state !== "active") advanceTick(g);
  const day0 = accruedTotal(g);
  advanceDay(g);
  const perDay = BUILDING_TYPES.workshop.upkeep * 1;
  assert.ok(accruedTotal(g) >= day0 + perDay); // building adds its share on top of the ship's
  while (g.day % 7 !== 0) advanceDay(g); // to settlement
  const rep = g.reports[0];
  assert.ok(rep.buildings.some((l) => l.plot === "cadiz/cadiz:7" && l.cost >= perDay));
  assert.equal(Object.keys(g.accrued.buildings ?? {}).length, 0); // book resets after settlement
});

test("upgrade scales cost, time and upkeep, and stops at max level", () => {
  const g = newGame(world, "cadiz", { cash: 30000 }); // three levels of materials at market prices
  buyPlot(g, "cadiz", PLOT);
  startConstruction(g, "cadiz", PLOT.id, "workshop");
  while (buildingAt(g, "cadiz", PLOT.id).state !== "active") advanceTick(g);
  const q2 = quoteConstruction(g, "cadiz", PLOT.id, "workshop");
  assert.ok(q2.ok); assert.equal(q2.level, 2);
  assert.equal(q2.ticks, BUILDING_TYPES.workshop.buildDays * 2 * TICKS_PER_DAY);
  assert.equal(q2.fee, BUILDING_TYPES.workshop.fee * 2);
  startConstruction(g, "cadiz", PLOT.id, "workshop");
  while (buildingAt(g, "cadiz", PLOT.id).state !== "active") advanceTick(g);
  assert.equal(buildingAt(g, "cadiz", PLOT.id).level, 2);
  startConstruction(g, "cadiz", PLOT.id, "workshop");
  while (buildingAt(g, "cadiz", PLOT.id).state !== "active") advanceTick(g);
  assert.equal(buildingAt(g, "cadiz", PLOT.id).level, 3);
  assert.equal(quoteConstruction(g, "cadiz", PLOT.id, "workshop").reason, "max level");
  assert.equal(quoteConstruction(g, "cadiz", PLOT.id, "house").reason, "plot has another building");
});

test("construction survives a save round-trip and completes on the same tick", () => {
  const g = newGame(world, "cadiz", { cash: 10000 });
  buyPlot(g, "cadiz", PLOT);
  startConstruction(g, "cadiz", PLOT.id, "house");
  for (let i = 0; i < 100; i++) advanceTick(g); // mid-construction
  const r = deserialize(serialize(g, "T"), world).g;
  assert.deepEqual(buildingAt(r, "cadiz", PLOT.id), buildingAt(g, "cadiz", PLOT.id));
  while (buildingAt(g, "cadiz", PLOT.id).state !== "active") advanceTick(g);
  while (buildingAt(r, "cadiz", PLOT.id).state !== "active") advanceTick(r);
  assert.equal(g.tick, r.tick); // same completion tick
  assert.deepEqual(buildingAt(r, "cadiz", PLOT.id), buildingAt(g, "cadiz", PLOT.id));
});

test("guards: unowned plot, unknown type, over game", () => {
  const g = newGame(world, "cadiz", { cash: 10000 });
  assert.equal(quoteConstruction(g, "cadiz", "cadiz:99", "house").reason, "plot not owned");
  buyPlot(g, "cadiz", PLOT);
  assert.equal(quoteConstruction(g, "cadiz", PLOT.id, "castle").reason, "unknown type");
  g.over = "lose";
  assert.equal(buyPlot(g, "cadiz", { id: "cadiz:10", type: "house", w: 3, d: 3 }).ok, false);
  assert.equal(startConstruction(g, "cadiz", PLOT.id, "house").ok, false);
});
