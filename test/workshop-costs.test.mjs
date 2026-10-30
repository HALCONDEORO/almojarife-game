// Zero production is not zero cost (Estudios 4, Marco 30/10): our documented policy is that an
// active workshop pays its fixed daily cost (upkeep + crew wages) whether or not it weaves that
// day - starved shelves, partial staffing and rest days all cost the same. A halted building
// (no cash at charge time) accrues nothing and resumes only with two days of cash in hand, so a
// building near the line does not flap. Save/load mid-cycle loses nothing and duplicates nothing.
// Only existing figures are pinned: the fixed daily cost, the activity counter (produced) and the
// staffed batch spread; there is no separate per-activity cost in the simulation.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, TICKS_PER_DAY } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { buyPlot, startConstruction, buildingAt, workshopTick, accrueBuildings, BUILDING_TYPES, JOBS_PER_LEVEL, WAGE_PER_WORKER } from "../src/game/buildings.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "cadiz:7", type: "workshop", w: 4, d: 5 }; // same descriptor the buildings suite uses
const KEY = "cadiz/cadiz:7";
const DAILY = BUILDING_TYPES.workshop.upkeep * 1 + JOBS_PER_LEVEL.workshop * 1 * WAGE_PER_WORKER; // level 1 fixed cost

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

test("a workshop starved of inputs still pays its full fixed daily cost", () => {
  const gm = fundedWorkshop(1);
  woolTown(gm, 0); // nothing to weave
  workshopTick(gm, "cadiz");
  assert.equal(buildingAt(gm, "cadiz", PLOT.id).produced ?? 0, 0, "test premise: zero production");
  const committed = accrueBuildings(gm);
  assert.equal(committed, DAILY, "the fixed daily cost commits in full on a zero-production day");
  assert.equal(gm.accrued.buildings[KEY], DAILY, "and lands in the weekly book");
});

test("the fixed cost is fixed: a weaving day costs exactly what a starved day costs", () => {
  const starved = fundedWorkshop(1);
  woolTown(starved, 0);
  workshopTick(starved, "cadiz");
  accrueBuildings(starved);
  const weaving = fundedWorkshop(1);
  woolTown(weaving, 500);
  workshopTick(weaving, "cadiz");
  assert.equal(buildingAt(weaving, "cadiz", PLOT.id).produced, 1, "test premise: this workshop wove");
  accrueBuildings(weaving);
  assert.equal(weaving.accrued.buildings[KEY], starved.accrued.buildings[KEY], "no per-activity charge exists: the day costs the same with and without output");
});

test("halt and restart hysteresis: no cash halts and stops the accrual, one day of cash is not enough to restart, two days is", () => {
  const gm = fundedWorkshop(1);
  woolTown(gm, 0); // keep production out of the picture
  gm.cash = DAILY - 1; // cannot cover the day
  assert.equal(accrueBuildings(gm), 0, "nothing accrues when the cash does not cover the cost");
  assert.equal(buildingAt(gm, "cadiz", PLOT.id).halted, true, "the building halts: the workers walk");
  gm.cash = DAILY; // one day in hand: above the charge, below the restart bar
  assert.equal(accrueBuildings(gm), 0, "one day of cash does not restart it (the hysteresis bar is two days)");
  assert.equal(buildingAt(gm, "cadiz", PLOT.id).halted, true, "still halted: no daily flapping near the line");
  gm.cash = DAILY * 2;
  assert.equal(accrueBuildings(gm), DAILY, "two days of cash restarts it and the day accrues in full");
  assert.equal(buildingAt(gm, "cadiz", PLOT.id).halted, false, "back at work");
  assert.equal(gm.accrued.buildings[KEY], DAILY, "exactly one day accrued after the restart");
});

test("partial staffing spreads fractional batches across days deterministically, charges full cost every day, and save/load mid-cycle changes nothing", () => {
  const runDays = (gm, fromDay, days) => {
    for (let d = fromDay; d < fromDay + days; d++) {
      gm.tick = d * TICKS_PER_DAY;
      workshopTick(gm, "cadiz");
      accrueBuildings(gm);
    }
  };
  const straight = fundedWorkshop(1); // level 1 pattern: one batch every other day fully staffed
  woolTown(straight);
  straight.buildings = { cadiz: { [PLOT.id]: buildingAt(straight, "cadiz", PLOT.id) } }; // drop the seeded town: its houses would add hireable hands
  straight.world.nodes.cadiz.pop = 50; // a hamlet: 50 - 45 town jobs leaves 5 hireable hands for 8 workshop jobs (jobs.test.mjs pins the arithmetic); the game keeps its own world object
  runDays(straight, 0, 32);
  const straightProduced = buildingAt(straight, "cadiz", PLOT.id).produced;
  const straightAccrued = straight.accrued.buildings[KEY];
  assert.equal(straightProduced, Math.floor(5 / 8 * 16), "5/8 staffing over sixteen pattern cycles runs exactly ten batches, spread by the deterministic remainder");
  assert.equal(straightAccrued, DAILY * 32, "every day costs the full fixed cost, batch day or not");

  const split = fundedWorkshop(1);
  woolTown(split);
  split.buildings = { cadiz: { [PLOT.id]: buildingAt(split, "cadiz", PLOT.id) } }; // same isolated hamlet as the straight run
  split.world.nodes.cadiz.pop = 50; // the game keeps its own world object
  runDays(split, 0, 13); // stop mid-cycle
  const saved = serialize(split, split.company ?? {});
  const hamletWorld = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url)))); // the world is data, not save state: reload against the same hamlet
  hamletWorld.nodes.cadiz.pop = 50;
  const restored = deserialize(JSON.parse(JSON.stringify(saved)), hamletWorld).g; // through the wire format, not a shared object
  assert.equal(buildingAt(restored, "cadiz", PLOT.id).produced, buildingAt(split, "cadiz", PLOT.id).produced, "the activity counter survives the round trip");
  assert.equal(restored.accrued.buildings[KEY], split.accrued.buildings[KEY], "the weekly book survives the round trip");
  runDays(restored, 13, 19); // finish the 32 days after the reload
  assert.equal(buildingAt(restored, "cadiz", PLOT.id).produced, straightProduced, "no batch lost or duplicated across the save: the fractional remainder is the tick, not hidden state");
  assert.equal(restored.accrued.buildings[KEY], straightAccrued, "no day charged twice, no day missed");
});
