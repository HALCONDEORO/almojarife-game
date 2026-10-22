import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { loadHermandad, validateHermandad, portClassOf, institutionsAt, eventsBetween, CLASSES } from '../src/game/hermandad.mjs';
import { START_YEAR } from '../src/sim/clock.mjs';
const world = loadWorld(), ids = world.cities.map((c) => c.id), data = loadHermandad();
test('start year is 1480', () => assert.equal(START_YEAR, 1480));
test('the shipped data is valid: every row has a source, known ports, dates inside 1480-1600', () => assert.deepEqual(validateHermandad(data, ids), []));
test('a port without a class is a member; classes are a closed set', () => {
  assert.equal(portClassOf(data, 'cadiz'), 'member'); assert.equal(portClassOf({ portClass: { cadiz: 'station' } }, 'cadiz'), 'station'); assert.equal(CLASSES.length, 5);
});
test('institutions change by date: Marismas until 1494, then the Consulado de Burgos', () => {
  assert.deepEqual(institutionsAt(data, 1490).map((i) => i.id), ['marismas']);
  assert.deepEqual(institutionsAt(data, 1494).map((i) => i.id), ['burgos']);
});
test('events come in date order', () => assert.deepEqual(eventsBetween(data, 1480, 1500).map((e) => e.id), ['malaga-siege-1487', 'granada-1492', 'melilla-1497']));
test('the validator rejects rows without a source, unknown ports, bad dates and duplicates', () => {
  const bad = { ...data, portClass: { atlantis: 'member', cadiz: 'castle' }, lords: [{ id: 'x', port: 'cadiz', title: { es: 'a' } }], events: [{ id: 'e', from: { year: 1700, month: 1, day: 1 }, until: null, port: 'zzz' }, { id: 'e', from: { year: 1490, month: 1, day: 1 }, until: null, port: null }] };
  const p = validateHermandad(bad, ids).join('|');
  for (const m of ['unknown port', 'unknown class', 'missing https source', 'title needs es and en', 'bad from', 'duplicate id']) assert.match(p, new RegExp(m));
});
