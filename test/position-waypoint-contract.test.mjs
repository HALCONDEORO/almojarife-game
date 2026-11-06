// Synthetic equatorial legs make distance-weighted interpolation independently exact.
import test from 'node:test';
import assert from 'node:assert/strict';
import { shipPosition } from '../src/sim/position.mjs';
import { haversineKm } from '../tools/geo.mjs';

const world = { nodes: { a: { lat: 0, lon: 0 }, b: { lat: 0, lon: 1 }, c: { lat: 0, lon: 4 } } };
const km = haversineKm(world.nodes.a, world.nodes.b) + haversineKm(world.nodes.b, world.nodes.c);
const ship = (ticksLeft = 100) => ({ at: 'a', voyage: { from: 'a', to: 'c', path: ['a', 'b', 'c'], km, totalTicks: 100, ticksLeft } });
const near = (actual, lon) => {
  assert.ok(Math.abs(actual.lon - lon) < 1e-10, `longitude ${actual.lon}, expected ${lon}`);
  assert.equal(actual.lat, 0);
};

test('unequal waypoint legs interpolate by travelled distance, not by leg count', () => {
  near(shipPosition(world, ship(75)), 1); // one quarter of total distance is exactly the first waypoint
  near(shipPosition(world, ship(50)), 2); // halfway lies a third of the way down the longer second leg
  near(shipPosition(world, ship(0)), 4);
});

test('render fractions clamp to one tick and cannot move behind departure or past arrival', () => {
  near(shipPosition(world, ship(50), -10), 2);
  near(shipPosition(world, ship(50), 0.5), 2.02);
  near(shipPosition(world, ship(50), 10), 2.04);
  near(shipPosition(world, ship(110), 0.5), 0);
  near(shipPosition(world, ship(0), 1), 4);
});

test('voyage-owned waypoint coordinates win over chart nodes and rendering stays read-only', () => {
  const custom = ship(50);
  custom.voyage.pts = { a: { lat: 0, lon: 10 }, b: { lat: 0, lon: 11 }, c: { lat: 0, lon: 14 } };
  const before = structuredClone({ world, custom });
  near(shipPosition(world, custom), 12);
  const restored = JSON.parse(JSON.stringify(custom));
  near(shipPosition(world, restored), 12);
  assert.deepEqual({ world, custom }, before);
});

test('a repeated waypoint at departure does not produce NaN or stall interpolation', () => {
  const duplicate = ship(100);
  duplicate.voyage.path = ['a', 'a', 'b', 'c'];
  near(shipPosition(world, duplicate), 0);
  duplicate.voyage.ticksLeft = 50;
  near(shipPosition(world, duplicate), 2);
});
