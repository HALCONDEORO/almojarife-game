// Fish good and fishery building (docs/design/fish-chain.md, step 1 of the production chains plan).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, advanceTick } from "../src/game/game.mjs";
import { BUILDING_TYPES, PRODUCERS, buyOffice, buyPlot, quoteConstruction, startConstruction, buildingAt, cityAllowsProducer, producerRate } from "../src/game/buildings.mjs";
import { RECIPES } from "../src/sim/recipes.mjs";
import { totalDemand } from "../src/sim/classes.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "malaga:13", type: "warehouse", w: 4, d: 5 };
const FISH_TOWNS = world.cities.filter((c) => c.makes.includes("fish")).map((c) => c.id);
const NO_FISH = world.cities.filter((c) => !c.makes.includes("fish")).map((c) => c.id);

test("fish is the one fish good: base price, market rows everywhere, dried fish is retired", () => {
  assert.equal(world.goods.fish.base, 20);
  assert.equal(world.goods.dried_fish, undefined);
  assert.equal(FISH_TOWNS.length, 18); assert.ok(NO_FISH.length > 0);
  const g = newGame(world, "cadiz", { cash: 10000 });
  for (const c of world.cities) assert.ok(g.market[c.id].fish, `market row in ${c.id}`);
  assert.ok(!g.market.sevilla.fish.makes);
  assert.ok(g.market.malaga.fish.makes);
});

test("citizens demand fish (a cheap staple, poor classes most)", () => {
  assert.ok(totalDemand(10000, "fish", 1) > 0);
});

test("fishery is a primary producer buildable only where the city catches fish", () => {
  const spec = BUILDING_TYPES.fishery;
  assert.ok(spec && RECIPES.fishery);
  assert.deepEqual(PRODUCERS.fishery.output, "fish"); assert.equal(PRODUCERS.fishery.primary, true);
  assert.ok(producerRate("fishery", 1) > 0);
  for (const c of FISH_TOWNS) assert.ok(cityAllowsProducer(world, c, "fishery"), c);
  for (const c of NO_FISH) assert.ok(!cityAllowsProducer(world, c, "fishery"), c);
  const g = newGame(world, "cadiz", { cash: 20000 });
  (g.rep ??= {}).malaga = 25; buyOffice(g, "malaga"); buyPlot(g, "malaga", PLOT);
  assert.ok(quoteConstruction(g, "malaga", PLOT.id, "fishery").ok);
});

test("a fishery yields fish into the local market once active", () => {
  const g = newGame(world, "cadiz", { cash: 20000 });
  (g.rep ??= {}).malaga = 25; buyOffice(g, "malaga"); buyPlot(g, "malaga", PLOT);
  assert.ok(startConstruction(g, "malaga", PLOT.id, "fishery").ok);
  while (buildingAt(g, "malaga", PLOT.id).state !== "active") advanceTick(g);
  const stock0 = g.market.malaga.fish.stock, produced0 = buildingAt(g, "malaga", PLOT.id).produced ?? 0;
  for (let i = 0; i < 4; i++) advanceDay(g); // the level-1 pattern runs one batch every two days
  const b = buildingAt(g, "malaga", PLOT.id);
  assert.ok((b.produced ?? 0) > produced0 || g.market.malaga.fish.stock !== stock0, "fish lands in the market");
});

test("fishery state survives a save round-trip", () => {
  const g = newGame(world, "cadiz", { cash: 20000 });
  (g.rep ??= {}).malaga = 25; buyOffice(g, "malaga"); buyPlot(g, "malaga", PLOT);
  startConstruction(g, "malaga", PLOT.id, "fishery");
  const r = deserialize(serialize(g, "T"), world).g;
  assert.deepEqual(buildingAt(r, "malaga", PLOT.id), buildingAt(g, "malaga", PLOT.id));
  assert.ok(r.market.cadiz.fish);
});
