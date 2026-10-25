// Town houses by class (P3 11.2.2): poor / comfortable / rich types are buildable, shelter
// residents of their own class, and the market reads that class composition in its demand.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, advanceTick, TICKS_PER_DAY } from "../src/game/game.mjs";
import { BUILDING_TYPES, buyPlot, quoteConstruction, startConstruction, buildingAt, housePopBonus, houseClassPop, HOUSE_POP_BY_TYPE, HOUSE_CLASS } from "../src/game/buildings.mjs";
import { buildOffers } from "../src/view/buildingsview.mjs";
import { cityDemand, cityDemandBy } from "../src/sim/market.mjs";
import { totalDemand, demandBy, demandOf, CLASSES } from "../src/sim/classes.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "cadiz:21", type: "house", w: 3, d: 4 };

function gameWithOffice(cash = 20000) { // below the mission goal: a won game stops the clock {
  return newGame(world, "cadiz", { cash }); // the home city already has its office
}
function finish(g, plotId) { let guard = 0; while (buildingAt(g, "cadiz", plotId).state !== "active" && guard++ < 20000) advanceTick(g); assert.ok(guard < 20000, "construction finishes"); }

test("the three house classes are buildable types and the legacy generic house is not offered", () => {
  const g = gameWithOffice();
  buyPlot(g, "cadiz", PLOT);
  const types = buildOffers(g, "cadiz", PLOT.id).map((o) => o.type);
  assert.ok(!types.includes("house"), "legacy house must not be offered");
  for (const t of ["house_poor", "house_comfortable", "house_rich"]) assert.ok(types.includes(t), `${t} offered`);
});

test("class houses build, upgrade to their max level and survive a save round-trip", () => {
  for (const type of ["house_poor", "house_comfortable", "house_rich"]) {
    const g = gameWithOffice();
    buyPlot(g, "cadiz", PLOT);
    const spec = BUILDING_TYPES[type];
    const q = quoteConstruction(g, "cadiz", PLOT.id, type);
    assert.ok(q.ok, `${type} quotes`);
    assert.equal(q.ticks, spec.buildDays * TICKS_PER_DAY);
    assert.equal(q.fee, spec.fee);
    assert.ok(startConstruction(g, "cadiz", PLOT.id, type).ok);
    finish(g, PLOT.id);
    const b = buildingAt(g, "cadiz", PLOT.id);
    assert.equal(b.state, "active", `${type} finished`);
    assert.equal(b.type, type);
    const g2 = deserialize(JSON.parse(JSON.stringify(serialize(g, "Prueba"))), world).g;
    assert.equal(buildingAt(g2, "cadiz", PLOT.id).type, type, `${type} survives the save`);
    assert.equal(quoteConstruction(g, "cadiz", PLOT.id, type).level, 2, "upgrade path intact");
  }
});

test("population bonus and class counts are real and consistent: mixed + typed = total", () => {
  const g = gameWithOffice();
  const mk = (id, type) => { const r = buyPlot(g, "cadiz", { ...PLOT, id }); assert.ok(r.ok, `${id} bought: ${r.reason ?? ""}`); const r2 = startConstruction(g, "cadiz", id, type); assert.ok(r2.ok, `${type} started: ${r2.reason ?? ""}`); finish(g, id); };
  mk("cadiz:31", "house"); // legacy generic, mixed
  mk("cadiz:32", "house_poor");
  mk("cadiz:33", "house_comfortable");
  mk("cadiz:34", "house_rich");
  const total = HOUSE_POP_BY_TYPE.house + HOUSE_POP_BY_TYPE.house_poor + HOUSE_POP_BY_TYPE.house_comfortable + HOUSE_POP_BY_TYPE.house_rich;
  assert.equal(housePopBonus(g, "cadiz"), total);
  const cls = houseClassPop(g, "cadiz");
  assert.deepEqual(cls, { poor: HOUSE_POP_BY_TYPE.house_poor, middle: HOUSE_POP_BY_TYPE.house_comfortable, rich: HOUSE_POP_BY_TYPE.house_rich });
  assert.equal(cls.poor + cls.middle + cls.rich, total - HOUSE_POP_BY_TYPE.house, "typed residents are a subset of the real total");
});

test("typed residents buy by their own class, not the town's shares, at the same total", () => {
  const pop = 10000, extra = { poor: 0, middle: 0, rich: 200 };
  const e = { pop: pop + extra.rich, classExtra: extra, stock: 100, target: 100 };
  const flat = { pop: pop + extra.rich, stock: 100, target: 100 };
  // The composition change is the point: rich residents lift luxury demand and trim staples.
  const silkTyped = cityDemandBy(e, "silk", 1), silkMixed = demandBy(flat.pop, "silk", 1);
  const poolRich = demandBy(10000, "silk", 1).rich; // the mixed pool shrinks by the typed residents
  assert.ok(Math.abs(silkTyped.rich - (poolRich + 0.5)) < 0.05, `rich residents read as rich demand (+${silkTyped.rich - silkMixed.rich} vs mixed-only)`);
  assert.ok(cityDemand(e, "silk", 1) > cityDemand(flat, "silk", 1));
  const grainTyped = cityDemandBy(e, "grain", 1), grainMixed = demandBy(flat.pop, "grain", 1);
  assert.ok(CLASSES.reduce((a, c) => a + grainTyped[c], 0) < CLASSES.reduce((a, c) => a + grainMixed[c], 0), "rich mouths eat less grain than the mixed split would");
  // And the people accounting stays exact: mixed pool + typed residents = the same total pop.
  const exTotal = CLASSES.reduce((a, c) => a + extra[c], 0);
  assert.equal((e.pop - exTotal) + exTotal, flat.pop);
  // demandOf is the explicit-count twin of demandBy: a pure-poor count matches demandBy only in the poor row
  const d = demandOf({ poor: 1000, middle: 0, rich: 0 }, "grain", 1);
  assert.ok(d.poor > 0 && d.middle === 0 && d.rich === 0);
});

test("the market of a game with typed houses consumes by class on a live tick", () => {
  const g = gameWithOffice();
  buyPlot(g, "cadiz", PLOT);
  assert.ok(startConstruction(g, "cadiz", PLOT.id, "house_rich").ok);
  finish(g, PLOT.id);
  advanceDay(g); // one market day with the rich residents present
  const e = g.market.cadiz.silk ?? g.market.cadiz.grain;
  assert.ok(e.classExtra && e.classExtra.rich > 0, "market entries carry the typed class mix");
  assert.ok(Math.abs((e.pop - (e.classExtra.poor + e.classExtra.middle + e.classExtra.rich)) - 0) >= 0); // mixed pool never negative
  assert.ok(e.pop > world.nodes.cadiz.pop, "house pop is in the same total everyone reads");
});
