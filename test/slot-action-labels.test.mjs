import test from 'node:test';
import assert from 'node:assert/strict';
import {slotsHtml,SLOT_TEXT} from '../src/view/slotsview.mjs';
test('each repeated slot action has a unique localized accessible name including its slot',()=>{
 const slots=Array.from({length:9},(_,i)=>({n:i+1,state:i===0?'ok':'empty',house:'Casa',day:1,cash:50}));
 for(const lang of ['es','en']){
  const html=slotsHtml(slots,{lang,inGame:true}),text=SLOT_TEXT[lang];
  for(const [action,key] of [['save','save'],['load','load'],['export','export'],['del','del']]){
   for(const slot of slots)assert.ok(html.includes(`data-sl-${action}="${slot.n}" aria-label="${text[key]}: ${text.slot} ${slot.n}"`));
  }
  const labels=[...html.matchAll(/aria-label="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(labels.length,36);assert.equal(new Set(labels).size,36);
 }
});
test('slots have a named modal dialog without changing visible action labels',()=>{
 const html=slotsHtml([{n:4,state:'ok',house:'Casa',day:1,cash:30}],{lang:'es',inGame:false});
 assert.match(html,/role="dialog" aria-modal="true" aria-labelledby="slots-title"/);
 assert.match(html,/<h2 id="slots-title">Ranuras de guardado<\/h2>/);
 assert.match(html,/>Borrar<\/button>/);assert.match(html,/>Exportar copia<\/button>/);
});
