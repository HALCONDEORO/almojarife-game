import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
const header = source.slice(source.indexOf('function updateCityHeader('), source.indexOf('\nfunction open3d('));
function fixture(city3dId, visible = true) {
 const name = {}, info = {}, seen = [];
 const view = { querySelector: selector => selector === '#city-header-name' ? name : info };
 const context = vm.createContext({ city3dId, $: () => visible ? view : null,
  world: { nodes: { lisboa: {}, cadiz: {} } }, g: {}, lang: 'es', t: { cityCitizens: 'habitantes' },
  cityEffects: (game, city) => { seen.push(city); return { popEff: city === 'lisboa' ? 50000 : 12000 }; },
  respectOf: () => ({ id: 'unknown' }), wallsLevel: () => 0, hasOffice: () => false, warehouseOf: () => null,
  cityName: city => city, fmt: String, RESPECT_NAMES: { es: { unknown: 'Desconocido' } } });
 vm.runInContext(header, context);
 return { context, name, info, seen };
}

test('actual header refresh uses the opened scene, not a selected ship in another port', () => {
 const { context, name, info, seen } = fixture('lisboa');
 vm.runInContext("updateCityHeader('cadiz')", context);
 assert.equal(name.textContent, 'lisboa'); assert.match(info.textContent, /50000 habitantes/);
 assert.deepEqual(seen, ['lisboa'], 'inhabitants and respect are read for the same opened port');
});

test('an absent selected ship port does not erase the opened city header', () => {
 const { context, name } = fixture('lisboa');
 vm.runInContext('updateCityHeader()', context); assert.equal(name.textContent, 'lisboa');
});

test('map-side refresh does not create or query a missing city header', () => {
 const { context, name, seen } = fixture(null, false);
 vm.runInContext("updateCityHeader('cadiz')", context);
 assert.deepEqual(name, {}); assert.deepEqual(seen, []);
});

test('a local selected ship still displays its opened port', () => {
 const { context, name } = fixture('cadiz');
 vm.runInContext("updateCityHeader('cadiz')", context); assert.equal(name.textContent, 'cadiz');
});
