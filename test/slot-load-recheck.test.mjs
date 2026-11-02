import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SLOT_TEXT} from '../src/view/slotsview.mjs';
const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
const start=source.indexOf('  el.querySelectorAll("[data-sl-load]")');
const binding=source.slice(start,source.indexOf('\n}',start));
function fixture(after,unreadableLive=false){
 const raw=JSON.stringify({g:{day:3},company:'Original'}),button={dataset:{slLoad:'4'}},messages=[];
 let reads=0,writes=0,rendered=0;
 const context={el:{querySelectorAll:()=>[button],hidden:false},readSlot:()=>reads++===0?raw:after===true?raw:after,
  unpackGame:value=>value,world:{},inGame:true,confirmDialog:()=>Promise.resolve(true),n2:text=>text,lang:'es',x:SLOT_TEXT.es,
  showSlots:()=>true,say:message=>messages.push(message),localStorage:{getItem:()=>{if(unreadableLive)throw Error('denied');return 'live';}},SAVE_KEY:'save',
  isValidSaveText:()=>true,packGame:(game,company)=>({g:game,company}),finishPendingRotation:()=>true,restoreRotate:()=>{writes++;},
  stopFollow:()=>true,follow:{},render:()=>{rendered++;},ship:()=>null};
 vm.runInNewContext(binding,context);return {run:()=>button.onclick(),messages,writes:()=>writes,rendered:()=>rendered,context};
}
test('real load binding rejects a replaced or deleted slot after confirmation without loading the stale snapshot',async()=>{
 for(const after of [null,JSON.stringify({g:{day:9},company:'Replacement'})]){
  const view=fixture(after);await view.run();assert.equal(view.writes(),0);assert.equal(view.rendered(),0);assert.deepEqual(view.messages,[SLOT_TEXT.es.err]);
 }
});
test('real load binding reports a read failure after confirmation before touching saves',async()=>{
 const view=fixture(undefined);await view.run();assert.equal(view.writes(),0);assert.equal(view.rendered(),0);assert.deepEqual(view.messages,[SLOT_TEXT.es.readError]);
});
test('a failed current-save read aborts visibly rather than rejecting the click handler',async()=>{
 const view=fixture(true,true);await assert.doesNotReject(view.run());assert.equal(view.writes(),0);assert.equal(view.rendered(),0);assert.deepEqual(view.messages,[SLOT_TEXT.es.readError]);
});
test('an unchanged slot still loads normally after confirmation',async()=>{
 const view=fixture(true);await view.run();assert.equal(view.writes(),1);assert.equal(view.rendered(),1);assert.equal(view.context.g.day,3);assert.deepEqual(view.messages,[]);
});
