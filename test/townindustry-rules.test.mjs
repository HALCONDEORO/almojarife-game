// Town-industry rule pinning, second layer: exact numbers and edges the behaviour suites
// (townindustry.test.mjs, townindustry-sale.test.mjs, almoneda-i18n.test.mjs) cover loosely -
// output boundaries, invalid levels, the split-levels upper bound, both ownership branches,
// malformed roster ids, the game-over refusal and the empty sales ledger.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { townIndustry, levelOutput, levelJobs, abstractDailyOutput, establishmentOf, salesOf, buyEstablishment, REP_TYPES } from "../src/game/townindustry.mjs";
import { PRODUCERS, producerRate, JOBS_PER_LEVEL } from "../src/game/buildings.mjs";

const world = loadWorld();
const FLAG = { cash: 100000, freePlay: true, townIndustry: true };

test("abstractDailyOutput: hands per 1000 souls, rounded, at least one crew, times two", () => {
  const table = [[0, 2], [400, 2], [500, 2], [1499, 2], [1500, 4], [2499, 4], [2500, 6], [12000, 24]];
  for (const [pop, expected] of table) assert.equal(abstractDailyOutput({ pop }), expected, `pop ${pop}`);
});

test("levelOutput: levels outside 1-3 and unknown types produce nothing; exact values inside", () => {
  assert.equal(levelOutput("building", "farm", 0), 0);
  assert.equal(levelOutput("building", "farm", 4), 0);
  assert.equal(levelOutput("rep", "tannery", 0), 0);
  assert.equal(levelOutput("rep", "tannery", 4), 0, "representation works have no level 4 either");
  assert.equal(levelOutput("rep", "trading_post", 4), 0);
  assert.equal(levelOutput("building", "nope", 2), 0);
  for (const [type, def] of Object.entries(PRODUCERS)) { // full table: every buildable type, every level
    for (const level of [1, 2, 3]) {
      const perBatch = def.primary ? def.yield : 2;
      assert.equal(levelOutput("building", type, level), perBatch * producerRate(type, level), `${type} level ${level}`);
    }
  }
  for (const [type, def] of Object.entries(REP_TYPES)) {
    for (const level of [1, 2, 3]) assert.equal(levelOutput("rep", type, level), def.outPerLevel * level, `${type} level ${level}`);
  }
  // literal pins of the representation tuning (own numbers): 2 units per level
  assert.equal(levelOutput("rep", "tannery", 1), 2);
  assert.equal(levelOutput("rep", "tannery", 3), 6);
  assert.equal(levelOutput("rep", "trading_post", 2), 4);
});

test("levelJobs: representation types use their own table; unknown types employ nobody", () => {
  for (const [type, def] of Object.entries(REP_TYPES)) {
    for (const level of [1, 2, 3]) assert.equal(levelJobs("rep", type, level), def.jobs * level, `${type} level ${level}`);
  }
  // literal pins: the tannery crews 6 hands per level, the trading house 4
  assert.equal(levelJobs("rep", "tannery", 3), 18);
  assert.equal(levelJobs("rep", "trading_post", 2), 8);
  for (const type of Object.keys(PRODUCERS)) {
    for (const level of [1, 2, 3]) assert.equal(levelJobs("building", type, level), (JOBS_PER_LEVEL[type] ?? 0) * level, `${type} level ${level}`);
  }
  assert.equal(levelJobs("building", "nope", 1), 0);
});

test("splitLevels: every (city, good) roster sums to [target, target + one level-1 house)", () => {
  let groups = 0;
  for (const city of world.cities) {
    const roster = townIndustry(world, city.id);
    const target = abstractDailyOutput(city);
    const byGood = new Map();
    for (const entry of roster) { const list = byGood.get(entry.good) ?? []; list.push(entry); byGood.set(entry.good, list); }
    for (const [good, entries] of byGood) {
      const sum = entries.reduce((a, e) => a + e.avgOut, 0);
      const one = levelOutput(entries[0].kind, entries[0].type, 1);
      assert.ok(sum >= target, `${city.id} ${good} never below the abstract production: ${sum}`);
      assert.ok(sum < target + one, `${city.id} ${good} overshoots by less than one small house: ${sum}`);
      groups++;
    }
  }
  assert.ok(groups > 50, `the bound is pinned across the full map, not a sample: ${groups} groups`);
});

test("ownership: the concejo takes exactly the first works and only with three or more; small ports are all private", () => {
  let big = 0, small = 0;
  for (const city of world.cities) {
    const byGood = new Map();
    for (const entry of townIndustry(world, city.id)) { const list = byGood.get(entry.good) ?? []; list.push(entry); byGood.set(entry.good, list); }
    for (const [good, entries] of byGood) {
      const councils = entries.filter((e) => e.owner.kind === "council");
      if (entries.length >= 3) {
        big++;
        assert.equal(councils.length, 1, `${city.id} ${good}: exactly one municipal works`);
        assert.equal(councils[0].id, `${city.id}:${good}:0`, "and it is the first of the roster");
      } else {
        small++;
        assert.equal(councils.length, 0, `${city.id} ${good}: one or two works stay all private`);
      }
      for (const entry of entries) if (entry.owner.kind === "townsfolk") assert.ok(entry.owner.name, `${city.id} ${good}: neighbours are named`);
    }
  }
  assert.ok(big > 0 && small > 0, `both ownership branches exercised: ${big} big, ${small} small`);
});

test("establishmentOf: malformed ids read null, never a crash or a guess", () => {
  const some = townIndustry(world, "cadiz")[0];
  assert.equal(establishmentOf(world, some.id).id, some.id, "a real id round-trips");
  assert.equal(establishmentOf(world, some.id.replace(/:\d+$/, ":99")), null, "index out of range");
  assert.equal(establishmentOf(world, "nowhere:grain:0"), null, "unknown city");
  assert.equal(establishmentOf(world, "cadiz:nope:0"), null, "unknown good");
  assert.equal(establishmentOf(world, "garbage"), null, "no shape at all");
});

test("buyEstablishment: a finished game sells nothing", () => {
  const game = newGame(world, "cadiz", FLAG);
  game.over = true;
  const est = townIndustry(world, "cadiz").find((entry) => entry.kind === "building");
  const cash = game.cash;
  assert.equal(buyEstablishment(game, "cadiz", est.id, 100).reason, "game over");
  assert.equal(game.cash, cash, "no coin moved");
  assert.deepEqual(salesOf(game, "cadiz"), { jobs: 0, ids: [] }, "no sale recorded");
});

test("salesOf: a fresh game reads an empty ledger, jobs zero and no ids", () => {
  const game = newGame(world, "cadiz", FLAG);
  assert.deepEqual(salesOf(game, "cadiz"), { jobs: 0, ids: [] });
  assert.deepEqual(salesOf(game, "lisboa"), { jobs: 0, ids: [] }, "every port starts unsold");
});
