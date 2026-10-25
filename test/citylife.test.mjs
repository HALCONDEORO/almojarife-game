// City-life module: per-class mood, weekly population drift, civic buildings (posito,
// hospital, alhondiga). The flag ships ON by default (24/10): a game without the citylife
// state (flag off) must be untouched. Rents and mortality are deliberately NOT coded (source: unverified).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { buyPlot, buyOffice, startConstruction, BUILDING_TYPES, freeLabor } from "../src/game/buildings.mjs";
import { initCitylife, citylifeDay, moodTarget, meanMood, citylifeExtra, moodWord } from "../src/game/citylife.mjs";
import { RECIPES } from "../src/sim/recipes.mjs";
import { buildOffers } from "../src/view/buildingsview.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, ...opts });
const ownHouse = (g) => { // give the company an active level-1 house in Cadiz
  (g.rep ??= {}).cadiz = 100; g.cash = 1e6; buyOffice(g, "cadiz");
  buyPlot(g, "cadiz", { id: "cadiz:1", type: "house", w: 10, d: 10 });
  const r = startConstruction(g, "cadiz", "cadiz:1", "house");
  assert.ok(r.ok, JSON.stringify(r));
  do advanceDay(g); while (g.buildings.cadiz["cadiz:1"].state !== "active");
};

test("flag OFF: no state is created and days pass with the city untouched", () => {
  const g = game({ citylife: false }); // OFF pinned explicitly: the flag ships ON by default (24/10)
  assert.equal(g.citylife, undefined);
  const cadizPop = world.nodes.cadiz.pop;
  for (let i = 0; i < 30; i++) advanceDay(g);
  assert.equal(g.citylife, undefined);
  assert.equal(citylifeExtra(g, "cadiz"), 0);
  assert.equal(moodWord(g, "cadiz"), null);
  assert.equal(world.nodes.cadiz.pop, cadizPop);
});

test("flag ON: every city gets mood state and civic buildings appear in the offers", () => {
  const g = game({ citylife: true });
  assert.ok(g.citylife.cities.cadiz && g.citylife.cities.sevilla);
  const offers = buildOffers(g, "cadiz", "cadiz:1");
  for (const t of ["posito", "hospital", "alhondiga"]) assert.ok(offers.some((o) => o.type === t), t + " offered with flag on");
  for (const t of ["posito", "hospital", "alhondiga"]) assert.ok(BUILDING_TYPES[t] && RECIPES[BUILDING_TYPES[t].recipe], t + " has a construction recipe");
  const off = game({ citylife: false }); // flag-off case pinned explicitly (default is ON since 24/10)
  for (const t of ["posito", "hospital", "alhondiga"]) assert.ok(!buildOffers(off, "cadiz", "cadiz:1").some((o) => o.type === t), t + " hidden with flag off");
});

test("mood: a stocked city drifts up from the start; hunger caps the target", () => {
  const g = game({ citylife: true });
  for (let i = 0; i < 60; i++) { g.day++; citylifeDay(g); }
  assert.ok(meanMood(g, "cadiz") > 60, "a stocked city cheers up: " + meanMood(g, "cadiz"));
  for (const good of ["grain", "fish", "meat", "olive_oil"]) g.market.cadiz[good].stock = 0;
  assert.ok(moodTarget(g, "cadiz", "poor") <= 35, "hunger caps the poor target");
});

test("growth: a content city with houses gains people, bounded by the room they give", () => {
  const g = game({ citylife: true });
  ownHouse(g);
  for (let i = 0; i < 40 * 7; i++) advanceDay(g); // plenty of weeks at a good mood
  const extra = citylifeExtra(g, "cadiz");
  assert.ok(extra > 0, "newcomers arrived, extra=" + extra);
  assert.ok(extra <= 100, "bounded by the room of one house level");
  assert.ok(freeLabor(g, "cadiz") > 0);
});

test("growth: without houses there is no room for newcomers", () => {
  const g = game({ citylife: true });
  for (let i = 0; i < 20 * 7; i++) advanceDay(g);
  assert.ok(citylifeExtra(g, "cadiz") <= 0, "no houses, no growth: " + citylifeExtra(g, "cadiz"));
});

test("drift: chronic dearth stagnates a city but does not empty it (measured 24/10: emigration under chronic hunger deflated the whole economy)", () => {
  const g = game({ citylife: true });
  for (const good of ["grain", "fish", "meat", "olive_oil"]) g.market.cadiz[good].stock = Math.round(g.market.cadiz[good].target * 0.5); // scarce, above the acute line
  for (let i = 0; i < 12 * 7; i++) { g.day++; citylifeDay(g); }
  assert.ok(meanMood(g, "cadiz") < 55, "the city is unhappy under the hunger cap: " + meanMood(g, "cadiz"));
  assert.equal(citylifeExtra(g, "cadiz"), 0, "twelve weeks of chronic dearth: nobody leaves (and no houses, no growth)");
});

test("drift: an acute famine empties a city, and a working posito slows the leaving", () => {
  const starved = () => { const g = game({ citylife: true }); for (const good of ["grain", "fish", "meat", "olive_oil"]) g.market.cadiz[good].stock = 0; return g; };
  const bare = starved();
  for (let i = 0; i < 12 * 7; i++) { bare.day++; citylifeDay(bare); }
  const bareLoss = -citylifeExtra(bare, "cadiz");
  assert.ok(bareLoss > 0, "an acute famine drives people out: " + bareLoss);
  const fed = starved();
  fed.buildings = { cadiz: { "cadiz:3": { type: "posito", level: 3, state: "active" } } };
  for (let i = 0; i < 12 * 7; i++) { fed.day++; citylifeDay(fed); }
  const fedLoss = -citylifeExtra(fed, "cadiz");
  assert.ok(fedLoss > 0 && fedLoss < bareLoss, "a level-3 posito slows the leaving: " + fedLoss + " < " + bareLoss);
});

test("civic effects: hospital lifts only the poor (more in hard times), alhondiga the middle, posito steadies staples", () => {
  const g = game({ citylife: true });
  g.buildings = { cadiz: { "cadiz:1": { type: "hospital", level: 1, state: "active" }, "cadiz:2": { type: "alhondiga", level: 1, state: "active" }, "cadiz:3": { type: "posito", level: 1, state: "active" } } };
  const poorWith = moodTarget(g, "cadiz", "poor"), middleWith = moodTarget(g, "cadiz", "middle"), richWith = moodTarget(g, "cadiz", "rich");
  g.buildings.cadiz = {};
  const poorBare = moodTarget(g, "cadiz", "poor"), middleBare = moodTarget(g, "cadiz", "middle"), richBare = moodTarget(g, "cadiz", "rich");
  assert.equal(poorWith - poorBare, 4, "hospital level 1 lifts the poor by 4");
  assert.equal(middleWith - middleBare, 3, "alhondiga level 1 lifts the middle by 3");
  assert.equal(richWith, richBare, "the rich get nothing from either");
  for (const good of ["grain", "fish", "meat", "olive_oil"]) g.market.cadiz[good].stock = Math.round(g.market.cadiz[good].target * 0.45); // scarce but not empty
  const cappedBare = moodTarget(g, "cadiz", "poor");
  assert.ok(cappedBare <= 35, "partial hunger still caps the target");
  g.buildings.cadiz = { "cadiz:3": { type: "posito", level: 3, state: "active" } };
  assert.ok(moodTarget(g, "cadiz", "poor") > cappedBare, "a level-3 posito lifts the staple reading past the hunger cap");
});

test("no rent is coded: a house changes no cash beyond its normal costs", () => {
  const g = game({ citylife: true });
  ownHouse(g);
  const before = g.cash;
  for (let i = 0; i < 50; i++) advanceDay(g);
  assert.ok(g.cash < before + 1, "houses pay no rent (cash " + before + " -> " + g.cash + ")");
});

test("OFF parity: 200 days with the flag off evolve identically and untouched by the module", () => {
  const a = game({ citylife: false }), b = game({ citylife: false }); // OFF pinned explicitly (the flag ships ON by default since 24/10)
  assert.equal(a.citylife, undefined);
  assert.equal(b.citylife, undefined);
  for (let i = 0; i < 200; i++) { advanceDay(a); advanceDay(b); }
  assert.equal(a.citylife, undefined);
  assert.equal(b.citylife, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify({ ...a, world: undefined })), JSON.parse(JSON.stringify({ ...b, world: undefined })));
});

// Real OFF parity, not just determinism: these golden numbers were produced by the base code
// (main d58197d, before the module existed) running this exact scenario. If the module leaks
// any state, effect or rounding into a flag-off game, one of them moves.
test("OFF parity vs base code: golden market and cash figures of the pre-module build", () => {
  // the golden figures were recorded with every optional module off; pin them off explicitly now that content flags default ON (owner directive 2026-10-23)
  const g = game({ kidMeat: false, credit: false, foreclosure: false, legumes: false, pottery: false, pirateFight: false, marque: false, plague: false, citylife: false }); // citylife pinned off too since 24/10 (flag ships ON by default): this golden verifies the pre-module baseline
  for (let i = 0; i < 60; i++) advanceDay(g);
  assert.deepEqual(
    { day: g.day, cash: g.cash, cadiz_grain: g.market.cadiz.grain.stock, cadiz_wine: g.market.cadiz.wine.stock, sevilla_grain: g.market.sevilla.grain.stock, sevilla_pop: g.market.sevilla.grain.pop, lisboa_beer: g.market.lisboa.beer.stock },
    { day: 60, cash: 1888, cadiz_grain: 100, cadiz_wine: 124, sevilla_grain: 297, sevilla_pop: 40000, lisboa_beer: 269 });
  // golden moved 121 -> 124 in cadiz_wine when saffron became NPC-tradeable (owner call 2026-10-24, the saffron-npc-trade PR):
  // verified main (saffron player-only) still reproduces 121 exactly and ONLY this cell moves.
});

test("flag OFF: civic types cannot be built even by a direct startConstruction call", () => {
  const g = game({ citylife: false }); // OFF pinned explicitly: the flag ships ON by default (24/10)
  (g.rep ??= {}).cadiz = 100; g.cash = 1e6; buyOffice(g, "cadiz");
  buyPlot(g, "cadiz", { id: "cadiz:1", type: "house", w: 10, d: 10 });
  for (const t of ["posito", "hospital", "alhondiga"]) {
    const r = startConstruction(g, "cadiz", "cadiz:1", t);
    assert.ok(!r.ok && r.reason === "unknown type", t + " refused without the flag");
  }
});

test("a halted hospital lifts nobody", () => {
  const g = game({ citylife: true });
  g.buildings = { cadiz: { "cadiz:1": { type: "hospital", level: 2, state: "active", halted: true } } };
  const withHalted = moodTarget(g, "cadiz", "poor");
  g.buildings.cadiz["cadiz:1"].halted = false;
  const withWorking = moodTarget(g, "cadiz", "poor");
  g.buildings.cadiz = {};
  assert.equal(withHalted, moodTarget(g, "cadiz", "poor"), "halted = no effect");
  assert.equal(withWorking - withHalted, 8, "working level 2 lifts the poor by 8");
});

test("save round trip with the flag ON keeps the city evolving identically", () => {
  const a = game({ citylife: true });
  for (let i = 0; i < 30; i++) advanceDay(a);
  const { g: b } = deserialize(JSON.parse(JSON.stringify(serialize(a, "Casa Oro"))), world);
  assert.ok(b.citylife?.cities?.cadiz, "citylife state survives the round trip");
  for (let i = 0; i < 30; i++) { advanceDay(a); advanceDay(b); }
  assert.deepEqual(JSON.parse(JSON.stringify({ ...b, world: undefined })), JSON.parse(JSON.stringify({ ...a, world: undefined })));
});
