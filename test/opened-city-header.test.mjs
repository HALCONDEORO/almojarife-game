import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
const sync = source.slice(source.indexOf('function syncCityControls()'), source.indexOf('\nfunction cityPanelTitle('));
function fixture(city3dId, selected) {
 const name = {}, info = {}, document = { querySelector: () => null };
 const view = { querySelector: selector => selector === '#city-header-name' ? name : selector === '#city-header-info' ? info : null };
 const context = vm.createContext({ city3dId, ship: () => selected,
  $: id => id === 'v3d' ? view : null, document,
  g: { ships: [selected] }, lang: 'es', t: { cityCitizens: 'habitantes' }, LT: { es: {} }, actionUnread: () => 0,
  updateCityHeader: city => { name.textContent = city; info.textContent = city === 'lisboa' ? '50.000 habitantes' : '12.000 habitantes'; } });
 vm.runInContext(sync, context);
 return { context, name, info };
}

test('actual city-control sync keeps the opened port header after selecting a ship elsewhere', () => {
 const { context, name, info } = fixture('lisboa', { at: 'cadiz' });
 vm.runInContext('syncCityControls()', context);
 assert.equal(name.textContent, 'lisboa'); assert.equal(info.textContent, '50.000 habitantes');
});

test('the opened city still refreshes its header when the selected ship is at sea', () => {
 const { context, name } = fixture('lisboa', { at: 'cadiz', voyage: { to: 'huelva' } });
 vm.runInContext('syncCityControls()', context); assert.equal(name.textContent, 'lisboa');
});

test('map-side sync does not invent a city header from the selected ship', () => {
 const { context, name } = fixture(null, { at: 'cadiz' });
 vm.runInContext('syncCityControls()', context); assert.equal(name.textContent, undefined);
});

test('selecting a local ship keeps the opened city header unchanged', () => {
 const { context, name } = fixture('cadiz', { at: 'cadiz' });
 vm.runInContext('syncCityControls()', context); assert.equal(name.textContent, 'cadiz');
});

test('panel render also refreshes the opened port rather than the selected ship port', () => {
 const refresh = source.split('\n').find(line => line.includes('if ($("v3d")) updateCityHeader('));
 let observed;
 vm.runInNewContext(refresh, { $: () => ({}), city3dId: 'lisboa', g: { ships: [{ at: 'cadiz' }] }, sel: 0,
  updateCityHeader: city => { observed = city; } });
 assert.equal(observed, 'lisboa');
});
