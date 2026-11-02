import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {restoreRotate,BACKUP_KEY} from '../web/savefile.mjs';
const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
const start=source.indexOf('  $("t-file").onchange =');
const binding=source.slice(start,source.indexOf('\n}\nshowTitle()',start));
function fixture(mode){
 const data=new Map([[BACKUP_KEY,'backup']]);let written=false,loaded=0;const input={},message={textContent:''};const panel={hidden:false};
 const storage={getItem:key=>{if(mode==='unreadable'&&key==='live'&&written)throw Error('Read unavailable');return data.get(key)??null;},
  setItem:(key,value)=>{written=true;if(mode!=='silent')data.set(key,value);},removeItem:key=>data.delete(key)};
 const context={$:id=>id==='t-file'?input:message,unpackGame:value=>value,world:{},localStorage:storage,SAVE_KEY:'live',
  isValidSaveText:()=>false,packGame:(game,company)=>({g:game,company}),recoverRotations:()=>true,restoreRotate,
  t:{badSave:'Bad save',errB:'The save could not be verified'},music:{leaveTitle:()=>{loaded++;}},stopFollow:()=>true,follow:{},
  render:()=>true,el:panel,ship:()=>null,close3d:()=>true};
 vm.runInNewContext(binding,context);
 return {data,message,panel,loaded:()=>loaded,run:()=>input.onchange({target:{files:[{text:()=>Promise.resolve(JSON.stringify({g:{day:3},company:'Imported'}))}]}})};
}
test('real import with no current game cannot report success after a silent write',async()=>{
 const view=fixture('silent');await view.run();assert.equal(view.loaded(),0);assert.equal(view.panel.hidden,false);assert.equal(view.data.has('live'),false);
 assert.equal(view.data.get(BACKUP_KEY),'backup');assert.match(view.message.textContent,/could not be verified/);
});
test('real import with effective write but failed readback reports uncertainty and keeps backup',async()=>{
 const view=fixture('unreadable');await view.run();assert.equal(view.loaded(),0);assert.ok(view.data.has('live'));
 assert.equal(view.data.get(BACKUP_KEY),'backup');assert.match(view.message.textContent,/could not be verified/);
});
test('verified import with no previous game still starts the imported game',async()=>{
 const view=fixture('healthy');await view.run();assert.equal(view.loaded(),1);assert.equal(view.message.textContent,'');
 assert.equal(JSON.parse(view.data.get('live')).company,'Imported');assert.equal(view.data.get(BACKUP_KEY),'backup');
});
