// Primary producers (piece: materials plan PR2): farm/pasture/sawmill/mine yield goods from the
// land, only in cities whose makes-list includes the good; seasonal goods follow the market's seasonMul.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, TICKS_PER_DAY } from "../src/game/game.mjs";
import { buyPlot, quoteConstruction, startConstruction, buildingAt, workshopTick, producerCities, cityAllowsProducer } from "../src/game/buildings.mjs";
import { seasonMul } from "../src/sim/market.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "casablanca:7", type: "farm", w: 5, d: 5 }; // casablanca makes grain and wool

function activeBuilding(cityId, plotId, type, level = 2) {
  const g = newGame(world, cityId, { cash: 50000 });
  buyPlot(g, cityId, { id: plotId, type, w: 4, d: 4 });
  startConstruction(g, cityId, plotId, type);
  const b = buildingAt(g, cityId, plotId);
  b.state = "active"; b.level = level; delete b.nextLevel; delete b.readyTick;
  return g;
}

test("primary producers build only where the city makes the good", () => {
  assert.ok(cityAllowsProducer(world, "casablanca", "farm")); // casablanca makes grain
  assert.ok(!cityAllowsProducer(world, "cadiz", "farm")); // cadiz does not
  assert.ok(!cityAllowsProducer(world, "cadiz", "mine"));
  assert.ok(cityAllowsProducer(world, "bilbao", "mine")); // bilbao makes iron
  assert.ok(cityAllowsProducer(world, "cadiz", "workshop")); // processors build anywhere
  assert.deepEqual(producerCities(world, "farm"), world.cities.filter((c) => c.makes.includes("grain")).map((c) => c.id));
  const g = newGame(world, "cadiz", { cash: 50000 });
  buyPlot(g, "cadiz", { id: "cadiz:8", type: "farm", w: 4, d: 4 });
  assert.equal(quoteConstruction(g, "cadiz", "cadiz:8", "farm").reason, "good not producible in this city");
  assert.equal(startConstruction(g, "cadiz", "cadiz:8", "farm").ok, false);
  assert.equal(buildingAt(g, "cadiz", "cadiz:8").state, "plot"); // untouched
});

test("an active farm adds seasonal grain to the city's stock, capped like city production", () => {
  const g = activeBuilding("casablanca", "casablanca:7", "farm", 2); // level 2: one batch a day
  const e = g.market.casablanca.grain, stock = e.stock;
  workshopTick(g, "casablanca");
  const expected = Math.max(1, Math.round(4 * 1 * seasonMul("grain", 0)));
  assert.equal(e.stock, Math.min(e.target * 4, stock + expected));
  assert.equal(buildingAt(g, "casablanca", "casablanca:7").produced, expected);
  e.stock = e.target * 4; // at the cap: nothing more goes in
  workshopTick(g, "casablanca");
  assert.equal(e.stock, e.target * 4);
});

test("sawmill produces evenly all year (no season peak for timber), level 1 rests alternate days", () => {
  const g = activeBuilding("bilbao", "bilbao:3", "sawmill", 1);
  const stock = g.market.bilbao.timber.stock;
  workshopTick(g, "bilbao"); // day 0: level 1 runs one batch -> 3 timber
  assert.equal(g.market.bilbao.timber.stock, stock + 3);
  g.tick = TICKS_PER_DAY; // day 1: level 1 rests
  workshopTick(g, "bilbao");
  assert.equal(g.market.bilbao.timber.stock, stock + 3);
});

test("primary production needs no cash and consumes nothing else", () => {
  const g = activeBuilding("bilbao", "bilbao:4", "mine", 3); // level 3, day 0: 2 batches -> 2 iron
  g.cash = 0;
  const noLedger = (m) => Object.fromEntries(Object.entries(m).filter(([k]) => k !== "iron").map(([k, e]) => { const { commerce, ...rest } = e; return [k, rest]; })); // commerce is port-wide telemetry on the grain row (needsLedger precedent), not economic state
  const before = JSON.stringify(noLedger(g.market.bilbao));
  const iron = g.market.bilbao.iron.stock;
  workshopTick(g, "bilbao");
  assert.equal(g.market.bilbao.iron.stock, iron + 2);
  assert.equal(JSON.stringify(noLedger(g.market.bilbao)), before);
  assert.equal(g.cash, 0);
});

test("production never deletes market stock already above the cap", () => {
  const g = activeBuilding("casablanca", "casablanca:7", "farm", 3);
  const e = g.market.casablanca.grain;
  e.stock = e.target * 10; // way above the production cap, e.g. after big player sales
  const before = e.stock;
  workshopTick(g, "casablanca");
  assert.ok(e.stock >= before, `stock fell from ${before} to ${e.stock}`);
});
