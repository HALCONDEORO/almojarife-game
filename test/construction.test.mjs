// Construction draws timber, bricks and tools (docs/design/construction.md, production chains PR 5).
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { BUILDING_TYPES } from "../src/game/buildings.mjs";
import { totalDemand } from "../src/sim/classes.mjs";
import { RECIPES, quoteRecipe } from "../src/sim/recipes.mjs";

const world = loadWorld();

test("every building recipe needs timber and bricks, and tools except the house", () => {
  for (const [type, spec] of Object.entries(BUILDING_TYPES)) {
    const r = RECIPES[spec.recipe];
    assert.ok(r.timber > 0 && r.bricks > 0, `${type}: timber and bricks`);
    if (type !== "house") assert.ok(r.ironware > 0, `${type}: tools`);
    assert.equal(r.iron, undefined, `${type}: iron is replaced by tools`);
  }
});

test("bricks have citizen demand and a warehouse quote draws them", () => {
  const g = newGame(world, "cadiz", { freePlay: true });
  assert.ok(totalDemand(10000, "bricks", 1) > 0);
  const q = quoteRecipe(world, g.market, "sevilla", "warehouse", 1);
  assert.ok(q.ok && q.inputs.bricks === 16 && q.inputs.ironware === 1);
});
