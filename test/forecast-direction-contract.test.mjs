// Wind directions are FROM bearings; the arrow must point where that wind blows.
import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastHtml } from '../src/view/forecastview.mjs';

function cell(dir, lang, storm = false) {
  return forecastHtml([{ city: 'cadiz', days: [{ dir, force: 0.5, storm }] }], { lang });
}

const bearings = [
  [0, 'N', 'N', '↓'], [45, 'NE', 'NE', '↙'],
  [90, 'E', 'E', '←'], [135, 'SE', 'SE', '↖'],
  [180, 'S', 'S', '↑'], [225, 'SO', 'SW', '↗'],
  [270, 'O', 'W', '→'], [315, 'NO', 'NW', '↘'],
];

test('forecast FROM bearings keep compass, downwind arrow and tooltip aligned in ES/EN', () => {
  for (const [dir, es, en, arrow] of bearings) {
    for (const lang of ['es', 'en']) {
      const compass = lang === 'es' ? es : en;
      const force = lang === 'es' ? 'fuerza' : 'force';
      const today = lang === 'es' ? 'Hoy' : 'Today';
      const html = cell(dir, lang);
      assert.ok(html.includes(`title="${compass} ${force} 2"`), `${lang} bearing ${dir} tooltip`);
      assert.ok(html.includes(`<i>${today}</i>${arrow}<small>${compass} 2</small>`), `${lang} bearing ${dir} cell`);
      assert.equal((html.match(/class="fc-day"/g) ?? []).length, 1);
      assert.doesNotMatch(html, /undefined|NaN/);
    }
  }
});

test('forecast rounds sectors at half bearings and wraps north without an empty cell', () => {
  for (const [dir, expected] of [[22.49, 'N'], [22.5, 'NE'], [337.49, 'NW'], [337.5, 'N'], [359.99, 'N']]) {
    const html = cell(dir, 'en');
    assert.ok(html.includes(`title="${expected} force 2"`), `bearing ${dir}`);
    assert.doesNotMatch(html, /undefined|NaN/);
  }
});

test('storm replaces only the arrow, retaining localized direction and force', () => {
  for (const [lang, compass, word] of [['es', 'SO', 'tormenta'], ['en', 'SW', 'storm']]) {
    const html = cell(225, lang, true);
    assert.match(html, /class="fc-day fc-storm"/);
    assert.ok(html.includes(`, ${word}"`));
    assert.ok(html.includes(`</i>⛈<small>${compass} 2</small>`));
    assert.ok(!html.includes('↗'));
  }
});
