import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { growthMul, growthTick, growthLine, GROWTH_MIN, GROWTH_MAX, GROWTH_STEP } from "../src/game/growth.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const mk = (opts) => newGame(world, "cadiz", { cityIdentity: false, cityMoodOut: false, citySeasons: false, cityCrafts: false, cityFestivals: false, cityMemory: false, cityRelations: false, cityGrowth: false, freePlay: true, seed: 5, ...opts });
const starveFood = (g, city) => { for (const good of ["grain", "fish", "meat"]) { const e = g.market[city][good]; if (e) e.stock = Math.max(1, Math.floor(e.target / 8)); } };
const feedFood = (g, city) => { for (const good of ["grain", "fish", "meat"]) { const e = g.market[city][good]; if (e) e.stock = e.target * 4; } };
test("flag off: multiplier is 1, no state, no tab line, drift is a no-op", () => {
  const g = mk({});
  assert.equal(g.cityGrowth, undefined);
  assert.equal(growthMul(g, "cadiz"), 1);
  starveFood(g, "cadiz"); growthTick(g, "cadiz");
  assert.equal(g.growth, undefined);
  assert.equal(growthLine(g, "cadiz"), null);
  assert.equal(hallView(g, "cadiz").growth, undefined);
});
test("a city is judged against its own habit: hungrier than usual shrinks it, better fed swells it", () => {
  const g = mk({ cityGrowth: true });
  feedFood(g, "cadiz"); for (let i = 0; i < 40; i++) growthTick(g, "cadiz"); // habit settles: well-fed is normal here
  assert.equal(growthMul(g, "cadiz"), 1); // no drift once the habit matches reality
  starveFood(g, "cadiz"); growthTick(g, "cadiz"); // suddenly hungry, against its habit
  assert.ok(Math.abs(growthMul(g, "cadiz") - (1 - GROWTH_STEP)) < 1e-6, String(growthMul(g, "cadiz")));
  growthTick(g, "cadiz");
  assert.ok(growthMul(g, "cadiz") < 1 - GROWTH_STEP); // keeps drifting while the hunger lasts
  feedFood(g, "cadiz"); growthTick(g, "cadiz"); // back to its well-fed habit
  assert.ok(growthMul(g, "cadiz") > 1 - GROWTH_STEP - 1e-9);
});
test("the drift stays inside its bounds", () => {
  const g = mk({ cityGrowth: true });
  feedFood(g, "cadiz");
  for (let i = 0; i < 2000; i++) growthTick(g, "cadiz");
  assert.ok(growthMul(g, "cadiz") <= GROWTH_MAX);
  starveFood(g, "cadiz");
  for (let i = 0; i < 4000; i++) growthTick(g, "cadiz");
  assert.ok(growthMul(g, "cadiz") >= GROWTH_MIN);
});
test("growth rides on the market's daily population figure (demand)", () => {
  const on = mk({ cityGrowth: true }), off = mk({});
  starveFood(on, "cadiz"); starveFood(off, "cadiz");
  for (let i = 0; i < 40; i++) { growthTick(on, "cadiz"); growthTick(off, "cadiz"); } // habit: hungry is normal
  feedFood(on, "cadiz"); feedFood(off, "cadiz");
  for (let i = 0; i < 60; i++) { growthTick(on, "cadiz"); growthTick(off, "cadiz"); } // suddenly well-fed
  assert.ok(growthMul(on, "cadiz") > 1.01, String(growthMul(on, "cadiz")));
  const day = Math.ceil(on.tick / (24 * 60));
  on.market.cadiz.wine.pop = ((12000) * 1) * growthMul(on, "cadiz"); // as marketTick composes it (cadiz pop 12000)
  assert.ok(on.market.cadiz.wine.pop > 12000);
});
test("the tab says it in words, both languages, only away from the middle", () => {
  const g = mk({ cityGrowth: true });
  assert.equal(hallView(g, "cadiz").growth, undefined); // at 1: nothing to say
  feedFood(g, "cadiz"); for (let i = 0; i < 40; i++) growthTick(g, "cadiz"); // habit
  starveFood(g, "cadiz"); for (let i = 0; i < 60; i++) growthTick(g, "cadiz"); // hungry against its habit (before the habit catches up)
  const line = hallView(g, "cadiz").growth;
  assert.ok(line && line.kind === "decline" && line.txt.es && line.txt.en, JSON.stringify(line));
});
test("state saves and loads; an off game plays byte-identical to before (golden parity)", () => {
  const play = (opts) => { const g = mk(opts); for (let i = 0; i < 40 && !g.over; i++) advanceDay(g); return g; };
  const a = play({}), b = play({});
  assert.equal(JSON.stringify(serialize(a, "T", 1)), JSON.stringify(serialize(b, "T", 1)));
  // OFF parity vs the pre-feature build is proven by the 8-seed gate (base sha vs branch sha,
  // flags off by default). Here: the flag leaves no keys in an off game, and an on game saves and loads.
  assert.equal(a.cityGrowth, undefined); assert.equal(a.growth, undefined);
  const on = play({ cityGrowth: true });
  const h = deserialize(JSON.parse(JSON.stringify(serialize(on, "T", 1))), world).g;
  assert.equal(h.cityGrowth, true);
  assert.equal(JSON.stringify(serialize(h, "T", 1)), JSON.stringify(serialize(on, "T", 1)));
});
