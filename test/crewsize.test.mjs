import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doSail, hireCrew, dismissCrew } from "../src/game/game.mjs";
import { CREW, HIRE_FEE, crewOf, speedFactor, crewDefence, dailyUpkeep, defenceOf, buyCannon } from "../src/game/crew.mjs";
import { SHIP_TYPES } from "../src/sim/trade.mjs";
import { SETTLE_EVERY } from "../src/game/ledger.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };
const dest = (g, s) => world.cities.find((c) => c.id !== s.at).id;
test("old ships count as optimal crew: same upkeep and speed as before", () => {
  const g = game(), s = g.ships[0]; assert.equal(crewOf(s), CREW[s.type].opt); assert.equal(speedFactor(s), 1); assert.equal(crewDefence(s), 1);
  const up = SHIP_TYPES[s.type].upkeepPerDay; assert.ok(Math.abs(dailyUpkeep(s, up).total - up) < 1e-9);
  const c0 = g.cash; for (let d = 0; d < SETTLE_EVERY; d++) advanceDay(g);
  assert.ok(Math.abs(g.reports[0].lines[0].wages - up * SETTLE_EVERY * 0.6) < 0.02);
});
test("bad crew values are clamped", () => {
  const s = game().ships[0]; s.crew = 999; assert.equal(crewOf(s), CREW[s.type].max); s.crew = -4; assert.equal(crewOf(s), 0); s.crew = "x"; assert.equal(crewOf(s), CREW[s.type].opt); s.crew = 3.5; assert.equal(crewOf(s), CREW[s.type].opt);
});
test("below the minimum the ship does not sail; at the minimum it is slower", () => {
  const g = game(), s = g.ships[0], L = CREW[s.type];
  s.crew = L.min - 1; assert.equal(doSail(g, s, dest(g, s)).reason, "crew"); assert.ok(!s.voyage);
  s.crew = L.min; assert.ok(Math.abs(speedFactor(s) - 0.7) < 1e-9);
  const full = game(), f = full.ships[0]; assert.ok(doSail(full, f, dest(full, f)).ok);
  assert.ok(doSail(g, s, dest(g, s)).ok); assert.ok(s.voyage.totalDays >= f.voyage.totalDays);
});
test("a full crew is faster, defends more and costs more wages", () => {
  const g = game(), s = g.ships[0], L = CREW[s.type]; buyCannon(g, s);
  const d0 = defenceOf(s), up = SHIP_TYPES[s.type].upkeepPerDay;
  s.crew = L.max; assert.ok(speedFactor(s) > 1 && speedFactor(s) <= 1.1 + 1e-9); assert.ok(defenceOf(s) > d0);
  assert.ok(dailyUpkeep(s, up).total > up);
  s.crew = 0; assert.ok(dailyUpkeep(s, up).total < up); assert.ok(Math.abs(dailyUpkeep(s, up).total - up * 0.4) < 1e-9);
});
test("hiring costs a fee, respects the maximum and cash, and only works in port", () => {
  const g = game(), s = g.ships[0], L = CREW[s.type]; s.crew = L.opt;
  const c0 = g.cash, r = hireCrew(g, s, 3); assert.ok(r.ok); assert.equal(g.cash, c0 - 3 * HIRE_FEE); assert.equal(crewOf(s), L.opt + 3);
  assert.equal(hireCrew(g, s, 1000).hired, L.max - (L.opt + 3)); assert.equal(hireCrew(g, s, 1).reason, "full");
  s.crew = 0; g.cash = 5; assert.equal(hireCrew(g, s, 1).reason, "no cash"); assert.equal(crewOf(s), 0);
  g.cash = 1000; assert.equal(hireCrew(g, s, 0).reason, "bad amount"); assert.equal(hireCrew(g, s, NaN).reason, "bad amount");
  s.voyage = { from: s.at, to: "x", daysLeft: 2, totalDays: 2, path: [], km: 1 }; assert.equal(hireCrew(g, s, 1).reason, "at sea"); assert.equal(dismissCrew(g, s, 1).reason, "at sea");
});
test("dismissing lowers wages in the report; the line follows the real crew", () => {
  const g = game(), s = g.ships[0]; dismissCrew(g, s, 100); assert.equal(crewOf(s), 0);
  for (let d = 0; d < SETTLE_EVERY; d++) advanceDay(g);
  assert.equal(g.reports[0].lines[0].wages, 0);
  assert.ok(Math.abs(g.reports[0].lines[0].cost - SHIP_TYPES[s.type].upkeepPerDay * 0.4 * SETTLE_EVERY) < 0.02);
});
