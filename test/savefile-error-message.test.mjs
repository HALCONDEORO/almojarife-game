import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {slotError} from '../src/view/slotsview.mjs';
import {restoreRotate,TMP_KEY,BACKUP_KEY} from '../web/savefile.mjs';
test('a changed live save with failed readback preserves parking and receives no unchanged-state claim',()=>{
 const data=new Map([['live','A'],[BACKUP_KEY,'B']]);let written=false;
 const store={setItem:(key,value)=>{data.set(key,value);if(key==='live')written=true;},
  getItem:key=>{if(key==='live'&&written)throw Error('unreadable');return data.get(key)??null;},removeItem:key=>data.delete(key)};
 let failure=null;try{restoreRotate(store,'live','A','C');}catch(error){failure=error;}
 assert.ok(failure);assert.equal(data.get('live'),'C');assert.equal(data.get(TMP_KEY),'A');
 assert.match(slotError(failure,'es'),/No se pudo verificar/);assert.doesNotMatch(slotError(failure,'es'),/no se ha cambiado nada/);
 assert.match(slotError(failure,'en'),/could not be verified/);assert.doesNotMatch(slotError(failure,'en'),/nothing was changed/);
});
test('import and new-game existing error text does not claim cancellation after an unverified write',()=>{
 const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 assert.match(source,/errB: "No se pudo verificar el guardado\./);assert.match(source,/errB: "The save could not be verified\./);
 assert.doesNotMatch(source,/errB: "[^"]*(importación cancelada|import cancelled)/);
});

test('real Restore binding reports uncertainty instead of restoration success after live readback fails',async()=>{
 const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 const start=source.indexOf('  $("t-rest").onclick =');
 const binding=source.slice(start,source.indexOf('  $("t-lang").onclick',start));
 const data=new Map([['live','A'],[BACKUP_KEY,'"B"']]);let written=false;
 const store={setItem:(key,value)=>{data.set(key,value);if(key==='live')written=true;},
  getItem:key=>{if(key==='live'&&written)throw Error('unreadable');return data.get(key)??null;},removeItem:key=>data.delete(key)};
 const button={},message={textContent:''};
 vm.runInNewContext(binding,{$:id=>id==='t-rest'?button:message,getBackup:()=>data.get(BACKUP_KEY),getTmp:()=>null,recoverRotations:()=>true,
  unpackGame:()=>{},world:{},confirmDialog:()=>Promise.resolve(true),el:{},t:{restConfirm:'Restore?',restDone:'Restored',badSave:'Bad'},
  localStorage:store,SAVE_KEY:'live',isValidSaveText:()=>true,restoreRotate,showTitle:()=>{},slotError,lang:'en'});
 await button.onclick();assert.match(message.textContent,/could not be verified/);assert.notEqual(message.textContent,'Restored');
 assert.equal(data.get('live'),'"B"');assert.equal(data.get(TMP_KEY),'A');
});
