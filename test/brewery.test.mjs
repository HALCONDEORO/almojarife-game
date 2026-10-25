// Beer and the brewery (docs/design/production-chains-study.md, PR 2): 3 grain -> 2 beer, no hops.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { BUILDING_TYPES, PRODUCERS, buyPlot, cityAllowsProducer, workshopTick } from "../src/game/buildings.mjs";
import { RECIPES, OUTPUTS } from "../src/sim/recipes.mjs";
import { totalDemand } from "../src/sim/classes.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const P = { id: "cadiz:14", type: "workshop", w: 4, d: 5 };

test("beer is a trade good: base price, market rows, no maker city, demand sited in the large ports", () => {
  assert.equal(world.goods.beer.base, 40);
  const g = newGame(world, "cadiz", { cash: 10000 });
  for (const c of world.cities) assert.ok(g.market[c.id].beer, `market row in ${c.id}`);
  // The study sites no historical maker (section 8): the brewery is a processor that builds anywhere.
  assert.equal(world.cities.filter((c) => c.makes.includes("beer")).length, 0);
  const needers = world.cities.filter((c) => c.needs.includes("beer")).map((c) => c.id).sort();
  assert.deepEqual(needers, ["argel", "barcelona", "cadiz", "lisboa", "malaga", "palma", "porto", "sevilla", "tanger", "valencia"]);
  for (const id of needers) assert.ok(g.market[id].beer.needs, id);
  assert.ok(totalDemand(10000, "beer", 1) > 0);
});

test("brewery is a processor: 3 grain -> 2 beer, builds anywhere", () => {
  assert.deepEqual(RECIPES.brew, { grain: 3 }); assert.deepEqual(OUTPUTS.brew, { beer: 2 });
  const def = PRODUCERS.brewery;
  assert.equal(def.primary, false); assert.equal(def.output, "beer"); assert.equal(def.recipe, "brew");
  assert.deepEqual(BUILDING_TYPES.brewery, { recipe: "brewery", fee: 250, buildDays: 28, upkeep: 2, maxLevel: 3 });
  assert.ok(RECIPES.brewery);
  for (const c of world.cities) assert.ok(cityAllowsProducer(world, c.id, "brewery"), c.id);
});

test("a brewery buys local grain, sells beer and earns the margin", () => {
  const g = newGame(world, "cadiz", { cash: 100000 });
  buyPlot(g, "cadiz", P);
  g.buildings.cadiz[P.id] = { type: "brewery", level: 3, state: "active", plotType: "workshop" };
  g.market.cadiz.grain.stock = g.market.cadiz.grain.target * 4; // cheap input
  g.market.cadiz.beer.stock = 0; // dear output
  const grain0 = g.market.cadiz.grain.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "cadiz");
  assert.ok(g.market.cadiz.grain.stock < grain0, "grain consumed");
  assert.ok(g.market.cadiz.beer.stock > 0, "beer produced");
  assert.ok(g.cash > cash0, "margin lands in cash");
  assert.ok((g.buildings.cadiz[P.id].produced ?? 0) > 0);
});

test("a brewery stands idle without grain, and survives a save round-trip", () => {
  const g = newGame(world, "cadiz", { cash: 100000 });
  buyPlot(g, "cadiz", P);
  g.buildings.cadiz[P.id] = { type: "brewery", level: 2, state: "active", plotType: "workshop" };
  g.market.cadiz.grain.stock = 0;
  const b0 = g.market.cadiz.beer.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "cadiz");
  assert.equal(g.market.cadiz.beer.stock, b0); assert.equal(g.cash, cash0);
  const r = deserialize(serialize(g, "T"), world).g;
  assert.deepEqual(r.buildings.cadiz[P.id], g.buildings.cadiz[P.id]);
  assert.ok(r.market.cadiz.beer);
});
