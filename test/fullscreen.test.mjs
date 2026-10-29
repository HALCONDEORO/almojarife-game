import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { syncFullscreenButtons } from '../web/fullscreen.mjs';
const button = () => ({ title: '', attributes: {}, setAttribute(k, v) { this.attributes[k] = v; } });
for (const [lang, enter, exit] of [['es', 'Pantalla completa', 'Salir de pantalla completa'], ['en', 'Fullscreen', 'Exit fullscreen']]) {
  test(`map and city fullscreen controls reflect enter, exit and browser Escape in ${lang}`, () => {
    const map = button(), city = button();
    for (const [active, label] of [[false, enter], [true, exit], [false, enter]]) {
      syncFullscreenButtons([map, null, city], active, lang);
      for (const b of [map, city]) {
        assert.equal(b.title, label);
        assert.equal(b.attributes['aria-label'], label);
        assert.equal(b.attributes['aria-pressed'], String(active));
      }
    }
  });
}
test('browser fullscreen changes refresh controls even while the game is paused', () => {
  const main = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
  assert.match(main, /addEventListener\("fullscreenchange",/);
  assert.match(main, /syncFullscreenButtons\(\[fsb, \$\("v3d"\)\?\.querySelector/);
});
