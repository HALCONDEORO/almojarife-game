// Construction engine, sim slice: pricing, purchase, tick timing, upkeep lines, save round-trip.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, advanceTick, TICKS_PER_DAY } from "../src/game/game.mjs";
import { BUILDING_TYPES, plotPrice, buyPlot, quoteConstruction, startConstruction, buildingAt, buyOffice, hasOffice, OFFICE_PRICE } from "../src/game/buildings.mjs";
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

test("profitable workshop runs batches per its level's daily pattern at its port tick", () => {
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
  workshopTick(g2, "cadiz"); // day 0: level 2 pattern is one batch every day
  assert.equal(buildingAt(g2, "cadiz", PLOT.id).produced, 1);
  assert.equal(g2.market.cadiz.wool.stock, wool - 4);
  const g3 = fundedWorkshop(3);
  woolTown(g3);
  workshopTick(g3, "cadiz"); // day 0: level 3 alternates 2 and 1 batches, starting at 2
  assert.equal(buildingAt(g3, "cadiz", PLOT.id).produced, 2);
  assert.equal(g3.market.cadiz.wool.stock, wool - 8);
  g3.tick = TICKS_PER_DAY; workshopTick(g3, "cadiz"); // day 1: the low half of the alternation
  assert.equal(buildingAt(g3, "cadiz", PLOT.id).produced, 3);
  const g1 = fundedWorkshop(1);
  woolTown(g1);
  g1.tick = TICKS_PER_DAY; workshopTick(g1, "cadiz"); // day 1: level 1 rests every other day
  assert.equal(buildingAt(g1, "cadiz", PLOT.id).produced ?? 0, 0);
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
  const bb = buildingAt(b, "cadiz", PLOT.id); bb.state = "active"; bb.level = 2; delete bb.nextTick; delete bb.nextLevel; delete bb.readyTick; // level 2 produces one batch every day, whatever the day parity
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

test("hostile or malformed plot ids are rejected and can never reach Object internals", () => {
  const g = newGame(world, "cadiz", { cash: 10000 });
  for (const id of ["__proto__", "constructor", "prototype", "CADIZ:1", "cadiz", "cadiz:x", "cadiz:-1", "cadiz:1:2", "", "cadiz:01", "cadiz:007", "cadiz:1000"]) {
    assert.equal(buyPlot(g, "cadiz", { id, type: "house", w: 3, d: 3 }).ok, false, id);
  }
  buyPlot(g, "cadiz", PLOT);
  assert.equal(buildingAt(g, "cadiz", "__proto__"), null); // null-prototype maps: no leak
  assert.equal(quoteConstruction(g, "cadiz", "__proto__", "house").reason, "plot not owned");
  assert.equal({}.polluted, undefined); // nothing polluted the global prototype
});

// Piece 5: houses raise effective population (more of the same demand), warehouse buildings extend storage.
import { housePopBonus, warehouseCapBonus, HOUSE_POP_PER_LEVEL, WAREHOUSE_CAP_PER_LEVEL } from "../src/game/buildings.mjs";
import { warehouseCap, buyWarehouse, storeGoods, warehouseOf } from "../src/game/game.mjs";

function activeBuilding(g, type, level = 1) {
  buyPlot(g, "cadiz", PLOT);
  startConstruction(g, "cadiz", PLOT.id, type);
  const b = buildingAt(g, "cadiz", PLOT.id);
  b.state = "active"; b.level = level; delete b.nextLevel; delete b.readyTick;
  return b;
}

test("houses add their people to the port's effective population at its market tick", () => {
  const cadizPop = world.cities.find((c) => c.id === "cadiz").pop;
  const g = newGame(world, "cadiz", { cash: 50000 });
  assert.equal(housePopBonus(g, "cadiz"), 0);
  activeBuilding(g, "house", 2);
  assert.equal(housePopBonus(g, "cadiz"), 2 * HOUSE_POP_PER_LEVEL);
  for (let i = 0; i < TICKS_PER_DAY; i++) advanceTick(g); // cadiz slot is 0 (first city): its market tick runs at the day boundary
  for (const e of Object.values(g.market.cadiz)) assert.equal(e.pop, cadizPop + 2 * HOUSE_POP_PER_LEVEL);
  const plain = newGame(world);
  for (let i = 0; i < TICKS_PER_DAY; i++) advanceTick(plain);
  for (const e of Object.values(plain.market.cadiz)) assert.equal(e.pop, cadizPop); // untouched without houses
});

test("more people means real extra demand pressure that reaches equilibrium (small town, level 3 house)", () => {
  const small = world.cities.reduce((m, c) => (c.pop < m.pop ? c : m)).id;
  const P = { id: `${small}:3`, type: "house", w: 3, d: 4 };
  const run = (withHouse) => {
    const g = newGame(world, small, { cash: 50000 });
    if (withHouse) {
      buyPlot(g, small, P); startConstruction(g, small, P.id, "house");
      const b = buildingAt(g, small, P.id);
      b.state = "active"; b.level = 3; delete b.nextLevel; delete b.readyTick;
    }
    return g;
  };
  const idx = world.cities.findIndex((c) => c.id === small), slot = marketSlot(world, idx), first = slot === 0 ? TICKS_PER_DAY : slot;
  const extraConsumed = (days) => {
    const a = run(false), b = run(true);
    for (let i = 0; i < first + (days - 1) * TICKS_PER_DAY; i++) { advanceTick(a); advanceTick(b); }
    let agg = 0, wiggles = 0, moves = 0;
    for (const [good, e] of Object.entries(b.market[small])) {
      const d = a.market[small][good].stock - e.stock; agg += d;
      if (d < 0) { assert.ok(Math.abs(d) <= 1, `${good} wiggle ${d} beyond one unit`); wiggles++; } // per-day demand rounding can swing one unit
      if (d >= 2) moves++;
    }
    return { agg, moves };
  };
  const one = extraConsumed(1);
  assert.ok(one.agg > 0, "the house town consumes more in aggregate");
  assert.ok(one.moves >= 1, "at least one good is consumed clearly more");
  const thirty = extraConsumed(30);
  assert.equal(thirty.agg, one.agg); // scarcity feedback holds the new demand at a leaner equilibrium, not a growing drain
});


test("warehouse buildings extend the port storage cap by level", () => {
  const g = newGame(world, "cadiz", { cash: 50000 });
  assert.equal(warehouseCap(g, "cadiz"), 300);
  assert.equal(buyWarehouse(g, "cadiz").ok, true);
  const s = g.ships[0]; s.cargo = { grain: 100 };
  assert.equal(storeGoods(g, s, "grain", 100).qty, 100);
  warehouseOf(g, "cadiz").goods = { grain: 250 }; s.cargo = { grain: 100 };
  assert.equal(storeGoods(g, s, "grain", 100).qty, 50); // base cap 300
  activeBuilding(g, "warehouse", 2);
  assert.equal(warehouseCapBonus(g, "cadiz"), 2 * WAREHOUSE_CAP_PER_LEVEL);
  assert.equal(warehouseCap(g, "cadiz"), 900);
  s.cargo = { grain: 200 }; // refill the hold: the previous store left 50 in it
  assert.equal(storeGoods(g, s, "grain", 100).qty, 100); // room again
});

test("office gates construction: home port always, other ports after buying one", () => {
  const g = newGame(world, "cadiz");
  assert.equal(hasOffice(g, "cadiz"), true); // home office comes free
  assert.equal(hasOffice(g, "lisboa"), false); // new games: no office abroad yet
  const q0 = quoteConstruction(g, "lisboa", "lisboa:1", "house");
  assert.equal(q0.ok, false); assert.equal(q0.reason, "office required");
  const r0 = buyOffice(g, "lisboa"); // respect below Known blocks the sale
  assert.equal(r0.ok, false); assert.equal(r0.reason, "respect required");
  g.rep = { lisboa: 2500 }; // 25 points: 2,500 coins of sales / 100
  const cash0 = g.cash, r = buyOffice(g, "lisboa");
  assert.equal(r.ok, true); assert.equal(g.cash, cash0 - OFFICE_PRICE);
  assert.equal(hasOffice(g, "lisboa"), true);
  assert.equal(buyOffice(g, "lisboa").ok, false); // no double purchase
  const legacy = { profile: { home: "cadiz" } }; // saves from before offices stay playable
  assert.equal(hasOffice(legacy, "lisboa"), true);
});
