// The three displayed strengths are bands of the same normalized weather force.
import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastHtml } from '../src/view/forecastview.mjs';

const bands = [[0, 1], [0.339999, 1], [0.34, 2], [0.5, 2], [0.669999, 2], [0.67, 3], [1, 3]];

test('forecast strength boundaries agree in the tooltip and visible cell in ES and EN', () => {
  for (const lang of ['es', 'en']) {
    for (const storm of [false, true]) {
      for (const [force, expected] of bands) {
        const rows = [{ city: 'cadiz', days: [{ dir: 0, force, storm }] }];
        const html = forecastHtml(rows, { lang });
        const label = lang === 'en' ? 'force' : 'fuerza';
        const stormText = storm ? (lang === 'en' ? ', storm' : ', tormenta') : '';
        assert.ok(html.includes(`title="N ${label} ${expected}${stormText}"`), `${lang}: ${force}, storm=${storm}`);
        assert.ok(html.includes(`<small>N ${expected}</small>`), `visible strength ${force}`);
        assert.equal((html.match(/class="fc-day(?: fc-storm)?"/g) ?? []).length, 1);
      }
    }
  }
});

test('a seven-day outlook preserves the strength of each day and labels each offset once', () => {
  const rows = [{ city: 'cadiz', days: bands.map(([force], i) => ({ day: 364 + i, dir: 0, force, storm: false })) }];
  const before = structuredClone(rows);
  for (const lang of ['es', 'en']) {
    const html = forecastHtml(rows, { lang });
    const today = lang === 'en' ? 'Today' : 'Hoy';
    assert.deepEqual([...html.matchAll(/<i>([^<]+)<\/i>/g)].map(match => match[1]), [today, '+1', '+2', '+3', '+4', '+5', '+6']);
    assert.deepEqual([...html.matchAll(/<small>N (\d)<\/small>/g)].map(match => Number(match[1])), bands.map(([, expected]) => expected));
  }
  assert.deepEqual(rows, before, 'rendering must not quantize the simulation weather in place');
});
