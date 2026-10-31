// Council works feed calamity mitigation (follow-up (a) of #734): finished civic levels count
// in workingLevels next to the player's buildings. Anti double-count: the two registries stay
// separate, so a civic pozo and a player pozo of the same level mitigate exactly like two
// player pozos, never more. Mutant-killing intent: dropping civicLevels fails tests 1/3/4/5;
// counting nextLevel instead of level fails test 2; dropping the unkept guard fails test 7.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { calamityChance, calamityDays, CALAMITY, CHANCE_CUT, CHANCE_CAP } from "../src/game/calamities.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, citylife: true, plague: true, calamities: true, ...opts });
const withBuildings = (gm, cityId, defs) => { gm.buildings ??= {}; gm.buildings[cityId] = Object.fromEntries(defs.map(([type, level], idx) => [`${cityId}:${idx + 1}`, { type, level, state: "active" }])); return gm; };
// A civic work record straight from the works department's shape: level = COMPLETED levels;
// nextLevel, when present, is the one under construction.
const civicWork = (gm, cityId, type, rec) => { (gm.works ??= {})[cityId] = { ...(gm.works?.[cityId]), [type]: rec }; return gm; };

// Chance cuts per raw level (weights only shape duration): pozo L1 is one level, not three.
const fireChance = (levels) => CALAMITY.incendio.chance * Math.max(CHANCE_CAP, 1 - CHANCE_CUT * levels);

test("a finished council pozo cuts fire risk and duration exactly like a player pozo", () => {
  const civic = game();
  civicWork(civic, "cadiz", "pozo", { level: 1, state: "active" });
  const player = game();
  withBuildings(player, "cadiz", [["pozo", 1]]);
  assert.equal(calamityChance(civic, "cadiz", "incendio"), fireChance(1), "one finished civic level: one CHANCE_CUT");
  assert.equal(calamityChance(civic, "cadiz", "incendio"), calamityChance(player, "cadiz", "incendio"), "same cut as the player building");
  assert.equal(calamityDays(civic, "cadiz", "incendio"), CALAMITY.incendio.days - 3, "duration shortens by the same 3");
  assert.equal(calamityDays(civic, "cadiz", "incendio"), calamityDays(player, "cadiz", "incendio"));
});

test("a level under construction does not mitigate yet: only completed levels count", () => {
  const gm = game();
  civicWork(gm, "cadiz", "pozo", { level: 1, state: "building", nextLevel: 2, needDays: 10, workedDays: 0, paidFee: 0, feeTotal: 300, need: {}, delivered: {} });
  assert.equal(calamityChance(gm, "cadiz", "incendio"), fireChance(1), "level 1 stands: it mitigates");
  assert.notEqual(calamityChance(gm, "cadiz", "incendio"), fireChance(2), "nextLevel 2 adds nothing while it is being built");
  const bare = game();
  civicWork(bare, "cadiz", "pozo", { level: 0, state: "solicitado" });
  assert.equal(calamityChance(bare, "cadiz", "incendio"), CALAMITY.incendio.chance, "a petition with nothing built changes nothing");
});

test("civic and player mitigation stack, and the CHANCE_CAP floor holds", () => {
  const gm = game();
  withBuildings(gm, "cadiz", [["pozo", 3], ["hospital", 1]]);
  civicWork(gm, "cadiz", "pozo", { level: 3, state: "active" });
  assert.equal(calamityChance(gm, "cadiz", "incendio"), CALAMITY.incendio.chance * CHANCE_CAP, "7 raw levels: the cap, not below");
  assert.equal(calamityDays(gm, "cadiz", "incendio"), CALAMITY.incendio.minDays, "duration floor holds too");
});

test("no double count: a civic work never enters g.buildings, both registries sum once", () => {
  const both = game();
  withBuildings(both, "cadiz", [["pozo", 1]]);
  civicWork(both, "cadiz", "pozo", { level: 1, state: "active" });
  assert.equal(Object.keys(both.buildings.cadiz).length, 1, "the civic pozo did not leak into g.buildings");
  const twoPlayer = game();
  withBuildings(twoPlayer, "cadiz", [["pozo", 1], ["pozo", 1]]);
  assert.equal(calamityChance(both, "cadiz", "incendio"), calamityChance(twoPlayer, "cadiz", "incendio"), "civic L1 + player L1 == two player L1, once each");
  assert.equal(calamityChance(both, "cadiz", "incendio"), fireChance(2));
});

test("save/load through the real wire preserves civic mitigation", () => {
  const gm = game();
  civicWork(gm, "cadiz", "pozo", { level: 2, state: "active" });
  const before = calamityChance(gm, "cadiz", "incendio");
  const { g: back } = deserialize(JSON.parse(JSON.stringify(serialize(gm, "Casa de prueba"))), world);
  assert.equal(calamityChance(back, "cadiz", "incendio"), before, "same mitigation after a real serialize/deserialize round trip");
});

test("works flag off: no civic registry, no crash, base chance", () => {
  const gm = game({ works: false });
  assert.ok(!("works" in gm), "flag off keeps no works key");
  assert.equal(calamityChance(gm, "cadiz", "incendio"), CALAMITY.incendio.chance);
});

test("an upkeep-lapsed civic work lapses its mitigation until the chest keeps it again", () => {
  const gm = game();
  civicWork(gm, "cadiz", "pozo", { level: 1, state: "active", unkept: true }); // "queda sin efecto", says its own post
  assert.equal(calamityChance(gm, "cadiz", "incendio"), CALAMITY.incendio.chance, "unkept: no mitigation");
  assert.equal(calamityDays(gm, "cadiz", "incendio"), CALAMITY.incendio.days, "unkept: full duration");
  gm.works.cadiz.pozo.unkept = false; // the chest keeps it again (works.mjs resume hysteresis)
  assert.equal(calamityChance(gm, "cadiz", "incendio"), fireChance(1), "kept again: mitigation back");
});
