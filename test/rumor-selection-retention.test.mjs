import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { newGame, buyRumor, RUMOR_PRICE } from '../src/game/game.mjs';
import { loadWorld } from '../src/sim/world.mjs';

const source = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
const optionExpression = source.slice(source.indexOf('unk.map((c)'), source.indexOf('.join("")}</select>', source.indexOf('unk.map((c)')) + '.join("")'.length);
const bindings = source.slice(source.indexOf('  const rum = P.querySelector("#rum")'), source.indexOf('\n', source.indexOf('const rb = P.querySelector("#rumbtn")')));
function setup() {
 const g = newGame(loadWorld(), 'cadiz', { seed: 501 });
 const select = { value: 'barcelona' }, button = {};
 const context = vm.createContext({ g, s: g.ships[0], rumorCity: null, rumorNote: null, buyRumor, RUMOR_PRICE,
  unk: [{ id: 'sevilla' }, { id: 'barcelona' }], cityName: city => city,
  t: { rumorOk: 'Recorded {city}', rumorErrKnown: 'Known', rumorErrCash: 'Need {price}' },
  P: { querySelector: id => id === '#rum' ? select : button }, act: callback => callback() });
 vm.runInContext(bindings, context);
 return { g, context, select, button };
}

test('actual selection and buy handlers preserve the intended port across renders without changing transactions', () => {
 const { g, context, select, button } = setup(), cash = g.cash;
 select.onchange();
 assert.match(vm.runInContext(optionExpression, context), /value="barcelona" selected/);
 button.onclick();
 assert.match(vm.runInContext(optionExpression, context), /value="barcelona" selected/);
 assert.equal(context.rumorCity, 'barcelona');
 assert.equal(g.cash, cash - RUMOR_PRICE);
 assert.equal(g.log.filter(row => row.key === 'rumor' && row.city === 'barcelona').length, 1);
 assert.match(context.rumorNote.text, /barcelona/);
 select.value = 'sevilla'; select.onchange();
 assert.match(vm.runInContext(optionExpression, context), /value="sevilla" selected/);
});

test('failed purchase also retains the selected port without a charge or a saved-state UI field', () => {
 const { g, context, button } = setup(); g.cash = RUMOR_PRICE - 1;
 const before = JSON.stringify(g); button.onclick();
 assert.equal(JSON.stringify(g), before);
 assert.equal(context.rumorCity, 'barcelona');
 assert.match(vm.runInContext(optionExpression, context), /value="barcelona" selected/);
 assert.equal(context.rumorNote.err, true);
 assert.ok(!Object.hasOwn(g, 'rumorCity'));
});

test('changing the ship, tab or opened city clears the transient choice alongside feedback', () => {
 assert.match(source, /sel = \+e.dataset.sel; rumorNote = null; rumorCity = null/);
 assert.match(source, /townSel = null; rumorNote = null; rumorCity = null/);
 assert.match(source, /if\(tb!==tab\)\{rumorNote=null;rumorCity=null;\}/);
 assert.match(source, /shipWin=null;rumorNote=null;rumorCity=null/);
});

test('a port no longer eligible for rumours is not reintroduced by the retained choice', () => {
 const { context, select } = setup(); select.onchange();
 context.unk = [{ id: 'sevilla' }];
 assert.doesNotMatch(vm.runInContext(optionExpression, context), /barcelona| selected/);
});
