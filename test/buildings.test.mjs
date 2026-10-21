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

// Piece 3: the workshop's weave production inside its port's market tick.
import { workshopTick } from "../src/game/buildings.mjs";
import { marketSlot } from "../src/game/game.mjs";
import { price } from "../src/sim/market.mjs";
import { FEE } from "../src/sim/trade.mjs";

function fundedWorkshop(level = 1) {
  const g = newGame(world, "cadiz", { cash: 50000 });
  buyPlot(g, "cadiz", PLOT);
  startConstruction(g, "cadiz", PLOT.id, "workshop");
  const b = buildingAt(g, "cadiz", PLOT.id);
  b.state = "active"; b.level = level; delete b.nextLevel; delete b.readyTick; // skip the wait; timing is covered above
  return g;
}
function woolTown(g) { // cheap wool, dear cloth: the weave's natural home
  Object.assign(g.market.cadiz.wool, { stock: 500, target: 50 });
  Object.assign(g.market.cadiz.cloth, { stock: 2, target: 100 });
}

test("profitable workshop runs one weave batch per level at its port tick", () => {
  const g = fundedWorkshop(1);
  woolTown(g);
  const cash = g.cash, wool = g.market.cadiz.wool.stock, cloth = g.market.cadiz.cloth.stock;
  workshopTick(g, "cadiz");
  assert.equal(g.market.cadiz.wool.stock, wool - 4);
  assert.equal(g.market.cadiz.cloth.stock, cloth + 2);
  // exact net: 2 cloth sold at the clamped top price, 4 wool bought at the clamped bottom, fees both sides
  const clothP = Math.floor(270 * (1 - FEE)), woolP = Math.ceil(24 * (1 + FEE));
  assert.equal(g.cash, cash + 2 * clothP - 4 * woolP);
  assert.equal(buildingAt(g, "cadiz", PLOT.id).produced, 1);
  const g2 = fundedWorkshop(2);
  woolTown(g2);
  workshopTick(g2, "cadiz");
  assert.equal(buildingAt(g2, "cadiz", PLOT.id).produced, 2); // level 2 tries two batches
  assert.equal(g2.market.cadiz.wool.stock, wool - 8);
});

test("no stock, no cash, no margin, under construction: no production, no mutation", () => {
  let g = fundedWorkshop(); woolTown(g); g.market.cadiz.wool.stock = 0;
  let snap = JSON.stringify(g.market.cadiz); workshopTick(g, "cadiz");
  assert.equal(JSON.stringify(g.market.cadiz), snap); assert.equal(buildingAt(g, "cadiz", PLOT.id).produced ?? 0, 0);
  g = fundedWorkshop(); woolTown(g); g.cash = 0;
  snap = JSON.stringify(g.market.cadiz); workshopTick(g, "cadiz");
  assert.equal(JSON.stringify(g.market.cadiz), snap);
  g = fundedWorkshop(); Object.assign(g.market.cadiz.cloth, { stock: 900, target: 50 }); // cloth worthless: margin gone
  const cash = g.cash; workshopTick(g, "cadiz");
  assert.equal(g.cash, cash); assert.equal(buildingAt(g, "cadiz", PLOT.id).produced ?? 0, 0);
  g = fundedWorkshop(); woolTown(g); buildingAt(g, "cadiz", PLOT.id).state = "construction";
  snap = JSON.stringify(g.market.cadiz); workshopTick(g, "cadiz");
  assert.equal(JSON.stringify(g.market.cadiz), snap);
});

test("production runs inside the port's own staggered market tick, deterministically", () => {
  const idx = world.cities.findIndex((c) => c.id === "cadiz"), slot = marketSlot(world, idx);
  const ticks = slot === 0 ? TICKS_PER_DAY : slot;
  const a = newGame(world, "cadiz", { cash: 50000 }), b = newGame(world, "cadiz", { cash: 50000 });
  buyPlot(b, "cadiz", PLOT); startConstruction(b, "cadiz", PLOT.id, "workshop");
  const bb = buildingAt(b, "cadiz", PLOT.id); bb.state = "active"; bb.level = 1; delete bb.nextLevel; delete bb.readyTick;
  for (const g of [a, b]) woolTown(g);
  for (let i = 0; i < ticks; i++) { advanceTick(a); advanceTick(b); } // both see cadiz's market tick once
  assert.equal(a.market.cadiz.wool.stock - b.market.cadiz.wool.stock, 4); // the weave is the only difference
  assert.equal(b.market.cadiz.cloth.stock - a.market.cadiz.cloth.stock, 2);
  assert.equal(buildingAt(b, "cadiz", PLOT.id).produced, 1); // and it produced exactly once
  for (const c of world.cities) if (c.id !== "cadiz") assert.deepEqual(b.market[c.id], a.market[c.id]); // other ports untouched
  // same run twice: identical state
  const c1 = fundedWorkshop(), c2 = fundedWorkshop();
  woolTown(c1); woolTown(c2);
  for (let i = 0; i < ticks; i++) { advanceTick(c1); advanceTick(c2); }
  assert.equal(JSON.stringify(c1.market), JSON.stringify(c2.market));
  assert.equal(c1.cash, c2.cash);
});
