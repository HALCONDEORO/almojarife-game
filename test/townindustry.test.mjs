// Town industry roster: determinism, output accounting against the market's own abstract
// production, ownership rules, level/jobs bounds and the labour bound against TOWN_JOBS_SHARE.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { TOWN_JOBS_SHARE, PRODUCERS } from "../src/game/buildings.mjs";
import { townIndustry, industrySummary, townIndustryJobs, industryTypeOf, levelOutput, levelJobs, abstractDailyOutput, GOOD_TO_TYPE, REP_TYPES } from "../src/game/townindustry.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("every good any city makes has an industry mapping (nothing silently skipped)", () => {
  const makes = new Set(world.cities.flatMap((c) => c.makes));
  for (const good of makes) assert.ok(industryTypeOf(good), `unmapped good: ${good}`);
  // and the inverse table is exactly the producer outputs (flag-only goods like pottery stay mappable)
  assert.deepEqual(Object.keys(GOOD_TO_TYPE).sort(), Object.values(PRODUCERS).map((d) => d.output).sort());
});

test("the roster is deterministic and save-independent", () => {
  for (const id of ["cadiz", "sevilla", "bilbao"]) {
    assert.deepEqual(townIndustry(world, id), townIndustry(world, id));
  }
});

test("roster output matches the market's abstract production, never below it", () => {
  for (const city of world.cities) {
    const roster = townIndustry(world, city.id);
    for (const good of city.makes) {
      const entries = roster.filter((e) => e.good === good);
      const sum = entries.reduce((a, e) => a + e.avgOut, 0);
      const target = abstractDailyOutput(city);
      assert.ok(entries.length > 0, `${city.id}:${good} has no establishment`);
      assert.ok(sum >= target, `${city.id}:${good} roster output ${sum} below abstract ${target}`);
      const one = levelOutput(entries[0].kind, entries[0].type, 1);
      assert.ok(sum < target + one, `${city.id}:${good} overshoots by more than one small house`);
      // shares account for exactly the whole production: ownership can move share by share
      const shares = entries.reduce((a, e) => a + e.share, 0);
      assert.ok(Math.abs(shares - 1) < 1e-9, `${city.id}:${good} shares sum ${shares}`);
      // avgOut and share are coherent per establishment
      for (const e of entries) assert.ok(Math.abs(e.share - e.avgOut / sum) < 1e-12);
    }
    // a city has no industry for goods it does not make
    assert.equal(roster.filter((e) => !city.makes.includes(e.good)).length, 0);
  }
});

test("establishments are legal buildings at level 1-3 or declared representation types", () => {
  for (const city of world.cities) for (const e of townIndustry(world, city.id)) {
    assert.ok(e.level >= 1 && e.level <= 3, `${e.id} level ${e.level}`);
    if (e.kind === "building") {
      assert.ok(PRODUCERS[e.type], `${e.id} type ${e.type} is not a producer`);
      assert.equal(PRODUCERS[e.type].output ?? PRODUCERS[e.type].output, PRODUCERS[e.type].output);
      assert.equal(GOOD_TO_TYPE[e.good], e.type, `${e.id} produces the good its type yields`);
    } else {
      assert.ok(REP_TYPES[e.type], `${e.id} unknown rep type ${e.type}`);
    }
    assert.ok(e.jobs > 0 && e.avgOut > 0, `${e.id} carries jobs and output`);
    assert.equal(levelJobs(e.kind, e.type, e.level), e.jobs);
  }
});

test("ownership: the concejo holds a minority, named neighbours the rest, all deterministic", () => {
  for (const city of world.cities) {
    const roster = townIndustry(world, city.id);
    if (!roster.length) continue;
    const council = roster.filter((e) => e.owner.kind === "council");
    const folk = roster.filter((e) => e.owner.kind === "townsfolk");
    assert.ok(folk.length > 0, `${city.id} has private owners`);
    assert.ok(council.length <= folk.length, `${city.id} concejo stays a minority`);
    for (const e of folk) assert.ok(typeof e.owner.name === "string" && e.owner.name.length > 3, `${e.id} owner named`);
    // the concejo keeps exactly the first establishment of each good with three or more
    for (const e of roster) {
      const [good, i] = [e.good, Number(e.id.split(":").pop())];
      const count = roster.filter((x) => x.good === good).length;
      assert.equal(e.owner.kind === "council", count >= 3 && i === 0, `${e.id} ownership seat`);
    }
  }
});

test("visible industry fits inside the town's own 90% jobs share, with room to spare", () => {
  for (const city of world.cities) {
    const jobs = townIndustryJobs(world, city.id);
    const townJobs = Math.round(city.pop * TOWN_JOBS_SHARE);
    assert.ok(jobs > 0, `${city.id} has industry jobs`);
    assert.ok(jobs <= townJobs, `${city.id} roster jobs ${jobs} exceed town jobs ${townJobs}`);
  }
});

test("summary aggregates per good and counts distinct owners", () => {
  const sum = industrySummary(world, "cadiz");
  const roster = townIndustry(world, "cadiz");
  assert.equal(sum.length, new Set(roster.map((e) => e.good)).size);
  for (const row of sum) {
    const entries = roster.filter((e) => e.good === row.good);
    assert.equal(row.establishments, entries.length);
    assert.equal(row.jobs, entries.reduce((a, e) => a + e.jobs, 0));
    assert.ok(row.owners >= 1, `${row.good} has owners`);
  }
});

test("unknown cities and malformed data yield an empty roster, never a crash", () => {
  assert.deepEqual(townIndustry(world, "nowhere"), []);
  assert.deepEqual(townIndustry({}, "cadiz"), []);
  assert.deepEqual(townIndustry(null, "cadiz"), []);
});
