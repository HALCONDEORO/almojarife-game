import test from 'node:test';
import assert from 'node:assert/strict';
import { crestColorChoices } from '../src/view/crestcolors.mjs';
import { PALETTE } from '../src/game/profile.mjs';
for (const lang of ['es', 'en']) for (const key of ['c1', 'c2']) {
  test(`${lang} ${key} colours have human names, group context and a unique selected state`, () => {
    for (const color of PALETTE) {
      const html = crestColorChoices({ c1: color, c2: color }, key, lang);
      const buttons = [...html.matchAll(/<button\b[^>]*>/g)].map(m => m[0]);
      assert.equal(buttons.length, PALETTE.length);
      assert.equal(buttons.filter(b => b.includes('aria-pressed="true"')).length, 1);
      assert.equal(new Set(buttons.map(b => b.match(/aria-label="([^"]+)"/)[1])).size, PALETTE.length);
      for (const [i, button] of buttons.entries()) {
        assert.ok(button.includes(`data-k="${key}"`));
        assert.ok(button.includes(`data-v="${PALETTE[i]}"`));
        assert.ok(button.includes(`aria-pressed="${PALETTE[i] === color}"`));
        assert.ok(button.includes('title="'));
        assert.doesNotMatch(button, /aria-label="#/);
      }
    }
    const red = crestColorChoices({c1: PALETTE[0], c2: PALETTE[0]}, key, lang);
    const name = lang === 'es' ? (key === 'c1' ? 'Color principal: Rojo' : 'Color secundario: Rojo') : (key === 'c1' ? 'Main colour: Red' : 'Second colour: Red');
    assert.ok(red.includes(`aria-label="${name}"`));
  });
}
