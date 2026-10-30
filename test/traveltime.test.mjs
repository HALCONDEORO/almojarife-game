import test from 'node:test';
import assert from 'node:assert/strict';
import { playerTravelTicks } from '../src/game/traveltime.mjs';
import { ticksForKm, TICKS_PER_DAY } from '../src/sim/clock.mjs';

// barca: crew min 3, opt 5, max 8. No captain => captainSpeed 1.
const barca = (crew, extra = {}) => ({ type: 'barca', crew, ...extra });
const KM = 240, KMPD = 48; // ticksForKm = 240/48 * 240 = 1200
const BASE = ticksForKm(KM, KMPD);

test('ticksForKm converts distance at a daily speed to ticks', () => {
  assert.equal(BASE, (KM / KMPD) * TICKS_PER_DAY);
  assert.equal(BASE, 1200);
});

test('an under-crewed ship never sails: null, and a captain never replaces sailors', () => {
  assert.equal(playerTravelTicks(KM, KMPD, barca(2)), null);
  assert.equal(playerTravelTicks(KM, KMPD, barca(0)), null);
  const withCaptain = barca(2, { captain: { id: 'c1', name: 'Ana', navigation: 3 } });
  assert.equal(playerTravelTicks(KM, KMPD, withCaptain), null);
});

test('optimal crew sails at full speed', () => {
  assert.equal(playerTravelTicks(KM, KMPD, barca(5)), 1200);
});

test('skeleton crew is slower, extra hands are faster', () => {
  assert.equal(playerTravelTicks(KM, KMPD, barca(3)), Math.round(1200 / 0.7)); // min crew: 0.7x
  assert.equal(playerTravelTicks(KM, KMPD, barca(8)), Math.round(1200 / 1.1)); // max crew: 1.1x
  assert.ok(playerTravelTicks(KM, KMPD, barca(3)) > playerTravelTicks(KM, KMPD, barca(5)));
  assert.ok(playerTravelTicks(KM, KMPD, barca(8)) < playerTravelTicks(KM, KMPD, barca(5)));
});

test('a navigator captain speeds the voyage by 4% per navigation level', () => {
  const ship = barca(5, { captain: { id: 'c1', name: 'Ana', navigation: 3 } });
  assert.equal(playerTravelTicks(KM, KMPD, ship), Math.round(1200 / 1.12));
});

test('the leg wind divides the ticks', () => {
  assert.equal(playerTravelTicks(KM, KMPD, barca(5), 0.5), 2400);
  assert.equal(playerTravelTicks(KM, KMPD, barca(5), 2), 600);
});

test('a voyage always costs at least one tick', () => {
  assert.equal(playerTravelTicks(0.0001, 10000, barca(8), 2), 1);
});
