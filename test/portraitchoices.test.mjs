import test from 'node:test';
import assert from 'node:assert/strict';
import { portraitChoices } from '../src/view/portraitchoices.mjs';
import { PORTRAITS } from '../src/game/profile.mjs';
for (const lang of ['es', 'en']) {
  test(`portrait choices expose unique localized names and selection in ${lang}`, () => {
    for (const selected of [0, 4, PORTRAITS - 1]) {
      const html = portraitChoices(selected, '#1f4e8c', lang);
      const buttons = [...html.matchAll(/<button\b[^>]*>/g)].map(m => m[0]);
      assert.equal(buttons.length, PORTRAITS);
      assert.equal(buttons.filter(b => b.includes('aria-pressed="true"')).length, 1);
      for (const [i, button] of buttons.entries()) {
        const name = lang === 'es' ? `Retrato ${i + 1} de ${PORTRAITS}` : `Portrait ${i + 1} of ${PORTRAITS}`;
        assert.ok(button.includes(`aria-label="${name}"`));
        assert.ok(button.includes(`title="${name}"`));
        assert.ok(button.includes(`aria-pressed="${i === selected}"`));
        assert.ok(button.includes('type="button"'));
        assert.ok(button.includes(`data-p="${i}"`));
      }
    }
  });
}
