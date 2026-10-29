import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {foundingHarbor} from '../src/view/foundingharbor.mjs';
const main=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
test('founding harbor uses existing city assets and localized home port labels',()=>{
 for(const lang of ['es','en']){
  const html=foundingHarbor('Lisboa',lang);
  assert.ok(html.includes(lang==='es'?'Puerto de origen':'Home port'));
  assert.ok(html.includes('<strong>Lisboa</strong>'));
  for(const m of html.matchAll(/src="([^"]+)"/g))assert.ok(existsSync(new URL('../web/'+m[1],import.meta.url)));
 }
 assert.ok(foundingHarbor('<img src=x onerror=alert(1)>').includes('&lt;img'));
});
test('founding screen keeps every existing setup control and accessibility label',()=>{
 const create=main.slice(main.indexOf('function showCreate('),main.indexOf('function showTitle('));
 for(const id of ['p-co','p-ch','p-home','p-bg','p-sh','p-dv','p-cg','p-df','p-freenav','p-back','p-go'])assert.ok(create.includes(`id="${id}"`),id);
 assert.ok(create.includes('aria-labelledby="founding-title"'));
 assert.ok(create.includes('role="dialog" aria-modal="true"'));
 assert.ok(create.includes('foundingHarbor(cityName(pf.home), lang)'));
 assert.ok(create.includes('portraitChoices(pf.portrait, pf.crest.c1, lang)'));
 assert.ok(create.includes('aria-describedby="founding-difficulty"'));
 assert.ok(create.includes('${START_YEAR}</span>'));
});
