import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {readSlot,listSlots} from '../src/game/saveslots.mjs';
import {slotsHtml,SLOT_TEXT} from '../src/view/slotsview.mjs';
const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
const markers=['save','export','del','load'].map(action=>`  el.querySelectorAll("[data-sl-${action}]")`);
function binding(action){const index=['save','export','del','load'].indexOf(action),start=source.indexOf(markers[index]);return source.slice(start,index===3?source.indexOf('\n}',start):source.indexOf(markers[index+1],start));}
test('unreadable slots differ from empty and corrupt and recover on the next read',()=>{
 let blocked=true;const store={getItem:key=>{if(blocked&&key.endsWith('.4'))throw Error('denied');return null;}};
 assert.equal(readSlot(store,4),undefined);assert.equal(readSlot(store,1),null);
 const slots=listSlots(store,()=>assert.fail('nothing to parse'));
 assert.equal(slots[3].state,'unavailable');assert.equal(slots[0].state,'empty');blocked=false;
 assert.equal(listSlots(store,()=>{})[3].state,'empty');
});
test('unavailable slots show localized status and disable every action without changing healthy slots',()=>{
 for(const lang of ['es','en']){
  const html=slotsHtml([{n:4,state:'unavailable'}],{lang,inGame:true});
  assert.ok(html.includes(SLOT_TEXT[lang].unavailable));
  for(const action of ['save','load','export','del'])assert.match(html,new RegExp(`data-sl-${action}="4"[^>]*disabled`));
 }
});
test('real save binding cannot bypass overwrite confirmation after a read failure',async()=>{
 const button={dataset:{slSave:'4'}},messages=[];let redraws=0,writes=0;
 vm.runInNewContext(binding('save'),{el:{querySelectorAll:()=>[button]},readSlot:()=>undefined,localStorage:{},
  showSlots:()=>{redraws++;},say:message=>messages.push(message),x:SLOT_TEXT.es,
  writeSlot:()=>{writes++;},confirmDialog:()=>assert.fail('unreadable is not permission to overwrite')});
 await button.onclick();assert.equal(writes,0);assert.equal(redraws,1);assert.deepEqual(messages,[SLOT_TEXT.es.readError]);
});
test('real export and load bindings report read failure without exporting or replacing the game',async()=>{
 for(const action of ['export','load','del']){
  const button={dataset:{slExport:'4',slLoad:'4',slDel:'4'}},messages=[];let redraws=0;
  vm.runInNewContext(binding(action),{el:{querySelectorAll:()=>[button]},readSlot:()=>undefined,localStorage:{},
   showSlots:()=>{redraws++;},say:message=>messages.push(message),x:SLOT_TEXT.en,
   clearSlot:()=>assert.fail('must not delete'),confirmDialog:()=>assert.fail('must not confirm'),unpackGame:()=>assert.fail('must not parse unavailable storage'),exportSave:()=>assert.fail('must not export')});
  await button.onclick();assert.equal(redraws,1);assert.deepEqual(messages,[SLOT_TEXT.en.readError]);
 }
});
