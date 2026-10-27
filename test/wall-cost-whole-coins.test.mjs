import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('wall offer and confirmation use whole-coin display without changing settlement',()=>{
 const js=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 assert.ok(js.includes('replace("{p}", fmt(Math.round(wq.cost)))'));
 const wall=js.split('if (bldAction.kind === "walls")')[1].split('\n')[0];
 for(const field of ['cost','materials','fee'])assert.ok(wall.includes(`fmt(Math.round(o.${field}))`));
 assert.ok(wall.includes('canPay = g.cash >= o.cost'));
});
