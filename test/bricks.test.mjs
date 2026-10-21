// Bricks and the brickworks (docs/design/production-chains-study.md, step 3): timber -> bricks.
// Bricks are a construction material: no citizen demand, and no maker city is named until a clay
// source is cited (study 4.4 and 8). Construction quotes start drawing bricks in the plan's PR5;
// until then the brickworks only fires where a player has drained the local stock.
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

test("bricks is a trade good: base price and market rows everywhere, no maker city, no citizen demand", () => {
  assert.equal(world.goods.bricks.base, 30);
  const g = newGame(world, "cadiz", { cash: 10000 });
  for (const c of world.cities) assert.ok(g.market[c.id].bricks, `market row in ${c.id}`);
  assert.ok(world.cities.every((c) => !c.makes.includes("bricks")), "no clay port is named until a source is cited (study 4.4)");
  assert.ok(world.cities.every((c) => !c.needs.includes("bricks")), "construction, not citizens, draws bricks (PR5)");
  assert.equal(totalDemand(10000, "bricks", 1), 0);
});

test("brickworks is a processor: 2 timber -> 2 bricks, builds anywhere", () => {
  assert.deepEqual(RECIPES.firing, { timber: 2 }); assert.deepEqual(OUTPUTS.firing, { bricks: 2 });
  const def = PRODUCERS.brickworks;
  assert.equal(def.primary, false); assert.equal(def.output, "bricks"); assert.equal(def.recipe, "firing");
  assert.deepEqual(BUILDING_TYPES.brickworks, { recipe: "brickworks", fee: 250, buildDays: 4, upkeep: 2, maxLevel: 3 });
  assert.deepEqual(RECIPES.brickworks, { timber: 12, iron: 2 });
  for (const c of world.cities) assert.ok(cityAllowsProducer(world, c.id, "brickworks"), c.id);
});

test("a brickworks buys local timber, sells bricks and earns the margin when the stock is drained", () => {
  const g = newGame(world, "cadiz", { cash: 100000 });
  buyPlot(g, "cadiz", P);
  g.buildings.cadiz[P.id] = { type: "brickworks", level: 3, state: "active", plotType: "workshop" };
  g.market.cadiz.timber.stock = g.market.cadiz.timber.target * 4; // cheap input
  g.market.cadiz.bricks.stock = 0; // dear output: a port mid construction boom
  const timber0 = g.market.cadiz.timber.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "cadiz");
  assert.ok(g.market.cadiz.timber.stock < timber0, "timber consumed");
  assert.ok(g.market.cadiz.bricks.stock > 0, "bricks produced");
  assert.ok(g.cash > cash0, "margin lands in cash");
  assert.ok((g.buildings.cadiz[P.id].produced ?? 0) > 0);
});

test("a brickworks stands idle without timber, and survives a save round-trip", () => {
  const g = newGame(world, "cadiz", { cash: 100000 });
  buyPlot(g, "cadiz", P);
  g.buildings.cadiz[P.id] = { type: "brickworks", level: 2, state: "active", plotType: "workshop" };
  g.market.cadiz.timber.stock = 0;
  const b0 = g.market.cadiz.bricks.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "cadiz");
  assert.equal(g.market.cadiz.bricks.stock, b0); assert.equal(g.cash, cash0);
  const r = deserialize(serialize(g, "T"), world).g;
  assert.deepEqual(r.buildings.cadiz[P.id], g.buildings.cadiz[P.id]);
  assert.ok(r.market.cadiz.bricks);
});
