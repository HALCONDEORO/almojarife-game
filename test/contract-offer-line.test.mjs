// The open-offer card must show how long the council gives you, like the active line does.
// Guards the template/placeholder chain in web/main.mjs against drift: every token in the
// ctOffer templates (es/en) must be filled by the render chain, and the days left must appear.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
const templates = [...src.matchAll(/ctOffer: "([^"]+)"/g)].map((m) => m[1]);
const chainStart = src.indexOf('t.ctOffer.replace');
const chain = chainStart < 0 ? '' : src.slice(chainStart, src.indexOf('fmt(cto.reward)', chainStart));
const fmt = (n) => String(n); // shape only: the real fmt groups thousands

test('both ctOffer templates name the days-left token',()=>{
 assert.equal(templates.length, 2, 'es and en templates');
 for (const tpl of templates) assert.ok(tpl.includes('{l}'), `template shows the days left: ${tpl}`);
});

test('the render chain fills every template token, including the days left',()=>{
 assert.ok(chain, "render chain found");
  const filled = new Set([...chain.matchAll(/\.replace\("\{([a-z])\}"/g)].map((m) => m[1]));
 for (const tpl of templates)
   for (const tok of [...tpl.matchAll(/\{([a-z])\}/g)].map((m) => m[1]))
     assert.ok(filled.has(tok), `token {${tok}} of "${tpl}" is filled`);
 assert.ok(chain.includes('cto.dueDay - g.day'), 'the days left come from the clock');
 assert.ok(chain.includes('Math.max(0,'), 'an expired offer never shows negative days');
});

test('rendered line: no token survives and the days left are visible',()=>{
 const o = {good: 'grain', qty: 20, dueDay: 40, reward: 500};
 for (const tpl of templates) {
   const line = tpl.replace('{g}', o.good).replace('{q}', fmt(o.qty)).replace('{d}', o.dueDay).replace('{l}', fmt(Math.max(0, o.dueDay - 33))).replace('{r}', fmt(o.reward));
   assert.ok(!/\{[a-z]\}/.test(line), `no placeholder left: ${line}`);
   assert.ok(line.includes('7'), `days left shown: ${line}`);
 }
});
