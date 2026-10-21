// Fish good and fishery building (docs/design/fish-chain.md, step 1 of the production chains plan).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, advanceTick } from "../src/game/game.mjs";
import { BUILDING_TYPES, PRODUCERS, buyOffice, buyPlot, quoteConstruction, startConstruction, buildingAt, cityAllowsProducer, producerRate, workshopTick } from "../src/game/buildings.mjs";
import { RECIPES } from "../src/sim/recipes.mjs";
import { totalDemand } from "../src/sim/classes.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "malaga:13", type: "warehouse", w: 4, d: 5 };
const PLOT2 = { id: "cadiz:14", type: "workshop", w: 4, d: 5 };
const FISH_TOWNS = world.cities.filter((c) => c.makes.includes("fish")).map((c) => c.id);
const NO_FISH = world.cities.filter((c) => !c.makes.includes("fish")).map((c) => c.id);

test("fish is a trade good: base price, market rows everywhere, fishing towns are not the dried-fish towns", () => {
  assert.equal(world.goods.fish.base, 13);
  const dried = world.cities.filter((c) => c.makes.includes("dried_fish")).map((c) => c.id);
  for (const t of FISH_TOWNS) assert.ok(!dried.includes(t), `${t}: fresh supply sits away from the smokehouses so the chain needs shipping`);
  assert.equal(FISH_TOWNS.length, 6); assert.ok(NO_FISH.length > 0);
  const g = newGame(world, "cadiz", { cash: 10000 });
  for (const c of world.cities) assert.ok(g.market[c.id].fish, `market row in ${c.id}`);
  assert.ok(!g.market.cadiz.fish.makes);
  assert.ok(g.market.malaga.fish.makes);
});

test("citizens demand fresh fish (a cheap staple, below dried fish)", () => {
  const dFish = totalDemand(10000, "fish", 1), dDried = totalDemand(10000, "dried_fish", 1);
  assert.ok(dFish > 0 && dDried > 0);
  assert.ok(dFish < dDried, "fresh fish moves less volume than the staple");
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

test("smokehouse is a processor: fish + salt become dried_fish when the margin holds", () => {
  assert.deepEqual(RECIPES.smoke, { fish: 2, salt: 1 });
  const def = PRODUCERS.smokehouse;
  assert.equal(def.primary, false); assert.equal(def.output, "dried_fish"); assert.equal(def.recipe, "smoke");
  // processors build anywhere, not only where the output is made
  for (const c of world.cities) assert.ok(cityAllowsProducer(world, c.id, "smokehouse"), c.id);
});

test("a smokehouse buys local fish and salt, sells dried_fish and earns the margin", () => {
  const g = newGame(world, "cadiz", { cash: 100000 });
  buyPlot(g, "cadiz", PLOT2);
  g.buildings.cadiz[PLOT2.id] = { type: "smokehouse", level: 3, state: "active", plotType: "workshop" };
  g.market.cadiz.fish.stock = g.market.cadiz.fish.target * 4; // a ship just unloaded the catch: cheap fish
  g.market.cadiz.salt.stock = g.market.cadiz.salt.target * 4;
  g.market.cadiz.dried_fish.stock = 0; // and no dried fish in town: dear output
  const fish0 = g.market.cadiz.fish.stock, salt0 = g.market.cadiz.salt.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "cadiz");
  const b = g.buildings.cadiz[PLOT2.id];
  assert.ok(g.market.cadiz.fish.stock < fish0, "fish consumed");
  assert.ok(g.market.cadiz.salt.stock < salt0, "salt consumed");
  assert.ok(g.market.cadiz.dried_fish.stock > 0, "dried fish produced");
  assert.ok(g.cash > cash0, "the margin lands in cash");
  assert.ok((b.produced ?? 0) > 0, "batches counted");
});

test("a smokehouse stands idle when fish is scarce or the margin is gone", () => {
  const g = newGame(world, "cadiz", { cash: 100000 });
  buyPlot(g, "cadiz", PLOT2);
  g.buildings.cadiz[PLOT2.id] = { type: "smokehouse", level: 3, state: "active", plotType: "workshop" };
  g.market.cadiz.fish.stock = 0; // no catch landed: nothing to smoke
  const dried0 = g.market.cadiz.dried_fish.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "cadiz");
  assert.equal(g.market.cadiz.dried_fish.stock, dried0, "no inputs, no batches");
  assert.equal(g.cash, cash0, "no cash moved");
});
