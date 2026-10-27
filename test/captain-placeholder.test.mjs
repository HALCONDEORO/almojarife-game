import test from 'node:test';import assert from 'node:assert/strict';
import {tavernCaptainsHtml} from '../src/view/captainview.mjs';
import {readFileSync} from 'node:fs';
test('captain view contains only active skills, not development placeholder copy',()=>{
 const source=readFileSync(new URL('../src/view/captainview.mjs',import.meta.url),'utf8');
 assert.ok(!source.includes('sin efecto todavía'));assert.ok(!source.includes('no effect yet'));
 assert.ok(source.includes('t.navigation'));assert.ok(source.includes('t.weather'));assert.ok(source.includes('t.defence'));
});
