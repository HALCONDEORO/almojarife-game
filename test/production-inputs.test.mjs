// Production is limited by its inputs (Estudios 3, Marco 30/10): a processor respects its recipe
// and consumes inputs from the local market - no input stock means no output, cash and stock each
// bind on their own, the largest affordable batch runs, and restocking resumes production. The
// limiting resource is exposed in the quote (reason/good/required/available) and pinned here.
// Partial production is our explicit existing policy: the workshop tries smaller batch sizes
// down to one instead of an all-or-nothing stop. These tests pin that contract.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { buyPlot, startConstruction, buildingAt, workshopTick } from "../src/game/buildings.mjs";
import { quoteRecipe } from "../src/sim/recipes.mjs";

const r2 = (num) => Math.round(num * 100) / 100;
const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "cadiz:7", type: "workshop", w: 4, d: 5 }; // same descriptor the buildings suite uses

function fundedWorkshop(level = 1) {
  const gm = newGame(world, "cadiz", { cash: 50000 });
  buyPlot(gm, "cadiz", PLOT);
  startConstruction(gm, "cadiz", PLOT.id, "workshop");
  const bld = buildingAt(gm, "cadiz", PLOT.id);
  bld.state = "active"; bld.level = level; delete bld.nextLevel; delete bld.readyTick; // skip the wait; construction timing is covered in buildings.test.mjs
  return gm;
}
function woolTown(gm, woolStock = 500) { // cheap wool, dear cloth: the weave's natural home
  Object.assign(gm.market.cadiz.wool, { stock: woolStock, target: 50 });
  Object.assign(gm.market.cadiz.cloth, { stock: 2, target: 100 });
}

test("zero input stock: no production, nothing consumed, nothing charged", () => {
  const gm = fundedWorkshop(1);
  woolTown(gm, 0); // no wool on the shelf at all
  const cash0 = gm.cash, cloth0 = gm.market.cadiz.cloth.stock;
  workshopTick(gm, "cadiz");
  const bld = buildingAt(gm, "cadiz", PLOT.id);
  assert.equal(bld.produced ?? 0, 0, "no batch ran without wool");
  assert.equal(gm.market.cadiz.wool.stock, 0, "no wool appeared");
  assert.equal(gm.market.cadiz.cloth.stock, cloth0, "no cloth appeared");
  assert.equal(gm.cash, cash0, "no money moved");
});

test("the quote names the limiting resource: good, required and available", () => {
  const gm = fundedWorkshop(1);
  woolTown(gm, 3); // one batch of weave needs 4 wool
  const quote = quoteRecipe(gm.world, gm.market, "cadiz", "weave", 1);
  assert.equal(quote.ok, false);
  assert.equal(quote.reason, "missing materials");
  assert.equal(quote.good, "wool", "the quote names the exact input that binds");
  assert.equal(quote.required, 4);
  assert.equal(quote.available, 3);
});

test("two limiters, one at a time: empty cash stops a stocked workshop, partial stock runs the largest batch that fits", () => {
  const gm = fundedWorkshop(3); // day 0 wants 2 batches (8 wool)
  woolTown(gm, 8);
  gm.market.cadiz.wool.target = 1; // 8 units on a target of 1: cheap AND limited, so only the purse can bind
  gm.cash = 0; // stock is there, the purse is empty
  const cloth0 = gm.market.cadiz.cloth.stock;
  workshopTick(gm, "cadiz");
  assert.equal(buildingAt(gm, "cadiz", PLOT.id).produced ?? 0, 0, "no batch ran without cash");
  assert.equal(gm.market.cadiz.wool.stock, 8, "the wool is untouched");
  assert.equal(gm.market.cadiz.cloth.stock, cloth0, "no cloth appeared");
  assert.equal(gm.cash, 0, "the empty purse is untouched: the rejection charges nothing");

  const gm2 = fundedWorkshop(3);
  woolTown(gm2, 4); // stock for exactly one batch of the two the pattern wants
  gm2.market.cadiz.wool.target = 1; // still cheap: only the shelf binds
  workshopTick(gm2, "cadiz");
  assert.equal(buildingAt(gm2, "cadiz", PLOT.id).produced, 1, "the largest batch that fits runs: one, not two, not zero");
  assert.equal(gm2.market.cadiz.wool.stock, 0, "the batch consumed its 4 wool");
  assert.equal(gm2.market.cadiz.cloth.stock, 2 + 2, "and produced its 2 cloth");
});

test("two full batches when inputs and cash suffice: the level cap binds, nothing else", () => {
  const gm = fundedWorkshop(3); // day 0 wants 2 batches and can have them
  woolTown(gm, 500);
  const cash0 = gm.cash;
  workshopTick(gm, "cadiz");
  assert.equal(buildingAt(gm, "cadiz", PLOT.id).produced, 2, "both batches run (a max-one-batch mutant dies here)");
  assert.equal(gm.market.cadiz.wool.stock, 500 - 8, "each batch consumed exactly its 4 wool, once (no double charge)");
  assert.equal(gm.market.cadiz.cloth.stock, 2 + 4, "each batch produced exactly its 2 cloth");
  assert.equal(r2(gm.cash - cash0), 862.56, "the cash delta is literal: revenue 1058.40 (4 cloth x 264.60) minus cost 195.84 (8 wool x 24.48)");
});

test("partial cash falls back to the largest affordable batch: one batch, charged once", () => {
  const gm = fundedWorkshop(3); // day 0 wants 2 batches (195.84 of wool)
  woolTown(gm, 500);
  gm.cash = 97.92; // exactly one batch of inputs: the two-batch quote (195.84) cannot be paid
  workshopTick(gm, "cadiz");
  assert.equal(buildingAt(gm, "cadiz", PLOT.id).produced, 1, "the affordable batch runs; the unaffordable one is skipped");
  assert.equal(gm.market.cadiz.wool.stock, 500 - 4, "one batch of wool consumed");
  assert.equal(r2(gm.cash), 529.2, "literal: 97.92 - 97.92 of inputs + 529.20 of cloth revenue, charged exactly once");
});

test("restock resumes production: a starved workshop weaves again the day wool returns", () => {
  const gm = fundedWorkshop(1); // level 1 weaves every day
  woolTown(gm, 0);
  workshopTick(gm, "cadiz");
  assert.equal(buildingAt(gm, "cadiz", PLOT.id).produced ?? 0, 0, "starved day: nothing");
  woolTown(gm, 500); // a trader docks and the shelf fills again
  workshopTick(gm, "cadiz");
  assert.equal(buildingAt(gm, "cadiz", PLOT.id).produced, 1, "the workshop resumes on its own once inputs are back");
  assert.equal(gm.market.cadiz.wool.stock, 500 - 4);
  assert.equal(gm.market.cadiz.cloth.stock, 2 + 2);
});
