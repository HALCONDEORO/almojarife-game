import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { slotsHtml } from '../src/view/slotsview.mjs';
const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
const start=source.indexOf('  el.querySelectorAll("[data-sl-export]")');
const binding=source.slice(start,source.indexOf('  el.querySelectorAll("[data-sl-del]")',start));
function click(raw) {
 const button={dataset:{slExport:'4'}},exports=[],messages=[];
 vm.runInNewContext(binding,{el:{querySelectorAll:()=>[button]},localStorage:{},readSlot:(store,n)=>{assert.equal(n,4);return raw;},
  unpackGame:value=>{if(!value.g)throw Error('invalid');return value;},world:{},
  exportSave:(...args)=>exports.push(args),say:value=>messages.push(value),x:{err:'Unavailable'},slotError:()=> 'Invalid save',lang:'es'});
 button.onclick();return {exports,messages};
}
test('slots offer export only for valid stored games, including at the title screen',()=>{
 const slots=[{n:1,state:'ok',house:'Casa',day:4,cash:200},{n:2,state:'empty'},{n:3,state:'corrupt'}];
 const html=slotsHtml(slots,{lang:'es',inGame:false});
 assert.match(html,/data-sl-export="1" >Exportar copia/);assert.match(html,/data-sl-export="2" disabled/);assert.match(html,/data-sl-export="3" disabled/);
 assert.match(slotsHtml(slots,{lang:'en',inGame:false}),/Export copy/);
});
test('real export binding downloads that slot verbatim with its own day, not the current game',()=>{
 const raw=JSON.stringify({g:{day:41},company:'Stored house'}),result=click(raw);
 assert.equal(result.exports.length,1);assert.deepEqual(result.exports[0],[raw,41]);assert.equal(result.messages.length,0);
});
test('a slot removed or corrupted since drawing never downloads a stale copy',()=>{
 for(const raw of [null,'broken','{}']){const result=click(raw);assert.equal(result.exports.length,0);assert.equal(result.messages.length,1);}
});
