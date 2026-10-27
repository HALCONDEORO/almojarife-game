import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('construction guidance refers to the city plan in both languages',()=>{
 const js=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 assert.ok(!js.includes('vista 3D'));
 assert.ok(!js.includes('in the 3D view'));
 assert.ok(js.includes('en el plano de la ciudad'));
 assert.ok(js.includes('in the city plan'));
});
