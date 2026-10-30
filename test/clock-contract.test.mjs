// One clock, one conversion (Estudios 7, Marco 30/10): the simulation tick, the calendar the
// player sees and every economic cycle share a single day counter - g.day, advanced only at the
// 240-tick boundary and rendered through calendarOf. These tests pin that speed and pause change
// the pacing but never the charge (no cycle is charged twice or skipped, whatever the batch
// shape), that the date rolls over through the real loop, and that the view reads the same
// conversion the engine pins. The base tick/day arithmetic and calendar unit tests live in
// tickclock.test.mjs; this suite adds the economic-cycle contract, nothing duplicated.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, advanceTick, doBuy, TICKS_PER_DAY } from "../src/game/game.mjs";
import { calendarOf, dayOf, START_YEAR, LEGACY_START_YEAR } from "../src/sim/clock.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("uneven speed batches charge each cycle exactly once: three weeks, three reports, identical books", () => {
  const steady = newGame(world); // one whole day per call, the 1x shape
  const burst = newGame(world); // uneven batches, the speed-change shape
  doBuy(steady, steady.ships[0], "grain", 10);
  doBuy(burst, burst.ships[0], "grain", 10);
  for (let d = 0; d < 21; d++) advanceDay(steady);
  const batches = [37, 240, 111, 480, 5, 720, 240, 239, 1, 480, 960, 7]; // arbitrary frame batches, sum matters not
  for (const n of batches) for (let i = 0; i < n; i++) advanceTick(burst);
  while (burst.tick < 21 * TICKS_PER_DAY) advanceTick(burst);
  assert.equal(burst.tick, 21 * TICKS_PER_DAY, "exactly twenty-one days of ticks");
  assert.equal(burst.day, 21);
  assert.equal(steady.tick, burst.tick);
  assert.equal(burst.reports.length, 3, "one settlement per week: no double charge, no skipped charge");
  assert.deepEqual(burst.reports, steady.reports, "the weekly books are identical whatever the batch shape");
  assert.equal(burst.cash, steady.cash, "and so is the cash");
  assert.deepEqual(burst.weekTrade, {}, "the trade book closed with the last week");
});

test("a paused game charges nothing: the cycle waits, then settles exactly once", () => {
  const gm = newGame(world);
  for (let d = 0; d < 6; d++) advanceDay(gm);
  gm.pending = { event: "storm", ship: 1 }; // an event waits: time is stopped
  const cashAtPause = gm.cash, accruedAtPause = JSON.stringify(gm.accrued);
  advanceDay(gm);
  for (let i = 0; i < 100; i++) advanceTick(gm);
  assert.equal(gm.tick, 6 * TICKS_PER_DAY, "paused: not a tick moves");
  assert.equal(gm.cash, cashAtPause, "paused: not a coin moves");
  assert.equal(JSON.stringify(gm.accrued), accruedAtPause, "paused: nothing accrues");
  gm.pending = null; // the player answers; time resumes
  advanceDay(gm);
  assert.equal(gm.day, 7);
  assert.equal(gm.reports.length, 1, "the week settles exactly once, after the pause");
  assert.equal(gm.reports[0].week, 1);
  assert.equal(gm.reports[0].day, 7, "the report carries the day the cycle actually closed");
});

test("the year rolls over through the real loop: the shown date and the cycle counter move together", () => {
  const gm = newGame(world);
  gm.day = 364; gm.tick = 364 * TICKS_PER_DAY; // New Year's Eve, consistently on both counters
  assert.deepEqual(calendarOf(gm.day, gm.startYear), { year: START_YEAR, month: 11, day: 31 }, "the shown date: 31 December");
  advanceDay(gm);
  assert.equal(gm.day, 365);
  assert.equal(dayOf(gm.tick), 365, "the day counter is still the tick's own day");
  assert.deepEqual(calendarOf(gm.day, gm.startYear), { year: START_YEAR + 1, month: 0, day: 1 }, "the shown date rolls to 1 January of the next year");
  assert.equal(gm.startYear, START_YEAR, "a new game counts from the current epoch");
});

test("the view reads the same single conversion, and an old save keeps its own epoch", () => {
  const main = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.match(main, /calendarOf\(g\.day, g\.startYear \?\? LEGACY_START_YEAR\)/, "the clock the player sees is calendarOf of the same day counter, not a parallel conversion");
  const gm = newGame(world);
  const save = JSON.parse(JSON.stringify(serialize(gm, "Reloj")));
  delete save.state.startYear; // a save from before the epoch moved
  const restored = deserialize(save, world).g;
  assert.equal(restored.startYear, undefined, "the old save carries no epoch");
  const epoch = restored.startYear ?? LEGACY_START_YEAR; // exactly the view's fallback
  assert.equal(epoch, LEGACY_START_YEAR);
  assert.equal(calendarOf(restored.day, epoch).year, LEGACY_START_YEAR, "its dates continue in its own epoch, unmoved");
});
