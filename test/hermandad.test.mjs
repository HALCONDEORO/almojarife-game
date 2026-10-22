import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { validateHermandad, portClassOf, institutionsAt, eventsBetween, CLASSES } from '../src/game/hermandad.mjs';
import { START_YEAR } from '../src/sim/clock.mjs';
const world = loadWorld(), ids = world.cities.map((c) => c.id), data = JSON.parse(readFileSync(new URL('../data/hermandad.json', import.meta.url), 'utf8'));
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
import { deserialize, serialize } from '../src/game/gamesave.mjs';
import { advanceDay, newGame } from '../src/game/game.mjs';
import { yearOf, startYearOf } from '../src/game/chronicle.mjs';
import { calendarOf, LEGACY_START_YEAR } from '../src/sim/clock.mjs';
test('new games store their start year (1480); calendar and chronicle use it', () => {
  const g = newGame(world); assert.equal(g.startYear, 1480); assert.equal(startYearOf(g), 1480); assert.equal(calendarOf(0, g.startYear).year, 1480);
  const r = deserialize(serialize(g), world).g; assert.equal(r.startYear, 1480);
});
test('a save written BEFORE this change (fixture from the previous main) continues identically: no early chronicle close, still counting from 1475', () => {
  const raw = readFileSync(new URL('./fixtures/save-before-1480.json', import.meta.url), 'utf8');
  const gg = deserialize(JSON.parse(raw), world).g;
  assert.equal(gg.startYear, undefined); assert.equal(gg.chronBook.year, 1475); assert.equal(startYearOf(gg), LEGACY_START_YEAR);
  const before = gg.day; for (let i = 0; i < 3; i++) advanceDay(gg);
  assert.equal(gg.day, before + 3); assert.equal(gg.chronBook.year, 1475, 'the open book stays 1475');
  assert.equal((gg.chronicle ?? []).length, 0, 'no year closed after 3 days');
  assert.equal(yearOf(gg.day, startYearOf(gg)), 1475);
});
