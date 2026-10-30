// City-life rule pinning, second layer: exact numbers for the pieces the behaviour
// suite (citylife.test.mjs) covers only loosely - coverage math, civic buffers, mood
// thresholds, mood penalties, memory rate, weekly cadence, and the shrink floor.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { initCitylife, citylifeDay, moodTarget, meanMood, citylifeExtra, moodWord, classCoverage, stapleCoverage } from "../src/game/citylife.mjs";
import { CLASSES, PER_1000, classShares } from "../src/sim/classes.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, ...opts });
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, msg + ": " + a + " vs " + b);
const stockAll = (g, stock, target = 100) => { for (const good of Object.keys(PER_1000)) g.market.cadiz[good] = { stock, target }; };

test("classCoverage is the weight-averaged per-good coverage, each good capped at 1.5", () => {
  const row = {};
  for (const good of Object.keys(PER_1000)) row[good] = { stock: 300, target: 100 }; // raw 3.0, capped to 1.5
  row.grain = { stock: 50, target: 100 }; // raw 0.5, under the cap
  for (const cls of CLASSES) {
    let num = 0, den = 0;
    for (const [good, w] of Object.entries(PER_1000)) {
      const weight = w[cls] ?? 0; if (weight <= 0) continue;
      num += weight * (good === "grain" ? 0.5 : 1.5); den += weight;
    }
    near(classCoverage(row, cls), num / den, cls + " weighted coverage with the 1.5 cap");
  }
  assert.equal(classCoverage({}, "poor"), 0, "an empty market row covers nothing");
});

test("civic buffers scale with what the market actually has; the posito alone fills a real gap", () => {
  const fake = (buildings, grain, meat) => ({ market: { cadiz: { grain: { stock: grain, target: 100 }, fish: { stock: 0, target: 100 }, meat: { stock: meat, target: 100 }, olive_oil: { stock: 0, target: 100 } } }, buildings: { cadiz: buildings } });
  const molino = { "cadiz:1": { type: "molino", level: 2, state: "active" } };
  assert.equal(stapleCoverage(fake(molino, 0, 0), "cadiz"), 0, "a mill cannot grind grain the market does not have");
  near(stapleCoverage(fake(molino, 50, 0), "cadiz"), (0.5 + 0.15 * 2 * 0.5) / 4, "mill buffer scales with the raw grain coverage");
  near(stapleCoverage(fake(molino, 110, 0), "cadiz"), Math.min(1.5, 1.1 + 0.15 * 2 * 1) / 4, "past full coverage the buffer stops growing with the raw reading");
  const halted = { "cadiz:1": { type: "molino", level: 2, state: "active", halted: true } };
  assert.equal(stapleCoverage(fake(halted, 50, 0), "cadiz"), 0.5 / 4, "a halted mill helps nobody");
  const carniceria = { "cadiz:1": { type: "carniceria", level: 1, state: "active" } };
  near(stapleCoverage(fake(carniceria, 0, 30), "cadiz"), (0.3 + 0.1 * 1 * 0.3) / 4, "the butcher buffer scales with the raw meat coverage");
  const posito = { "cadiz:1": { type: "posito", level: 2, state: "active" } };
  near(stapleCoverage(fake(posito, 0, 0), "cadiz"), 0.1 * 2, "the posito's stores fill the gap on top, stocks or no stocks");
});

test("moodWord thresholds: 75 contenta, 55 tranquila, 40 inquieta, below furiosa", () => {
  const fake = (m) => ({ citylife: { cities: { x: { animo: { poor: m, middle: m, rich: m }, extra: 0 } } }, world: { nodes: { x: { pop: 1000 } } }, buildings: {} });
  assert.equal(moodWord(fake(75), "x"), "contenta");
  assert.equal(moodWord(fake(74.99), "x"), "tranquila");
  assert.equal(moodWord(fake(55), "x"), "tranquila");
  assert.equal(moodWord(fake(54.99), "x"), "inquieta");
  assert.equal(moodWord(fake(40), "x"), "inquieta");
  assert.equal(moodWord(fake(39.99), "x"), "furiosa");
  assert.equal(moodWord({ world: { nodes: { x: { pop: 1000 } } } }, "x"), null, "flag off: no word");
});

test("meanMood weights the classes by the city mix; flag off reads null", () => {
  const g = { citylife: { cities: { cadiz: { animo: { poor: 80, middle: 60, rich: 40 }, extra: 0 } } }, world: { nodes: { cadiz: { pop: 12000 } } }, buildings: {} };
  const s = classShares(12000);
  near(meanMood(g, "cadiz"), s.poor * 80 + s.middle * 60 + s.rich * 40, "weighted by the class shares of 12000 souls");
  assert.equal(meanMood({ world: { nodes: { cadiz: { pop: 12000 } } } }, "cadiz"), null, "flag off: no mean mood");
});

test("moodTarget: an active shock costs exactly 15 and doubles the hospital's comfort", () => {
  const g = game({ citylife: true });
  stockAll(g, 100); // full coverage: every class target starts at 80
  const t0 = moodTarget(g, "cadiz", "poor");
  g.buildings = { cadiz: { "cadiz:9": { type: "hospital", level: 1, state: "active" } } };
  assert.equal(moodTarget(g, "cadiz", "poor") - t0, 4, "hospital level 1 lifts the poor by 4 in quiet times");
  g.shocks = [{ type: "port_closed", city: "cadiz", day: g.day, untilDay: g.day + 5 }];
  g.buildings = { cadiz: {} };
  assert.equal(moodTarget(g, "cadiz", "poor"), t0 - 15, "an active shock cuts the target by exactly 15");
  g.buildings = { cadiz: { "cadiz:9": { type: "hospital", level: 1, state: "active" } } };
  assert.equal(moodTarget(g, "cadiz", "poor"), t0 - 15 + 8, "in hard times the hospital comfort doubles to 8");
});

test("moodTarget: plague costs 20 and a calamity its mood hit, floored at 0", () => {
  const g = game({ citylife: true });
  stockAll(g, 100);
  const t0 = moodTarget(g, "cadiz", "middle");
  g.plague = { active: { cadiz: { untilDay: g.day + 10 } } };
  assert.equal(moodTarget(g, "cadiz", "middle"), t0 - 20, "a plague sits on spirits by exactly 20 while it lasts");
  g.calamities = { active: { cadiz: { incendio: { untilDay: g.day + 3 } } } };
  assert.equal(moodTarget(g, "cadiz", "middle"), t0 - 20 - 10, "a fire adds its 10 on top");
  stockAll(g, 0);
  assert.equal(moodTarget(g, "cadiz", "middle"), 0, "misery piles up but never goes below 0");
});

test("the corral lifts rich and middle, never the poor; hunger caps the target after civic spirits", () => {
  const g = game({ citylife: true });
  stockAll(g, 100);
  const bare = Object.fromEntries(CLASSES.map((c) => [c, moodTarget(g, "cadiz", c)]));
  g.buildings = { cadiz: { "cadiz:9": { type: "corral", level: 2, state: "active" } } };
  assert.equal(moodTarget(g, "cadiz", "rich") - bare.rich, 8, "corral level 2 lifts the rich by 4 per level");
  assert.equal(moodTarget(g, "cadiz", "middle") - bare.middle, 4, "and the middle by 2 per level");
  assert.equal(moodTarget(g, "cadiz", "poor") - bare.poor, 0, "the poor get nothing from a playhouse");
  for (const good of ["grain", "fish", "meat", "olive_oil"]) g.market.cadiz[good] = { stock: 0, target: 100 }; // the city cannot eat
  assert.equal(moodTarget(g, "cadiz", "rich"), 35, "a playhouse must never mask an unfed city: capped at 35 after civic spirits");
  for (const good of ["grain", "fish", "meat", "olive_oil"]) g.market.cadiz[good] = { stock: 55, target: 100 }; // dearth, just under the hunger line
  assert.equal(moodTarget(g, "cadiz", "rich"), 35, "staple coverage 0.55 still sits under the 0.6 hunger line");
});

test("mood memory: one day moves the mood exactly one twelfth of the way to today's reading", () => {
  const g = game({ citylife: true });
  stockAll(g, 100); // every class target is 80 from the 60 start
  g.day = 3; // mid-week: no population drift involved
  citylifeDay(g);
  for (const cls of CLASSES) near(g.citylife.cities.cadiz.animo[cls], 60 + (80 - 60) / 12, cls + " after one day");
});

test("weekly drift only moves people on days divisible by 7", () => {
  const g = game({ citylife: true });
  g.buildings = { cadiz: { "cadiz:1": { type: "house", level: 1, state: "active" } } };
  for (let d = 1; d <= 6; d++) { stockAll(g, 150); g.day = d; citylifeDay(g); assert.equal(citylifeExtra(g, "cadiz"), 0, "day " + d + ": no drift mid-week"); }
  stockAll(g, 150); g.day = 7; citylifeDay(g);
  const extra = citylifeExtra(g, "cadiz");
  assert.ok(extra > 0 && extra <= 100, "day 7: the content city draws newcomers within the house's room, extra=" + extra);
  assert.equal(extra, 25, "exact drift: round(12050 * 0.004 * (mean mood 78.25 - 55) / 45) after 7 days at target 100");
});

test("a shrinking city never falls below half its base population", () => {
  const g = game({ citylife: true });
  stockAll(g, 0); // acute famine: emigration allowed
  const floor = -Math.round(g.world.nodes.cadiz.pop * 0.5);
  const city = g.citylife.cities.cadiz;
  for (const start of [floor, floor - 500]) {
    city.animo = { poor: 0, middle: 0, rich: 0 }; city.extra = start;
    g.day = 7; citylifeDay(g);
    assert.equal(city.extra, floor, "extra " + start + " stays clamped at the half-population floor");
  }
});

test("initCitylife starts every city content-but-not-delighted at 60 with no drift, and a missing city is recreated", () => {
  const cl = initCitylife(world);
  assert.equal(Object.keys(cl.cities).length, world.cities.length, "one entry per city, full table");
  for (const c of world.cities) assert.deepEqual(cl.cities[c.id], { animo: { poor: 60, middle: 60, rich: 60 }, extra: 0 }, c.id);
  const g = game({ citylife: true });
  delete g.citylife.cities.sevilla;
  g.day = 3; citylifeDay(g);
  assert.ok(g.citylife.cities.sevilla, "a city missing from the state is recreated, not crashed on");
  assert.equal(g.citylife.cities.sevilla.extra, 0);
});
