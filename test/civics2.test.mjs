// Second civic batch (docs/design/civic-buildings-2.md): carniceria, molino, corral.
// Same rules as the first batch: citylife flag OFF means the types do not exist at all,
// a halted building helps nobody, and saves round-trip. Numbers are own tuning.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { buyPlot, buyOffice, startConstruction, quoteConstruction, BUILDING_TYPES, CIVIC_BUILDINGS, JOBS_PER_LEVEL } from "../src/game/buildings.mjs";
import { moodTarget, stapleCoverage } from "../src/game/citylife.mjs";
import { RECIPES } from "../src/sim/recipes.mjs";
import { buildOffers } from "../src/view/buildingsview.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, ...opts });
const TYPES = ["carniceria", "molino", "corral"];
const own = (g, cityId, n = 1) => { // office + one plot in the city
  (g.rep ??= {})[cityId] = 5000; g.cash = 1e6; // rep is stored as coins sold (ensureRep migrates once), 5000 coins = 50 points >= the office gate
  const off = buyOffice(g, cityId); assert.ok(off.ok || off.reason === "already owned", "office in " + cityId + ": " + JSON.stringify(off)); // the home port starts with one
  assert.ok(buyPlot(g, cityId, { id: `${cityId}:${n}`, type: "workshop", w: 10, d: 10 }).ok, "plot in " + cityId);
};
const buildActive = (g, cityId, plotId, type) => {
  const r = startConstruction(g, cityId, plotId, type);
  assert.ok(r.ok, JSON.stringify(r));
  do advanceDay(g); while (g.buildings[cityId][plotId].state !== "active");
  return g.buildings[cityId][plotId];
};

test("flag OFF: the new civic types do not exist for the game", () => {
  const g = game();
  own(g, "cadiz");
  for (const t of TYPES) {
    const q = quoteConstruction(g, "cadiz", "cadiz:1", t);
    assert.equal(q.ok, false, t); assert.equal(q.reason, "unknown type", t);
    assert.ok(!buildOffers(g, "cadiz", "cadiz:1").some((o) => o.type === t), t + " hidden with flag off");
  }
});

test("flag ON: types are offered, carry recipe, jobs and the civic tag", () => {
  const g = game({ citylife: true });
  const offers = buildOffers(g, "cadiz", "cadiz:1");
  for (const t of TYPES) {
    assert.ok(CIVIC_BUILDINGS.includes(t), t + " tagged civic");
    assert.ok(BUILDING_TYPES[t] && RECIPES[BUILDING_TYPES[t].recipe], t + " has a recipe");
    assert.ok(JOBS_PER_LEVEL[t] > 0, t + " hires a crew");
    assert.ok(offers.some((o) => o.type === t), t + " offered in cadiz");
  }
  // and a flag-off game hides exactly the civic list it hid before plus these
  const off = game();
  for (const t of TYPES) assert.ok(!buildOffers(off, "cadiz", "cadiz:1").some((o) => o.type === t), t);
});

test("corral needs a big city: refused in Melilla, buildable in Sevilla", () => {
  const g = game({ citylife: true });
  own(g, "melilla", 1);
  const q = quoteConstruction(g, "melilla", "melilla:1", "corral");
  assert.equal(q.ok, false); assert.equal(q.reason, "town too small");
  // but a slaughterhouse or a mill fit a small port fine
  for (const t of ["carniceria", "molino"]) {
    const ok = quoteConstruction(g, "melilla", "melilla:1", t);
    assert.ok(ok.ok, t + " allowed in melilla: " + JSON.stringify(ok));
  }
  own(g, "sevilla", 1);
  assert.ok(quoteConstruction(g, "sevilla", "sevilla:1", "corral").ok, "corral allowed in sevilla");
});

test("molino adds exactly its grain buffer to the staple reading", () => {
  const g = game({ citylife: true });
  own(g, "cadiz");
  const b = buildActive(g, "cadiz", "cadiz:1", "molino");
  g.market.cadiz.grain.stock = g.market.cadiz.grain.target; // full grain: the buffer counts in full
  b.halted = true; const off = stapleCoverage(g, "cadiz");
  b.halted = false; const on = stapleCoverage(g, "cadiz");
  assert.ok(Math.abs(on - off - 0.15 / 4) < 1e-9, `level 1 with full grain adds 0.15/4: ${off} -> ${on}`);
  g.market.cadiz.grain.stock = 0; // no grain, nothing to mill
  const starved = stapleCoverage(g, "cadiz");
  assert.ok(Math.abs(starved - (off - 1.0 / 4)) < 1e-9, `level 1 with zero grain adds nothing: ${off} -> ${starved}`);
});

test("molino lifts the hunger cap when its buffer crosses the line", () => {
  const g = game({ citylife: true });
  own(g, "cadiz");
  const b = buildActive(g, "cadiz", "cadiz:1", "molino");
  for (let lvl = 2; lvl <= 3; lvl++) { // upgrade to level 3
    const r = startConstruction(g, "cadiz", "cadiz:1", "molino");
    assert.ok(r.ok, "upgrade to " + lvl + ": " + JSON.stringify(r));
    do advanceDay(g); while (g.buildings.cadiz["cadiz:1"].state !== "active");
  }
  assert.equal(g.buildings.cadiz["cadiz:1"].level, 3);
  // every staple hovering at 55% coverage: under the hunger line without the mill
  for (const good of ["grain", "fish", "meat", "olive_oil"]) g.market.cadiz[good].stock = Math.round(g.market.cadiz[good].target * 0.55);
  for (const [good, e] of Object.entries(g.market.cadiz)) if (!["fish", "meat", "olive_oil", "grain"].includes(good)) e.stock = e.target;
  b.halted = true; const capped = moodTarget(g, "cadiz", "poor");
  b.halted = false; const lifted = moodTarget(g, "cadiz", "poor");
  assert.ok(capped <= 35, "without the mill the hunger cap holds: " + capped);
  // and a mill with no grain at all grinds nothing: the buffer scales with the raw coverage
  g.market.cadiz.grain.stock = 0;
  g.market.cadiz.fish.stock = 0; g.market.cadiz.meat.stock = 0; g.market.cadiz.olive_oil.stock = 0;
  const starved = moodTarget(g, "cadiz", "poor");
  assert.ok(starved <= 35, "no grain, no bread: the mill lifts nothing on empty stocks: " + starved);
  for (const good of ["grain", "fish", "meat", "olive_oil"]) g.market.cadiz[good].stock = Math.round(g.market.cadiz[good].target * 0.55);
  assert.ok(lifted > capped, `level 3 buffer (3 x 0.15 on grain) crosses the line: ${capped} -> ${lifted}`);
});

test("carniceria steadies meat and fish and cheers the poor; halted it does nothing", () => {
  const g = game({ citylife: true });
  own(g, "cadiz");
  const b = buildActive(g, "cadiz", "cadiz:1", "carniceria");
  // protein scarce, the rest stocked: the market alone leaves the city hungry
  g.market.cadiz.meat.stock = 0; g.market.cadiz.fish.stock = 0;
  for (const good of ["grain", "olive_oil"]) g.market.cadiz[good].stock = g.market.cadiz[good].target;
  const halted = (b.halted = true, moodTarget(g, "cadiz", "poor"));
  const active = (b.halted = false, moodTarget(g, "cadiz", "poor"));
  assert.ok(halted <= 35 && active <= 35, `a hungry city stays capped, the butcher's cheer never masks hunger: ${halted} -> ${active}`);
  // fed city: the same butcher lifts the poor by its level
  for (const e of Object.values(g.market.cadiz)) e.stock = e.target;
  const haltedFed = (b.halted = true, moodTarget(g, "cadiz", "poor"));
  const activeFed = (b.halted = false, moodTarget(g, "cadiz", "poor"));
  assert.ok(activeFed >= haltedFed + 2, `carniceria lifts the poor when the city is fed: ${haltedFed} -> ${activeFed}`);
});

test("corral lifts rich and middle moods by its level, poor not at all", () => {
  const g = game({ citylife: true });
  own(g, "sevilla");
  const b = buildActive(g, "sevilla", "sevilla:1", "corral");
  // a fully stocked market: no caps, so the deltas are exactly the tuning figures
  for (const e of Object.values(g.market.sevilla)) e.stock = e.target;
  b.halted = true;
  const rich0 = moodTarget(g, "sevilla", "rich"), mid0 = moodTarget(g, "sevilla", "middle"), poor0 = moodTarget(g, "sevilla", "poor");
  b.halted = false;
  assert.equal(moodTarget(g, "sevilla", "rich") - rich0, 4, "rich +4 per level");
  assert.equal(moodTarget(g, "sevilla", "middle") - mid0, 2, "middle +2 per level");
  assert.equal(moodTarget(g, "sevilla", "poor"), poor0, "poor unmoved by a playhouse");
});

test("the new civics survive a save/load with their effects", () => {
  const a = game({ citylife: true });
  own(a, "cadiz");
  buildActive(a, "cadiz", "cadiz:1", "carniceria");
  own(a, "sevilla");
  buildActive(a, "sevilla", "sevilla:1", "corral");
  for (const e of Object.values(a.market.sevilla)) e.stock = e.target;
  const richA = moodTarget(a, "sevilla", "rich");
  const { g: b } = deserialize(JSON.parse(JSON.stringify(serialize(a, "Casa Oro"))), world);
  assert.equal(b.buildings.cadiz["cadiz:1"].type, "carniceria");
  assert.equal(b.buildings.sevilla["sevilla:1"].type, "corral");
  for (const e of Object.values(b.market.sevilla)) e.stock = e.target;
  assert.equal(moodTarget(b, "sevilla", "rich"), richA, "same lift after the round trip");
});
