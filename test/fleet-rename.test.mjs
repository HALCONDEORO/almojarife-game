import test from 'node:test';
import assert from 'node:assert/strict';
import {fleetHtml} from '../src/view/fleet.mjs';
import {shipNameForm} from '../src/view/shipnameform.mjs';

for (const [lang, caption, label] of [['es', 'Renombrar', 'Nombre del barco'], ['en', 'Rename', 'Ship name']]) {
 test(`fleet rename is collapsed with the unchanged, escaped ${lang} form`, () => {
  const ship = {id: 7, type: 'barca', at: 'cadiz', hull: 100, cargo: {}, name: `<Mar & "Sol's">`};
  const game = {ships: [ship]};
  const before = JSON.stringify(game);
  const html = fleetHtml(game, 0, {lang});
  const disclosure = html.match(/<details\b([^>]*)><summary\b([^>]*)>(.*?)<\/summary>([\s\S]*?)<\/details>/);
  assert.ok(disclosure);
  assert.doesNotMatch(disclosure[1], /\bopen\b/);
  assert.ok(disclosure[3].endsWith(caption));
  assert.match(disclosure[3], /aria-hidden="true"/);
  assert.match(disclosure[2], /pointer-events:auto/); // Overrides the existing pinned-fleet rule.
  assert.equal(disclosure[4], shipNameForm(ship, lang));
  assert.match(disclosure[4], new RegExp(`<label>${label} <input name="shipname"`));
  assert.ok(disclosure[4].includes('&lt;Mar &amp; &quot;Sol&#39;s&quot;&gt;'));
  assert.equal(html.split('<form ').length - 1, 1);
  assert.equal(JSON.stringify(game), before);
  const handler = disclosure[1].match(/onkeydown="([^"]*)"/)[1];
  for (const key of [' ', 'Enter', 'Escape', 'm', '1']) {
   let stopped = false;
   // Keep native disclosure, typing and form defaults; stop only document shortcuts.
   Function('event', handler)({key, stopPropagation() { stopped = true; }});
   assert.ok(stopped);
  }
 });
}

test('an empty fleet has no rename disclosure', () => {
 assert.doesNotMatch(fleetHtml({ships: []}, 0), /<details|data-ship-rename/);
});
