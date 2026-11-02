import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SLOT_TEXT} from '../src/view/slotsview.mjs';
const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
function fixture(action,after,{initial='original',accepted=true}={}){
 const marker=`  el.querySelectorAll("[data-sl-${action}]")`,start=source.indexOf(marker),end=source.indexOf('\n  el.querySelectorAll(',start+marker.length);
 assert.ok(start>=0&&end>start);
 const button={dataset:action==='save'?{slSave:'4'}:{slDel:'4'}},messages=[];
 let reads=0,writes=0,deletes=0,confirmations=0;
 const context={el:{querySelectorAll:()=>[button]},readSlot:()=>reads++===0?(initial===false?undefined:initial):after===true?initial:after,
  confirmDialog:()=>{confirmations++;return Promise.resolve(accepted);},n2:text=>text,lang:'es',x:SLOT_TEXT.es,
  showSlots:()=>true,say:message=>messages.push(message),localStorage:{},g:{day:3},company:'House',
  packGame:(game,company)=>({g:game,company}),isValidSaveText:()=>true,writeSlot:()=>{writes++;},clearSlot:()=>{deletes++;return true;},slotError:()=>SLOT_TEXT.es.err};
 vm.runInNewContext(source.slice(start,end),context);
 return {run:()=>button.onclick(),messages,counts:()=>({writes,deletes,confirmations})};
}
for(const action of ['save','del']){
 test(`real ${action} binding refuses a changed or removed slot after confirmation`,async()=>{
  for(const after of ['replacement',null]){
   const view=fixture(action,after);await view.run();assert.deepEqual(view.counts(),{writes:0,deletes:0,confirmations:1});assert.deepEqual(view.messages,[SLOT_TEXT.es.err]);
  }
 });
 test(`real ${action} binding reports an unreadable slot after confirmation without mutation`,async()=>{
  const view=fixture(action);await assert.doesNotReject(view.run());assert.deepEqual(view.counts(),{writes:0,deletes:0,confirmations:1});assert.deepEqual(view.messages,[SLOT_TEXT.es.readError]);
 });
 test(`real ${action} binding still commits an unchanged slot`,async()=>{
  const view=fixture(action,true);await view.run();assert.deepEqual(view.counts(),{writes:action==='save'?1:0,deletes:action==='del'?1:0,confirmations:1});assert.deepEqual(view.messages,[action==='save'?SLOT_TEXT.es.saved:SLOT_TEXT.es.deleted]);
 });
 test(`real ${action} binding stops before confirmation if the initial read fails`,async()=>{
  const view=fixture(action,true,{initial:false});await view.run();assert.deepEqual(view.counts(),{writes:0,deletes:0,confirmations:0});assert.deepEqual(view.messages,[SLOT_TEXT.es.readError]);
 });
 test(`real ${action} binding cancellation never mutates a changed slot`,async()=>{
  const view=fixture(action,'replacement',{accepted:false});await view.run();assert.deepEqual(view.counts(),{writes:0,deletes:0,confirmations:1});assert.deepEqual(view.messages,[]);
 });
}
test('saving an empty slot still writes directly without confirmation',async()=>{
 const view=fixture('save',true,{initial:null});await view.run();assert.deepEqual(view.counts(),{writes:1,deletes:0,confirmations:0});
});
test('a stale delete button cannot delete a slot created during confirmation',async()=>{
 const view=fixture('del','replacement',{initial:null});await view.run();assert.deepEqual(view.counts(),{writes:0,deletes:0,confirmations:1});assert.deepEqual(view.messages,[SLOT_TEXT.es.err]);
});
