import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, advanceTick, doBuy, TICKS_PER_DAY } from "../src/game/game.mjs";
import { serialize, deserialize, SAVE_VERSION } from "../src/game/gamesave.mjs";
import { calendarOf, START_YEAR } from "../src/sim/clock.mjs";
import { seasonOf } from "../src/sim/market.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("a new game starts at tick 0, day 0", () => {
  const g = newGame(world);
  assert.equal(g.tick, 0); assert.equal(g.day, 0);
});

test("240 ticks are exactly one day, with identical state", () => {
  const a = newGame(world), b = newGame(world);
  doBuy(a, a.ships[0], "grain", 10); doBuy(b, b.ships[0], "grain", 10);
  for (let d = 0; d < 30; d++) { advanceDay(a); for (let i = 0; i < TICKS_PER_DAY; i++) advanceTick(b); }
  assert.equal(a.day, 30); assert.equal(b.day, 30); assert.equal(b.tick, 30 * TICKS_PER_DAY);
  assert.deepEqual(b, a);
});

test("advanceDay jumps to the next day boundary from mid-day", () => {
  const g = newGame(world);
  for (let i = 0; i < 100; i++) advanceTick(g);
  assert.equal(g.day, 0); assert.equal(g.tick, 100);
  advanceDay(g);
  assert.equal(g.day, 1); assert.equal(g.tick, TICKS_PER_DAY); // like the old progress reset on wait
});

test("ticks stop while an event waits or the game is over", () => {
  const g = newGame(world); g.pending = { event: "storm", ship: 1 };
  advanceTick(g); advanceDay(g);
  assert.equal(g.tick, 0); assert.equal(g.day, 0);
  g.pending = null; g.over = "win"; advanceTick(g); advanceDay(g);
  assert.equal(g.tick, 0); assert.equal(g.day, 0);
});

test("day is always floor(tick / TICKS_PER_DAY) under mixed advances", () => {
  const g = newGame(world);
  for (let k = 0; k < 50; k++) { for (let i = 0; i < 37; i++) advanceTick(g); advanceDay(g); }
  assert.equal(g.day, Math.floor(g.tick / TICKS_PER_DAY));
});

test("saves are version 3 and keep the tick through a round trip, mid-day futures identical", () => {
  const g = newGame(world);
  for (let i = 0; i < 517; i++) advanceTick(g); // mid-day: day 2, tick 517
  assert.equal(g.day, 2); assert.equal(g.tick, 517);
  const s = serialize(g, "Casa Reloj");
  assert.equal(s.version, 3); assert.equal(SAVE_VERSION, 3); assert.equal(s.state.tick, 517);
  const { g: r } = deserialize(JSON.parse(JSON.stringify(s)), world);
  assert.deepEqual(r, g);
  for (let i = 0; i < 300; i++) { advanceTick(g); advanceTick(r); }
  assert.deepEqual(r, g); // a mid-day save replays the same future
});

test("version 1 saves are refused clearly", () => {
  const s = JSON.parse(JSON.stringify(serialize(newGame(world), "X")));
  s.version = 1;
  assert.throws(() => deserialize(s, world), /no migration for v1/);
  const noTick = JSON.parse(JSON.stringify(serialize(newGame(world), "X")));
  delete noTick.state.tick; // a v2-shaped save without a tick is a test build
  assert.throws(() => deserialize(noTick, world), /not kept/);
});

test("calendar: day 0 is 1 January of the start year, dates roll over exactly", () => {
  assert.equal(seasonOf(0), "winter"); // the calendar start must stay in deep winter
  assert.deepEqual(calendarOf(0), { year: START_YEAR, month: 0, day: 1 });
  assert.deepEqual(calendarOf(30), { year: START_YEAR, month: 0, day: 31 });
  assert.deepEqual(calendarOf(31), { year: START_YEAR, month: 1, day: 1 });
  assert.deepEqual(calendarOf(58), { year: START_YEAR, month: 1, day: 28 }); // February has 28, no leap years
  assert.deepEqual(calendarOf(59), { year: START_YEAR, month: 2, day: 1 });
  assert.deepEqual(calendarOf(364), { year: START_YEAR, month: 11, day: 31 });
  assert.deepEqual(calendarOf(365), { year: START_YEAR + 1, month: 0, day: 1 });
  assert.deepEqual(calendarOf(365 * 4 + 182), { year: START_YEAR + 4, month: 6, day: 2 });
  for (let d = 0; d < 365 * 8; d++) { const c = calendarOf(d); assert.ok(c.month >= 0 && c.month < 12 && c.day >= 1 && c.day <= 31); }
});
