import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
const binding = source.split('\n').find(line => line.includes('$("t-cont").onclick ='));
function fixture(current, lang = 'es') {
 const nodes = { 't-cont': {}, 't-msg': {} }, effects = [];
 const context = { $: key => nodes[key], saved: {g:{day:1},company:'Stale house'}, lang,
  loadSaved: () => current, showTitle: () => effects.push('title'), music: {leaveTitle:()=>effects.push('music')},
  render:()=>effects.push('render'),el:{hidden:false},ship:()=>null,
  g:null,company:null,sel:3,playing:true,pauseNote:'old',progress:2,tickAcc:3,inTitle:true };
 vm.createContext(context);vm.runInContext(binding,context);nodes['t-cont'].onclick();
 return {context,nodes,effects};
}
test('Continue refuses a deleted, corrupt or inaccessible save instead of loading the cached title snapshot',()=>{
 const result=fixture(null);assert.equal(result.context.g,null);assert.equal(result.context.inTitle,true);
 assert.deepEqual(result.effects,['title']);assert.match(result.nodes['t-msg'].textContent,/No se ha cargado una copia antigua/);
});
test('missing-save feedback is available in English',()=>{
 assert.match(fixture(null,'en').nodes['t-msg'].textContent,/No stale copy was loaded/);
});
test('Continue uses the newly read save and enters that game exactly once',()=>{
 const current={g:{day:9},company:'Current house'},result=fixture(current);
 assert.equal(result.context.g,current.g);assert.equal(result.context.company,'Current house');
 assert.equal(result.context.inTitle,false);assert.equal(result.context.el.hidden,true);
 assert.equal(result.context.progress,0);assert.equal(result.context.tickAcc,0);
 assert.deepEqual(result.effects,['music','render']);
});
