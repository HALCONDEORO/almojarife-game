// Bread and the bakery (docs/design/bakery.md): grain -> bread processor.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { BUILDING_TYPES, PRODUCERS, buyPlot, cityAllowsProducer, workshopTick } from "../src/game/buildings.mjs";
import { RECIPES, OUTPUTS } from "../src/sim/recipes.mjs";
import { totalDemand } from "../src/sim/classes.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "valencia:14", type: "workshop", w: 4, d: 5 };

test("bread is a trade good: base price, market rows, makers and needers", () => {
  assert.equal(world.goods.bread.base, 30);
  const g = newGame(world, "cadiz", { cash: 10000 });
  for (const c of world.cities) assert.ok(g.market[c.id].bread, `market row in ${c.id}`);
  assert.deepEqual(world.cities.filter((c) => c.makes.includes("bread")).map((c) => c.id).sort(), ["oran", "valencia"]);
  for (const id of ["sevilla", "lisboa", "barcelona"]) assert.ok(g.market[id].bread.needs, id);
  assert.ok(totalDemand(10000, "bread", 1) > 0);
});

test("bakery is a processor: 3 grain -> 3 bread, builds anywhere", () => {
  assert.deepEqual(RECIPES.bake, { grain: 3 }); assert.deepEqual(OUTPUTS.bake, { bread: 3 });
  const def = PRODUCERS.bakery;
  assert.equal(def.primary, false); assert.equal(def.output, "bread"); assert.equal(def.recipe, "bake");
  assert.ok(BUILDING_TYPES.bakery && RECIPES.bakery);
  for (const c of world.cities) assert.ok(cityAllowsProducer(world, c.id, "bakery"), c.id);
});

test("a bakery buys local grain, sells bread and earns the margin", () => {
  const g = newGame(world, "cadiz", { cash: 100000 });
  buyPlot(g, "cadiz", { ...PLOT, id: "cadiz:14" });
  g.buildings.cadiz["cadiz:14"] = { type: "bakery", level: 3, state: "active", plotType: "workshop" };
  g.market.cadiz.grain.stock = g.market.cadiz.grain.target * 4; // cheap grain
  g.market.cadiz.bread.stock = 0;                               // dear bread
  const grain0 = g.market.cadiz.grain.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "cadiz");
  assert.ok(g.market.cadiz.grain.stock < grain0, "grain consumed");
  assert.ok(g.market.cadiz.bread.stock > 0, "bread produced");
  assert.ok(g.cash > cash0, "margin lands in cash");
  assert.ok((g.buildings.cadiz["cadiz:14"].produced ?? 0) > 0);
});

test("a bakery stands idle without grain", () => {
  const g = newGame(world, "cadiz", { cash: 100000 });
  buyPlot(g, "cadiz", { ...PLOT, id: "cadiz:14" });
  g.buildings.cadiz["cadiz:14"] = { type: "bakery", level: 3, state: "active", plotType: "workshop" };
  g.market.cadiz.grain.stock = 0;
  const bread0 = g.market.cadiz.bread.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "cadiz");
  assert.equal(g.market.cadiz.bread.stock, bread0); assert.equal(g.cash, cash0);
});
