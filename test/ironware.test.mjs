// Ironware and the ironworks (docs/design/production-chains-study.md, step 3): iron + timber -> ironware.
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

test("ironware is a trade good: base price, market rows, makers and needers", () => {
  assert.equal(world.goods.ironware.base, 110);
  const g = newGame(world, "cadiz", { cash: 10000 });
  for (const c of world.cities) assert.ok(g.market[c.id].ironware, `market row in ${c.id}`);
  assert.deepEqual(world.cities.filter((c) => c.makes.includes("ironware")).map((c) => c.id).sort(), ["barcelona", "bilbao"]);
  for (const id of ["sevilla", "lisboa", "valencia", "malaga", "cadiz", "argel"]) assert.ok(g.market[id].ironware.needs, id);
  assert.ok(totalDemand(10000, "ironware", 1) > 0);
  assert.ok(world.cities.filter((c) => c.makes.includes("iron")).some((c) => c.makes.includes("ironware")), "made where iron is");
});

test("ironworks is a processor: 2 iron + 1 timber -> 2 ironware, builds anywhere", () => {
  assert.deepEqual(RECIPES.forge, { iron: 2, timber: 1 }); assert.deepEqual(OUTPUTS.forge, { ironware: 2 });
  const def = PRODUCERS.ironworks;
  assert.equal(def.primary, false); assert.equal(def.output, "ironware"); assert.equal(def.recipe, "forge");
  assert.deepEqual(BUILDING_TYPES.ironworks, { recipe: "ironworks", fee: 250, buildDays: 23, upkeep: 2, maxLevel: 3 });
  assert.ok(RECIPES.ironworks);
  for (const c of world.cities) assert.ok(cityAllowsProducer(world, c.id, "ironworks"), c.id);
});

test("an ironworks buys local iron and timber, sells ironware and earns the margin", () => {
  const g = newGame(world, "cadiz", { cash: 100000 });
  buyPlot(g, "cadiz", P);
  g.buildings.cadiz[P.id] = { type: "ironworks", level: 3, state: "active", plotType: "workshop" };
  for (const k of ["iron", "timber"]) g.market.cadiz[k].stock = g.market.cadiz[k].target * 4; // cheap inputs
  g.market.cadiz.ironware.stock = 0; // dear output
  const iron0 = g.market.cadiz.iron.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "cadiz");
  assert.ok(g.market.cadiz.iron.stock < iron0, "iron consumed");
  assert.ok(g.market.cadiz.ironware.stock > 0, "ironware produced");
  assert.ok(g.cash > cash0, "margin lands in cash");
  assert.ok((g.buildings.cadiz[P.id].produced ?? 0) > 0);
});

test("an ironworks stands idle without iron, and survives a save round-trip", () => {
  const g = newGame(world, "cadiz", { cash: 100000 });
  buyPlot(g, "cadiz", P);
  g.buildings.cadiz[P.id] = { type: "ironworks", level: 2, state: "active", plotType: "workshop" };
  g.market.cadiz.iron.stock = 0;
  const w0 = g.market.cadiz.ironware.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "cadiz");
  assert.equal(g.market.cadiz.ironware.stock, w0); assert.equal(g.cash, cash0);
  const r = deserialize(serialize(g, "T"), world).g;
  assert.deepEqual(r.buildings.cadiz[P.id], g.buildings.cadiz[P.id]);
  assert.ok(r.market.cadiz.ironware);
});
