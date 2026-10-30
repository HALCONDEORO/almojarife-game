import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEAR_BASE_PER_DAY, WEAR_WIND_PER_DAY, WEAR_STORM_PER_DAY, HULL_FLOOR, HULL_SPEED_MIN,
  HULL_WARN_LOW, HULL_WARN_CRITICAL, hullSpeedFactor, seaWearDay, hullWarning,
} from '../src/game/seawear.mjs';
import { TICKS_PER_DAY } from '../src/sim/clock.mjs';
import { windAt, inStorm } from '../src/sim/weather.mjs';
import { haversineKm } from '../tools/geo.mjs';

// Deterministic real-weather fixture: the centre of a storm cell in the cantabrico region,
// found by scanning stormsAt(day, seed). If the weather model changes, these pinned values
// fail loudly and the fixture must be re-found.
const FIX = { lat: 43.7066, lon: -9.1097, day: 0, seed: 1, force: 0.8738283944316209 };
// World with the ship mid-lane exactly at the fixture point (linear midpoint of the two nodes).
const fixWorld = () => {
  const na = { lat: FIX.lat - 0.05, lon: FIX.lon }, nb = { lat: FIX.lat + 0.05, lon: FIX.lon };
  return { nodes: { na, nb }, km: haversineKm(na, nb) };
};
const fixShip = (hull, extraVoyage = {}) => {
  const w = fixWorld();
  return { hull, voyage: { path: ['na', 'nb'], km: w.km, totalTicks: 1000, ticksLeft: 500, ...extraVoyage } };
};

test('fixture still pins a storm cell with strong wind', () => {
  assert.equal(windAt(FIX.lat, FIX.lon, FIX.day, FIX.seed).force, FIX.force);
  assert.equal(inStorm(FIX.lat, FIX.lon, FIX.day, FIX.seed), true);
});

test('hullSpeedFactor is 1.0 at full hull, HULL_SPEED_MIN at 0, linear between', () => {
  assert.equal(hullSpeedFactor(100), 1);
  assert.equal(hullSpeedFactor(0), HULL_SPEED_MIN);
  assert.equal(hullSpeedFactor(50), HULL_SPEED_MIN + (1 - HULL_SPEED_MIN) / 2);
});

test('hullSpeedFactor clamps out-of-range and defaults missing hull to 100', () => {
  assert.equal(hullSpeedFactor(150), 1);
  assert.equal(hullSpeedFactor(-20), HULL_SPEED_MIN);
  assert.equal(hullSpeedFactor(undefined), 1);
  assert.equal(hullSpeedFactor(null), 1);
});

test('warning thresholds stay ordered and the floor stays below them', () => {
  assert.ok(HULL_WARN_CRITICAL < HULL_WARN_LOW);
  assert.ok(HULL_FLOOR < HULL_WARN_CRITICAL);
});

test('seaWearDay is null when not underway or anchored', () => {
  assert.equal(seaWearDay({}, {}), null);
  assert.equal(seaWearDay({}, { voyage: { anchored: true, ticksLeft: 10 } }), null);
});

test('forced arrival day without world charges base wear only', () => {
  const ship = { hull: 100, voyage: { ticksLeft: 100 } };
  const r = seaWearDay({}, ship, true);
  assert.equal(r.wear, WEAR_BASE_PER_DAY);
  assert.equal(r.windForce, 0);
  assert.equal(r.storm, false);
  assert.equal(ship.hull, 100 - WEAR_BASE_PER_DAY);
});

test('seaWearDay couples real weather: wind and storm raise the wear', () => {
  const g = { world: fixWorld(), day: FIX.day, seed: FIX.seed };
  const ship = fixShip(100);
  const r = seaWearDay(g, ship);
  assert.equal(r.windForce, FIX.force);
  assert.equal(r.storm, true);
  const expectedWear = WEAR_BASE_PER_DAY + WEAR_WIND_PER_DAY * FIX.force + WEAR_STORM_PER_DAY;
  assert.equal(r.wear, expectedWear);
  assert.equal(ship.hull, 100 - expectedWear);
});

test('weather never sinks a ship: hull floors at HULL_FLOOR, in a storm too', () => {
  const calm = { hull: 12, voyage: { ticksLeft: 100 } };
  for (let i = 0; i < 50; i++) seaWearDay({}, calm, true);
  assert.equal(calm.hull, HULL_FLOOR);
  const g = { world: fixWorld(), day: FIX.day, seed: FIX.seed };
  const stormy = fixShip(12);
  for (let i = 0; i < 10; i++) seaWearDay(g, stormy);
  assert.equal(stormy.hull, HULL_FLOOR);
});

test('drag accumulates exactly the per-day drag seaWearDay returns', () => {
  const ship = { hull: 60, voyage: { ticksLeft: 1000 } };
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += seaWearDay({}, ship, true).drag;
  const carried = ship.voyage.ticksLeft + ship.voyage.dragFrac;
  assert.ok(Math.abs(carried - (1000 + sum)) < 1e-9, `ticksLeft+dragFrac ${carried} vs 1000+drag ${1000 + sum}`);
  assert.ok(ship.voyage.ticksLeft > 1000, 'whole ticks were added');
});

test('drag continues a fractional dragFrac carried in an old save', () => {
  const ship = { hull: 60, voyage: { ticksLeft: 1000, dragFrac: 0.9 } };
  const r = seaWearDay({}, ship, true);
  const expectedDrag = TICKS_PER_DAY * (1 / hullSpeedFactor(60 - WEAR_BASE_PER_DAY) - 1);
  assert.equal(r.drag, expectedDrag);
  const total = 0.9 + expectedDrag, whole = Math.floor(total);
  assert.equal(ship.voyage.ticksLeft, 1000 + whole);
  assert.ok(Math.abs(ship.voyage.dragFrac - (total - whole)) < 1e-12);
});

test('an escorted voyage keeps station: no drag applied (escorted flag)', () => {
  const ship = { hull: 20, voyage: { ticksLeft: 1000, escorted: true } };
  seaWearDay({}, ship, true);
  assert.equal(ship.voyage.ticksLeft, 1000);
  assert.equal(ship.voyage.dragFrac, undefined);
});

test('an escorted voyage keeps station: no drag applied (escortedBy)', () => {
  const ship = { hull: 20, voyage: { ticksLeft: 1000, escortedBy: 'capitana-2' } };
  seaWearDay({}, ship, true);
  assert.equal(ship.voyage.ticksLeft, 1000);
  assert.equal(ship.voyage.dragFrac, undefined);
});

test('hullWarning fires once per downward threshold crossing, bilingual', () => {
  const w1 = hullWarning(HULL_WARN_LOW, { hull: HULL_WARN_LOW - 1 });
  assert.ok(w1 && w1.es.includes('Casco bajo') && w1.en.includes('Low hull'));
  const w2 = hullWarning(HULL_WARN_CRITICAL, { hull: HULL_WARN_CRITICAL - 1 });
  assert.ok(w2 && w2.es.includes('Casco crítico') && w2.en.includes('Critical hull'));
});

test('hullWarning is null without a downward crossing', () => {
  assert.equal(hullWarning(HULL_WARN_LOW, { hull: HULL_WARN_LOW }), null); // at, not below
  assert.equal(hullWarning(100, { hull: 90 }), null);
  assert.equal(hullWarning(HULL_WARN_LOW - 1, { hull: HULL_WARN_LOW - 2 }), null); // already below
  assert.equal(hullWarning(HULL_WARN_CRITICAL - 1, { hull: HULL_FLOOR }), null); // already critical
});
