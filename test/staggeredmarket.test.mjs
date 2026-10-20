import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { makeMarket, tickMarket, tickMarketCity } from "../src/sim/market.mjs";
import { newGame, advanceTick, marketSlot, HISTORY_DAYS } from "../src/game/game.mjs";
import { TICKS_PER_DAY } from "../src/sim/clock.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("market slots are unique per port and inside the day", () => {
  const slots = world.cities.map((_, i) => marketSlot(world, i));
  assert.equal(new Set(slots).size, world.cities.length, "no two ports tick at the same tick");
  for (const s of slots) assert.ok(s >= 0 && s < TICKS_PER_DAY);
});

test("a port ticked on its slot matches a daily tick bit for bit", () => {
  const a = makeMarket(world), b = makeMarket(world);
  for (let day = 1; day <= 60; day++) {
    tickMarket(a, day, world);
    for (const c of world.cities) tickMarketCity(b[c.id], day, world);
  }
  assert.deepEqual(b, a, "same formulas and quantities, only the scheduling changes");
});

test("each port ticks exactly once per day (its history shifts by one entry)", () => {
  const g = newGame(world);
  const before = JSON.parse(JSON.stringify(g.hist));
  for (let i = 0; i < TICKS_PER_DAY; i++) advanceTick(g);
  for (const c of world.cities)
    for (const good of Object.keys(world.goods)) {
      const b = before[c.id][good], a = g.hist[c.id][good];
      assert.equal(a.length, Math.min(b.length + 1, HISTORY_DAYS), c.id + "/" + good);
      assert.deepEqual(a.slice(0, -1), b.slice(-(a.length - 1)), "one entry appended, the rest shifted, in " + c.id + "/" + good);
    }
});

test("staggering spreads updates through the day: at noon only half the ports have ticked", () => {
  const probe = (tick) => {
    const g = newGame(world), before = JSON.parse(JSON.stringify(g.hist));
    for (let i = 0; i < tick; i++) advanceTick(g);
    return world.cities.filter((c) => JSON.stringify(g.hist[c.id]) !== JSON.stringify(before[c.id])).length; // all goods: a ticked port shows somewhere
  };
  assert.equal(probe(TICKS_PER_DAY), world.cities.length, "by midnight every port has ticked");
  const half = probe(TICKS_PER_DAY / 2);
  assert.ok(half > 0 && half < world.cities.length, "at noon some ports ticked, some not: " + half);
});

test("mid-day save/load keeps the staggered schedule identical", () => {
  const g = newGame(world);
  for (let i = 0; i < 517; i++) advanceTick(g);
  const { g: r } = deserialize(JSON.parse(JSON.stringify(serialize(g, "Casa Pulso"))), world);
  for (let i = 0; i < 500; i++) { advanceTick(g); advanceTick(r); }
  assert.deepEqual(r.market, g.market);
  assert.deepEqual(r.hist, g.hist);
});
