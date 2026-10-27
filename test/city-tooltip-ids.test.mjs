import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('city selection tooltip uses visible names without leaking internal plot ids',()=>{
 const js=readFileSync(new URL('../web/city2d/scene.mjs',import.meta.url),'utf8');
 const line=js.split('\n').find(l=>l.includes("$('tip').textContent="));
 assert.ok(line.includes('labels[selected.id]'));assert.ok(!line.includes("+' · '+selected.id"));
 assert.ok(js.includes("id:service?selected.type:selected.id"));
});
