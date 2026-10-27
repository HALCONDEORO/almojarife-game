import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('map destination controls never render inside city windows',()=>{
 const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 assert.match(source,/if \(!inCity\) \{ const te = target \? travelEstimate/);
 assert.equal((source.match(/class="dest"/g)||[]).length,1);
});
