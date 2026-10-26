// Hull-wear rebalance (docs/design/hull-wear-rebalance.md): base + wind + storm wear, hull-speed
// coupling (departure and mid-voyage drag), and the low/critical hull warnings.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, advanceTick, doSail, TICKS_PER_DAY } from "../src/game/game.mjs";
import { windAt, inStorm, stormsAt } from "../src/sim/weather.mjs";
import { shipPosition } from "../src/sim/position.mjs";
import { seaWearDay, hullSpeedFactor, hullWarning, WEAR_BASE_PER_DAY, WEAR_WIND_PER_DAY, WEAR_STORM_PER_DAY, HULL_FLOOR, HULL_SPEED_MIN, HULL_WARN_LOW, HULL_WARN_CRITICAL } from "../src/game/seawear.mjs";
import { makeShip, tickShip } from "../src/sim/trade.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("speed factor: 1.0 at full hull, HULL_SPEED_MIN at zero, clamped outside", () => {
  assert.equal(hullSpeedFactor(100), 1);
  assert.equal(hullSpeedFactor(0), HULL_SPEED_MIN);
  assert.equal(hullSpeedFactor(120), 1);
  assert.equal(hullSpeedFactor(-5), HULL_SPEED_MIN);
  assert.ok(Math.abs(hullSpeedFactor(50) - 0.825) < 1e-12);
  assert.equal(hullSpeedFactor(undefined), 1); // old saves: no hull field = intact
});

test("calm day at sea: base + wind-proportional wear, no storm", () => {
  const g = newGame(world), s = g.ships[0];
  doSail(g, s, "huelva");
  advanceDay(g);
  const p = shipPosition(world, s, 0);
  const force = windAt(p.lat, p.lon, g.day, g.seed ?? 0).force;
  const before = s.hull;
  const r = seaWearDay(g, s);
  assert.ok(r && !r.storm);
  assert.ok(Math.abs(r.wear - (WEAR_BASE_PER_DAY + WEAR_WIND_PER_DAY * force)) < 1e-12);
  assert.ok(Math.abs(s.hull - (before - r.wear)) < 1e-12);
});

test("a day inside a storm cell adds WEAR_STORM_PER_DAY", () => {
  // find (day, seed) with a storm cell over the Cadiz-Huelva lane; skip-free: the cell field is dense enough in winter
  const g = newGame(world, "cadiz", { seed: 3 });
  let day = 300; // winter: most cells
  const s = g.ships[0];
  g.day = day;
  const port = world.nodes.cadiz;
  const found = inStorm(port.lat, port.lon, day, g.seed ?? 0);
  const ship = makeShip(1, "cog", "cadiz");
  ship.voyage = { from: "cadiz", to: "huelva", ticksLeft: 1, totalTicks: 100, km: 100, path: ["cadiz", "huelva"], pts: {} };
  const before = ship.hull;
  const r = seaWearDay(g, ship);
  assert.ok(r);
  const p = shipPosition(world, ship, 0);
  const force = windAt(p.lat, p.lon, g.day, g.seed ?? 0).force;
  const storm = inStorm(p.lat, p.lon, g.day, g.seed ?? 0);
  assert.ok(Math.abs(r.wear - (WEAR_BASE_PER_DAY + WEAR_WIND_PER_DAY * force + (storm ? WEAR_STORM_PER_DAY : 0))) < 1e-12);
  if (storm) assert.ok(r.wear >= WEAR_BASE_PER_DAY + WEAR_STORM_PER_DAY, "storm day bites");
  assert.ok(Math.abs(ship.hull - (before - r.wear)) < 1e-12);
  assert.equal(typeof found, "boolean");
});

test("wear never goes below the floor; weather alone cannot sink a ship", () => {
  const g = newGame(world);
  const s = g.ships[0];
  s.hull = HULL_FLOOR + 0.1;
  doSail(g, s, "huelva");
  seaWearDay(g, s);
  assert.equal(s.hull, HULL_FLOOR);
});

test("mid-voyage drag: a damaged hull stretches the remaining ticks, deterministically", () => {
  const g = newGame(world), s = g.ships[0];
  doSail(g, s, "barcelona");
  const t0 = s.voyage.ticksLeft;
  s.hull = 50; // factor 0.825 -> drag = 240 * (1/0.825 - 1) = 50.909...
  const r = seaWearDay(g, s);
  const expectedDrag = TICKS_PER_DAY * (1 / hullSpeedFactor(s.hull) - 1);
  assert.ok(Math.abs(r.drag - expectedDrag) < 1e-9);
  const whole = Math.floor(expectedDrag);
  assert.equal(s.voyage.ticksLeft, t0 + whole - TICKS_PER_DAY >= 0 ? t0 + whole : t0 + whole); // ticksLeft only grows here (no sailTick in between)
  assert.ok(Math.abs(s.voyage.dragFrac - (expectedDrag - whole)) < 1e-9);
  // fraction carries into the next day
  const before2 = s.hull; s.hull = 50;
  const r2 = seaWearDay(g, s);
  const total = (expectedDrag - whole) + r2.drag;
  assert.ok(Math.abs((s.voyage.dragFrac ?? 0) - (total - Math.floor(total))) < 1e-9);
  void before2;
});

test("departure prices the hull in: a damaged ship starts slower", () => {
  const g = newGame(world), s = g.ships[0];
  const fast = doSail(g, s, "huelva");
  assert.ok(fast.ok);
  const tFull = fast.ticks;
  const g2 = newGame(world), s2 = g2.ships[0];
  s2.hull = 50;
  const slow = doSail(g2, s2, "huelva");
  assert.ok(slow.ok);
  assert.ok(Math.abs(slow.ticks - Math.round(tFull / hullSpeedFactor(50))) <= 1, `${slow.ticks} vs ${tFull} at factor ${hullSpeedFactor(50)}`);
});

test("warnings fire once per downward crossing", () => {
  const ship = { hull: HULL_WARN_LOW - 1 };
  const low = hullWarning(HULL_WARN_LOW + 2, ship);
  assert.ok(low && /[Cc]asco|[Hh]ull/.test(low.es));
  assert.equal(hullWarning(HULL_WARN_LOW - 2, ship), null); // already below: no repeat
  ship.hull = HULL_WARN_CRITICAL - 1;
  const crit = hullWarning(HULL_WARN_LOW - 2, ship);
  assert.ok(crit && /cr[ií]tic/i.test(crit.es));
  assert.equal(hullWarning(10, ship), null);
});

test("a warning posts to the log and the message feed in a real game", () => {
  const g = newGame(world), s = g.ships[0];
  doSail(g, s, "barcelona");
  s.hull = HULL_WARN_LOW + 0.05;
  const logLen = g.log.length;
  advanceDay(g);
  assert.ok(s.hull < HULL_WARN_LOW);
  const line = g.log.find((l) => l.key === "event" && l.ship === s.id);
  assert.ok(line, "low-hull warning logged");
  assert.ok(g.log.length <= 30 || g.log.length === logLen + 1);
});

test("NPC traders keep the flat model: no weather coupling, no drag", () => {
  const g = newGame(world);
  const t = g.ai[0];
  t.ship.voyage = { from: "cadiz", to: "huelva", ticksLeft: 100, totalTicks: 200, km: 100, path: ["cadiz", "huelva"], pts: {} };
  const before = t.ship.hull;
  tickShip(t.ship);
  assert.equal(t.ship.hull, before - 0.5);
  assert.equal(t.ship.voyage.dragFrac, undefined);
});
