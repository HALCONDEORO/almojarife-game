import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEAR_BASE_PER_DAY, HULL_FLOOR, HULL_SPEED_MIN, HULL_WARN_LOW, HULL_WARN_CRITICAL,
  hullSpeedFactor, seaWearDay, hullWarning,
} from '../src/game/seawear.mjs';
import { TICKS_PER_DAY } from '../src/sim/clock.mjs';

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

test('weather never sinks a ship: hull floors at HULL_FLOOR', () => {
  const ship = { hull: 12, voyage: { ticksLeft: 100 } };
  for (let i = 0; i < 50; i++) seaWearDay({}, ship, true);
  assert.equal(ship.hull, HULL_FLOOR);
});

test('drag stretches an unescorted voyage and dragFrac stays fractional', () => {
  const ship = { hull: 50, voyage: { ticksLeft: 1000 } };
  const before = ship.voyage.ticksLeft;
  for (let i = 0; i < 30; i++) seaWearDay({}, ship, true);
  assert.ok(ship.voyage.ticksLeft > before, 'ticksLeft grew');
  const frac = ship.voyage.dragFrac;
  assert.ok(frac >= 0 && frac < 1, `dragFrac ${frac} in [0,1)`);
  const expectedDragPerDay = TICKS_PER_DAY * (1 / hullSpeedFactor(ship.hull) - 1);
  assert.ok(expectedDragPerDay > 0);
});

test('an escorted voyage keeps station: no drag applied', () => {
  const ship = { hull: 20, voyage: { ticksLeft: 1000, escorted: true } };
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
