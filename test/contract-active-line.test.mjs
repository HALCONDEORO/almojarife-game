// The active-contract line must show the completion premium, like the offer card does.
// Guards the template/placeholder chain in web/main.mjs against drift: every token in the
// ctActive templates (es/en) must be filled by the render chain, and the reward must appear.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
const templates = [...src.matchAll(/ctActive: "([^"]+)"/g)].map((m) => m[1]);
const chainStart = src.indexOf('cta.map((x) => t.ctActive');
const chain = chainStart < 0 ? '' : src.slice(chainStart, src.indexOf('.join(', chainStart));
const fmt = (n) => String(n); // shape only: the real fmt groups thousands

test('both ctActive templates name the premium token',()=>{
 assert.equal(templates.length, 2, 'es and en templates');
 for (const tpl of templates) assert.ok(tpl.includes('{r}'), `template shows the premium: ${tpl}`);
});

test('the render chain fills every template token, including the reward',()=>{
 assert.ok(chain, "render chain found");
  const filled = new Set([...chain.matchAll(/\.replace\("\{([a-z])\}"/g)].map((m) => m[1]));
 for (const tpl of templates)
   for (const tok of [...tpl.matchAll(/\{([a-z])\}/g)].map((m) => m[1]))
     assert.ok(filled.has(tok), `token {${tok}} of "${tpl}" is filled`);
 assert.ok(chain.includes('fmt(x.reward)'), 'the reward value feeds {r}');
});

test('rendered line: no token survives and the premium is visible',()=>{
 const x = {good: 'grain', delivered: 12, qty: 20, dueDay: 40, reward: 500};
 for (const tpl of templates) {
   const line = tpl.replace('{g}', x.good).replace('{n}', fmt(x.delivered)).replace('{q}', fmt(x.qty)).replace('{d}', x.dueDay).replace('{r}', fmt(x.reward));
   assert.ok(!/\{[a-z]\}/.test(line), `no placeholder left: ${line}`);
   assert.ok(line.includes('500'), `premium shown: ${line}`);
 }
});
