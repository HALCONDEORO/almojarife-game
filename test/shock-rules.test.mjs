import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { REGIONS, rollShock, tickShocks, activeShocks, applyShock, SHOCK_MIN_DAY } from "../src/game/shocks.mjs";

const world = loadWorld();
const mk = (seed = 0) => { const g = newGame(world); g.seed = seed; g.eventsOn = true; return g; };
// Seeded fixtures (verified against the draw stream): seed 0 rolls a poor harvest (estrecho, grain)
// on day 58 and a port closure (casablanca) on day 51; seed 36 rolls on the minimum day itself.
const PH = { seed: 0, day: 58, region: "estrecho", good: "grain" };

test("the draw never fires before the minimum day", () => {
  // Causality: with the gate temporarily relaxed locally, seed 0 rolls a poor harvest
  // (estrecho, sugar) on day 3; restored, the gate must hold it back.
  const g = mk(0);
  g.day = 3;
  assert.equal(rollShock(g), null, "seed 0 would roll on day 3, but day 3 is before day 30");
});

test("the draw accepts the minimum day itself", () => {
  const g = mk(36);
  g.day = SHOCK_MIN_DAY;
  assert.ok(rollShock(g) !== null, "day 30 is inside the schedule");
});

test("an identical market shock never doubles up; a different good in the same region may", () => {
  const base = mk(PH.seed);
  base.day = PH.day;
  const rolled = rollShock(base);
  assert.equal(rolled.type, "poor_harvest");
  assert.equal(rolled.region, PH.region);
  assert.equal(rolled.good, PH.good);
  const dup = mk(PH.seed);
  dup.day = PH.day;
  dup.shocks = [{ type: "poor_harvest", region: PH.region, good: PH.good, untilDay: PH.day + 100, fromDay: PH.day - 1 }];
  assert.equal(rollShock(dup), null, "same type, region and good already running");
  const other = mk(PH.seed);
  other.day = PH.day;
  other.shocks = [{ type: "poor_harvest", region: PH.region, good: "wine", untilDay: PH.day + 100, fromDay: PH.day - 1 }];
  const r = rollShock(other);
  assert.ok(r !== null && r.good === PH.good, "another good in the region does not block the draw");
});

test("a port closure is its city's own: neighbours in the region trade on", () => {
  const g = mk(0);
  g.day = 10;
  g.shocks = [{ type: "port_closed", city: "cadiz", untilDay: 50, fromDay: 1 }, { type: "poor_harvest", region: "atlantico", good: "grain", untilDay: 50, fromDay: 1 }];
  assert.deepEqual(activeShocks(g, "cadiz").map((s) => s.type).sort(), ["poor_harvest", "port_closed"]);
  assert.deepEqual(activeShocks(g, "sevilla").map((s) => s.type), ["poor_harvest"], "same region, but the closure is not hers");
  assert.deepEqual(activeShocks(g, "malaga").map((s) => s.type), [], "another region sees nothing");
  assert.equal(activeShocks(g).length, 2, "no city filter lists both");
});

test("a rolled closure carries its city and no region key", () => {
  const g = mk(0);
  g.day = 51;
  const sh = rollShock(g);
  assert.equal(sh.type, "port_closed");
  assert.equal(sh.city, "casablanca");
  assert.equal(sh.region, undefined, "the closure is not a regional shock");
  assert.equal(sh.untilDay, 55);
});

test("a shock is active strictly before its last day and unwinds on it", () => {
  const g = mk(0);
  g.shocks = [{ type: "poor_harvest", region: "estrecho", good: "grain", untilDay: 50, fromDay: 40 }];
  g.day = 49;
  assert.equal(activeShocks(g, "malaga").length, 1);
  g.day = 50;
  assert.equal(activeShocks(g, "malaga").length, 0, "untilDay is the first clean day");
});

test("a poor harvest spares the ports that do not grow the good", () => {
  const g = mk(0);
  const nonProd = REGIONS.atlantico.find((c) => !g.market[c].grain.makes);
  const e = g.market[nonProd].grain;
  const rate0 = e.rate, target0 = e.target;
  const sh = { id: "x", type: "poor_harvest", region: "atlantico", good: "grain", untilDay: 999, fromDay: 1 };
  applyShock(g, sh);
  assert.equal(e.rate, rate0, `${nonProd} grows no grain: its rate is untouched`);
  assert.equal(e.target, target0);
  assert.ok(!sh.touched.some((t) => t.city === nonProd), "nothing to unwind for a spared port");
});

test("no draws with the news off or the game over", () => {
  const off = mk(PH.seed);
  off.day = PH.day;
  off.eventsOn = false;
  assert.equal(rollShock(off), null);
  const over = mk(PH.seed);
  over.day = PH.day;
  over.over = "lose";
  assert.equal(rollShock(over), null);
});

test("the shock diary is a 30-entry ring, newest first", () => {
  const g = mk(0);
  g.day = 10;
  g.log = Array.from({ length: 30 }, (_, i) => ({ day: i, key: "old", txt: { es: "x", en: "x" } }));
  g.shocks = [{ id: "s", type: "port_closed", city: "cadiz", untilDay: 10, fromDay: 5 }];
  tickShocks(g);
  assert.equal(g.log.length, 30, "the oldest entry falls off");
  assert.equal(g.log[0].key, "shock");
  assert.equal(g.log[0].day, 10);
  assert.equal(g.shocks.length, 0, "the expired shock is gone");
});
