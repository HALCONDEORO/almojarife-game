import test from 'node:test';
import assert from 'node:assert/strict';
import {convoyNameInput} from '../src/view/convoyname.mjs';
import {shipNameForm} from '../src/view/shipnameform.mjs';

// Literal expectations captured before extracting the shared escaping helper.
const cases = [
  ['empty', '', ''],
  ['null', null, ''],
  ['undefined', undefined, ''],
  ['sensitive characters', `&<>"'`, '&amp;&lt;&gt;&quot;&#39;'],
  ['existing entities', '&amp;&#39;', '&amp;amp;&amp;#39;'],
  ['Unicode and whitespace', '  Cádiz — 船\n\t\\  ', '  Cádiz — 船\n\t\\  '],
  ['zero', 0, '0'],
  ['negative zero', -0, '0'],
  ['false', false, 'false'],
  ['NaN', NaN, 'NaN'],
  ['infinity', Infinity, 'Infinity'],
  ['bigint', 12n, '12'],
  ['symbol', Symbol('name&'), 'Symbol(name&amp;)'],
  ['array', ['<', null, '&'], '&lt;,,&amp;'],
  ['object', {toString: () => `<name&"'>`}, '&lt;name&amp;&quot;&#39;&gt;'],
  ['long name', 'x'.repeat(31), 'x'.repeat(31)],
];

for (const lang of ['es', 'en']) {
  for (const [label, value, escaped] of cases) {
    test(`${lang}: complete name HTML is byte-identical for ${label}`, () => {
      const convoyLabel = lang === 'es' ? 'Nombre del convoy' : 'Convoy name';
      const shipLabel = lang === 'en' ? 'Ship name' : 'Nombre del barco';
      const button = lang === 'en' ? 'Rename' : 'Renombrar';
      const convoy = `<label>${convoyLabel} <input id="convoy-name" value="${escaped}" maxlength="30" autocomplete="off"></label>`;
      const ship = `<form data-ship-rename="7"><label>${shipLabel} <input name="shipname" value="${escaped}" maxlength="30" required autocomplete="off"></label> <button>${button}</button><small role="status" data-name-error></small></form>`;
      assert.deepEqual(Buffer.from(convoyNameInput(value, lang)), Buffer.from(convoy));
      assert.deepEqual(Buffer.from(shipNameForm({id: 7, name: value}, lang)), Buffer.from(ship));
    });
  }
}

test('default arguments, custom IDs and existing language fallbacks remain exact', () => {
  const defaultConvoy = '<label>Nombre del convoy <input id="convoy-name" value="" maxlength="30" autocomplete="off"></label>';
  const defaultShip = '<form data-ship-rename="7"><label>Nombre del barco <input name="shipname" value="" maxlength="30" required autocomplete="off"></label> <button>Renombrar</button><small role="status" data-name-error></small></form>';
  assert.equal(convoyNameInput(), defaultConvoy);
  assert.equal(convoyNameInput(undefined, undefined, undefined), defaultConvoy);
  assert.equal(shipNameForm({id: 7}), defaultShip);
  assert.equal(convoyNameInput('', 'fr', 'custom-id'), '<label>Convoy name <input id="custom-id" value="" maxlength="30" autocomplete="off"></label>');
  assert.equal(shipNameForm({id: 7}, 'fr'), defaultShip);
});

test('each renderer coerces a name exactly once and propagates coercion errors', () => {
  for (const render of [name => convoyNameInput(name), name => shipNameForm({id: 7, name})]) {
    let calls = 0;
    render({toString() { calls++; return '&'; }});
    assert.equal(calls, 1);
    const error = new Error('name coercion');
    assert.throws(() => render({toString() { throw error; }}), e => e === error);
  }
});
