import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, advanceTick, doSail, TICKS_PER_DAY } from "../src/game/game.mjs";
import { TICKS_PER_HOUR, tickParts } from "../src/sim/clock.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { shipPosition } from "../src/sim/position.mjs";
import { windAt, inStorm } from "../src/sim/weather.mjs";
import { WEAR_BASE_PER_DAY, WEAR_WIND_PER_DAY, WEAR_STORM_PER_DAY } from "../src/game/seawear.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("a voyage arrives on the exact tick, mid-day, not at a day boundary", () => {
  const g = newGame(world);
  const r = doSail(g, g.ships[0], "barcelona");
  assert.equal(r.ok, true);
  // hull-wear rebalance (26/10, declared): a damaged hull drags the voyage, so ticksLeft grows at
  // the day boundaries; the contract is that the CURRENT prediction always holds to the exact tick.
  let predicted = g.tick + g.ships[0].voyage.ticksLeft;
  let n = 0;
  while (g.ships[0].voyage && n++ < 400 * TICKS_PER_DAY) { predicted = g.tick + g.ships[0].voyage.ticksLeft; advanceTick(g); }
  assert.equal(g.tick, predicted, "arrival lands on the last predicted tick");
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

test("the arrival day pays its sea wear, same count as the day model", () => {
  // DECLARED CHANGE (hull-wear rebalance 26/10, docs/design/hull-wear-rebalance.md): the flat
  // 0.5/day becomes base 0.4 + 0.2 x wind force + 3.5 in a storm cell, sampled per charge; the
  // arrival day still counts as a day at sea. This test recomputes each charge through the public
  // weather functions at the same moments the game charges them.
  const g = newGame(world), s = g.ships[0];
  doSail(g, s, "huelva");
  const hull0 = s.hull, days = Math.ceil(s.voyage.totalTicks / TICKS_PER_DAY);
  let expected = 0, lastDay = g.day, charges = 0;
  const charge = () => { const p = shipPosition(world, s, 0); expected += WEAR_BASE_PER_DAY + WEAR_WIND_PER_DAY * windAt(p.lat, p.lon, g.day, g.seed ?? 0).force + (inStorm(p.lat, p.lon, g.day, g.seed ?? 0) ? WEAR_STORM_PER_DAY : 0); charges++; };
  while (s.voyage) {
    advanceTick(g);
    if (g.day !== lastDay) { lastDay = g.day; charge(); } // day-boundary charge
  }
  charge(); // the arrival-day charge, on the arrival tick at the destination
  assert.equal(charges, days, "one wear charge per started day at sea, including the arrival day");
  assert.ok(Math.abs(s.hull - (hull0 - expected)) < 1e-9, `weather-coupled wear: got ${s.hull}, expected ${hull0 - expected}`);
});

test("advanceDay stops on the arrival tick instead of running to the day boundary", () => {
  const g = newGame(world), s = g.ships[0];
  doSail(g, s, "barcelona");
  // hull-wear rebalance (26/10, declared): hull drag grows ticksLeft at day boundaries, so track
  // the CURRENT prediction; arrival still stops the day instead of running to the boundary.
  let predicted = g.tick + s.voyage.ticksLeft;
  while (s.voyage) { predicted = g.tick + s.voyage.ticksLeft; advanceDay(g); }
  assert.equal(g.tick, predicted, "no extra hours after the arrival");
});
