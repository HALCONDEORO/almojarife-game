// Pottery and the kiln (docs/design/production-chains-study.md, pottery A: 2 timber -> 2 pottery). Optional good: only in games started with {pottery:true}.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { BUILDING_TYPES, PRODUCERS, buyPlot, cityAllowsProducer, producerCities, workshopTick } from "../src/game/buildings.mjs";
import { buildOffers } from "../src/view/buildingsview.mjs";
import { RECIPES, OUTPUTS } from "../src/sim/recipes.mjs";
import { PER_1000, OPTIONAL_PER_1000, demandBy } from "../src/sim/classes.mjs";
import { withPottery, POTTERY } from "../src/sim/optional_goods.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const P = { id: "sevilla:13", type: "workshop", w: 4, d: 5 };

test("flag OFF is the default: no pottery in the world, markets, demand table or build offers", () => {
  assert.equal("pottery" in world.goods, false); assert.equal("pottery" in PER_1000, false);
  const g = newGame(world, "sevilla", { cash: 100000, freePlay: true });
  assert.equal(g.pottery, false); assert.equal(g.market.sevilla.pottery, undefined); assert.equal(g.world, world);
  assert.deepEqual(producerCities(world, "pottery"), []);
  buyPlot(g, "sevilla", P);
  assert.equal(buildOffers(g, "sevilla", P.id).some((o) => o.type === "pottery"), false, "no kiln offer without the good");
  assert.equal(cityAllowsProducer(world, "sevilla", "pottery"), false);
});

test("flag OFF parity: absent, false and 1 play the same 120 days, byte for byte", () => {
  const run = (o) => { const g = newGame(world, "cadiz", { freePlay: true, seed: 5, ...o }); for (let d = 0; d < 120; d++) advanceDay(g); const { kidMeat, legumes, pottery, ...r } = g; return JSON.stringify({ ...r, world: undefined }); };
  assert.equal(run({}), run({ pottery: false })); assert.equal(run({}), run({ pottery: 1 }));
});

test("withPottery leaves the loaded world untouched and adds only the sourced makers", () => {
  const before = JSON.stringify(world); const w = withPottery(world);
  assert.equal(JSON.stringify(world), before);
  assert.equal(w.goods.pottery.base, 40);
  assert.deepEqual(w.cities.filter((c) => c.makes.includes("pottery")).map((c) => c.id).sort(), ["sevilla", "valencia"]); // Triana and Manises; porto has no source
  for (const id of POTTERY.consumers) assert.ok(w.cities.find((c) => c.id === id).needs.includes("pottery"), id);
});

test("flag ON: kiln is a processor 2 timber -> 2 pottery, builds anywhere, class demand 0.1/0.3/0.4", () => {
  assert.deepEqual(RECIPES.kiln, { timber: 2 }); assert.deepEqual(OUTPUTS.kiln, { pottery: 2 });
  assert.equal(PRODUCERS.pottery.primary, false); assert.equal(PRODUCERS.pottery.output, "pottery");
  assert.deepEqual(BUILDING_TYPES.pottery, { recipe: "pottery", fee: 250, buildDays: 4, upkeep: 2, maxLevel: 3 }); assert.ok(RECIPES.pottery);
  const k = OPTIONAL_PER_1000.pottery; assert.deepEqual([k.poor, k.middle, k.rich], [0.1, 0.3, 0.4]);
  assert.ok(demandBy(40000, "pottery", 1).rich > 0);
  const g = newGame(world, "sevilla", { cash: 100000, freePlay: true, pottery: true }); g.cash = 100000;
  for (const c of g.world.cities) assert.ok(g.market[c.id].pottery, c.id);
  for (const c of g.world.cities) assert.ok(cityAllowsProducer(g.world, c.id, "pottery"), c.id);
  buyPlot(g, "sevilla", P);
  assert.equal(buildOffers(g, "sevilla", P.id).some((o) => o.type === "pottery"), true);
});

test("a kiln buys local timber, sells pottery and earns the margin; idle without timber; save round-trip", () => {
  const g = newGame(world, "sevilla", { cash: 100000, freePlay: true, pottery: true });
  buyPlot(g, "sevilla", P);
  g.buildings.sevilla[P.id] = { type: "pottery", level: 3, state: "active", plotType: "workshop" };
  g.market.sevilla.timber.stock = g.market.sevilla.timber.target * 4; g.market.sevilla.pottery.stock = 0;
  const t0 = g.market.sevilla.timber.stock, cash0 = g.cash;
  g.tick = 1; workshopTick(g, "sevilla");
  assert.ok(g.market.sevilla.timber.stock < t0, "timber consumed"); assert.ok(g.market.sevilla.pottery.stock > 0, "pottery produced");
  assert.ok(g.cash > cash0, "margin lands in cash"); assert.ok((g.buildings.sevilla[P.id].produced ?? 0) > 0);
  const r = deserialize(serialize(g, "T"), world).g;
  assert.equal(r.pottery, true); assert.ok(r.world.goods.pottery); assert.ok(r.market.sevilla.pottery);
  assert.deepEqual(r.buildings.sevilla[P.id], g.buildings.sevilla[P.id]);
  g.market.sevilla.timber.stock = 0; const p0 = g.market.sevilla.pottery.stock, c1 = g.cash; g.tick = 2; workshopTick(g, "sevilla");
  assert.equal(g.market.sevilla.pottery.stock, p0); assert.equal(g.cash, c1);
});
