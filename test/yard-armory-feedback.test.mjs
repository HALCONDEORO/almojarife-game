import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const src=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
test('shipyard weapons share weight/price blockers and render the reason beside disabled controls',()=>{assert.match(src,/armoryBlock\(g, s, w.weight, price, g.cash\)/);assert.match(src,/armoryPrice\(g, s.at, w.price\)/);assert.match(src,/yd-arm-reason/);assert.match(src,/note.id="arm-fail-note"/);});
