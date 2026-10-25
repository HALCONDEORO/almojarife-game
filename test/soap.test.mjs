// Soap and the soapworks (docs/design/production-chains-study.md, PR 7 row "soapworks + soap"):
// olive oil -> soap. Makers in data: sevilla and cartagena (study section 8 sources, full texts
// read 2026-10-21: Reales Almonas of Triana; Grove Gordillo on the Kingdom of Seville; Panta Rei
// on Cartagena; EPCCM on Baza). Ports of 10000+ need soap (study 4.4: middle and rich classes; sited like beer, PR 2).
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
const P = { id: "sevilla:13", type: "workshop", w: 4, d: 5 };

test("soap is a trade good: base price, market rows, sevilla and cartagena make it, every other port needs it", () => {
  assert.equal(world.goods.soap.base, 60);
  const g = newGame(world, "cadiz", { cash: 10000 });
  for (const c of world.cities) assert.ok(g.market[c.id].soap, `market row in ${c.id}`);
  assert.deepEqual(world.cities.filter((c) => c.makes.includes("soap")).map((c) => c.id).sort(), ["cartagena", "sevilla"]);
  const needers = world.cities.filter((c) => c.needs.includes("soap")).map((c) => c.id);
  assert.equal(needers.length, world.cities.length - 2); // every non-maker port
  for (const c of world.cities) if (c.makes.includes("soap")) assert.ok(!c.needs.includes("soap"), c.id + " makes and needs");
  assert.ok(totalDemand(10000, "soap", 1) > 0);
});

test("soapworks is a processor: 1 olive oil -> 2 soap, builds anywhere", () => {
  assert.deepEqual(RECIPES.boil, { olive_oil: 1 }); assert.deepEqual(OUTPUTS.boil, { soap: 2 });
  const def = PRODUCERS.soapworks;
  assert.equal(def.primary, false); assert.equal(def.output, "soap"); assert.equal(def.recipe, "boil");
  assert.deepEqual(BUILDING_TYPES.soapworks, { recipe: "soapworks", fee: 250, buildDays: 22, upkeep: 2, maxLevel: 3 });
  assert.ok(RECIPES.soapworks);
  for (const c of world.cities) assert.ok(cityAllowsProducer(world, c.id, "soapworks"), c.id);
});

test("a soapworks buys local olive oil, sells soap and earns the margin", () => {
  const g = newGame(world, "sevilla", { cash: 100000 });
  buyPlot(g, "sevilla", P);
  g.buildings.sevilla[P.id] = { type: "soapworks", level: 3, state: "active", plotType: "workshop" };
  g.market.sevilla.olive_oil.stock = g.market.sevilla.olive_oil.target * 4; // cheap input
  g.market.sevilla.soap.stock = 0; // dear output
  const oil0 = g.market.sevilla.olive_oil.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "sevilla");
  assert.ok(g.market.sevilla.olive_oil.stock < oil0, "olive oil consumed");
  assert.ok(g.market.sevilla.soap.stock > 0, "soap produced");
  assert.ok(g.cash > cash0, "margin lands in cash");
  assert.ok((g.buildings.sevilla[P.id].produced ?? 0) > 0);
});

test("a soapworks stands idle without olive oil, and survives a save round-trip", () => {
  const g = newGame(world, "sevilla", { cash: 100000 });
  buyPlot(g, "sevilla", P);
  g.buildings.sevilla[P.id] = { type: "soapworks", level: 2, state: "active", plotType: "workshop" };
  g.market.sevilla.olive_oil.stock = 0;
  const s0 = g.market.sevilla.soap.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "sevilla");
  assert.equal(g.market.sevilla.soap.stock, s0); assert.equal(g.cash, cash0);
  const r = deserialize(serialize(g, "T"), world).g;
  assert.deepEqual(r.buildings.sevilla[P.id], g.buildings.sevilla[P.id]);
  assert.ok(r.market.sevilla.soap);
});
