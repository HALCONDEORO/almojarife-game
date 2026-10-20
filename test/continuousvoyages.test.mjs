import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceTick, doSail, TICKS_PER_DAY } from "../src/game/game.mjs";
import { TICKS_PER_HOUR, tickParts } from "../src/sim/clock.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { shipPosition } from "../src/sim/position.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("a voyage arrives on the exact tick, mid-day, not at a day boundary", () => {
  const g = newGame(world);
  const r = doSail(g, g.ships[0], "barcelona");
  assert.equal(r.ok, true);
  const arrivalTick = g.tick + g.ships[0].voyage.ticksLeft;
  let n = 0;
  while (g.ships[0].voyage && n++ < 400 * TICKS_PER_DAY) advanceTick(g);
  assert.equal(g.tick, arrivalTick, "arrival lands on the predicted tick");
  assert.equal(g.ships[0].at, "barcelona");
  assert.equal(g.day, Math.floor(g.tick / TICKS_PER_DAY));
});

test("wind is seeded per leg: same departure tick and leg, same duration; replay matches", () => {
  const a = newGame(world), b = newGame(world);
  const ra = doSail(a, a.ships[0], "barcelona"), rb = doSail(b, b.ships[0], "barcelona");
  assert.equal(ra.ticks, rb.ticks);
  assert.equal(a.ships[0].voyage.wind, b.ships[0].voyage.wind);
  assert.ok(a.ships[0].voyage.wind >= 0.8 && a.ships[0].voyage.wind <= 1.2);
});

test("a short hop takes about a day and a half, not a rounded two days", () => {
  const g = newGame(world);
  // cadiz-huelva is 134 km: 1.5 days at cog speed in still air (old model rounded up to whole days)
  const r = doSail(g, g.ships[0], "huelva");
  assert.equal(r.ok, true);
  assert.ok(r.ticks < 2 * TICKS_PER_DAY, "huelva is under two days away: " + r.ticks + " ticks");
  assert.ok(r.ticks > TICKS_PER_DAY / 2, "and not instantaneous: " + r.ticks + " ticks");
});

test("ETA parts: arrival tick splits into day and hour", () => {
  const p = tickParts(2 * TICKS_PER_DAY + 13 * TICKS_PER_HOUR + 7);
  assert.deepEqual(p, { day: 2, hour: 13 });
});

test("a save made at sea keeps the voyage ticks and lands on the same tick", () => {
  const g = newGame(world);
  doSail(g, g.ships[0], "barcelona");
  for (let i = 0; i < 137; i++) advanceTick(g);
  const { g: r } = deserialize(JSON.parse(JSON.stringify(serialize(g, "Casa Derrota"))), world);
  assert.deepEqual(r.ships[0].voyage, g.ships[0].voyage);
  while (g.ships[0].voyage) advanceTick(g);
  while (r.ships[0].voyage) advanceTick(r);
  assert.equal(r.tick, g.tick);
  assert.equal(r.ships[0].at, g.ships[0].at);
});

test("the position at sea is a pure function of the voyage ticks", () => {
  const g = newGame(world);
  doSail(g, g.ships[0], "barcelona");
  const s = g.ships[0], halfway = shipPosition(world, s, 0);
  for (let i = 0; i < Math.floor(s.voyage.totalTicks / 2); i++) advanceTick(g);
  const mid = shipPosition(world, s, 0);
  assert.notDeepEqual(mid, halfway);
  const copy = JSON.parse(JSON.stringify(s));
  assert.deepEqual(shipPosition(world, copy, 0.5), shipPosition(world, s, 0.5));
});

test("the departure log line carries whole hours, never an undefined field", () => {
  const g = newGame(world);
  doSail(g, g.ships[0], "huelva");
  const line = g.log.find((l) => l.key === "sail");
  assert.ok(line, "departure is logged");
  assert.ok(Number.isInteger(line.hours) && line.hours >= 1, "hours param is set: " + JSON.stringify(line));
  assert.equal(line.days, undefined, "the old days field is gone");
});
