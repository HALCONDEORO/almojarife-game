import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {clearSlot,slotKey} from '../src/game/saveslots.mjs';
const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
const start=source.indexOf('  el.querySelectorAll("[data-sl-del]")');
const binding=source.slice(start,source.indexOf('  el.querySelectorAll("[data-sl-load]")',start));
function storeFixture(mode) {
 const data=new Map([[slotKey(4),'retained save'],['almojarife.save.v1','current'],['almojarife.save.backup','backup']]);
 return {data,getItem:key=>{if(mode==='unreadable')throw Error('blocked');return data.get(key)??null;},
  removeItem:key=>{if(mode==='throw')throw Error('blocked');if(mode!=='silent')data.delete(key);}};
}
async function click(store,confirmed=true) {
 const button={dataset:{slDel:'4'}},messages=[];let redraws=0;
 vm.runInNewContext(binding,{el:{querySelectorAll:()=>[button]},confirmDialog:()=>Promise.resolve(confirmed),n2:(text,n)=>text.replace('{n}',n),
  x:{confirmDel:'Delete {n}?',err:'Not completed',deleted:'Deleted {n}'},lang:'en',localStorage:store,clearSlot,
  showSlots:()=>{redraws++;},say:message=>messages.push(message)});
 await button.onclick();return {messages,redraws};
}
test('deletion requires readback: a silent no-op and unreadable storage are not success',()=>{
 for(const mode of ['silent','unreadable','throw'])assert.equal(clearSlot(storeFixture(mode),4),false);
 assert.equal(clearSlot(storeFixture('normal'),4),true);
});
test('real delete binding reports failure when storage silently retains the slot',async()=>{
 const store=storeFixture('silent'),result=await click(store);
 assert.deepEqual(result.messages,['Not completed']);assert.equal(result.redraws,1);assert.equal(store.data.get(slotKey(4)),'retained save');
 assert.equal(store.data.get('almojarife.save.v1'),'current');assert.equal(store.data.get('almojarife.save.backup'),'backup');
});
test('confirmed successful deletion reports success only after the slot disappears',async()=>{
 const store=storeFixture('normal'),result=await click(store);
 assert.deepEqual(result.messages,['Deleted 4']);assert.equal(store.data.has(slotKey(4)),false);
 assert.equal(store.data.get('almojarife.save.v1'),'current');assert.equal(store.data.get('almojarife.save.backup'),'backup');
});
test('cancelling deletion preserves the slot and does not claim deletion',async()=>{
 const store=storeFixture('normal'),result=await click(store,false);
 assert.deepEqual(result.messages,[]);assert.equal(store.data.get(slotKey(4)),'retained save');
});
